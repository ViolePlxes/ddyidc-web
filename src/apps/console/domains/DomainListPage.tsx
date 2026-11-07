import { useMemo, useState } from "react";
import { Badge, Banner, Button, Input, LayerCard, Select, Tabs, Text } from "@cloudflare/kumo";
import { ConfigurableTable, type TableColumn } from "../../../shared/components/ConfigurableTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import type { DomainAsset, DomainOperation } from "../../../shared/api/domains";

const columns: readonly TableColumn[] = [
  { key: "domain", label: "域名", width: 240, min: 180, required: true },
  { key: "status", label: "服务状态", width: 140, min: 110 },
  { key: "expires", label: "到期时间", width: 200, min: 160 },
  { key: "actions", label: "操作", width: 280, min: 220, required: true },
];
const statusLabels: Record<string, string> = { active: "正常", pending: "待处理", executing: "处理中", submitted: "已提交", succeeded: "已完成", failed: "失败", unknown: "待核对", review: "待人工核对", expired: "已过期", cancelled: "已取消" };

export function DomainListPage({ assets, loading, error, contracts, onOperation, onManage, onRefresh }: {
  assets: DomainAsset[];
  loading: boolean;
  error?: string;
  contracts: DomainOperation[];
  onOperation: (operation: DomainOperation, initial: Record<string, string>) => void;
  onManage: (domain: string, tab: string) => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState("all");
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const operation = (ref: string) => contracts.find((item) => item.key === ref);
  const rows = useMemo(() => assets.filter((asset) => {
    if (keyword && !asset.domain.includes(keyword.trim())) return false;
    if (status !== "all" && (status === "expired" ? !/expired/i.test(asset.status) : asset.status !== status)) return false;
    if (tab === "expiring") {
      const expires = asset.expiresAt ? new Date(asset.expiresAt).getTime() : 0;
      return expires > 0 && expires - Date.now() < 30 * 86400000;
    }
    return true;
  }), [assets, keyword, status, tab]);
  const cell = (asset: DomainAsset, key: string) => {
    if (key === "domain") return <span className="font-medium text-kumo-strong">{asset.domain}</span>;
    if (key === "status") return <Badge variant={/fail|expired/i.test(asset.status) ? "error" : /pending|review/i.test(asset.status) ? "warning" : "success"}>{statusLabels[asset.status] ?? asset.status}</Badge>;
    if (key === "expires") return asset.expiresAt ? new Date(asset.expiresAt).toLocaleString("zh-CN") : "待确认";
    if (key === "actions") return <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => onManage(asset.domain, "overview")}>管理</Button>
      <Button variant="secondary" size="sm" disabled={!operation("4.8")} onClick={() => { const op = operation("4.8"); if (op) onOperation(op, { domain: asset.domain }); }}>详情</Button>
      <Button variant="secondary" size="sm" disabled={!operation("4.7")} onClick={() => { const op = operation("4.7"); if (op) onOperation(op, { domain: asset.domain }); }}>修改资料</Button>
    </div>;
    return null;
  };
  return <div className="grid gap-3">
    <PageHeader title="我的域名" description="查看域名状态与到期时间，进入详情修改联系人资料。" actions={<Button variant="secondary" onClick={onRefresh}>刷新</Button>} />
    <Tabs variant="underline" value={tab} onValueChange={setTab} tabs={[{ value: "all", label: "全部域名" }, { value: "expiring", label: "即将到期" }]} />
    <LayerCard className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_12rem_auto]">
      <Input aria-label="域名关键词" placeholder="输入域名搜索…" value={draft} onChange={(event) => setDraft(event.target.value)} />
      <Select aria-label="域名状态" value={status} onValueChange={(value) => setStatus(value ?? "all")} items={{ all: "全部状态", pending: "待处理", succeeded: "已完成", expired: "已过期" }} />
      <Button variant="secondary" onClick={() => setKeyword(draft.trim())}>筛选</Button>
    </LayerCard>
    {error ? <Banner variant="error" title={error} /> : <div className="grid min-w-0 gap-3">
      <ConfigurableTable rows={rows} columns={columns} storageKey="ddyidc-domain-list-columns:v1" label="我的域名" loading={loading} renderCell={cell} rowKey={(row) => row.domain} emptyContent="暂无符合条件的域名" />
      <Text variant="secondary" size="sm">共 {rows.length} 条</Text>
    </div>}
  </div>;
}
