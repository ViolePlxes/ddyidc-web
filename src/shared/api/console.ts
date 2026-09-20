import type { AxiosResponse } from "axios";
import { userRequest, type ApiEnvelope } from "./request";

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductSummary {
  id: string;
  groupId: string;
  parentGroupId: string;
  groupName: string;
  name: string;
  moduleType: string;
  stock: number | null;
  summary: string;
  description: string;
  price: number;
  cycle: string;
  sort: number;
}

export interface ProductGroupSummary {
  id: string;
  parentId: string;
  name: string;
  sort: number;
  status: number;
}

export interface ProductSpec {
  id: string;
  productId: string;
  name: string;
  vcpu: number;
  memory: string;
  processorModel: string;
  processorFrequency: string;
  defense: string;
  upstreamBandwidth: string;
  downstreamRate: string;
  stock: number | null;
  priceMode: "fixed" | "upstream";
  price: number;
  sort: number;
}

export interface ConfigOptionValue {
  id: string;
  name: string;
  price: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface ConfigOption {
  id: string;
  name: string;
  field: string;
  optionType: string;
  required: boolean;
  options: ConfigOptionValue[];
  min: number;
  max: number;
  step: number;
  unit: string;
  default: string;
}

export interface CycleItem {
  billingcycle: string;
  label: string;
  price: number;
  setupFee: number;
}

export interface CatalogProduct extends ProductSummary {
  catalogSpec?: ProductSpec;
  upstreamStock?: string | number | null;
  supplierId: string;
  upstreamProductId: string;
}

export interface ProductDetail extends CatalogProduct {
  catalogSpec?: ProductSpec;
  upstreamStock?: string | number | null;
  config: Record<string, string>;
  configMode: "elastic" | "fixed" | "semi";
  configOptions: ConfigOption[] | null;
  specs: ProductSpec[];
  supplierId: string;
  upstreamProductId: string;
}

export interface OrderPage {
  product: {
    id: string;
    name: string;
    price: number;
    cycle: string;
  };
  dataCenters: ConfigOptionValue[];
  images: ConfigOptionValue[];
  imageGroups: Array<{ name: string; child: ConfigOptionValue[] }>;
  configOptions: ConfigOption[];
  cycles: CycleItem[];
  defaultPassword: string;
  networkTypes: ConfigOptionValue[];
}

export interface SelectedConfigOption {
  id: string;
  field: string;
  value: string;
  displayName: string;
  displayValue: string;
  position: number;
}

export interface OrderConfigSnapshot {
  configOptions?: Record<string, Omit<SelectedConfigOption, "id">>;
  hostname?: string;
  billingCycle?: string;
  passwordSet?: boolean;
  passwordMasked?: string;
}

export interface OrderDraft {
  productId: string;
  productName: string;
  configMode: ProductDetail["configMode"];
  selectedSpec: ProductSpec | null;
  configOptions: SelectedConfigOption[];
  billingCycle: string;
  cycleLabel: string;
  durationMonth: number;
  quantity: number;
  unitPriceYuan: number;
  totalYuan: number;
  hostname: string;
  password: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  durationText?: string;
  configSnapshot: OrderConfigSnapshot;
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  productName?: string;
  totalAmount: number;
  discountAmount: number;
  couponAmount: number;
  couponId?: string;
  payAmount: number;
  status: number;
  payType?: number;
  paidAt?: string;
  cancelledAt?: string;
  remark?: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface Recharge {
  id: string;
  rechargeNo: string;
  amount: number;
  status: number;
  paidAt?: string;
  createdAt: string;
}

export interface Invite {
  id: string;
  userId: string;
  code: string;
  status: number;
  rejectReason?: string;
  inviteCount: number;
  createdAt: string;
}

export interface PromoOverview {
  inviteCode: string;
  promoLinkPath: string;
  registrations: number;
  rechargeTotal: number;
  spendTotal: number;
  earnings: Earnings;
  posterEnabled: boolean;
}

export interface Earnings {
  total: number;
  pending: number;
  settled: number;
  frozen: number;
}

export interface RewardRecord {
  id: string;
  orderId: string;
  orderNo: string;
  bizType: number;
  username: string;
  level: number;
  amount: number;
  status: number;
  settledAt?: string;
  createdAt: string;
}

export interface PublicMarketingConfig {
  inviteEnabled: boolean;
  inviteReview: boolean;
  rewardEnabled: boolean;
  couponSelfClaim: boolean;
}

export interface UserCoupon {
  id: string;
  couponId: string;
  code: string;
  name: string;
  type: number;
  faceValue: number;
  discountRate: number;
  maxDiscount: number;
  minAmount: number;
  status: number;
  expireAt: string;
  usedAt?: string;
  orderId?: string;
  previewDiscount?: number;
}

export interface ClaimableCoupon {
  id: string;
  name: string;
  type: number;
  faceValue: number;
  discountRate: number;
  maxDiscount: number;
  minAmount: number;
  remaining: number;
  userClaimed: number;
  perUserLimit: number;
  endAt?: string;
}

export interface ResourceRecord {
  id: string;
  name?: string;
  productName?: string;
  status?: number | string;
  expiresAt?: string;
  createdAt?: string;
	orderId?: string;
	productId?: string;
	upstreamProviderId?: string;
	upstreamInstanceId?: string;
	activatedAt?: string;
}

export interface InstanceListItem {
  remark?: string;
  id: string;
  name: string;
  productName: string;
  primaryIp?: string;
  status: number;
  powerStatus?: string;
  billingCycle?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface InstanceConfigItem {
  id: string;
  field?: string;
  displayName: string;
  displayValue: string;
  position: number;
}

export interface InstanceCapabilities {
  start: boolean;
  stop: boolean;
  reboot: boolean;
  reinstall: boolean;
  resetPassword: boolean;
  traffic: boolean;
  remote: boolean;
  destroy: boolean;
}

export interface InstanceEvent {
  id: string;
  type: string;
  status: number;
  message?: string;
  createdAt: string;
  processedAt?: string;
}

export interface InstanceDetail extends InstanceListItem {
 username?:string; port?:string; portIsDefault?:boolean; remark?:string; upstreamOrderId?:string; upstreamOrderNo?:string; invoiceId?:string; firstPayment?:string; renewalAmount?:string; autoRenew?:boolean;
  orderId: string;
  orderNo?: string;
  productId: string;
  moduleType: string;
  upstreamInstanceId?: string;
  hostname?: string;
  subnetMask?: string;
  gateway?: string;
  operatingSystem?: string;
  currentImageId?: string;
  currentImageName?: string;
  currentImageGroup?: string;
  passwordMasked?: string;
  activatedAt?: string;
  config: InstanceConfigItem[];
  ips: Array<{ address: string; subnetMask?: string; gateway?: string }>;
  capabilities: InstanceCapabilities;
  events: InstanceEvent[];
  warning?: string;
}

export interface InstanceImage {
  id: string;
  version: string;
  pricing: number;
}

export interface InstanceImageGroup {
  name: string;
  child: InstanceImage[];
}

export interface InstanceImages {
  currentImageId?: string;
  currentImageName?: string;
  currentImageGroup?: string;
  groups: InstanceImageGroup[];
}

export interface MonitorPoint {
  timestamp: number;
  value: number;
}

export interface InstanceMonitor {
  cpu: MonitorPoint[];
  memory: MonitorPoint[];
  diskIo: MonitorPoint[];
  diskRead: MonitorPoint[];
  diskWrite: MonitorPoint[];
  networkIn: MonitorPoint[];
  networkOut: MonitorPoint[];
  available: boolean;
  message?: string;
}

export interface InstanceActionInput {
  action: "start" | "stop" | "reboot" | "reinstall" | "reset_password" | "remote" | "destroy";
  password?: string;
  imageId?: string;
  port?: string;
  formatDataDisk?: boolean;
}

export interface InstanceActionResult {
  status?: string;
  message: string;
  remote?: {
    type: "novnc" | "kasmvnc" | "guacamole";
    url: string;
    token: string;
    expiresAt: number;
    extra?: Record<string, string>;
  };
}

export class ApiBusinessError extends Error {}

async function unwrap<T>(
  response: AxiosResponse<ApiEnvelope<T>> | Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) {
    throw new ApiBusinessError(envelope.message || "业务请求失败");
  }
  return envelope.data;
}

export const consoleApi = {
  products: async (pageSize = 100) => {
    const load = (page: number) => unwrap(
      userRequest.get<ApiEnvelope<{ items: CatalogProduct[]; groups: ProductGroupSummary[]; total: number; page: number; pageSize: number }>>(
        "/products",
        { params: { pageSize, page } },
      ),
    );
    const first = await load(1);
    const items = [...(first.items ?? [])];
    for (let page = 2; items.length < first.total; page += 1) {
      const next = await load(page);
      if (!next.items?.length) throw new Error("商品目录发生变化，请刷新后重试");
      items.push(...next.items);
    }
    return { ...first, items: Array.from(new Map(items.map((item) => [item.id, item])).values()), groups: first.groups ?? [] };
  },
  product: (id: string) => unwrap(userRequest.get<ApiEnvelope<ProductDetail>>(`/products/${id}`)),
  orderPage: (supplierId: string, productId: string) =>
    unwrap(
      userRequest.get<ApiEnvelope<OrderPage>>("/upstream/order-page", {
        params: { supplierId, productId },
      }),
    ),
  orders: (status: number | undefined, page: number, pageSize = 10) =>
    unwrap(
      userRequest.get<ApiEnvelope<PageResult<Order>>>("/orders", {
        params: { status, page, pageSize },
      }),
    ),
  order: (id: string) =>
    unwrap(userRequest.get<ApiEnvelope<Order>>(`/orders/${id}`)),
  createOrder: (input: {
    productId: string;
    specId?: string;
    durationMonth: number;
    quantity: number;
    userCouponId?: string;
    configOptions: Record<string, Omit<SelectedConfigOption, "id">>;
    hostname: string;
    password: string;
    billingCycle: string;
  }) => unwrap(userRequest.post<ApiEnvelope<Order>>("/orders", input)),
  cancelOrder: (id: string) =>
    unwrap(userRequest.post<ApiEnvelope<{ cancelled: boolean }>>(`/orders/${id}/cancel`)),
  recharges: (page = 1, pageSize = 10) =>
    unwrap(
      userRequest.get<ApiEnvelope<PageResult<Recharge>>>("/recharges", {
        params: { page, pageSize },
      }),
    ),
  createRecharge: (amount: number, method: string) =>
    unwrap(userRequest.post<ApiEnvelope<Recharge>>("/recharges", { amount, method })),
  instances: () => unwrap(userRequest.get<ApiEnvelope<ResourceRecord[]>>("/instances")),
  userInstances: (params: { page: number; pageSize?: number; search?: string; status?: number }) =>
    unwrap(
      userRequest.get<ApiEnvelope<{ items: InstanceListItem[]; total: number; page: number; pageSize: number }>>(
        "/user/instances",
        { params },
      ),
    ),
  instance: (id: string) =>
    unwrap(userRequest.get<ApiEnvelope<InstanceDetail>>(`/instance/${id}`,{timeout:30000})),
  instanceImages: (id: string) =>
    unwrap(userRequest.get<ApiEnvelope<InstanceImages>>(`/instance/${id}/images`,{timeout:30000})),
  instanceMonitor: (id: string) =>
    unwrap(userRequest.get<ApiEnvelope<InstanceMonitor>>(`/instance/${id}/monitor`,{timeout:30000})),
  instanceAction: (id: string, input: InstanceActionInput) =>
    unwrap(userRequest.post<ApiEnvelope<InstanceActionResult>>(`/instance/${id}/action`, input,{timeout:65000})),
  notifications: () => unwrap(userRequest.get<ApiEnvelope<ResourceRecord[]>>("/notifications")),
  marketingConfig: () =>
    unwrap(userRequest.get<ApiEnvelope<PublicMarketingConfig>>("/marketing/public-config")),
  invite: () =>
    unwrap(
      userRequest.get<
        ApiEnvelope<{
          invite?: Invite;
          stats: { level1: number; level2: number; level3: number };
        }>
      >("/marketing/invites/my"),
    ),
  createInvite: (code: string) =>
    unwrap(userRequest.post<ApiEnvelope<Invite>>("/marketing/invites", { code })),
  promoOverview: () =>
    unwrap(userRequest.get<ApiEnvelope<PromoOverview>>("/marketing/promo/overview")),
  earnings: () =>
    unwrap(userRequest.get<ApiEnvelope<Earnings>>("/marketing/earnings")),
  rewardRecords: (page = 1, pageSize = 10) =>
    unwrap(
      userRequest.get<ApiEnvelope<PageResult<RewardRecord>>>(
        "/marketing/earnings/records",
        { params: { page, pageSize } },
      ),
    ),
  coupons: (status: number, page = 1, pageSize = 10) =>
    unwrap(
      userRequest.get<ApiEnvelope<PageResult<UserCoupon>>>("/marketing/coupons", {
        params: { status, page, pageSize },
      }),
    ),
  claimCenter: () =>
    unwrap(
      userRequest.get<ApiEnvelope<ClaimableCoupon[]>>("/marketing/coupons/claim-center"),
    ),
  usableCoupons: (amount: number) =>
    unwrap(
      userRequest.get<ApiEnvelope<UserCoupon[]>>("/marketing/coupons/usable", {
        params: { amount },
      }),
    ),
  claimCoupon: (couponId: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<UserCoupon>>("/marketing/coupons/claim", { couponId }),
    ),
  claimCode: (claimCode: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<UserCoupon>>("/marketing/coupons/claim-code", {
        claimCode,
      }),
    ),
};
