import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { scheduler } from "node:timers/promises";

const account = process.env.DDYIDC_QA_ACCOUNT;
const password = process.env.DDYIDC_QA_PASSWORD;
const baseUrl = process.env.DDYIDC_QA_BASE_URL ?? "http://localhost:3100";
if (!account || !password) throw new Error("DDYIDC_QA_ACCOUNT and DDYIDC_QA_PASSWORD are required");

const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outputDir = resolve("artifacts", "transition-evidence");
const profileDir = await mkdtemp(join(tmpdir(), "ddyidc-transition-"));
const port = 9800 + Math.floor(Math.random() * 100);
await mkdir(outputDir, { recursive: true });

const browser = spawn(edge, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

async function pageSocketUrl() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Browser is still starting.
    }
    await scheduler.wait(100);
  }
  throw new Error("Timed out waiting for Edge DevTools");
}

const socket = new WebSocket(await pageSocketUrl());
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", rejectOpen, { once: true });
});

let sequence = 0;
const pending = new Map();
const runtimeErrors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  if (message.method === "Runtime.exceptionThrown") {
    runtimeErrors.push(message.params.exceptionDetails.text);
  }
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

async function navigate(url, wait = 0) {
  await command("Page.navigate", { url });
  if (wait) await scheduler.wait(wait);
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  return result.result.value;
}

async function waitForSelector(selector, timeout = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return;
    await scheduler.wait(100);
  }
  throw new Error(`Timed out waiting for ${selector}`);
}

async function capture(name) {
  const metrics = await command("Page.getLayoutMetrics");
  const width = Math.min(metrics.cssContentSize.width, 1440);
  const height = Math.max(900, Math.min(metrics.cssContentSize.height, 1800));
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
  await command("Runtime.enable");
  await command("Network.enable");
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 600, deviceScaleFactor: 1, mobile: false });

  const loginResponse = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ account, password }),
  });
  const token = loginResponse.headers.get("set-cookie")?.match(/ddyidc_token=([^;]+)/)?.[1];
  if (!loginResponse.ok || !token) throw new Error("Could not establish QA session");
  await command("Network.setCookie", { name: "ddyidc_token", value: token, url: baseUrl, path: "/", httpOnly: true, secure: false, sameSite: "Lax" });
  await navigate(`${baseUrl}/console`, 2500);
  await command("Network.setCacheDisabled", { cacheDisabled: true });
  await command("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: 180 * 1024 / 8,
    uploadThroughput: 84 * 1024 / 8,
    connectionType: "cellular3g",
  });

  await evaluate("document.querySelector('a[href=\"/console/products\"]')?.click()");
  await waitForSelector('[aria-label="正在加载卡片数据"]');
  await scheduler.wait(220);
  await capture("01-products-skeleton-fast-3g.png");
  await scheduler.wait(7000);
  await capture("02-products-real-fast-3g.png");

  const scrollTarget = await evaluate("(() => { const container = document.querySelector('[data-dashboard-scroll]'); return Math.min(500, Math.max(0, container.scrollHeight - container.clientHeight)); })()");
  await evaluate(`document.querySelector('[data-dashboard-scroll]').scrollTo(0, ${scrollTarget})`);
  await capture("02b-products-content-scrolled-shell-fixed.png");
  const productHref = await evaluate("document.querySelector('a[href^=\"/console/products/\"]')?.href");
  if (!productHref) {
    const pageState = await evaluate("({ url: location.href, text: document.body.innerText, html: document.body.innerHTML.slice(0, 1000) })");
    throw new Error(`No product detail link found: ${JSON.stringify({ pageState, runtimeErrors })}`);
  }
  await evaluate("document.querySelector('a[href^=\"/console/products/\"]')?.click()");
  await waitForSelector('[aria-label="正在加载商品配置"]');
  await scheduler.wait(220);
  await capture("03-product-detail-skeleton-fast-3g.png");
  await scheduler.wait(15000);
  await capture("04-product-detail-real-fast-3g.png");

  await evaluate("history.back()");
  await scheduler.wait(1600);
  const restoredScrollY = await evaluate("document.querySelector('[data-dashboard-scroll]').scrollTop");
  await capture("05-products-back-scroll-restored.png");

  await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const motion = await evaluate(`(() => {
    const route = document.querySelector('.route-content');
    const card = document.querySelector('.interactive-card');
    return {
      routeAnimation: route ? getComputedStyle(route).animationName : null,
      cardTransition: card ? getComputedStyle(card).transitionDuration : null,
      viewTransitionsSupported: 'startViewTransition' in document,
    };
  })()`);

  const layout = await evaluate(`(() => {
    const scroller = document.querySelector('[data-dashboard-scroll]');
    const topbar = document.querySelector('[data-dashboard-topbar]');
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    return {
      bodyScrollY: scrollY,
      contentScrollTop: scroller?.scrollTop ?? null,
      contentClientHeight: scroller?.clientHeight ?? null,
      contentScrollHeight: scroller?.scrollHeight ?? null,
      topbarTop: topbar?.getBoundingClientRect().top ?? null,
      sidebarTop: sidebar?.getBoundingClientRect().top ?? null,
      sidebarBottom: sidebar?.getBoundingClientRect().bottom ?? null,
      viewportHeight: innerHeight,
    };
  })()`);

  console.log(JSON.stringify({ outputDir, scrollTarget, restoredScrollY, motion, layout }, null, 2));
} finally {
  socket.close();
  browser.kill();
  await scheduler.wait(500);
  try {
    await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // Edge may keep a dictionary file locked briefly.
  }
}
