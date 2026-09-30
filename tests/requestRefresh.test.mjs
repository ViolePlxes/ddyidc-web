import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import axios from "axios";
import ts from "typescript";

const require = createRequire(import.meta.url);
globalThis.window = { location: { pathname: "/console" }, dispatchEvent: (event) => events.push(event.type) };
const events = [];
let renewals = 0;
let failRenewal;
globalThis.requestRefreshTest = { renewUserSession: async () => { renewals++; if (failRenewal) throw failRenewal; }, refreshSessionAvailable: () => true };
const source = await readFile(new URL("../src/shared/api/request.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  .replace('import { neutralCustomerResponse, neutralCustomerText } from "../utils/customerCopy";', 'const neutralCustomerResponse = x => x; const neutralCustomerText = x => x;')
  .replace('from "axios"', `from ${JSON.stringify(pathToFileURL(require.resolve("axios")).href)}`)
  .replace('import { renewUserSession, refreshSessionAvailable } from "./refreshSession";', 'const { renewUserSession, refreshSessionAvailable } = globalThis.requestRefreshTest;');
const { userRequest, adminRequest } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const unauthorized = (config) => new axios.AxiosError("expired", "ERR_BAD_REQUEST", config, null, { status: 401, data: { code: 1 }, config });

test("401 renews and replays the original write once with no login event", async () => {
  let calls = 0;
  userRequest.defaults.adapter = async (config) => {
    calls++;
    if (calls === 1) throw unauthorized(config);
    assert.equal(config.method, "post");
    assert.equal(config.url, "/orders/example");
    assert.equal(config.data, '{"request_id":"same-id"}');
    assert.equal(config.headers.get("X-CSRF-Token"), undefined);
    return { status: 200, data: { code: 0, data: true }, headers: {}, config };
  };
  const result = await userRequest.post("/orders/example", { request_id: "same-id" }, { headers: { "X-CSRF-Token": "old-csrf" } });
  assert.equal(result.data.data, true);
  assert.equal(calls, 2);
  assert.equal(renewals, 1);
  assert.deepEqual(events, []);
});
test("replay 401 stops once, login and admin never use the user refresh credential", async () => {
  userRequest.defaults.adapter = async (config) => { throw unauthorized(config); };
  await assert.rejects(userRequest.get("/auth/me"));
  assert.equal(renewals, 2);
  assert.deepEqual(events, ["ddyidc:user-unauthorized"]);
  await assert.rejects(userRequest.post("/auth/login", {}));
  assert.equal(renewals, 2);
  adminRequest.defaults.adapter = async (config) => { throw unauthorized(config); };
  await assert.rejects(adminRequest.get("/auth/me"));
  assert.equal(renewals, 2);
  assert.equal(events.at(-1), "ddyidc:admin-unauthorized");
});
test("temporary refresh service failure preserves login intent without unauthorized event", async () => {
  const before = events.length;
  failRenewal = new axios.AxiosError("unavailable", "ERR_BAD_RESPONSE", {}, null, { status: 503 });
  await assert.rejects(userRequest.get("/auth/me"));
  assert.equal(events.length, before);
});
