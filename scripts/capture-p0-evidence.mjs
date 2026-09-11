import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { scheduler } from "node:timers/promises";

const account = process.env.DDYIDC_QA_ACCOUNT;
const password = process.env.DDYIDC_QA_PASSWORD;
const orderId = process.env.DDYIDC_P0_ORDER_ID;
if (!account || !password || !orderId) {
  throw new Error("DDYIDC_QA_ACCOUNT, DDYIDC_QA_PASSWORD and DDYIDC_P0_ORDER_ID are required");
}

const productId = "7327268567126021";
const browserExecutable = process.env.DDYIDC_BROWSER_EXECUTABLE ?? "/usr/bin/chromium";
const outputDir = resolve("artifacts", "p0-browser-evidence");
const profileDir = await mkdtemp(join(tmpdir(), "ddyidc-p0-evidence-"));
const port = 9700 + Math.floor(Math.random() * 200);
await mkdir(outputDir, { recursive: true });

const browser = spawn(browserExecutable, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: "ignore" });

const delay = (milliseconds) => scheduler.wait(milliseconds);

async function pageSocketUrl() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Chromium is still starting.
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for Chromium DevTools");
}

const socket = new WebSocket(await pageSocketUrl());
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", rejectOpen, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCommand, rejectCommand) => {
    pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
  });
}

async function navigate(url) {
  await command("Page.navigate", { url });
  await delay(1800);
}

async function capture(name) {
  const metrics = await command("Page.getLayoutMetrics");
  const { width, height } = metrics.cssContentSize;
  const result = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    fromSurface: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
  await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
}

const draft = {
  productId,
  productName: "内蒙电信铂金云-4核4G",
  configMode: "elastic",
  configOptions: [
    ["1666834", "data_center", "6892454", "数据中心", "内蒙电信机房"],
    ["1666842", "image", "6892492", "操作系统", "Ubuntu-22.04-x64 ¥0.00元"],
    ["1666835", "cpu", "6892456", "CPU", "8核 ¥14.00元"],
    ["1666836", "memory", "6892462", "内存", "8GB ¥16.00元"],
    ["1666837", "system_disk", "100", "系统盘", "100 G"],
    ["1666841", "data_disk", "50", "数据盘", "50 G"],
    ["1666839", "bandwidth", "15", "带宽", "15 Mbps"],
    ["1666840", "ip_num", "2", "IP数量", "2 个"],
    ["1666838", "network", "6892470", "网络类型", "VPC网络 ¥0.00元"],
  ].map(([id, field, value, displayName, displayValue], position) => ({
    id, field, value, displayName, displayValue, position,
  })),
  billingCycle: "monthly",
  cycleLabel: "月",
  durationMonth: 1,
  quantity: 1,
  unitPriceYuan: 158,
  totalYuan: 158,
  hostname: "ser123456789012",
  password: "aB1234567890",
};

try {
  await command("Page.enable");
  await command("Network.enable");
  await command("Runtime.enable");
  await command("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await navigate("http://localhost:3100/register");
  await capture("01-register.png");

  const loginResponse = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ account, password }),
  });
  const token = loginResponse.headers.get("set-cookie")?.match(/ddyidc_token=([^;]+)/)?.[1];
  if (!loginResponse.ok || !token) throw new Error("Could not establish QA session");
  await command("Network.setCookie", {
    name: "ddyidc_token",
    value: token,
    url: "http://localhost:3100",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });

  await navigate(`http://localhost:3100/products/${productId}`);
  await delay(4500);
  await capture("02-product-6353.png");

  await command("Runtime.evaluate", {
    expression: `sessionStorage.setItem("ddyidc_order_draft", ${JSON.stringify(JSON.stringify(draft))})`,
  });
  await navigate("http://localhost:3100/order/confirm");
  await capture("03-order-confirm.png");

  await navigate(`http://localhost:3100/console/orders/${orderId}`);
  await capture("04-order-detail.png");
} finally {
  socket.close();
  browser.kill();
  await delay(500);
  try {
    await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // Chromium can keep profile files open briefly while exiting.
  }
}

console.log(outputDir);
