export type UserRole = "customer" | "admin" | "sales";

export interface AuthUser {
  id: string;
  account: string;
  name: string;
  role: UserRole;
  mobile?: string;
  email?: string;
  staffNo?: string;
}

export interface AuthPayload {
  user: AuthUser;
  needBindMobile?: boolean;
}
