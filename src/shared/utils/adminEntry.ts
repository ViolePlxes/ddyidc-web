// A configured entry is validated by the server before this bundle is served.
// Never publish the actual configured path in a public settings response.
export const adminBase = /^\/dd-admin-[a-z0-9]{24,64}(?:\/|$)/.test(window.location.pathname)
  ? window.location.pathname.split("/").slice(0, 2).join("/") : "/__admin_entry_unavailable__";
export function adminPath(path: string) { return path === "/admin" || (path.startsWith("/admin/") && path !== "/admin/v1" && !path.startsWith("/admin/v1/")) ? adminBase + path.slice(6) : path; }
export function adminNavigationResponse(value: unknown): unknown {
  if(Array.isArray(value)) return value.map(adminNavigationResponse);
  if(value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key === "href" && typeof item === "string" ? adminPath(item) : adminNavigationResponse(item)]));
  return value;
}
