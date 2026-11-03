/* ES5 deliberately: this recovery surface must run before the application. */
(function () {
  var w = window, d = document, timer, panel, reason = "";
  var guard = { blocked: false, mounted: false };
  w.__ddyBrowserGuard = guard;
  function message(kind) {
    if (kind === "unsupported") return "当前浏览器内核不支持此页面，请升级浏览器或使用最新版 Chrome、Edge、Firefox、Safari 打开。";
    if (kind === "styles") return "页面样式未能正常加载，请检查网络连接后重新加载。";
    return "页面资源加载失败或耗时过长，请检查网络连接后重新加载。";
  }
  function show(kind) {
    reason = kind; guard.blocked = true;
    if (!d.body) return;
    var root = d.getElementById("root");
    if (root) { root.style.display = "none"; root.setAttribute("aria-hidden", "true"); }
    if (panel) return;
    panel = d.createElement("main"); panel.setAttribute("role", "alert");
    panel.style.cssText = "margin:2em auto;padding:1em;max-width:36em;font-family:system-ui,sans-serif;color:CanvasText;background:Canvas;overflow-wrap:break-word";
    var title = d.createElement("h1"); title.textContent = "页面暂时无法正常显示";
    var text = d.createElement("p"); text.textContent = message(kind);
    var button = d.createElement("button"); button.type = "button"; button.textContent = "重新加载";
    button.onclick = function () { button.disabled = true; w.location.reload(); };
    panel.appendChild(title); panel.appendChild(text); panel.appendChild(button); d.body.appendChild(panel);
  }
  guard.checkStyles = function () {
    if (guard.blocked) return false;
    var rootStyle = w.getComputedStyle(d.documentElement);
    if (rootStyle.getPropertyValue("--ddy-styles-ready").replace(/\s/g, "") !== "1") { show("styles"); return false; }
    var probe = d.createElement("div"); probe.className = "fixed p-4 rounded-md"; probe.style.visibility = "hidden"; d.body.appendChild(probe);
    var style = w.getComputedStyle(probe);
    var okay = style.position === "fixed" && parseFloat(style.paddingTop) > 0 && parseFloat(style.borderTopLeftRadius) > 0;
    d.body.removeChild(probe);
    if (!okay) show("styles");
    return okay;
  };
  guard.ready = function () { guard.mounted = true; w.clearTimeout(timer); };
  var css = w.CSS;
  // Hard-block only when the runtime itself is missing. Modern CSS colours
  // (oklch/color-mix) and :has are optional: older Chromium builds render a
  // degraded but usable interface, which beats a dead login page.
  var supported = !!(css && css.supports && w.Promise && w.fetch && w.AbortController && w.ResizeObserver);
  if (!supported) { reason = "unsupported"; guard.blocked = true; }
  d.addEventListener("DOMContentLoaded", function () { if (guard.blocked) show(reason); });
  w.addEventListener("error", function (event) {
    var target = event.target;
    if (target && ((target.tagName === "LINK" && target.rel === "stylesheet") || (target.tagName === "SCRIPT" && target.type === "module"))) show(target.tagName === "LINK" ? "styles" : "resources");
  }, true);
  timer = w.setTimeout(function () { if (!guard.mounted && !guard.blocked) show("resources"); }, 30000);
}());
