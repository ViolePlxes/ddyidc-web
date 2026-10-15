import { Button, Input } from '@cloudflare/kumo';

type Band={min:number;max:number;points:number};
export function LadderEditor({value,onChange}:{value:unknown[];onChange:(bands:Band[])=>void}){
 const rows=value as Band[];
 const update=(index:number,field:keyof Band,next:number)=>onChange(rows.map((row,i)=>i===index?{...row,[field]:next}:row));
 return <div className="col-span-full grid gap-3"><p className="text-base text-kumo-subtle">按金额从低到高配置，档位不能重叠；最高金额为0表示不限。</p>{rows.map((row,i)=><div className="grid gap-3 sm:grid-cols-4" key={i}>
  <Input label="最低金额（元）" type="number" min={0} step="0.01" value={row.min/100} onChange={e=>update(i,'min',Math.round(Number(e.target.value)*100))}/>
  <Input label="最高金额（元）" type="number" min={0} step="0.01" value={row.max/100} onChange={e=>update(i,'max',Math.round(Number(e.target.value)*100))}/>
  <Input label="奖励积分" type="number" min={0} step={1} value={row.points} onChange={e=>update(i,'points',Number(e.target.value))}/>
  <Button variant="secondary" className="self-end" onClick={()=>onChange(rows.filter((_,index)=>index!==i))}>删除档位</Button>
 </div>)}<Button variant="secondary" className="justify-self-start" onClick={()=>onChange([...rows,{min:rows.length?(rows.at(-1)!.max+1):0,max:0,points:0}])}>添加档位</Button></div>;
}
