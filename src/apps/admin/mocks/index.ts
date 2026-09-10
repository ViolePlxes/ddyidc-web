import type { DataRow } from "../../../shared/components/DataTable";

// TODO: wire API — 管理后台静态占位数据。
export const adminMetrics = [
  { label: "今日订单", value: "42", hint: "较昨日 +12%" },
  { label: "今日销售额", value: "¥18,620", hint: "已支付 36 笔" },
  { label: "客户总数", value: "2,846", hint: "本周新增 87" },
  { label: "运行实例", value: "1,492", hint: "健康率 99.8%" },
];

export const productRows: DataRow[] = [
  {
    id: "p1",
    primary: "香港精品云服务器",
    secondary: "弹性云服务器",
    meta: "排序 10",
    amount: "¥219/月",
    status: "running",
  },
  {
    id: "p2",
    primary: "东京高防云服务器",
    secondary: "高防专区",
    meta: "排序 20",
    amount: "¥159/月",
    status: "running",
  },
  {
    id: "p3",
    primary: "新加坡轻量应用服务器",
    secondary: "轻量应用",
    meta: "排序 30",
    amount: "¥99/月",
    status: "suspended",
  },
];

export const adminOrderRows: DataRow[] = [
  {
    id: "ao1",
    primary: "e2ea074640 · 香港精品云服务器",
    secondary: "DD202609080018",
    meta: "余额支付",
    amount: "¥299.00",
    status: "paid",
  },
  {
    id: "ao2",
    primary: "cloud_user · 东京高防云服务器",
    secondary: "DD202609070126",
    meta: "待选择支付方式",
    amount: "¥159.00",
    status: "pending",
  },
  {
    id: "ao3",
    primary: "demo_2026 · 新加坡轻量应用服务器",
    secondary: "DD202609060089",
    meta: "用户取消",
    amount: "¥99.00",
    status: "cancelled",
  },
];

export const customerRows: DataRow[] = [
  {
    id: "c1",
    primary: "e2ea074640",
    secondary: "138****8021",
    meta: "user@example.com",
    status: "running",
  },
  {
    id: "c2",
    primary: "cloud_user",
    secondary: "186****6632",
    meta: "cloud@example.com",
    status: "running",
  },
  {
    id: "c3",
    primary: "demo_2026",
    secondary: "未绑定手机",
    meta: "demo@example.com",
    status: "suspended",
  },
];

export const supplierRows: DataRow[] = [
  {
    id: "s1",
    primary: "智简魔方 V10",
    secondary: "zjmf",
    meta: "https://upstream.example.com",
    amount: "汇率 1.00",
    status: "running",
  },
  {
    id: "s2",
    primary: "财务系统节点",
    secondary: "finance",
    meta: "https://finance.example.com",
    amount: "汇率 0.98",
    status: "running",
  },
];

export const upstreamProductRows: DataRow[] = [
  {
    id: "up1",
    primary: "香港 CN2 GIA",
    secondary: "#1024 · 智简魔方 V10",
    meta: "成本 ¥168.00",
    amount: "售价 ¥219.00",
    status: "running",
  },
  {
    id: "up2",
    primary: "东京高防 100G",
    secondary: "#2088 · 财务系统节点",
    meta: "成本 ¥132.00",
    amount: "售价 ¥159.00",
    status: "running",
  },
  {
    id: "up3",
    primary: "新加坡轻量 2C4G",
    secondary: "#3031 · 智简魔方 V10",
    meta: "成本 ¥76.00",
    amount: "售价 ¥99.00",
    status: "suspended",
  },
];

export const inviteRows: DataRow[] = [
  {
    id: "iv1",
    primary: "DDY-9K8M2P",
    secondary: "e2ea074640",
    meta: "已使用 18 次",
    status: "running",
  },
  {
    id: "iv2",
    primary: "CLOUD-2026",
    secondary: "cloud_user",
    meta: "待审核",
    status: "pending",
  },
];

export const rewardRows: DataRow[] = [
  {
    id: "rw1",
    primary: "一级分销奖励",
    secondary: "DD202609080018",
    meta: "用户 e2ea074640",
    amount: "¥59.80",
    status: "paid",
  },
  {
    id: "rw2",
    primary: "二级分销奖励",
    secondary: "DD202609070126",
    meta: "用户 cloud_user",
    amount: "¥15.90",
    status: "pending",
  },
];

export const salesRows: DataRow[] = [
  {
    id: "sa1",
    primary: "张小云 · KF0008",
    secondary: "sales_zhang",
    meta: "已分配 126 位客户",
    status: "running",
  },
  {
    id: "sa2",
    primary: "李小数 · KF0012",
    secondary: "sales_li",
    meta: "已分配 89 位客户",
    status: "running",
  },
];
