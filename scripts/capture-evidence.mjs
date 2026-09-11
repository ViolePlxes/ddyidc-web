import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { scheduler } from "node:timers/promises";

const account = process.env.DDYIDC_QA_ACCOUNT;
const password = process.env.DDYIDC_QA_PASSWORD;
if (!account || !password) {
  throw new Error("DDYIDC_QA_ACCOUNT and DDYIDC_QA_PASSWORD are required");
}

const browserExecutable = process.env.DDYIDC_BROWSER_EXECUTABLE ?? "/usr/bin/chromium";
const outputDir = resolve("artifacts", "browser-evidence");
const profileDir = await mkdtemp(join(tmpdir(), "ddyidc-evidence-"));
const port = 9200 + Math.floor(Math.random() * 500);
await mkdir(outputDir, { recursive: true });

const browser = spawn(
  browserExecutable,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

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
  await delay(1600);
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

try {
  await command("Page.enable");
  await command("Network.enable");
  await command("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await navigate("http://localhost:3100/products");
  await capture("01-products.png");

  await navigate("http://localhost:3100/register");
  await capture("02-register.png");

  const loginResponse = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ account, password }),
  });
  const token = loginResponse.headers.get("set-cookie")?.match(/ddyidc_token=([^;]+)/)?.[1];
  if (!loginResponse.ok || !token) throw new Error("Could not establish QA session");

  const ordersResponse = await fetch("http://localhost:8080/api/v1/orders?page=1&pageSize=1", {
    headers: { cookie: `ddyidc_token=${token}` },
  }).then((response) => response.json());
  const latestOrderId = ordersResponse.data?.list?.[0]?.id;
  if (!latestOrderId) throw new Error("QA account has no order to capture");

  await command("Network.setCookie", {
    name: "ddyidc_token",
    value: token,
    url: "http://localhost:3100",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });

  await navigate("http://localhost:3100/console");
  await capture("03-console-home.png");

  await navigate(`http://localhost:3100/console/orders/${latestOrderId}`);
  await capture("04-order-detail.png");

  await navigate("http://localhost:3100/console/finance");
  await capture("05-finance.png");

  await navigate("http://localhost:3100/console/coupons");
  await capture("06-coupons.png");

  await navigate("http://localhost:3100/console/instances");
  await capture("07-instances-unavailable.png");
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
