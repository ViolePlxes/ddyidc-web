import { Banner, Button, Input, LayerCard, Switch, Textarea } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { emptyBankTransfer, getAdminBankTransfer, saveBankTransfer } from "../../../shared/api/bankTransfer";
import { getApiMessage } from "../../../shared/api/request";

export function BankTransferSettings() {
  const query = useQuery({ queryKey: ["admin", "bank-transfer"], queryFn: getAdminBankTransfer });
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(emptyBankTransfer);
  useEffect(() => { if (query.data) setConfig(query.data); }, [query.data]);
  const save = useMutation({ mutationFn: saveBankTransfer, onSuccess: (data) => {
    setConfig(data);
    queryClient.setQueryData(["admin", "bank-transfer"], data);
    void queryClient.invalidateQueries({ queryKey: ["wallet", "bank-transfer"] });
  } });
  return <LayerCard className="grid max-w-3xl gap-5 p-6">
    <h2 className="text-lg font-semibold">对公汇款收款信息</h2>
    <p className="text-sm text-kumo-subtle">启用后向登录用户展示以下公司收款信息。汇款不会自动入账，工作人员核对到账后通过现有余额操作处理。</p>
    {query.error ? <Banner variant="error" title="读取失败" description={getApiMessage(query.error)} /> : null}
    <form className="grid gap-5" onSubmit={event => { event.preventDefault(); save.mutate(config); }}>
      <Switch label="启用对公汇款" checked={config.enabled} disabled={query.isLoading || Boolean(query.error) || save.isPending} onCheckedChange={enabled => setConfig({ ...config, enabled })} />
      {([{ key: "companyName", label: "开户名称", limit: 200 }, { key: "bankName", label: "开户银行", limit: 200 }, { key: "bankAccount", label: "银行账号", limit: 40 }, { key: "bankCode", label: "联行号（可选，12 位数字）", limit: 12 }] as const).map(field => <Input key={field.key} label={field.label} maxLength={field.limit} value={config[field.key]} disabled={query.isLoading || Boolean(query.error) || save.isPending} onChange={event => setConfig({ ...config, [field.key]: event.target.value })} />)}
      <Textarea label="汇款说明（可选）" rows={5} maxLength={4000} value={config.instructions} disabled={query.isLoading || Boolean(query.error) || save.isPending} onChange={event => setConfig({ ...config, instructions: event.target.value })} />
      <Button type="submit" variant="primary" loading={save.isPending} disabled={query.isLoading || Boolean(query.error)}>保存收款信息</Button>
    </form>
    {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
    {save.isSuccess ? <Banner title="收款信息已保存" /> : null}
  </LayerCard>;
}
