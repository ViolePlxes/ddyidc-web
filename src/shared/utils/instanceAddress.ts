/** Preserve unknown OS ports: only hide a port when its OS default is known. */
export function instanceAddress(ip?: string, port?: string, operatingSystem?: string): string | undefined {
  if (!ip) return undefined;
  const value = port?.trim();
  const windows = /windows/i.test(operatingSystem ?? "");
  const linux = /linux|ubuntu|debian|centos|alma|rocky|fedora|arch|suse/i.test(operatingSystem ?? "");
  if (!value || (windows && value === "3389") || (linux && value === "22")) return ip;
  const host = ip.includes(":") && !ip.startsWith("[") ? `[${ip}]` : ip;
  return `${host}:${value}`;
}
