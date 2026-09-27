import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/shared/utils/productCatalog.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { secondaryGroups, belongsToGroup, isUpstreamProduct, catalogDescription, catalogStock, isCatalogAvailable } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("visible inventory and selection use the same local quota precedence", () => {
  const available = { stock: 5, upstreamStock: "0", catalogSpec: { stock: null } };
  assert.equal(catalogStock(available), 5);
  assert.equal(isCatalogAvailable(available), true);
  const exhausted = { stock: 5, upstreamStock: "99", catalogSpec: { stock: 0 } };
  assert.equal(catalogStock(exhausted), 0);
  assert.equal(isCatalogAvailable(exhausted), false);
  assert.equal(isCatalogAvailable({ stock: null, upstreamStock: "0" }), false);
  assert.equal(isCatalogAvailable({ stock: null, upstreamStock: 3 }), true);
  assert.equal(catalogStock({ stock: null, upstreamStock: "余量待确认" }), "余量待确认");
  assert.equal(isCatalogAvailable({ stock: null, upstreamStock: "余量待确认" }), true);
  assert.equal(catalogStock({ stock: null }), null);
});

test("second-level ownership uses IDs, including duplicate names and empty roots", () => {
  const groups = [
    { id: "r1", parentId: "0", name: "云", status: 1 },
    { id: "r2", parentId: "0", name: "云", status: 1 },
    { id: "a", parentId: "r1", name: "香港", status: 1 },
    { id: "b", parentId: "r2", name: "香港", status: 1 },
    { id: "hidden", parentId: "r1", status: 0 },
    { id: "orphan", parentId: "missing", status: 1 },
  ];
  assert.deepEqual(secondaryGroups(groups, "r1").map((g) => g.id), ["a"]);
  assert.deepEqual(secondaryGroups(groups, "all").map((g) => g.id), ["a", "b"]);
  assert.deepEqual(secondaryGroups(groups, "empty"), []);
  assert.equal(belongsToGroup({ groupId: "a", parentGroupId: "r1" }, groups[2]), true);
  assert.equal(belongsToGroup({ groupId: "a", parentGroupId: "r2" }, groups[2]), false);
});

test("only genuine linked products are eligible; empty manual specs do not exclude them", () => {
  assert.equal(isUpstreamProduct({ supplierId: "9", upstreamProductId: "28", specs: [] }), true);
  for (const value of ["", "0", undefined]) {
    assert.equal(isUpstreamProduct({ supplierId: value, upstreamProductId: "28" }), false);
    assert.equal(isUpstreamProduct({ supplierId: "9", upstreamProductId: value }), false);
  }
});

test("supplier styles and scripts never appear as catalogue parameters", () => {
  assert.equal(catalogDescription({ description: "<style>table{color:red}</style><script>bad()</script>4核<br>4GB&nbsp;DDR4", summary: "" }), "4核 · 4GB DDR4");
  assert.equal(catalogDescription({ description: "", summary: "<style>truncated CSS" }), "");
});
