import { Button, LayerCard } from "@cloudflare/kumo";
import { PaperclipIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useRef } from "react";
import type { TicketAttachment } from "../../api/tickets";

export function AttachmentPicker({
  value,
  loading,
  onUpload,
  onChange,
}: {
  value: TicketAttachment[];
  loading: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onChange: (value: TicketAttachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.log,.zip"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) void onUpload(files);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        icon={<UploadSimpleIcon />}
        loading={loading}
        onClick={() => inputRef.current?.click()}
      >
        上传附件
      </Button>
      {value.length ? (
        <LayerCard className="p-0">
          <ul className="divide-y divide-kumo-line">
            {value.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                <PaperclipIcon className="shrink-0 text-kumo-subtle" />
                <span className="min-w-0 flex-1 truncate text-sm text-kumo-strong">{item.name}</span>
                <span className="text-xs text-kumo-subtle">{Math.max(1, Math.ceil(item.size / 1024))} KB</span>
                <Button
                  type="button"
                  variant="ghost"
                  shape="square"
                  size="sm"
                  icon={<TrashIcon />}
                  aria-label={`移除 ${item.name}`}
                  onClick={() => onChange(value.filter((entry) => entry.id !== item.id))}
                />
              </li>
            ))}
          </ul>
        </LayerCard>
      ) : null}
    </div>
  );
}
