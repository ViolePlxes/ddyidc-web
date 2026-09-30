import { Button, LayerCard, Textarea } from "@cloudflare/kumo";
import { ArrowBendUpLeftIcon, PaperclipIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { TicketReply } from "../../api/tickets";

export function TicketConversation({ replies, perspective, onQuote }: { replies: TicketReply[]; perspective: "Client" | "Admin"; onQuote: (reply: TicketReply) => void }) {
  return (
    <div className="grid min-w-0 gap-5" aria-live="polite">
      {replies.map((reply) => {
        const mine = reply.type === perspective;
        return (
          <div key={reply.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <LayerCard className={`shadow-none grid w-full min-w-0 gap-5 p-5 sm:p-6 ${mine ? "bg-kumo-tint" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm font-medium text-kumo-strong">
                  {reply.type === "Client" ? "客户" : "管理员"}{mine ? "（我）" : ""}
                </strong>
                <span className="text-xs text-kumo-subtle">{new Date(reply.createdAt).toLocaleString("zh-CN")}</span>
              </div>
              {reply.quote ? (
                <div className="border-l-2 border-kumo-line bg-kumo-recessed p-3 text-sm text-kumo-subtle">
                  <span className="font-medium">引用{reply.quote.type === "Client" ? "客户" : "管理员"}：</span>
                  <span className="ml-1 line-clamp-2">{reply.quote.content}</span>
                </div>
              ) : null}
              <p className="whitespace-pre-wrap break-words text-base text-kumo-default">{reply.content}</p>
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
    </div>
  );
}

export function ReplyComposer({
  content,
  quote,
  submitting,
  disabled,
  children,
  onContentChange,
  onClearQuote,
  onSubmit,
}: {
  content: string;
  quote?: TicketReply;
  submitting: boolean;
  disabled: boolean;
  children?: ReactNode;
  onContentChange: (value: string) => void;
  onClearQuote: () => void;
  onSubmit: () => void;
}) {
  return (
    <LayerCard className="shadow-none grid min-w-0 gap-5 p-5 sm:p-6">
      {quote ? (
        <div className="flex items-start gap-3 border-l-2 border-kumo-line bg-kumo-recessed p-3">
          <ArrowBendUpLeftIcon className="mt-0.5 shrink-0 text-kumo-subtle" />
          <p className="line-clamp-2 min-w-0 flex-1 text-sm text-kumo-subtle">{quote.content}</p>
          <Button type="button" variant="ghost" shape="square" size="sm" icon={<XIcon />} aria-label="取消引用" onClick={onClearQuote} />
        </div>
      ) : null}
      <Textarea
        className="h-[200px] w-full"
        label="回复内容"
        value={content}
        rows={6}
        placeholder={disabled ? "该工单已关闭，不能继续回复。" : "请描述处理结果或补充信息…"}
        disabled={disabled}
        onChange={(event) => onContentChange(event.target.value)}
      />
      {children}
      <div className="flex justify-end">
        <Button icon={<PaperPlaneTiltIcon />} loading={submitting} disabled={disabled || !content.trim()} onClick={onSubmit}>
          发送回复
        </Button>
      </div>
    </LayerCard>
  );
}

export function AttachmentLinks({ attachments }: { attachments: TicketReply["attachments"] }) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.url}
          download={attachment.name}
          className="inline-flex items-center gap-2 text-sm text-kumo-link hover:underline"
        >
          <PaperclipIcon />{attachment.name}
        </a>
      ))}
    </div>
  );
}
