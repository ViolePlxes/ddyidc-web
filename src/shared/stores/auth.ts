import { create } from "zustand";
import * as authApi from "../api/auth";
import type { AuthUser } from "../types/auth";

interface AuthState {
  user: AuthUser | null;
  needBindMobile: boolean;
  initialized: boolean;
  loading: boolean;
  setSession: (user: AuthUser, needBindMobile?: boolean) => void;
  restoreSession: () => Promise<void>;
  signIn: (account: string, password: string, rememberMe?: boolean) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  needBindMobile: false,
  initialized: false,
  loading: false,
  setSession: (user, needBindMobile = false) =>
    set({ user, needBindMobile, initialized: true }),
  clearSession: () =>
    set({
      user: null,
      needBindMobile: false,
      initialized: true,
      loading: false,
    }),
  restoreSession: async () => {
    if (get().initialized || get().loading) return;
    set({ loading: true });
    try {
      const payload = await authApi.getSession();
      set({
        user: payload.user,
        needBindMobile: payload.needBindMobile ?? false,
        initialized: true,
      });
    } catch {
      set({ user: null, needBindMobile: false, initialized: true });
    } finally {
      set({ loading: false });
    }
  },
  signIn: async (account, password, rememberMe = false) => {
    set({ loading: true });
    try {
      const payload = await authApi.login(account, password, rememberMe);
      set({
        user: payload.user,
        needBindMobile: payload.needBindMobile ?? false,
        initialized: true,
      });
      return payload.user;
    } finally {
      set({ loading: false });
    }
  },
  signOut: async () => {
    try {
      await authApi.logout();
    } finally {
      get().clearSession();
    }
  },
}));
