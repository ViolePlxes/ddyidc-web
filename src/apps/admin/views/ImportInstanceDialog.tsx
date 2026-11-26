import { adminBase } from "../../../shared/utils/adminEntry";
import { Banner, Button, Input, LayerDialog, Toolbar } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
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
  const [keyword, setKeyword] = useState("");
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
  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => `${item.name} ${item.supplierName} ${item.upstreamProductId}`.toLowerCase().includes(needle));
  }, [items, keyword]);
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
  const reset = () => { setProductId(""); setKeyword(""); setUpstreamId(""); save.reset(); };
  return <>
    <Button variant="secondary" onClick={() => { reset(); setOpen(true); }}>创建空白实例</Button>
    <LayerDialog.Root open={open} dismissDisabled={save.isPending} onOpenChange={(next) => { if (save.isPending) return; setOpen(next); if (!next) save.reset(); }}>
      <LayerDialog.Content>
        <LayerDialog.Title>创建空白实例并绑定上游</LayerDialog.Title>
        <LayerDialog.Description>选择已对接产品后填写已开通的上游实例 ID。保存时拉取真实 IP、状态与配置，不会在上游再次下单或扣款。</LayerDialog.Description>
        <LayerDialog.Body><div className="grid gap-4">
          <div className="grid gap-2">
            <span className="text-sm font-medium">已对接产品</span>
            <Toolbar>
              <Toolbar.Input aria-label="筛选已对接产品" placeholder="输入关键字筛选：产品名 / 供应商 / 商品 ID" value={keyword} onChange={(event) => setKeyword(event.target.value)} disabled={save.isPending || products.isLoading} />
              <Toolbar.Button disabled={!keyword || save.isPending} onClick={() => setKeyword("")}>清除筛选</Toolbar.Button>
            </Toolbar>
            <div className="max-h-56 overflow-auto rounded border border-kumo-line" role="listbox" aria-label="已对接产品列表">
              {products.isLoading ? <p className="px-3 py-2 text-sm text-kumo-subtle">正在读取已对接产品…</p> : null}
              {!products.isLoading && !filtered.length ? <p className="px-3 py-2 text-sm text-kumo-subtle">{items.length ? "没有匹配的已对接产品" : "暂无已对接产品，请先在商品管理中完成对接"}</p> : null}
              {filtered.map((item) => {
                const active = item.id === productId;
                return <div key={item.id} role="option" aria-selected={active} className="border-b border-kumo-hairline p-2 last:border-b-0">
                  <Button variant={active ? "primary" : "secondary"} className="h-auto w-full justify-start whitespace-normal text-left" disabled={save.isPending} onClick={() => setProductId(item.id)}>
                    <span className="grid gap-0.5">
                      <span>{item.name}</span>
                      <span className={active ? "text-sm opacity-80" : "text-sm text-kumo-subtle"}>{item.supplierName} · 商品 #{item.upstreamProductId}</span>
                    </span>
                  </Button>
                </div>;
              })}
            </div>
            {selected ? <p className="text-sm text-kumo-subtle">已选：{selected.name} · {selected.supplierName} · 商品 #{selected.upstreamProductId}</p> : <p className="text-sm text-kumo-subtle">尚未选择产品</p>}
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
