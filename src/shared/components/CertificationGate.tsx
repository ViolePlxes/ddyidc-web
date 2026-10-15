import { Dialog } from "./Dialog";
import { Banner, Button } from "@cloudflare/kumo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { certificationApi } from "../api/certification";
import { getApiMessage } from "../api/request";
export function useCertificationGate() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => void) {
    setBusy(true);
    setError("");
    try {
      const info = await certificationApi.info();
      if (
        info.settings.enabled &&
        info.settings.requirePurchase &&
        info.status !== 2
      ) {
        setOpen(true);
        return;
      }
      action();
    } catch (e) {
      setError(getApiMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const feedback = (
    <>
      {error && <Banner variant="error" title={error} />}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog className="grid gap-4 p-8">
          <Dialog.Title>尚未实名认证，请先完成实名认证</Dialog.Title>
          <Dialog.Description>
            当前平台要求完成实名认证后购买。国内云产品须遵守实名与合法使用要求。
          </Dialog.Description>
          <Button onClick={() => navigate("/console/certification")}>
            立即认证
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            以后再说
          </Button>
        </Dialog>
      </Dialog.Root>
    </>
  );
  return { run, busy, feedback };
}
