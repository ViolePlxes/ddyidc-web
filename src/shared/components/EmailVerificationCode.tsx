import {useRef} from 'react';
import {Input} from '@cloudflare/kumo';
export function EmailVerificationCode({value,onChange}:{value:string[];onChange:(value:string[])=>void}) {
 const refs=useRef<(HTMLInputElement|null)[]>([]);
 const distribute=(index:number,text:string)=>{
  const digits=text.replace(/\D/g,'').slice(0,6-index);if(!digits)return;
  const next=[...value];for(let offset=0;offset<digits.length;offset++)next[index+offset]=digits[offset]!;
  onChange(next);refs.current[Math.min(index+digits.length,5)]?.focus();
 };
 return <div role="group" aria-label="六位邮箱验证码" className="flex justify-center gap-2">{value.map((digit,index)=><Input key={index} ref={el=>{refs.current[index]=el;}} aria-label={`验证码第${index+1}位`} autoFocus={index===0} inputMode="numeric" autoComplete={index===0?'one-time-code':'off'} value={digit} className="h-12 w-10 px-0 text-center caret-transparent selection:bg-transparent selection:text-current" onChange={event=>{
  const text=event.target.value;if(!text){const next=[...value];next[index]='';onChange(next);return;}
  distribute(index,text.length>1&&digit&&text.startsWith(digit)?text.slice(1):text);
 }} onPaste={event=>{event.preventDefault();distribute(index,event.clipboardData.getData('text'));}} onFocus={event=>event.target.select()} onClick={event=>event.currentTarget.select()} onKeyDown={event=>{
  if(event.key==='Backspace'){event.preventDefault();const next=[...value];if(next[index])next[index]='';else if(index>0){next[index-1]='';refs.current[index-1]?.focus();}onChange(next);}
  if(event.key==='ArrowLeft'&&index>0){event.preventDefault();refs.current[index-1]?.focus();}
  if(event.key==='ArrowRight'&&index<5){event.preventDefault();refs.current[index+1]?.focus();}
 }} />)}</div>;
}

