import axios from "axios";

const refreshKey = "ddyidc-user-refresh";
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
}
export function saveRefreshSession(payload: RefreshPayload, rememberMe: boolean) {
  clearRefreshSession();
  (rememberMe ? localStorage : sessionStorage).setItem(refreshKey, payload.refresh_token);
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
