import { create } from "zustand";
import { adminAuthApi, salesAuthApi } from "../api/staffAuth";
import type { AuthPayload, AuthUser } from "../types/auth";

interface StaffAuthApi {
  login: (account: string, password: string, captchaGrant?: string) => Promise<AuthPayload>;
  getSession: () => Promise<AuthPayload>;
  logout: () => Promise<void>;
}

interface StaffAuthState {
  user: AuthUser | null;
  initialized: boolean;
  loading: boolean;
  restoreSession: () => Promise<void>;
  signIn: (account: string, password: string, captchaGrant?: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  clearSession: () => void;
}

function createStaffAuthStore(api: StaffAuthApi) {
  return create<StaffAuthState>((set, get) => ({
    user: null,
    initialized: false,
    loading: false,
    clearSession: () =>
      set({ user: null, initialized: true, loading: false }),
    restoreSession: async () => {
      if (get().initialized || get().loading) return;
      set({ loading: true });
      try {
        const payload = await api.getSession();
        set({ user: payload.user, initialized: true });
      } catch {
        set({ user: null, initialized: true });
      } finally {
        set({ loading: false });
      }
    },
    signIn: async (account, password, captchaGrant = "") => {
      set({ loading: true });
      try {
        const payload = await api.login(account, password, captchaGrant);
        set({ user: payload.user, initialized: true });
        return payload.user;
      } finally {
        set({ loading: false });
      }
    },
    signOut: async () => {
      try {
        await api.logout();
      } finally {
        get().clearSession();
      }
    },
  }));
}

export const useAdminAuthStore = createStaffAuthStore(adminAuthApi);
export const useSalesAuthStore = createStaffAuthStore(salesAuthApi);
