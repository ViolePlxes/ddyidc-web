import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
};
globalThis.sessionStorage = storage();
globalThis.localStorage = storage();
let locked = Promise.resolve();
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: { request: (_, callback) => {
  const result = locked.then(callback); locked = result.catch(() => {}); return result;
} } } });
let calls = 0;
let behavior;
globalThis.refreshTestAxios = { post: async (...args) => { calls++; return behavior(...args); }, isAxiosError: (error) => error?.isAxiosError === true };
const source = await readFile(new URL("../src/shared/api/refreshSession.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText.replace('import axios from "axios";', "const axios = globalThis.refreshTestAxios;");
const moduleURL = (suffix = "") => `data:text/javascript;base64,${Buffer.from(compiled + suffix).toString("base64")}`;
const api = await import(moduleURL());
const pair = (token) => ({ refresh_token: token, access_token: "test-access", expires_in: 7200, refresh_expires_in: 2592000 });
const response = (token) => ({ data: { code: 0, data: pair(token) } });

test("remember-me storage, single-flight rotation, cross-tab lock, failure and logout fencing", async () => {
  api.saveRefreshSession(pair("temporary"), false);
  assert.equal(localStorage.getItem("ddyidc-user-refresh"), null);
  assert.equal(sessionStorage.getItem("ddyidc-user-refresh"), "temporary");
  api.saveRefreshSession(pair("persistent"), true);
  assert.equal(sessionStorage.getItem("ddyidc-user-refresh"), null);
  assert.equal(localStorage.getItem("ddyidc-user-refresh"), "persistent");
  behavior = async (url, body, config) => {
    assert.equal(url, "/api/v1/auth/refresh");
    assert.equal(body.rememberMe, true);
    assert.equal(config.headers["X-Refresh-Request"], "1");
    await new Promise((resolve) => setTimeout(resolve, 20));
    return response(calls === 1 ? "rotated" : `rotated-${calls}`);
  };
  await Promise.all(Array.from({ length: 10 }, () => api.renewUserSession()));
  assert.equal(calls, 1);
  assert.equal(localStorage.getItem("ddyidc-user-refresh"), "rotated");
  const secondTab = await import(moduleURL("\n// second-tab"));
  await Promise.all([api.renewUserSession(), secondTab.renewUserSession()]);
  assert.equal(calls, 2);
  behavior = async () => { throw { isAxiosError: true, response: { status: 503 } }; };
  await assert.rejects(api.renewUserSession());
  assert.equal(api.refreshSessionAvailable(), true);
  behavior = async () => { throw { isAxiosError: true, response: { status: 401 } }; };
  await assert.rejects(api.renewUserSession());
  assert.equal(api.refreshSessionAvailable(), false);
  api.saveRefreshSession(pair("before-logout"), false);
  behavior = async () => { api.clearRefreshSession(); return response("must-not-restore"); };
  await assert.rejects(api.renewUserSession());
  assert.equal(api.refreshSessionAvailable(), false);
});

test("quick login stores only the last profile, preserves it on rotation and hides expired credentials", async () => {
  api.clearRefreshSession();
  api.saveRefreshSession({ ...pair("profile-token"), user: { id: "1", name: "用户一", account: "first", mobile: "13800138000", avatar: "https://avatars.example/a" } }, true);
  assert.equal(api.readRememberedProfile().name, "用户一");
  assert.equal(localStorage.getItem("ddyidc-quick-login").includes("13800138000"), false);
  behavior = async () => response("profile-rotated");
  await api.renewUserSession();
  assert.equal(api.readRememberedProfile().name, "用户一");
  api.rememberRefreshProfile({ id: "1", name: "新昵称", account: "first", mobile: "13900139000" });
  assert.equal(api.readRememberedProfile().name, "新昵称");
  api.saveRefreshSession({ ...pair("second-token"), user: { id: "2", name: "用户二", account: "second" } }, true);
  assert.equal(api.readRememberedProfile().id, "2");
  const cached = JSON.parse(localStorage.getItem("ddyidc-quick-login"));
  localStorage.setItem("ddyidc-quick-login", JSON.stringify({ ...cached, expiresAt: Date.now() - 1 }));
  assert.equal(api.readRememberedProfile(), null);
  api.clearRefreshSession();
  assert.equal(localStorage.getItem("ddyidc-quick-login"), null);
  api.saveRefreshSession({ ...pair("temporary-profile"), user: { id: "3", name: "临时用户" } }, false);
  assert.equal(api.readRememberedProfile(), null);
  api.clearRefreshSession();
});
