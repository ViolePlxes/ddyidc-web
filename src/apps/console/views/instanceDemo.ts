import type { InstanceDetail, InstanceMonitor, MonitorPoint } from "../../../shared/api/console";

// Explicit visual preview only. Never persisted or used by the instance API.
export function createInstanceDemo(now = Date.now()): { instance: InstanceDetail; monitor: InstanceMonitor } {
  const end = Math.floor(now / 300_000) * 300;
  const points = (base: number, amplitude: number, phase = 0): MonitorPoint[] => Array.from({ length: 289 }, (_, i) => ({
    timestamp: end - (288 - i) * 300,
    value: Number(Math.max(0, base + Math.sin(i / 13 + phase) * amplitude + Math.cos(i / 3 + phase) * amplitude / 4 + (i % 61 < 3 ? amplitude * 2 : 0)).toFixed(2)),
  }));
  const config = [
    ["data_center", "数据中心", "华东 · 上海 BGP（模拟）"], ["remark", "备注信息", "业务测试服务器 · 仅用于页面效果预览"],
    ["username", "用户名", "root"], ["port", "端口", "22"], ["network", "网络类型", "VPC 私有网络"],
    ["system_disk", "系统盘", "80 GB SSD"], ["cpu", "CPU", "8 vCPU"], ["memory", "内存", "16 GB"],
    ["bandwidth", "带宽", "100 Mbps"], ["data_disk", "数据盘", "200 GB SSD"],
  ].map(([field, displayName, displayValue], position) => ({ id: `demo-${position}`, field: field!, displayName: displayName!, displayValue: displayValue!, position }));
  return {
    instance: {
      id: "DEMO-001", name: "web-production-01（模拟）", productName: "通用型云服务器 · 8核16G（模拟）", productId: "demo", orderId: "0", moduleType: "demo",
      upstreamInstanceId: "demo-server-52686", hostname: "web-production-01", primaryIp: "192.0.2.10", subnetMask: "255.255.255.0", gateway: "192.0.2.1",
      operatingSystem: "Ubuntu 24.04 LTS", currentImageGroup: "Ubuntu", currentImageName: "Ubuntu 24.04 LTS x64", passwordMasked: "••••••••••••",
      status: 3, powerStatus: "running", billingCycle: "monthly", createdAt: new Date(now - 4 * 86_400_000).toISOString(),
      activatedAt: new Date(now - 4 * 86_400_000).toISOString(), expiresAt: new Date(now + 26 * 86_400_000).toISOString(),
      config, ips: [{ address: "192.0.2.10" }], events: [],
      capabilities: { start: false, stop: false, reboot: false, reinstall: false, resetPassword: false, remote: false, destroy: false, traffic: false },
    },
    monitor: { available: true, cpu: points(23, 10), memory: points(54, 5, 1), diskIo: [], diskRead: points(650, 400, 2), diskWrite: points(240, 150, 4), networkIn: points(18_000_000, 9_000_000, 1), networkOut: points(6_000_000, 4_000_000, 3) },
  };
}
