import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/shared/utils/productOptions.ts", import.meta.url), "utf8");
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}});
const {usesResourceSlider,optionValueCount,isResourceOption,optionValueAt}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const option={field:"cpu",name:"CPU",optionType:"select",min:1,max:1,step:1,options:[]};
test("six resource choices use segments; seven retain slider and original IDs",()=>{
 const six={...option,options:Array.from({length:6},(_,i)=>({id:`choice-${i*3}`,name:`${i+1}核`}))};
 assert.equal(usesResourceSlider(six),false);
 const seven={...six,options:[...six.options,{id:"special-choice",name:"64核"}]};
 assert.equal(usesResourceSlider(seven),true);assert.equal(optionValueAt(seven,6),"special-choice");
});
test("quantity control counts selectable points rather than price tiers",()=>{
 const qty={...option,optionType:"qty",min:1,max:100,options:[{id:"price-tier"}]};
 assert.equal(optionValueCount(qty),100);assert.equal(usesResourceSlider(qty),true);
 assert.equal(usesResourceSlider({...qty,max:6}),false);
 assert.equal(optionValueCount({...qty,min:0.1,max:0.3,step:0.1}),3);
 assert.equal(isResourceOption({...qty,max:1}),true);
});
