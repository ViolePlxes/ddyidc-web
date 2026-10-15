import { Dialog } from "./Dialog";
import { Button } from "@cloudflare/kumo";
import { useState, type ReactNode } from "react";

export function ConfirmAction({ children, title, description, onConfirm, loading, disabled }: {
  children: ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger render={<Button loading={loading} disabled={disabled} />}>{children}</Dialog.Trigger>
    <Dialog className="p-8">
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description className="my-4">{description}</Dialog.Description>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)}>返回</Button>
        <Button onClick={() => { setOpen(false); onConfirm(); }}>确认</Button>
      </div>
    </Dialog>
  </Dialog.Root>;
}
