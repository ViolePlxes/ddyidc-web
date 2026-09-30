export type UserRole = "customer" | "admin" | "sales";

export interface AuthUser {
  id: string;
  account: string;
  name: string;
  role: UserRole;
  mobile?: string;
  email?: string;
  staffNo?: string;
  avatar?: string;
  initialPasswordRequired?: boolean;
}

export interface AuthPayload {
  refreshable?: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  user: AuthUser;
  needBindMobile?: boolean;
  rememberMe?: boolean;
}
