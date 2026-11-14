import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/shared/utils/fillingPageSize.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { fillingRowCount } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("rows fill the measured height and never exceed it", () => {
  assert.equal(fillingRowCount(500, 44, 48), 9);
  assert.equal(fillingRowCount(44 + 48 * 4, 44, 48), 4);
  assert.equal(fillingRowCount(44 + 48 * 4 - 1, 44, 48), 3);
});

test("the measured count stays inside the 3-50 guard rails", () => {
  assert.equal(fillingRowCount(10, 44, 48), 3);
  assert.equal(fillingRowCount(5000, 44, 48), 50);
  assert.equal(fillingRowCount(500, 44, 48, 2, 12), 9);
  assert.equal(fillingRowCount(5000, 44, 48, 2, 12), 12);
});

test("a broken measurement falls back to the minimum instead of NaN rows", () => {
  assert.equal(fillingRowCount(Number.NaN, 44, 48), 3);
  assert.equal(fillingRowCount(500, Number.NaN, 48), 3);
  assert.equal(fillingRowCount(500, 44, 0), 3);
  assert.equal(fillingRowCount(500, 44, -48), 3);
});
