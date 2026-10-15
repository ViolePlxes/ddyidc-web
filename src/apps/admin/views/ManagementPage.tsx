import { Dialog } from "../../../shared/components/Dialog";
import { Button, Input, Select, Switch } from "@cloudflare/kumo";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { DataTable, type DataRow } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

export function ManagementPage({
  title,
  description,
  rows,
  primaryLabel,
  secondaryLabel,
  actionLabel = "新增",
  selectable = false,
  showFilters = false,
  showSwitch = false,
}: {
  title: string;
  description: string;
  rows: DataRow[];
  primaryLabel: string;
  secondaryLabel: string;
  actionLabel?: string;
  selectable?: boolean;
  showFilters?: boolean;
  showSwitch?: boolean;
}) {
  const action = (
    <Dialog.Root>
      <Dialog.Trigger
        render={<Button icon={<PlusIcon />}>{actionLabel}</Button>}
      />
      <Dialog className="grid gap-4 p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-2xl font-semibold">
              {actionLabel}
            </Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              填写必要信息后保存，静态阶段不会提交数据。
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
        <div className="grid gap-4">
          <Input label="名称" placeholder="请输入名称" />
          <Input label="说明" placeholder="选填" />
          {showSwitch ? <Switch label="立即启用" defaultChecked /> : null}
        </div>
        <div className="flex justify-end gap-2">
          <Dialog.Close render={<Button variant="secondary">取消</Button>} />
          <Button>保存</Button>
        </div>
      </Dialog>
    </Dialog.Root>
  );
  return (
    <>
      <PageHeader title={title} description={description} actions={action} />
      {showFilters ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Input aria-label="搜索" placeholder="搜索关键词…" />
          <Select
            aria-label="状态"
            defaultValue="all"
            items={{ all: "全部状态", active: "启用", inactive: "停用" }}
          />
          <Button variant="secondary">筛选</Button>
        </div>
      ) : null}
      <PageState emptyTitle={`暂无${title.replace("管理", "")}`}>
        <DataTable
          rows={rows}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          withPagination
          selectable={selectable}
        />
      </PageState>
    </>
  );
}
