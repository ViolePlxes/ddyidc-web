import { Banner, Button, Textarea } from "@cloudflare/kumo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Dialog } from "../../../shared/components/Dialog";
import { certificationAdminApi } from "../../../shared/api/certification";
import type { TodoEntry } from "../../../shared/api/adminTodos";
import { getApiMessage } from "../../../shared/api/request";

export function TodoCertificationActions({ row }: { row: TodoEntry }) {
  const cache = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const inFlight = useRef(false);
  const refresh = () => Promise.all([
    cache.invalidateQueries({ queryKey: ["admin-todos"] }),
    cache.invalidateQueries({ queryKey: ["admin-todo-items", "certifications"] }),
    cache.invalidateQueries({ queryKey: ["certification-list"] }),
    cache.invalidateQueries({ queryKey: ["certification-detail", row.id] }),
  ]);
  const review = useMutation({
    retry: false,
    mutationFn: async (action: "pass" | "reject") => {
      const { record } = await certificationAdminApi.detail(row.id);
      if (record.status !== 1) throw new Error("该申请已处理，请刷新列表。");
      return certificationAdminApi.review(row.id, action, action === "reject" ? reason.trim() : "管理员在待处理实名列表审核通过");
    },
    onSuccess: async () => { setRejectOpen(false); setReason(""); await refresh(); },
    onError: async () => { await refresh(); },
  });
  const submit = (action: "pass" | "reject") => {
    if (inFlight.current || (action === "reject" && !reason.trim())) return;
    inFlight.current = true;
    review.mutate(action, { onSettled: () => { inFlight.current = false; } });
  };
  return <>
    <Button loading={review.isPending && review.variables === "pass"} disabled={review.isPending} onClick={() => submit("pass")}>通过</Button>
    <Button variant="secondary" disabled={review.isPending} onClick={() => { review.reset(); setReason(""); setRejectOpen(true); }}>拒绝</Button>
    {review.error && !rejectOpen ? <Banner variant="error" title={getApiMessage(review.error)} /> : null}
    <Dialog.Root open={rejectOpen} onOpenChange={open => { if (!review.isPending) setRejectOpen(open); }}>
      <Dialog className="grid gap-4 p-6">
        <Dialog.Title>拒绝实名申请</Dialog.Title>
        <Dialog.Description>申请编号：{row.number}。拒绝原因将告知客户并保留审核记录。</Dialog.Description>
        <Textarea label="拒绝原因（必填）" required maxLength={255} value={reason} disabled={review.isPending} onChange={event => setReason(event.target.value)} />
        {review.error ? <Banner variant="error" title={getApiMessage(review.error)} /> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={review.isPending} onClick={() => setRejectOpen(false)}>取消</Button>
          <Button loading={review.isPending} disabled={review.isPending || !reason.trim()} onClick={() => submit("reject")}>确认拒绝</Button>
        </div>
      </Dialog>
    </Dialog.Root>
  </>;
}
