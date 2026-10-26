import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { LayerDialog } from '@cloudflare/kumo';
import { useBlocker } from 'react-router-dom';

interface Store { values: Map<string, unknown>; dirty: Set<string> }
const Context = createContext<Store | null>(null);
export function useConsoleDraftField<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const store = useContext(Context);
  const [value,setValue] = useState<T>(() => store?.values.has(key) ? store.values.get(key) as T : initial);
  const update: Dispatch<SetStateAction<T>> = next => setValue(previous => { const resolved = typeof next === 'function' ? (next as (value:T)=>T)(previous) : next; store?.values.set(key,resolved); return resolved; });
  return [value,update];
}
export function useConsoleUnsaved(key: string, dirty: boolean) {
  const store = useContext(Context);
  useEffect(() => { if (dirty) store?.dirty.add(key); else store?.dirty.delete(key); return () => { store?.dirty.delete(key); }; },[key,dirty,store]);
  return useCallback(() => { store?.dirty.delete(key); for (const name of store?.values.keys() ?? []) if (name.startsWith(key + '/')) store?.values.delete(name); },[key,store]);
}
function ActiveBoundary({children}:{children:ReactNode}) {
  const store=useRef<Store>({values:new Map(),dirty:new Set()}).current;
  const blocker=useBlocker(({currentLocation,nextLocation})=>currentLocation.pathname!==nextLocation.pathname && store.dirty.size>0);
  useEffect(()=>{const guard=(event:BeforeUnloadEvent)=>{if(store.dirty.size)event.preventDefault();}; window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[store]);
  return <Context.Provider value={store}>{children}<LayerDialog.Root open={blocker.state==='blocked'} onOpenChange={open=>{if(!open&&blocker.state==='blocked')blocker.reset();}}><LayerDialog.Content><LayerDialog.Title>有未提交的内容，确认离开？</LayerDialog.Title><LayerDialog.Description>不会自动提交或付款。普通工单草稿仅在本次登录会话内保留；认证、密码等敏感资料不会缓存，离开后可能丢失。</LayerDialog.Description><LayerDialog.Body><p>你可以继续编辑，完成后再离开。</p></LayerDialog.Body><LayerDialog.Actions dismissLabel="继续编辑"><LayerDialog.Action onClick={()=>{if(blocker.state==='blocked')blocker.proceed();}}>确认离开</LayerDialog.Action></LayerDialog.Actions></LayerDialog.Content></LayerDialog.Root></Context.Provider>;
}
export function ConsoleDraftBoundary({children,enabled}:{children:ReactNode;enabled:boolean}) { return enabled?<ActiveBoundary>{children}</ActiveBoundary>:children; }
