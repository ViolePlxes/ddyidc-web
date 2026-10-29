import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const source=await readFile(new URL("../src/shared/components/AdminTableCopyText.tsx",import.meta.url),"utf8");
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}});
const resolved=outputText.replace(/from (["'])([^"']+)\1/g,(_,quote,specifier)=>`from ${JSON.stringify(import.meta.resolve(specifier))}`);
const {AdminTableCopyText}=await import(`data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`);
test("admin identifier links and native copy buttons are siblings",()=>{
 const html=renderToStaticMarkup(React.createElement(AdminTableCopyText,{value:"QA-ORDER-001",label:"订单号"},React.createElement("a",{href:"/orders/example"},"QA-ORDER-001")));
 assert.match(html,/<a href="\/orders\/example">QA-ORDER-001<\/a><button/);
 assert.match(html,/data-kumo-component="InlineCopyText"/);assert.match(html,/aria-label="复制订单号"/);
 assert.ok(!/<button[^>]*>[\s\S]*?<a/.test(html));
});
test("absent values do not create a fake clipboard action",()=>{
 for(const value of [undefined,null,"","—"]){const html=renderToStaticMarkup(React.createElement(AdminTableCopyText,{value,label:"用户 ID"}));assert.equal(html,"—");}
});
