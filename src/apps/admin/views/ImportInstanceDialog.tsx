import { adminBase } from "../../../shared/utils/adminEntry";
import { Banner, Button, Combobox, Input, LayerDialog, Toolbar } from "@cloudflare/kumo";
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
function productLabel(product: ImportProduct) {
  return `${product.name} · ${product.supplierName} · 商品 #${product.upstreamProductId}`;
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
  const items = products.data?.items ?? [];
  const labels = items.map(productLabel);
  const selected = items.find((item) => item.id === productId);
  const validUpstream = /^[1-9]\d*$/.test(upstreamId.trim());
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
  const submit = () => {
    if (submitting.current || !productId || !validUpstream) return;
    submitting.current = true;
    save.mutate();
  };
  return <>
    <Button variant="secondary" onClick={() => { setProductId(""); setUpstreamId(""); save.reset(); setOpen(true); }}>创建空白实例</Button>
    <LayerDialog.Root open={open} dismissDisabled={save.isPending} onOpenChange={(next) => { if (save.isPending) return; setOpen(next); if (!next) save.reset(); }}>
      <LayerDialog.Content>
        <LayerDialog.Title>创建空白实例并绑定上游</LayerDialog.Title>
        <LayerDialog.Description>选择已对接产品后填写已开通的上游实例 ID。保存时拉取真实 IP、状态与配置，不会在上游再次下单或扣款。</LayerDialog.Description>
        <LayerDialog.Body><div className="grid gap-4">
          <div className="grid gap-2">
            <span className="text-sm font-medium">已对接产品</span>
            <Toolbar className="w-full">
              <Combobox
                items={labels}
                value={selected ? productLabel(selected) : null}
                onValueChange={(value) => setProductId(items.find((item) => productLabel(item) === value)?.id ?? "")}
              >
                <Combobox.TriggerInput className="flex-1" aria-label="已对接产品" placeholder="搜索产品名 / 供应商 / 商品 ID" render={<Toolbar.Input />} />
                <Combobox.Content>
                  <Combobox.List>
                    {(item: string) => <Combobox.Item key={item} value={item}>{item}</Combobox.Item>}
                  </Combobox.List>
                  <Combobox.Empty>没有匹配的已对接产品</Combobox.Empty>
                </Combobox.Content>
              </Combobox>
            </Toolbar>
            {!products.isLoading && !items.length ? <p className="text-sm text-kumo-subtle">暂无已对接产品，请先在商品管理中完成对接。</p> : null}
            {products.error && <Banner variant="error" title="读取产品失败" description={getApiMessage(products.error)} />}
          </div>
          <Input label="上游实例 ID" description="填写开通后的实例编号，不是商品目录 ID。" inputMode="numeric" pattern="[1-9][0-9]*" required
            value={upstreamId} onChange={(event) => setUpstreamId(event.target.value)} disabled={save.isPending} />
          {save.error && <Banner variant="error" title="未能保存实例" description={getApiMessage(save.error)} />}
        </div></LayerDialog.Body>
        <LayerDialog.Actions dismissLabel="取消">
          <LayerDialog.Action disabled={!productId || !validUpstream || save.isPending} loading={save.isPending} onClick={submit}>保存并拉取信息</LayerDialog.Action>
        </LayerDialog.Actions>
      </LayerDialog.Content>
    </LayerDialog.Root>
  </>;
}
