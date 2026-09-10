import {
  Button,
  Dialog,
  Input,
  LayerCard,
  Radio,
  Select,
  Switch,
} from "@cloudflare/kumo";
import {
  ArrowsClockwiseIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { DataTable } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { upstreamProductRows } from "../mocks";

const catalog = [
  "#1024 - 香港 CN2 GIA",
  "#2088 - 东京高防 100G",
  "#3031 - 新加坡轻量 2C4G",
  "#4110 - 洛杉矶精品线路",
];
export function UpstreamProducts() {
  const [selected, setSelected] = useState(catalog[0]!);
  const metrics = [
    { label: "映射商品数", value: "36", hint: "启用 32 个" },
    { label: "上游实例数", value: "1,492", hint: "运行中 1,466" },
    { label: "销售额", value: "¥286,420", hint: "本月累计" },
    { label: "利润", value: "¥64,180", hint: "利润率 22.4%" },
  ];
  return (
    <>
      <PageHeader
        title="上游产品管理"
        description="同步供应商目录并维护销售映射与成本策略。"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<TrashIcon />}>
              批量删除
            </Button>
            <Dialog.Root>
              <Dialog.Trigger
                render={<Button icon={<PlusIcon />}>添加映射</Button>}
              />
              <Dialog size="lg" className="grid gap-5 p-6">
                <div className="flex justify-between">
                  <div>
                    <Dialog.Title className="text-xl font-semibold">
                      选择上游产品
                    </Dialog.Title>
                    <Dialog.Description className="text-kumo-subtle">
                      支持按 #ID-名称 搜索目录。
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    render={
                      <Button
                        variant="ghost"
                        shape="square"
                        icon={<XIcon />}
                        aria-label="关闭"
                      />
                    }
                  />
                </div>
                <Input label="搜索目录" placeholder="#ID-名称" />
                <Radio.Group
                  legend="目录产品"
                  value={selected}
                  onValueChange={setSelected}
                  className="grid gap-2"
                >
                  {catalog.map((item) => (
                    <Radio.Item
                      key={item}
                      value={item}
                      label={item}
                      description="月成本 ¥168.00"
                    />
                  ))}
                </Radio.Group>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="销售名称"
                    defaultValue={selected.replace(/^#\d+ - /, "")}
                  />
                  <Input
                    label="销售描述"
                    defaultValue="从上游目录自动填充，可继续编辑。"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Dialog.Close
                    render={<Button variant="secondary">取消</Button>}
                  />
                  <Button>保存映射</Button>
                </div>
              </Dialog>
            </Dialog.Root>
          </div>
        }
      />
      <MetricGrid metrics={metrics} />
      <LayerCard className="grid gap-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="供应商"
            defaultValue="zjmf"
            items={{ zjmf: "智简魔方 V10", finance: "财务系统节点" }}
          />
          <Select
            label="代理模式"
            defaultValue="percent"
            items={{ percent: "百分比加价", fixed: "固定加价" }}
          />
          <Button variant="secondary" icon={<ArrowsClockwiseIcon />}>
            同步目录
          </Button>
          <span className="pb-2 text-sm text-kumo-success">同步完成</span>
        </div>
        <div className="grid gap-1">
          <Switch label="亏本交易拦截" defaultChecked />
          <span className="text-sm text-kumo-subtle">
            售价低于换算成本时阻止保存与开通
          </span>
        </div>
      </LayerCard>
      <DataTable
        rows={upstreamProductRows}
        primaryLabel="映射商品"
        secondaryLabel="上游目录"
        selectable
        withPagination
      />
    </>
  );
}
