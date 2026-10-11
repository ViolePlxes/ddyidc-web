import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/shared/utils/catalogIntegrity.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { normalizeCatalogPage, completeCatalog } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const page = { items: [{ id: "10", groupId: "2", parentGroupId: "1", configurable: true }], groups: [{id: "1", parentId: "0", status: 1}, {id: "2", parentId: "1", status: 1}], total: 1, page: 1, pageSize: 100 };
test("safe numeric IDs and status normalize; large string IDs retain precision", () => {
 const normalized = normalizeCatalogPage({ ...page, items: [{ ...page.items[0], id: "9007199254740993", groupId: 2, parentGroupId: 1 }], groups: [{id: 2, parentId: 1, status: "1"}]});
 assert.equal(normalized.items[0].id, "9007199254740993");
 assert.equal(normalized.items[0].groupId, normalized.groups[0].id);
 assert.equal(normalized.groups[0].status, 1);
 assert.throws(() => normalizeCatalogPage({...page, items:[{...page.items[0], id:9007199254740992}]}));
});
test("missing arrays or protocol fields fail explicitly rather than become empty", () => {
 for (const data of [null, {...page, items: undefined}, {...page, groups:undefined}, {...page, total:-1}, {...page, items:[{...page.items[0], configurable:undefined}]}]) assert.throws(()=>normalizeCatalogPage(data));
});
test("partial, repeated or changed pages fail without displaying a partial catalogue", () => {
 assert.throws(()=>completeCatalog({...page,total:2},[]));
 assert.throws(()=>completeCatalog({...page,total:2},[{...page,total:2}]));
 assert.throws(()=>completeCatalog({...page,total:2},[{...page,items:[{...page.items[0],id:"11"}]}]));
 const first={...page,total:2};
 assert.equal(completeCatalog(first,[{...first,items:[{...page.items[0],id:"11"}]}]).items.length,2);
});
test("genuine empty catalogue stays valid", () => {
 assert.equal(completeCatalog(normalizeCatalogPage({...page,items:[],groups:[],total:0}),[]).items.length,0);
});
