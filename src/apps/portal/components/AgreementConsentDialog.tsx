import { Button, Dialog } from "@cloudflare/kumo";

type AgreementConsentDialogProps = {
  open: boolean;
  onAgree: () => void;
  onOpenChange: (open: boolean) => void;
};

export function AgreementConsentDialog({
  open,
  onAgree,
  onOpenChange,
}: AgreementConsentDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog className="grid gap-5 p-6">
        <div className="grid gap-2">
          <Dialog.Title className="text-xl font-semibold">
            请先同意相关协议
          </Dialog.Title>
          <Dialog.Description className="text-kumo-subtle">
            请阅读并同意《服务协议》和《隐私协议》后继续。
          </Dialog.Description>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onAgree}>同意并继续</Button>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
