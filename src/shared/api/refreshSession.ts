import axios from "axios";
import type { AuthUser } from "../types/auth";

const refreshKey = "ddyidc-user-refresh";
const profileKey = "ddyidc-quick-login";
export interface RememberedProfile { id: string; name: string; avatar?: string; expiresAt: number }
export function readRememberedProfile(): RememberedProfile | null {
  try {
    if (!localStorage.getItem(refreshKey)) return null;
    const profile = JSON.parse(localStorage.getItem(profileKey) ?? "null") as RememberedProfile | null;
    if (!profile || typeof profile.id !== "string" || typeof profile.name !== "string" || !Number.isFinite(profile.expiresAt) || profile.expiresAt <= Date.now()) return null;
    return profile;
  } catch { return null; }
}
export function rememberRefreshProfile(user: AuthUser) {
  try {
    const profile = readRememberedProfile();
    if (profile) localStorage.setItem(profileKey, JSON.stringify({ id: user.id, name: user.name || user.account, avatar: user.avatar, expiresAt: profile.expiresAt } satisfies RememberedProfile));
  } catch { /* Profile caching is optional. */ }
}
export interface RefreshPayload {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}
function storedRefresh() {
  const temporary = sessionStorage.getItem(refreshKey);
  if (temporary) return { token: temporary, rememberMe: false };
  const persistent = localStorage.getItem(refreshKey);
  return persistent ? { token: persistent, rememberMe: true } : null;
}
export function clearRefreshSession() {
  sessionStorage.removeItem(refreshKey);
  localStorage.removeItem(refreshKey);
  localStorage.removeItem(profileKey);
}
export function saveRefreshSession(payload: RefreshPayload & { user?: AuthUser }, rememberMe: boolean) {
  const previous = readRememberedProfile();
  clearRefreshSession();
  (rememberMe ? localStorage : sessionStorage).setItem(refreshKey, payload.refresh_token);
  if (rememberMe) {
    const user = payload.user;
    const profile = user ? { id: user.id, name: user.name || user.account, avatar: user.avatar } : previous;
    if (profile) localStorage.setItem(profileKey, JSON.stringify({ id: profile.id, name: profile.name, avatar: profile.avatar, expiresAt: Date.now() + payload.refresh_expires_in * 1000 } satisfies RememberedProfile));
  }
}

let pending: Promise<void> | null = null;
export async function renewUserSession(): Promise<void> {
  if (pending) return pending;
  const before = storedRefresh();
  if (!before) throw new Error("登录已失效，请重新登录");
  const renew = async () => {
    const current = storedRefresh();
    if (!current) throw new Error("登录已失效，请重新登录");
    // Another tab may already have rotated the shared credential while waiting.
    if (current.token !== before.token) return;
    try {
      const response = await axios.post<{ code: number; data: RefreshPayload }>(
        "/api/v1/auth/refresh",
        { refresh_token: current.token, rememberMe: current.rememberMe },
        { withCredentials: true, timeout: 15_000, headers: { "X-Refresh-Request": "1" } },
      );
      if (response.data.code !== 0) throw new Error("登录续期失败");
      // A logout or a new login while the request ran must not restore credentials.
      if (storedRefresh()?.token !== current.token) throw new Error("登录状态已变更");
      saveRefreshSession(response.data.data, current.rememberMe);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && storedRefresh()?.token === current.token) clearRefreshSession();
      throw error;
    }
  };
  // Shared localStorage needs a browser-wide lock; a promise also coalesces
  // requests in one tab. Credentials are read again after acquiring the lock.
  pending = (async () => {
    if (navigator.locks) await navigator.locks.request("ddyidc-user-refresh", renew);
    else await renew();
  })().finally(() => { pending = null; });
  await pending;
}
export function refreshSessionAvailable() { return storedRefresh() !== null; }
