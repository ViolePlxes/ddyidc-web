import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import type { Plugin } from "vite";

function entryForPath(pathname: string): string {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "/admin.html";
  if (pathname === "/sales" || pathname.startsWith("/sales/")) return "/sales.html";
  if (
    pathname === "/cart" ||
    pathname === "/order/confirm" ||
    pathname === "/bind-mobile" ||
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
    return execFileSync("git", args, { cwd: __dirname, encoding: "utf8" }).trim() || fallback;
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
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version, commit, branch, builtAt }, null, 2) });
    },
  };
}

export default defineConfig({
  plugins: [entryRewrite(), versionAsset(), react(), tailwindcss()],
  server: {
    port: 3100,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/admin/v1": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        portal: resolve(__dirname, "index.html"),
        console: resolve(__dirname, "console.html"),
        admin: resolve(__dirname, "admin.html"),
        sales: resolve(__dirname, "sales.html"),
      },
    },
  },
});
