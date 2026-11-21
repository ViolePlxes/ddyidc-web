/* ES5 deliberately: this recovery surface must run before the application,
   and it is the only thing an old browser can still execute. Keep the syntax
   free of let/const, arrow functions, template literals and modules. */
(function () {
  var w = window, d = document, timer, panel, reason = "";
  var guard = { blocked: false, mounted: false, failures: [], legacy: false };
  var reloadKey = "ddy:browser-guard:reloaded";
  var retryKey = "ddy:browser-guard:retried";
  w.__ddyBrowserGuard = guard;

  function message(kind) {
    if (kind === "legacy") return "当前浏览器版本过低，无法运行本站的新界面。请使用最新版 Chrome、Edge、Firefox 或 Safari 打开；安卓请使用系统浏览器以外的现代浏览器。";
    if (kind === "unsupported") return "当前浏览器内核缺少必要能力，请升级浏览器后重试。";
    if (kind === "styles") return "页面样式未能正常加载，通常是网络中断或缓存里的文件已损坏。";
    return "页面资源加载失败或耗时过长，请检查网络连接后重新加载。";
  }

  /* Without storage we cannot remember that a reload was already attempted, so
     recovery must not fire blindly: a loop is worse than the error panel. */
  function markOnce(key) {
    try {
      if (w.sessionStorage.getItem(key) === "1") return false;
      w.sessionStorage.setItem(key, "1");
      return true;
    } catch (error) { return false; }
  }
  function clearMark(key) {
    try { w.sessionStorage.removeItem(key); } catch (error) { /* private mode */ }
  }
  function reloadFresh() {
    var href = "";
    try { href = String(w.location.href || "").replace(/#.*$/, ""); } catch (error) { href = ""; }
    if (href) {
      try {
        w.location.replace(href + (href.indexOf("?") >= 0 ? "&" : "?") + "r=" + new Date().getTime());
        return;
      } catch (error) { /* fall back to a plain reload */ }
    }
    try { w.location.reload(); } catch (error) { /* nothing else we can do */ }
  }

  /* A deploy replaces every hashed asset. One reload with a fresh index (and a
     cache-busting query so proxies cannot replay the broken HTML) recovers an
     open tab; the flag stops a reload loop when the network is the problem. */
  function recover() {
    if (!markOnce(reloadKey)) return false;
    reloadFresh();
    return true;
  }

  function noteFailure(kind, url) {
    var entry = { kind: kind, url: String(url || ""), at: new Date().getTime() };
    if (guard.failures.length < 20) guard.failures.push(entry);
    guard.lastFailure = entry;
    if (w.console && w.console.warn) w.console.warn("[browser-guard]", kind, entry.url);
  }

  function show(kind) {
    reason = kind; guard.blocked = true;
    if (!d.body) return;
    var root = d.getElementById("root");
    if (root) { root.style.display = "none"; root.setAttribute("aria-hidden", "true"); }
    if (panel) return;
    panel = d.createElement("main");
    panel.setAttribute("role", "alert");
    panel.style.cssText = "margin:2em auto;padding:1em;max-width:36em;font:14px/1.7 system-ui,-apple-system,'Segoe UI',sans-serif;color:#1f1f1f;background:#fff;overflow-wrap:break-word";
    var title = d.createElement("h1");
    title.style.cssText = "font-size:18px;margin:0 0 8px";
    title.textContent = "页面暂时无法正常显示";
    var text = d.createElement("p");
    text.style.cssText = "margin:0 0 12px;color:#555";
    text.textContent = message(kind);
    panel.appendChild(title);
    panel.appendChild(text);
    if (guard.lastFailure && guard.lastFailure.url) {
      var detail = d.createElement("p");
      detail.style.cssText = "margin:0 0 12px;color:#777;font-size:12px;word-break:break-all";
      detail.textContent = "加载失败的资源：" + guard.lastFailure.url;
      panel.appendChild(detail);
    }
    var retry = d.createElement("button");
    retry.type = "button";
    retry.textContent = "重新加载";
    retry.style.cssText = "margin-right:8px;padding:6px 14px;font:inherit;cursor:pointer";
    retry.onclick = function () {
      retry.disabled = true;
      clearMark(reloadKey);
      clearMark(retryKey);
      reloadFresh();
    };
    panel.appendChild(retry);
    if (kind === "legacy" || kind === "unsupported") {
      retry.style.display = "none";
      var hint = d.createElement("p");
      hint.style.cssText = "margin:12px 0 0;color:#777;font-size:12px";
      hint.textContent = "推荐浏览器：Chrome 90+ / Edge 90+ / Firefox 90+ / Safari 15+";
      panel.appendChild(hint);
    }
    d.body.appendChild(panel);
  }

  /* Retry one stylesheet with a cache-buster before giving up: a truncated or
     poisoned cache entry is the common cause of a page that renders without
     any styles, and the browser will happily serve it to a plain reload. */
  function retryStylesheet(link) {
    var href = link.href || (link.getAttribute && link.getAttribute("href")) || "";
    if (!href) return false;
    if (!markOnce(retryKey + ":" + href)) return false;
    var base = href.replace(/[?&]r=\d+/, "");
    link.href = base + (base.indexOf("?") >= 0 ? "&" : "?") + "r=" + new Date().getTime();
    return true;
  }

  guard.checkStyles = function () {
    if (guard.blocked) return false;
    if (!d.body) return false;
    var rootStyle = w.getComputedStyle(d.documentElement);
    if (rootStyle.getPropertyValue("--ddy-styles-ready").replace(/\s/g, "") !== "1") { show("styles"); return false; }
    var probe = d.createElement("div");
    probe.className = "fixed p-4 rounded-md";
    probe.style.visibility = "hidden";
    d.body.appendChild(probe);
    var style = w.getComputedStyle(probe);
    var okay = style.position === "fixed" && parseFloat(style.paddingTop) > 0 && parseFloat(style.borderTopLeftRadius) > 0;
    d.body.removeChild(probe);
    if (!okay) show("styles");
    return okay;
  };

  guard.ready = function () {
    guard.mounted = true;
    w.clearTimeout(timer);
    clearMark(reloadKey);
  };

  /* Old browsers cannot run the bundle at all (ES modules, fetch, AbortController).
     Detect that first so they get a readable page instead of a blank one. */
  var probeScript = d.createElement("script");
  var modules = ("noModule" in probeScript);
  var supported = !!(modules && w.Promise && w.fetch && w.AbortController && w.ResizeObserver);
  if (!supported) {
    guard.legacy = !modules;
    reason = modules ? "unsupported" : "legacy";
    guard.blocked = true;
    noteFailure(reason, "");
  }

  function onResourceError(event) {
    var target = event.target;
    if (!target) return;
    var stylesheet = target.tagName === "LINK" && target.rel === "stylesheet";
    var script = target.tagName === "SCRIPT" && (target.type === "module" || /\/assets\/.+\.js/.test(target.src || ""));
    if (!stylesheet && !script) return;
    noteFailure(stylesheet ? "styles" : "resources", stylesheet ? target.href : target.src);
    if (stylesheet && retryStylesheet(target)) {
      guard.blocked = false;
      return;
    }
    if (recover()) { guard.blocked = true; return; }
    show(stylesheet ? "styles" : "resources");
  }

  if (d.addEventListener) {
    d.addEventListener("DOMContentLoaded", function () { if (guard.blocked) show(reason); });
    w.addEventListener("error", onResourceError, true);
    w.addEventListener("unhandledrejection", function (event) {
      var text = String((event.reason && event.reason.message) || event.reason || "");
      if (!/dynamically imported module|Importing a module script failed|Failed to fetch|Loading chunk/i.test(text)) return;
      noteFailure("chunk", text.slice(0, 200));
      if (recover()) { guard.blocked = true; return; }
      show("resources");
    });
  }

  timer = w.setTimeout(function () {
    if (!guard.mounted && !guard.blocked) { if (!recover()) show("resources"); }
  }, 30000);
}());
