# 可配置表格（共享组件）

唯一公共入口：`src/shared/components/ConfigurableTable.tsx`。后续需要这套CF表格的页面直接导入，不复制表格/表头/弹窗代码。业务订单和充值订单已接入。

- 样式唯一来源：`src/shared/components/configurableTableStyles.ts`。表格行、表头控件显隐、分割线、拖动浮层、字段弹窗的核心视觉统一修改这里；页面不覆盖这些样式。
- 拖列、列宽、加载骨架及布局存储：`ConfigurableTable.tsx`。
- 内部组件：`TableColumnHead.tsx`、`TableFieldsDialog.tsx`；不在页面直接引用。
- 布局约束、旧版本迁移和排序：`src/shared/utils/tableLayout.ts`。

```tsx
import {ConfigurableTable,type TableColumn} from '../../../shared/components/ConfigurableTable';
const columns: readonly TableColumn[] = [
 {key:'id',label:'编号',width:240,min:160,required:true},
 {key:'amount',label:'金额',type:'N',width:130,min:100},
];
<ConfigurableTable
 columns={columns} rows={items} label="记录列表"
 storageKey={`my-feature-table:v1:${currentUserId}`}
 loading={query.isPending}
 rowKey={row=>row.id}
 renderCell={(row,key)=>key==='amount'?formatMoney(row.amount):row.id}
/>;
```

页面只定义列与真实数据渲染；金额、状态、链接、权限仍由业务提供。storageKey必须包含功能和当前账号ID；切换key自动隔离实例，禁止共用跨账号偏好。不缓存业务数据或支付结果。必需列不能隐藏，可用字段类型S/N/A，仅影响标记。

交互：表头原生Kumo手柄+dnd-kit浮层；指针5px门槛、键盘空格/方向键/Escape；字段弹窗搜索/增删/排序；独立列宽、键盘调整、双击恢复；全部恢复默认。偏好只在提交后保存，降低动态效果设置受支持。字段弹窗固定挂在表格容器，不能随首列表头卸载；落点提交时禁止二次transform插值。

业务订单沿用`ddyidc-admin-order-columns:v3:business:<adminId>`及旧v1/v2迁移键；充值订单沿用`ddyidc-admin-order-columns:v3:recharge:<adminId>`，不用清理用户历史偏好。其他页面接入时选自己的命名空间。

相同CF效果依据已登录页面运行DOM/类名和公开dnd-kit实现；不声称取得CF私有业务React源码。头部13px、100ms分割线与192px拖动卡片为用户明确要求的局部视觉例外。组件使用Kumo语义token。

验证脚本：`scripts/table-layout.test.mjs`、`scripts/admin-recharges.test.mjs`、`scripts/admin-table-copy.test.mjs`。需要回归首两列互换、落位无回弹、面板不关闭、隐藏列与列宽保留、切换账号/业务类型隔离、刷新保存、取消无提交。

当前本地默认旧后端充值API返回404；共享组件类型/单元/构建及业务订单实页已验收，不能将此称为充值HTTP验收。无需数据库迁移，生产由用户后台手动安装。

## 后台全量接入（v0.1.202）

后台应用唯一提供`src/apps/admin/AdminTableScope.tsx`作用域；现有表格使用`ScopedTable as Table`，由`ScopedTable.tsx`把原有Kumo表格声明适配至同一个ConfigurableTable。`docs/admin-table-inventory.json`列出82处声明，加上业务/充值主表2处。后台新增表格必须复用ScopedTable（指定固定tableId）或ConfigurableTable；CI拒绝后台直接导入Kumo Table自行维护。

共享业务组件在后台作用域外原样渲染Kumo Table，前台/门户/销售端页面未修改。回归对无后台作用域时的实际HTML与原版Kumo逐字比较。表格作用域本身不导入后台认证状态，只有AdminApp提供账号ID。

适配层保留单元格业务React节点、复选框受控值/回调、行key/拖拽回调；空内容colSpan转为全宽空态，不把说明错放进字段。业务操作API、权限、金额与分页不改。布局按固定tableId和管理员ID隔离；后台产品列表合并旧“显示字段”入口，首次沿用旧显隐偏好，不删除旧键。字段集合变化时重新校准布局，列排序自身不卸载弹窗。

共享组件路径：ConfigurableTable、TableColumnHead、TableFieldsDialog、configurableTableStyles、ScopedTable、tableScope、utils/tableLayout、utils/tableMarkup。请勿复制文件或在单页覆盖同款视觉。
