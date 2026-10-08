# 浏览器兼容与资源恢复

## 启动契约

门户、登录、用户中心、后台和销售端的 HTML 在模块脚本之前加载 ES5 `public/browser-guard.js`。Vite 将它输出为带内容哈希的 `/assets/browser-guard-<hash>.js`，进入现有静态资源保留机制，避免在线更新或回滚覆盖旧页面依赖。

检测采用功能判断，不按 User-Agent 猜测：Promise、fetch、AbortController、ResizeObserver、CSS.registerProperty、oklch、color-mix、:has。Tailwind 4 官方支持基线为 Chrome 111、Safari 16.4、Firefox 128；对应 Edge 需使用现代内核。详见 [官方兼容说明](https://tailwindcss.com/docs/compatibility)。低于基线的浏览器显示独立恢复说明，并不承诺旧内核能完整运行 Kumo。

`src/styles/tailwind.css` 提供 `--ddy-styles-ready: 1`；挂载前额外检查实际 utility 的定位、内边距和圆角。CSS 缺失或不生效时不挂载业务界面，防止隐藏的弹窗和表单变成混排纯文本。模块加载失败、启动超过 30 秒时显示同一恢复面板。面板使用原生元素及系统颜色，不依赖已经失败的应用样式。

`src/entry/createEntry.tsx` 在 React 提交后解除启动计时器。独立 public 入口也检查样式；全部 HTML 提供 JavaScript 关闭说明。恢复按钮由用户点击，禁止自动刷新循环。现有路由错误边界继续负责挂载后的异常。检测不会向外发送行为数据，不改变登录、订单、余额、实例操作和权限。

入口守卫本身仍依赖同源静态文件能够送达；内容哈希、发布资源保留和资源完整性验收保护这一依赖。完全断网时浏览器自己的网络错误不属于应用能恢复的范围。

## 更新并发与回滚

HTML 不缓存，哈希资源长期缓存；在线更新保留已有 assets，使用原子目录交换。不要原地删除 live 目录，或回滚时丢弃新版本已被用户打开的资源。后端已有更新全局锁限制同时安装；本次前端改动不修改后端发布机制。

本次隔离测试以生产使用的 renameat2 原子交换原语切换前端静态目录，并在回滚前合并双方哈希资源。719 次并发页面与资源请求没有失败；打开的旧版页面在更新后仍可切换路由，打开的新版页面在回滚后也可继续切换。生产发布还须通过既有在线更新任务及实际资源探测，不用这项隔离原语测试代替生产任务结果。

## 验收与发布门禁

VM 内执行：

```sh
node scripts/check-release.mjs
node scripts/test-browser-guard.mjs
npm ci --ignore-scripts --no-audit --no-fund
npx tsc -b
npm run build
node scripts/check-release.mjs --artifact
```

GitHub Release isolation gate 纳入守卫回归，覆盖正常启动、旧能力模拟、样式标记缺失、utility 失效、CSS/模块请求失败、启动超时、单次人工重载；图片失败不阻断整页。

2026-10-09 隔离验收：IAB Chromium 的 38 个用户导航和 60 个后台导航分别在 320×568、1440×900 下检查，共 196 次导航。后台门户编辑页受 VM 当前权限限制返回明确 403，不记为业务通过；其余页面未发现页面级横向溢出或无样式混排。实例旧链接、续费/重装/重置密码/救援的窄屏弹窗经只读展开和关闭检查，未提交机器操作。实例数据和失败响应仅在独立测试 HTTP 进程中生成，没有数据库写入，也不进入 Git 或发布包。

Windows Edge 核对首页、登录、注册、密码找回、协议页和真实 CSS 故障恢复。无样式截图的客户内核未知，本次不能把原因认定为旧内核，也不能声称已覆盖真实 Safari、Firefox、所有实体手机。现有资源响应、兼容能力不足和更新期间版本混用是分别核查的路径；样式丢失时现在有明确恢复反馈。

脱敏证据保存在 `D:/ddoidc/deploy-notes/browser-layout-*-20261009.*`；生产最终版本、任务与验收结果见本次交付报告和 Obsidian「前端兼容与资源恢复」节点。
