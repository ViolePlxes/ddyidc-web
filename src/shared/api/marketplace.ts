import axios, { type AxiosInstance } from "axios";
import { adminRequest, userRequest, type ApiEnvelope } from "./request";

export interface PageData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface MarketplaceStatus {
  enabled: boolean;
  maintenance: boolean;
  feeType: string;
  feeRate: string;
  feeFixed: string;
  feeBearer: string;
  refundEnabled: boolean;
  onSale?: number;
  sold?: number;
  wants?: number;
}
export interface MarketplaceGroup {
  id: string;
  name: string;
}
export interface ListingPrice {
  id: string;
  oldPrice: string;
  newPrice: string;
  createdAt: string;
}
export interface Listing {
  id: string;
  listingNo: string;
  sellerId?: string;
  productId: string;
  sourceProductId: string;
  groupId: string;
  productName: string;
  productType: string;
  region: string;
  configSnapshot: Record<string, unknown> | null;
  price: string;
  originalRenewalPrice: string;
  remainingDays: number;
  status: string;
  auditStatus: string;
  auditRemark?: string;
  views: number;
  favoriteCount: number;
  sellerNote: string;
  isRecommended: boolean;
  expiresAt: string;
  createdAt: string;
  favorite?: boolean;
  priceHistory?: ListingPrice[];
}
export interface ListingProduct {
  id: string;
  productName: string;
  productType: string;
  groupId: string;
  primaryIp: string;
  configSnapshot: Record<string, unknown> | null;
  expiresAt?: string;
  remainingDays: number;
}
export interface MarketplaceOrder {
  id: string;
  orderNo: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: string;
  payAmount: string;
  fee: string;
  feeBearer: string;
  sellerIncome: string;
  status: string;
  paymentMethod: string;
  lockExpiresAt: string;
  paidAt?: string;
  settleAt?: string;
  refundWindowEnd?: string;
  createdAt: string;
  listing?: Listing;
}
export interface Want {
  id: string;
  wantNo: string;
  userId?: string;
  title: string;
  budgetMin: string;
  budgetMax: string;
  region: string;
  description: string;
  tags: string[] | null;
  status: string;
  createdAt: string;
}
export interface Wallet {
  userId: string;
  balance: string;
  frozenBalance: string;
  totalIncome: string;
  totalWithdrawn: string;
  updatedAt: string;
}
export interface Flow {
  id: string;
  flowNo: string;
  userId: string;
  type: string;
  direction: string;
  amount: string;
  balanceAfter: string;
  refId: string;
  remark: string;
  createdAt: string;
}
export interface Withdrawal {
  id: string;
  withdrawNo: string;
  userId: string;
  amount: string;
  fee: string;
  actualAmount: string;
  status: string;
  remark: string;
  createdAt: string;
}
export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  detail: string;
  status: string;
  createdAt: string;
}
export interface MarketplaceSettings extends MarketplaceStatus {
  id: string;
  auditEnabled: boolean;
  requireBackupConfirm: boolean;
  requireRealnameListing: boolean;
  requireRealnamePurchase: boolean;
  forceSettleAfterWindow: boolean;
  withdrawalAuditEnabled: boolean;
  announcement: string;
  agreement: string;
  maintenanceTip: string;
  withdrawFeeType: string;
  withdrawFeeRate: string;
  withdrawFeeFixed: string;
  maxListingsPerUser: number;
  newUserLimitDays: number;
  listingValidMinutes: number;
  orderLockMinutes: number;
  settleFreezeDays: number;
  refundWindowDays: number;
  allowGroups: string[] | null;
}
export interface MarketplaceDashboard {
  onSale: number;
  sold: number;
  wants: number;
  pendingListings: number;
  pendingWithdrawals: number;
  pendingReports: number;
  feeIncome: string;
  feeRate: string;
}

async function unwrap<T>(
  request: Promise<{ data: ApiEnvelope<T> }>,
): Promise<T> {
  return (await request).data.data;
}
const page = <T>(
  client: AxiosInstance,
  path: string,
  params?: Record<string, unknown>,
) => unwrap(client.get<ApiEnvelope<PageData<T>>>(path, { params }));

export async function probeMarketplace(scope: "public" | "admin") {
  try {
    if (scope === "admin") {
      await adminRequest.get("/marketplace/dashboard");
      return true;
    }
    const value = await unwrap(
      userRequest.get<ApiEnvelope<MarketplaceStatus>>("/marketplace/status"),
    );
    return value.enabled;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404)
      return false;
    throw error;
  }
}

