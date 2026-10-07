import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import type { Plugin } from "vite";

function entryForPath(pathname: string): string {
  if (/^\/dd-admin-[a-z0-9]{24,64}(?:\/|$)/.test(pathname)) return "/admin.html";
  if (pathname === "/sales" || pathname.startsWith("/sales/")) return "/sales.html";
  if (
    pathname === "/cart" ||
    pathname === "/order/confirm" ||
    pathname === "/bind-mobile" ||
    ["/wallet/recharge", "/wallet/recharge-records", "/wallet/consume-records"].includes(pathname) ||
    pathname === "/user/productList.htm" ||
    /^\/user\/instance\/[^/]+\.htm$/.test(pathname) ||
    pathname === "/console" ||
    pathname.startsWith("/console/")
  ) {
    return "/console.html";
  }
  return "/index.html";
}

function entryRewrite(): Plugin {
  async function secureEntry(path: string, response: import("node:http").ServerResponse) {
    if (/^\/(?:admin(?:\/|$)|backend(?:\/|$)|manage(?:\/|$)|admin\.html$)/.test(path) && !path.startsWith("/admin/v1/")) { response.statusCode=404; response.end("Not Found"); return false; }
    if (/^\/dd-admin-/.test(path)) {
      try { const result=await fetch((process.env.DDYIDC_API_TARGET||"http://localhost:8080")+"/api/v1/security/entry?path="+encodeURIComponent(path), { signal: AbortSignal.timeout(5000) }); if(result.status!==204){response.statusCode=result.status===503?503:404;response.end("Not Found");return false;} const cookie=result.headers.get("set-cookie");if(cookie)response.setHeader("Set-Cookie",cookie);response.setHeader("Referrer-Policy","no-referrer");response.setHeader("Cache-Control","no-store"); } catch {response.statusCode=503;response.end("Service unavailable");return false;}
    }
    return true;
  }
  return {
    name: "ddyidc-entry-rewrite",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (
          request.method !== "GET" ||
          !String(request.headers.accept ?? "").includes("text/html") ||
          !request.url
        ) {
          next();
          return;
        }
        const url = new URL(request.url, "http://localhost");
        if (!await secureEntry(url.pathname,response)) return;
        const entry = entryForPath(url.pathname);
        if (entry === "/index.html" || (url.pathname.includes(".") && entry !== "/console.html")) {
          next();
          return;
        }
        try {
          const template = await readFile(resolve(__dirname, entry.slice(1)), "utf8");
          const html = await server.transformIndexHtml(url.pathname, template);
          response.statusCode = 200;
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(html);
        } catch (error) {
          next(error as Error);
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (
          request.method !== "GET" ||
          !String(request.headers.accept ?? "").includes("text/html") ||
          !request.url
        ) {
          next();
          return;
        }
        const url = new URL(request.url, "http://localhost");
        if (!await secureEntry(url.pathname,response)) return;
        const entry = entryForPath(url.pathname);
        if (entry === "/index.html" || (url.pathname.includes(".") && entry !== "/console.html")) {
          next();
          return;
        }
        try {
          const html = await readFile(resolve(__dirname, "dist", entry.slice(1)), "utf8");
          response.statusCode = 200;
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(html);
        } catch (error) {
          next(error as Error);
        }
      });
    },
  };
}

function gitValue(args: string[], fallback: string): string {
  try {
    return execFileSync("git", args, { cwd: __dirname, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function versionAsset(): Plugin {
  const commit = process.env.DDYIDC_COMMIT || gitValue(["rev-parse", "HEAD"], "unknown");
  const branch = process.env.DDYIDC_BRANCH || gitValue(["branch", "--show-current"], "unknown");
  const packageVersion = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8")) as { version?: string };
  const version = process.env.DDYIDC_VERSION || packageVersion.version || "unknown";
  const builtAt = process.env.DDYIDC_BUILD_TIME || new Date().toISOString();
  return {
    name: "ddyidc-version-asset",
    config() {
      return { define: { "import.meta.env.VITE_DDYIDC_VERSION": JSON.stringify(version) } };
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version, commit, branch, builtAt }, null, 2) });
    },
  };
}

export default defineConfig({
  plugins: [entryRewrite(), versionAsset(), react(), tailwindcss()],
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
  },
  server: {
    port: 3100,
    strictPort: true,
    proxy: {
      "/auth/github/callback": { target: process.env.DDYIDC_API_TARGET || "http://localhost:8080", changeOrigin: false },
      "/auth/qq/callback": { target: process.env.DDYIDC_API_TARGET || "http://localhost:8080", changeOrigin: false },
      "/api": { target: process.env.DDYIDC_API_TARGET || "http://localhost:8080", changeOrigin: false, ws: true },
      "/admin/v1": { target: process.env.DDYIDC_API_TARGET || "http://localhost:8080", changeOrigin: false, ws: true },
    },
  },
  preview: {
    proxy: {
      "/auth/github/callback": { target: "http://localhost:8080", changeOrigin: false },
      "/auth/qq/callback": { target: "http://localhost:8080", changeOrigin: false },
      "/api": { target: "http://localhost:8080", changeOrigin: false, ws: true },
      "/admin/v1": { target: "http://localhost:8080", changeOrigin: false, ws: true },
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        public: resolve(__dirname, "public.html"),
        portal: resolve(__dirname, "index.html"),
        console: resolve(__dirname, "console.html"),
        admin: resolve(__dirname, "admin.html"),
        sales: resolve(__dirname, "sales.html"),
      },
    },
  },
});
