import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source=await readFile(new URL("../src/shared/utils/retiredLayoutPreferences.ts",import.meta.url),"utf8");
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}});
const {clearRetiredLayoutPreferences}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
test("clears all retired account and guest preferences, preserving other settings",()=>{
 const values=new Map([["ddyidc-layout-width:guest","centered"],["ddyidc-layout-width:admin:1","wide"],["ddyidc-layout-width:customer:2","centered"],["ddyidc-theme","dark"],["draft","keep"]]);
 const storage={get length(){return values.size},key:index=>[...values.keys()][index]??null,removeItem:key=>values.delete(key)};
 clearRetiredLayoutPreferences(storage);clearRetiredLayoutPreferences(storage);
 assert.deepEqual([...values],[["ddyidc-theme","dark"],["draft","keep"]]);
});
test("blocked storage does not prevent startup",()=>{
 assert.doesNotThrow(()=>clearRetiredLayoutPreferences({get length(){throw Error("blocked")}}));
 assert.doesNotThrow(()=>clearRetiredLayoutPreferences({length:1,key:()=>"ddyidc-layout-width:guest",removeItem(){throw Error("blocked")}}));
});
