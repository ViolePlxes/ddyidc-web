import type { AxiosInstance, AxiosResponse } from "axios";
import { adminRequest, userRequest, type ApiEnvelope } from "./request";

export type GroupType = "two" | "three" | "five";

export interface GroupBuyActivity {
  id: string;
  productId: string;
  productName: string;
  groupId: string;
  groupName: string;
  billingCycle: string;
  billingCycleName: string;
  configOptions: Record<string, unknown>;
  configDescription: string;
  originalPrice: number;
  priceMode: 1 | 2;
  twoPrice?: number;
  twoDiscount?: number;
  threePrice?: number;
  threeDiscount?: number;
  fivePrice?: number;
  fiveDiscount?: number;
  twoLeaderPrice?: number;
  twoLeaderDiscount?: number;
  threeLeaderPrice?: number;
  threeLeaderDiscount?: number;
  fiveLeaderPrice?: number;
  fiveLeaderDiscount?: number;
  renewType: 1 | 2;
  timeoutDays: number;
  endTime: string;
  status: 0 | 1;
  order: number;
  isPublicGroupEnabled: boolean;
  forcePublic: boolean;
  slogan: string;
  requireCertification: boolean;
  purchaseLimit: number;
  memberRestrictMode: 0 | 1 | 2;
  hideForOldUser: boolean;
  activeGroups: number;
  joinedMembers: number;
}

export interface GroupBuyRecord {
  id: string;
  activityId: string;
  clientId: string;
  groupType: GroupType;
  isLeader: boolean;
  leaderId: string;
  currentNum: number;
  needNum: number;
  payAmount: number;
  groupPrice: number;
  levelDiscountAmount: number;
  orderId?: string;
  hostId?: string;
  inviteCode: string;
  isPublic: boolean;
  forceClosePublic: boolean;
  status: 1 | 2 | 3 | 4;
  timeoutTime: string;
  successTime?: string;
  memberName?: string;
  memberPhone?: string;
  activity?: GroupBuyActivity;
}

export interface GroupBuyDetail {
  leader: GroupBuyRecord;
  members: GroupBuyRecord[];
  activity: GroupBuyActivity;
}

export interface GroupBuySettings {
  id?: string;
  clientLevelDiscountEnable: boolean;
  timeoutRemindHours: number;
  showMemberName: boolean;
  showMemberPhone: boolean;
  newUserGroupLimit: number;
}

export interface PageData<T> { list: T[]; total: number; page: number; pageSize: number }

type PagePayload<T> = Omit<PageData<T>, "list"> & { list: T[] | null };

function normalizePage<T>(page: PagePayload<T>): PageData<T> {
  return { ...page, list: page.list ?? [] };
}

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

const activities = (client: AxiosInstance, path: string, params?: Record<string, unknown>) =>
  unwrap(client.get<ApiEnvelope<PagePayload<GroupBuyActivity>>>(path, { params })).then(normalizePage);

export const groupBuyApi = {
  publicActivities: (params?: Record<string, unknown>) => activities(userRequest, "/groupbuy/public/activities", params),
  publicActivity: (id: string) => unwrap(userRequest.get<ApiEnvelope<GroupBuyActivity>>(`/groupbuy/public/activities/${id}`)),
  publicShare: (code: string) => unwrap(userRequest.get<ApiEnvelope<GroupBuyDetail>>(`/groupbuy/public/share/${code}`)),
  activities: (params?: Record<string, unknown>) => activities(userRequest, "/groupbuy/activities", params),
  activity: (id: string) => unwrap(userRequest.get<ApiEnvelope<GroupBuyActivity>>(`/groupbuy/activities/${id}`)),
  publicGroups: (activityId?: string) => unwrap(userRequest.get<ApiEnvelope<PagePayload<GroupBuyRecord>>>("/groupbuy/public-groups", { params: { activityId } })).then(normalizePage),
  start: (input: { activityId: string; groupType: GroupType; isPublic: boolean }) => unwrap(userRequest.post<ApiEnvelope<{ groupId: string; inviteCode: string; sharePath: string }>>("/groupbuy/groups", input)),
  join: (id: string) => unwrap(userRequest.post<ApiEnvelope<GroupBuyRecord>>(`/groupbuy/groups/${id}/join`, {})),
  mine: (status?: number) => unwrap(userRequest.get<ApiEnvelope<PagePayload<GroupBuyRecord>>>("/groupbuy/my", { params: { status } })).then(normalizePage),
  myDetail: (id: string) => unwrap(userRequest.get<ApiEnvelope<GroupBuyDetail>>(`/groupbuy/my/${id}`)),
  refund: (id: string) => unwrap(userRequest.post<ApiEnvelope<{ refunded: boolean }>>(`/groupbuy/my/${id}/refund`, {})),
  togglePublic: (id: string, isPublic: boolean) => unwrap(userRequest.put<ApiEnvelope<{ updated: boolean }>>(`/groupbuy/my/${id}/toggle-public`, { isPublic })),
  tabCounts: () => unwrap(userRequest.get<ApiEnvelope<{ pending: number; success: number; refunded: number }>>("/groupbuy/tab-counts")),
};

export const groupBuyAdminApi = {
  activities: (params?: Record<string, unknown>) => activities(adminRequest, "/groupbuy/activities", params),
  activity: (id: string) => unwrap(adminRequest.get<ApiEnvelope<GroupBuyActivity>>(`/groupbuy/activities/${id}`)),
  saveActivity: (value: Partial<GroupBuyActivity>) => value.id
    ? unwrap(adminRequest.put<ApiEnvelope<GroupBuyActivity>>(`/groupbuy/activities/${value.id}`, value))
    : unwrap(adminRequest.post<ApiEnvelope<GroupBuyActivity>>("/groupbuy/activities", value)),
  deleteActivity: (id: string) => unwrap(adminRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/groupbuy/activities/${id}`)),
  setStatus: (id: string, status: 0 | 1) => unwrap(adminRequest.put<ApiEnvelope<{ updated: boolean }>>(`/groupbuy/activities/${id}/status`, { status })),
  leaders: (params?: Record<string, unknown>) => unwrap(adminRequest.get<ApiEnvelope<PagePayload<GroupBuyRecord>>>("/groupbuy/leaders", { params })).then(normalizePage),
  leader: (id: string) => unwrap(adminRequest.get<ApiEnvelope<GroupBuyDetail>>(`/groupbuy/leaders/${id}/detail`)),
  refund: (id: string) => unwrap(adminRequest.post<ApiEnvelope<{ refunded: boolean }>>(`/groupbuy/members/${id}/refund`, {})),
  forcePublic: (id: string, closed: boolean) => unwrap(adminRequest.put<ApiEnvelope<{ updated: boolean }>>(`/groupbuy/leaders/${id}/force-public`, { closed })),
  settings: () => unwrap(adminRequest.get<ApiEnvelope<GroupBuySettings>>("/groupbuy/settings")),
  saveSettings: (value: GroupBuySettings) => unwrap(adminRequest.put<ApiEnvelope<GroupBuySettings>>("/groupbuy/settings", value)),
};

export async function probeGroupBuy(scope: "public" | "admin"): Promise<boolean> {
  try {
    if (scope === "admin") await groupBuyAdminApi.activities({ pageSize: 1 });
    else await groupBuyApi.publicActivities({ pageSize: 1 });
    return true;
  } catch {
    return false;
  }
}
