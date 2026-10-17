import { create } from "zustand";
import { useAuthStore } from "../../stores/auth";
import { useAdminAuthStore } from "../../stores/staffAuth";
import type { RichDocument } from "../editor/document";
import type { TicketAttachment, TicketReply } from "../../api/tickets";
import type { SetStateAction } from "react";

type Draft = { content: string; richContent?: RichDocument; attachments: TicketAttachment[]; quote?: TicketReply };
const empty: Draft = { content: "", attachments: [] };
const useDrafts = create<{ rows: Record<string, Draft>; put: (key: string, update: (draft: Draft) => Draft) => void; clear: () => void }>(set => ({
 rows: {}, put: (key, update) => set(s => ({ rows: { ...s.rows, [key]: update(s.rows[key] ?? empty) } })), clear: () => { set({ rows: {} }); window.dispatchEvent(new Event("ticket-drafts-cleared")); },
}));
// Memory only: route changes retain drafts; an identity change discards them.
useAuthStore.subscribe((s, old) => { if (s.user?.id !== old.user?.id) useDrafts.getState().clear(); });
useAdminAuthStore.subscribe((s, old) => { if (s.user?.id !== old.user?.id) useDrafts.getState().clear(); });
export function useTicketDraft(scope: "user" | "admin", id: string) {
 const key = `${scope}:${id}`;
 const draft = useDrafts(s => s.rows[key] ?? empty);
 const field = <K extends keyof Draft>(name: K) => (value: SetStateAction<Draft[K]>) => useDrafts.getState().put(key, current => ({ ...current, [name]: typeof value === "function" ? (value as (v: Draft[K]) => Draft[K])(current[name]) : value }));
 return { ...draft, setContent: field("content"), setRichContent: field("richContent"), setAttachments: field("attachments"), setQuote: field("quote") };
}
