import { adminBase } from "../../../shared/utils/adminEntry";
import { Dialog } from "../../../shared/components/Dialog";
import { Banner, Button, Input, Select } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminRequest, getApiMessage, type ApiEnvelope } from "../../../shared/api/request";

interface ImportProduct {
  id: string;
  name: string;
  supplierName: string;
  upstreamProductId: string;
}
async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>) {
  const response = (await request).data;
  if (response.code !== 0) throw new Error(response.message || "请求失败");
  return response.data;
}

export function ImportInstanceDialog({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [upstreamId, setUpstreamId] = useState("");
  const submitting = useRef(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const base = `/customers/${encodeURIComponent(customerId)}/instances`;
  const products = useQuery({
    queryKey: ["admin", "instance-import-products", customerId],
    queryFn: () => unwrap(adminRequest.get<ApiEnvelope<{ items: ImportProduct[] | null }>>(`${base}/import-options`)),
    enabled: open,
  });
  const save = useMutation({
    mutationFn: () => unwrap(adminRequest.post<ApiEnvelope<{ id: string }>>(`${base}/import`, {
      productId, upstreamInstanceId: upstreamId.trim(),
    }, { timeout: 65000 })),
    onSuccess: async (result) => {
      await client.invalidateQueries({ queryKey: ["admin", "customer-records", customerId, "products"] });
      await client.invalidateQueries({ queryKey: ["admin", "customer-instance-options", customerId] });
      setOpen(false);
      navigate(`${adminBase}/customers/${customerId}/instances/${result.id}`);
    },
    onSettled: () => { submitting.current = false; },
  });
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!save.isPending) { setOpen(next); save.reset(); } }}>
      <Dialog.Trigger render={<Button variant="secondary">创建空白实例</Button>} />
      <Dialog className="grid gap-5 p-6">
        <Dialog.Title>创建空白实例并绑定上游</Dialog.Title>
        <Dialog.Description>填写已开通的上游实例 ID。保存时拉取真实 IP、状态与配置，不会在上游再次下单或扣款。</Dialog.Description>
        <form className="grid gap-4" onSubmit={(event) => {
          event.preventDefault();
          if (submitting.current || !productId || !/^[1-9]\d*$/.test(upstreamId.trim())) return;
          submitting.current = true;
          save.mutate();
        }}>
          <Select label="已对接产品" value={productId} disabled={save.isPending || products.isLoading}
            items={Object.fromEntries((products.data?.items ?? []).map((p) => [p.id, `${p.name} · ${p.supplierName} · 商品 #${p.upstreamProductId}`]))}
            onValueChange={(value) => setProductId(value || "")} />
          <Input label="上游实例 ID" description="填写开通后的实例编号，不是商品目录 ID。" inputMode="numeric" pattern="[1-9][0-9]*" required
            value={upstreamId} onChange={(event) => setUpstreamId(event.target.value)} disabled={save.isPending} />
          {products.error && <Banner variant="error" title="读取产品失败" description={getApiMessage(products.error)} />}
          {products.data && !products.data.items?.length && <Banner title="暂无已对接产品，请先在商品管理中完成对接" />}
          {save.error && <Banner variant="error" title="未能保存实例" description={getApiMessage(save.error)} />}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" disabled={save.isPending} onClick={() => setOpen(false)}>取消</Button>
            <Button type="submit" loading={save.isPending} disabled={!productId || !/^[1-9]\d*$/.test(upstreamId.trim())}>保存并拉取信息</Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}
