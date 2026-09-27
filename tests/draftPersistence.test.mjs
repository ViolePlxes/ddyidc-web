import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import test from "node:test";
import ts from "typescript";

globalThis.crypto ??= webcrypto;
const compile = (source) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const url = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const credentials = url(compile(await readFile(new URL("../src/shared/utils/credentials.ts", import.meta.url), "utf8")));
const code = compile(await readFile(new URL("../src/shared/utils/draftPersistence.ts", import.meta.url), "utf8")).replace('"./credentials"', JSON.stringify(credentials));
const { redactDraft, restoreDraft } = await import(url(code));

test("persisted cart/draft excludes plaintext while preserving original option IDs", () => {
  const input = { productId: "123", password: "unit-test-only-secret", configOptions: [{ id: "network", value: "original-option-id" }], quantity: 2 };
  const saved = redactDraft(input);
  assert.equal(JSON.stringify(saved).includes(input.password), false);
  assert.equal("password" in saved, false);
  assert.deepEqual(saved.configOptions, input.configOptions);
  const restored = restoreDraft(saved);
  assert.notEqual(restored.password, input.password);
  assert.ok(restored.password.length >= 12);
  assert.deepEqual(restored.configOptions, input.configOptions);
  assert.equal(restored.quantity, 2);
});

test("legacy plaintext is discarded and fixed products gain no unsolicited password", () => {
  const restored = restoreDraft({ productId: "123", password: "legacy-test-only-secret" });
  assert.notEqual(restored.password, "legacy-test-only-secret");
  assert.equal(JSON.stringify(redactDraft(restored)).includes("legacy-test-only-secret"), false);
  assert.equal(restoreDraft(redactDraft({ productId: "fixed", password: "" })).password, "");
});
