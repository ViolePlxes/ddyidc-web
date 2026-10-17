import { TicketReplyEditor } from './TicketReplyEditor';
import { TicketRichContent } from './TicketRichContent';
import type { RichDocument } from '../editor/document';
import type { TicketAttachment } from '../../api/tickets';
import { Button, LayerCard, Link } from "@cloudflare/kumo";
import { ArrowBendUpLeftIcon, PaperclipIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TicketReply } from "../../api/tickets";

export function TicketConversation({ replies, perspective, onQuote, fill = false }: { replies: TicketReply[]; perspective: "Client" | "Admin"; onQuote: (reply: TicketReply) => void; fill?: boolean | "viewport" }) {
  const scroll = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [unseen, setUnseen] = useState(false);
  const latest = replies.at(-1)?.id;
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    if (following.current) { el.scrollTop = el.scrollHeight; setUnseen(false); }
    else setUnseen(true);
  }, [latest]);
  return (
    <div className={`relative min-w-0 ${fill === "viewport" ? "h-full min-h-0" : fill ? "xl:h-full xl:min-h-0" : ""}`}>
    <div ref={scroll} role="log" aria-label="工单消息" onScroll={() => { const el = scroll.current; if (el) { following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; if (following.current) setUnseen(false); } }} className={`grid min-w-0 content-start gap-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 ${fill === "viewport" ? "h-full min-h-0" : fill ? "min-h-64 max-h-[60dvh] xl:h-full xl:min-h-0 xl:max-h-none" : "max-h-[60dvh] min-h-64"}`} onLoadCapture={() => { const el = scroll.current; if (el && following.current) el.scrollTop = el.scrollHeight; }} aria-live="polite">
      {replies.map((reply) => {
        const mine = reply.type === perspective;
        return (
          <div key={reply.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <LayerCard className={`grid w-fit min-w-0 max-w-[92%] gap-2 px-4 py-3 sm:max-w-[80%] ${mine ? "bg-kumo-recessed" : "bg-kumo-base"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm font-medium text-kumo-strong">
                  {reply.type === "Client" ? "客户" : "管理员"}{mine ? "（我）" : ""}
                </strong>
                <span className="text-sm text-kumo-subtle">{new Date(reply.createdAt).toLocaleString("zh-CN")}</span>
              </div>
              {reply.quote ? (
                <div className="border-l-2 border-kumo-line bg-kumo-recessed p-3 text-sm text-kumo-subtle">
                  <span className="font-medium">引用{reply.quote.type === "Client" ? "客户" : "管理员"}：</span>
                  <span className="ml-1 line-clamp-2">{reply.quote.content}</span>
                </div>
              ) : null}
              <TicketRichContent reply={reply} perspective={perspective} />
              <AttachmentLinks attachments={reply.attachments} />
              <div>
                <Button type="button" variant="ghost" size="sm" icon={<ArrowBendUpLeftIcon />} onClick={() => onQuote(reply)}>
                  引用回复
                </Button>
              </div>
            </LayerCard>
          </div>
        );
      })}
      {!replies.length ? <p className="text-sm text-kumo-subtle">暂无消息</p> : null}
    </div>
    {unseen ? <div className="absolute bottom-3 left-0 right-0 flex justify-center"><Button size="sm" variant="secondary" onClick={() => { const el = scroll.current; if (el) el.scrollTop = el.scrollHeight; following.current = true; setUnseen(false); }}>查看新消息</Button></div> : null}
    </div>
  );
}

export function ReplyComposer({
  content,
  richContent, onRichContentChange, attachments, onUploaded, onUploadingChange, perspective,
  quote,
  submitting,
  disabled,
  children,
  actions,
  fillEditor,
  onContentChange,
  onClearQuote,
  onSubmit,
}: {
  content: string;
  richContent?: RichDocument; onRichContentChange: (value: RichDocument | undefined) => void; attachments: TicketAttachment[]; onUploaded: (rows: TicketAttachment[]) => void; onUploadingChange: (loading: boolean) => void; perspective: "Client" | "Admin";
  quote?: TicketReply;
  submitting: boolean;
  disabled: boolean;
  children?: ReactNode;
  actions?: ReactNode;
  fillEditor?: boolean | "viewport";
  onContentChange: (value: string) => void;
  onClearQuote: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="h-full min-h-0 p-px"><LayerCard className="flex h-full min-h-0 min-w-0 flex-col gap-3 px-4 py-3">
      {quote ? (
        <div className="flex items-start gap-3 border-l-2 border-kumo-line bg-kumo-recessed p-3">
          <ArrowBendUpLeftIcon className="mt-0.5 shrink-0 text-kumo-subtle" />
          <p className="line-clamp-2 min-w-0 flex-1 text-sm text-kumo-subtle">{quote.content}</p>
          <Button type="button" variant="ghost" shape="square" size="sm" icon={<XIcon />} aria-label="取消引用" onClick={onClearQuote} />
        </div>
      ) : null}
      <div className="min-h-0 flex-1 p-px"><TicketReplyEditor fill={fillEditor ?? perspective === "Admin"} hideLabel text={content} value={richContent} onChange={(text, doc) => { onContentChange(text); onRichContentChange(doc); }} disabled={disabled || submitting} attachments={attachments} onUploaded={onUploaded} onUploadingChange={onUploadingChange} perspective={perspective}/></div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-kumo-line pt-3">
        <div>{children}</div><div className="ml-auto flex flex-wrap items-center justify-end gap-3">{actions}
        <Button icon={<PaperPlaneTiltIcon />} loading={submitting} disabled={disabled || submitting || !content.trim() || Array.from(content).length > 20000} onClick={onSubmit}>
          发送回复
        </Button>
      </div></div>
    </LayerCard></div>
  );
}

export function AttachmentLinks({ attachments }: { attachments: TicketReply["attachments"] }) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <Link
          key={attachment.id}
          href={attachment.url}
          download={attachment.name}
          className="inline-flex items-center gap-2 text-sm"
        >
          <PaperclipIcon />{attachment.name}
        </Link>
      ))}
    </div>
  );
}
