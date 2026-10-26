import { createContext, useCallback, useContext, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Button, LayerDialog } from '@cloudflare/kumo';
import { useNavigate } from 'react-router-dom';
import type { PortalDocument } from '../api/portalContent';

interface Draft { document?: PortalDocument; dirty: boolean }
const DraftContext = createContext<{ draft: Draft; update: (draft: Draft) => void }>({ draft: { dirty: false }, update: () => {} });
export const useContentDraft = () => useContext(DraftContext);

/** Session-only draft cache also preserves unsaved content across browser back/forward. */
export function ContentDraftBoundary({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>({ dirty: false });
  const [destination, setDestination] = useState<string>();
  const navigate = useNavigate();
  const update = useCallback((next: Draft) => setDraft(previous => previous.document === next.document && previous.dirty === next.dirty ? previous : next), []);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (draft.dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [draft.dirty]);
  const capture = (event: MouseEvent<HTMLDivElement>) => {
    if (!draft.dirty || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const target = new URL(anchor.href, window.location.href);
    if (target.origin !== window.location.origin || target.pathname === window.location.pathname) return;
    // All content sections share one editor document, so switching sections retains the draft.
    if (/\/content(?:\/|$)/.test(window.location.pathname) && /\/content(?:\/|$)/.test(target.pathname)) return;
    event.preventDefault(); event.stopPropagation();
    setDestination(target.pathname + target.search + target.hash);
  };
  return <DraftContext.Provider value={{ draft, update }}><div className="contents" onClickCapture={capture}>{children}</div>
    <LayerDialog.Root open={Boolean(destination)} onOpenChange={open => { if (!open) setDestination(undefined); }}><LayerDialog.Content><LayerDialog.Title>有未保存的草稿，确认离开？</LayerDialog.Title><LayerDialog.Description>不会自动保存或发布。草稿会暂存在本次后台会话中，返回可继续编辑；刷新或退出登录后可能丢失。</LayerDialog.Description><LayerDialog.Body><div className="grid gap-3"><p>选择继续编辑可留在当前页面，保存草稿后再离开。</p><Button variant="destructive" onClick={() => { const target = destination; setDestination(undefined); setDraft({ dirty: false }); if (target) navigate(target); }}>放弃草稿并离开</Button></div></LayerDialog.Body><LayerDialog.Actions dismissLabel="继续编辑"><LayerDialog.Action onClick={() => { const target = destination; setDestination(undefined); if (target) navigate(target); }}>确认离开</LayerDialog.Action></LayerDialog.Actions></LayerDialog.Content></LayerDialog.Root>
  </DraftContext.Provider>;
}