export const marketplaceApi = {
  status: () =>
    unwrap(
      userRequest.get<ApiEnvelope<MarketplaceStatus>>("/marketplace/status"),
    ),
  listings: (params?: Record<string, unknown>) =>
    page<Listing>(userRequest, "/marketplace/listings", params),
  listing: (id: string) =>
    unwrap(
      userRequest.get<ApiEnvelope<Listing>>(`/marketplace/listings/${id}`),
    ),
  groups: () =>
    unwrap(
      userRequest.get<ApiEnvelope<MarketplaceGroup[]>>("/marketplace/groups"),
    ),
  announcement: () =>
    unwrap(
      userRequest.get<
        ApiEnvelope<{
          announcement: string;
          maintenance: boolean;
          maintenanceTip: string;
        }>
      >("/marketplace/announcement"),
    ),
  agreement: () =>
    unwrap(
      userRequest.get<ApiEnvelope<{ agreement: string }>>(
        "/marketplace/agreement",
      ),
    ),
  wants: (params?: Record<string, unknown>) =>
    page<Want>(userRequest, "/marketplace/wants", params),
  listingProducts: (keyword = "") =>
    unwrap(
      userRequest.get<ApiEnvelope<ListingProduct[]>>(
        "/marketplace/listing/products",
        { params: { keyword } },
      ),
    ),
  createListing: (input: Record<string, unknown>) =>
    unwrap(
      userRequest.post<ApiEnvelope<Listing>>("/marketplace/listings", input),
    ),
  myListings: (params?: Record<string, unknown>) =>
    page<Listing>(userRequest, "/marketplace/my/listings", params),
  offListing: (id: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<{ updated: boolean }>>(
        `/marketplace/listings/${id}/off`,
        {},
      ),
    ),
  reprice: (id: string, price: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<{ updated: boolean }>>(
        `/marketplace/listings/${id}/price`,
        { price },
      ),
    ),
  favorite: (id: string, value: boolean) =>
    unwrap(
      value
        ? userRequest.post<ApiEnvelope<{ favorite: boolean }>>(
            `/marketplace/listings/${id}/favorite`,
            {},
          )
        : userRequest.delete<ApiEnvelope<{ favorite: boolean }>>(
            `/marketplace/listings/${id}/favorite`,
          ),
    ),
  createOrder: (listingId: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<MarketplaceOrder>>("/marketplace/orders", {
        listingId,
      }),
    ),
  orders: (params?: Record<string, unknown>) =>
    page<MarketplaceOrder>(userRequest, "/marketplace/orders/my", params),
  pay: (id: string, method = "balance", mode = "qr") =>
    unwrap(
      userRequest.post<ApiEnvelope<MarketplaceOrder | Record<string, unknown>>>(
        `/marketplace/orders/${id}/pay`,
        { method, mode },
      ),
    ),
  refund: (id: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<MarketplaceOrder>>(
        `/marketplace/orders/${id}/refund`,
        {},
      ),
    ),
  wallet: () =>
    unwrap(userRequest.get<ApiEnvelope<Wallet>>("/marketplace/wallet")),
  flows: (params?: Record<string, unknown>) =>
    page<Flow>(userRequest, "/marketplace/flows", params),
  withdrawals: (params?: Record<string, unknown>) =>
    page<Withdrawal>(userRequest, "/marketplace/withdrawals", params),
  withdraw: (amount: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<Withdrawal>>("/marketplace/withdrawals", {
        amount,
      }),
    ),
  createWant: (input: Partial<Want>) =>
    unwrap(userRequest.post<ApiEnvelope<Want>>("/marketplace/wants", input)),
  myWants: () => page<Want>(userRequest, "/marketplace/wants/my"),
  offer: (
    id: string,
    input: { listingId?: string; price: string; message: string },
  ) => unwrap(userRequest.post(`/marketplace/wants/${id}/offers`, input)),
  report: (input: { listingId: string; reason: string; detail: string }) =>
    unwrap(
      userRequest.post<ApiEnvelope<Report>>("/marketplace/reports", input),
    ),
};

export const marketplaceAdminApi = {
  dashboard: () =>
    unwrap(
      adminRequest.get<ApiEnvelope<MarketplaceDashboard>>(
        "/marketplace/dashboard",
      ),
    ),
  settings: () =>
    unwrap(
      adminRequest.get<ApiEnvelope<MarketplaceSettings>>(
        "/marketplace/settings",
      ),
    ),
  saveSettings: (input: MarketplaceSettings) =>
    unwrap(
      adminRequest.put<ApiEnvelope<MarketplaceSettings>>(
        "/marketplace/settings",
        input,
      ),
    ),
  listings: (params?: Record<string, unknown>) =>
    page<Listing>(adminRequest, "/marketplace/listings", params),
  audit: (id: string, passed: boolean, remark = "") =>
    unwrap(
      adminRequest.post(`/marketplace/listings/${id}/audit`, {
        passed,
        remark,
      }),
    ),
  off: (id: string) =>
    unwrap(adminRequest.post(`/marketplace/listings/${id}/off`, {})),
  recommend: (id: string, recommended: boolean) =>
    unwrap(
      adminRequest.post(`/marketplace/listings/${id}/recommend`, {
        recommended,
      }),
    ),
  orders: (params?: Record<string, unknown>) =>
    page<MarketplaceOrder>(adminRequest, "/marketplace/orders", params),
  refund: (id: string) =>
    unwrap(adminRequest.post(`/marketplace/orders/${id}/refund`, {})),
  flows: (params?: Record<string, unknown>) =>
    page<Flow>(adminRequest, "/marketplace/flows", params),
  withdrawals: (params?: Record<string, unknown>) =>
    page<Withdrawal>(adminRequest, "/marketplace/withdrawals", params),
  auditWithdrawal: (id: string, approved: boolean, remark = "") =>
    unwrap(
      adminRequest.post(`/marketplace/withdrawals/${id}/audit`, {
        approved,
        remark,
      }),
    ),
  reports: (params?: Record<string, unknown>) =>
    page<Report>(adminRequest, "/marketplace/reports", params),
  handleReport: (id: string, status: string) =>
    unwrap(adminRequest.post(`/marketplace/reports/${id}/handle`, { status })),
};
