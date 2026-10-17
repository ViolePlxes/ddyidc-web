---
node_type: module
status: 本地候选实现与隔离测试通过，未发布
updated: 2026-10-17
---

# 共享富文本编辑器

用户授权采用Tiptap共享编辑器并接入工单；随后要求后台三分区满高布局、右侧资料合成一张卡片。当前只在本地VM开发与演示，不推送、不上线。

## 架构与边界

- 引擎：Tiptap开源npm依赖，锁定 @tiptap/react、pm、starter-kit、extension-image 3.32.0；工具栏、链接弹窗与消息链接采用Kumo。未接入Pro、云存储或协作服务。
- shared/components/editor/RichTextEditor.tsx：格式工具栏、链接校验、图片粘贴/拖入/选择、上传状态、编辑禁用、撤销重做；通过features、label、maxLength、uploadImages、onChange等属性复用，不直接依赖工单API。
- editor/document.ts：version=1的Tiptap JSON协议；去掉图片src、链接target等不应持久化的属性，纯文本摘要独立生成。
- editor/RichContent.tsx：按白名单映射为React节点，不使用dangerouslySetInnerHTML；未知节点不执行；旧纯文本按文字显示。
- tickets/TicketReplyEditor.tsx：工单图片上传与最多5附件约束，使用现有user/admin upload；本地编辑图片使用临时Object URL，模块回调接入通用编辑器。
- tickets/TicketRichContent.tsx：只按同条回复附件ID解析图片，走对应身份HTTP客户端取Blob后显示，不让JSON指定外部图片URL；清理Object URL和取消失效请求。
- 共享编辑器与展示器通过React.lazy按需加载。创建工单、用户回复、后台回复均已接入；预设回复仍可作为纯文本写入。

## 后端与存储

后端 internal/shared/richtext/document.go 是独立协议验证器：版本、节点/标记/属性白名单、结构关系、HTTP(S)链接、资源上限（64KiB JSON、2000节点、16层、20000字符、5图片）；纯文本由服务端重新生成，不能相信客户端摘要。
创建和回复输入增加richContent，回复输出返回richContent；ticket.ticket_reply新增可空rich_content JSON列，原content字段保留纯文本。历史行NULL无需重写。工单主记录content保持纯文本，创建正文富格式由首条reply存储，避免重复消息。

service先校验结构及声明附件引用；repository在原写事务中完成upload归属/状态绑定后，基于数据库规范化MIME再校验图片，失败连附件绑定、回复、工单状态一起回滚。只允许PNG/JPEG/GIF/WebP，不支持SVG或base64/外部图片地址。既有账号/工单/关闭状态/附件下载鉴权仍生效。

增量迁移 internal/shared/migrations/sql/048_ticket_rich_content.sql，重复执行无损；校验和已登记tools/architecture/schema-checksums.json。EnsureSchema仅在既有迁移模式允许时补列，运行身份不授予DDL。后续发布必须先备份、平台受控迁移/后端、再前端；不改旧迁移校验和，回滚保留新增列和富文本数据。当前未对VM业务库或生产执行此迁移，仅在临时隔离MySQL验证。

## 后台布局

TicketViewport.tsx测量可用浏览器高度（考虑主区顶部与底部padding），桌面满高；左上消息区、左下回复区、右侧资料各自滚动。ReplyComposer发送按钮独立放在左下区域底部，附加选项滚动不会遮住按钮。
TicketCustomerSidebar.tsx只有一个LayerCard，客户/产品/工单信息用section与Kumo分隔线组织；滚动放在卡片内部，边框所在外层留1px空间，防止Kumo ring被overflow裁掉。移动端保留资料展开入口。

## 检测证据与限制

- VM：依赖npm install/ci，TypeScript与生产构建；后端go build ./...、go vet ./...、go test ./...成功。外部条件测试的跳过不算通过。
- TestValidate/TestsLimits：未知版本、未知字段、脚本节点、危险链接、无归属图片、外部src、空内容、非法嵌套、超长文本与过深文档拒绝；纯文本兼容。
- 临时Unix socket隔离MySQL TestOwnedUploadsMySQL真实执行通过，新增子用例验证048迁移重复执行、JSON落库、规范MIME、失败附件状态回到ready、失败回复不落库、工单状态不变、旧纯文本可继续写入。
- 浏览器：加粗消息、图片选择/发送/授权Blob展示、发送后清空、危险链接按钮禁用；桌面1440×900与默认1613×1252整体高度等于视口，发送按钮在区域底部；390手机无横向溢出。粘贴/拖入已实现，但本轮未分别做真实剪贴板与拖动文件验收。
- 独立预览 http://127.0.0.1:13101/ticket-chat-preview.html 使用虚构数据与内存adapter，实际React页面。真实运行后端服务未切换；完整HTTP创建/回复/重载和分角色权限仍需后续启动候选服务验收，不能以模拟预览替代这些项。
- 证据 D:/ddoidc/deploy-notes/tiptap-isolated.log、tiptap-server-full-test.log、tiptap-final-web-build.log、tiptap-npm-ci.log及Tiptap工单接入-本地验收-20261017.md。

## 版本与关联

前端 D:/ddoidc/work/cdn-production-web-20261011，feature/ticket-chat-local-20261017，基线v0.1.165 / 254892ffea4eb26f32b3aadb9638b6d12f7fb442；后端 cdn-production-server-20261011，feature/ticket-richtext-local-20261017，基线v0.1.133 / 8d76ecb1138bf47ebcc80da9b4ca63d4c7d518b2。均未新增提交/tag、未推送或上线。

关联 [[工单与附件]]（首个业务适配）、[[前端开发规范]]（Kumo与共享边界）、[[认证权限与安全请求]]（图片身份隔离）、[[工单聊天界面与后台客户侧栏改造任务书]]（完整后续验收）、[[20261017-Tiptap工单接入与满高布局踩坑]]。


### 2026-10-17 回复区视觉调整（本地）
- 回复外框所在父区保留1px空间，不再以overflow-y-auto包住外框；内部使用flex/min-h-0让Tiptap填充剩余高度，移除回复块外层滚动条。长正文仍可在编辑内容区滚动，但隐藏可见滚动条，避免截断输入或限制编辑。
- 删除可见“回复内容”标题，保留编辑区aria-label；创建工单的问题描述标签不变。通用编辑器新增fill/hideLabel展示属性。
- 后台取消随公开回复附加内部备注的输入、状态和note提交；既有独立内部备注标签及历史备注保留，后端API不删除。
- AttachmentPicker新增compact展示；附件操作与发送位于底部右侧，预设回复保留在左侧。接口、附件限制、归属和上传逻辑不变。
- 默认桌面1613×1252 document高度=1252，编辑区随左下404px区域填充；截图验证边框连续、标题/附加备注消失、附件右对齐。仅本地候选，未提交/发布。


## 2026-10-18 发布候选补充
- 用户消息页保持 18rem 紧凑回复区，上方会话独立伸缩滚动；后台左上对话、左下编辑、右侧单资料卡，附件在右，催单/关闭与返回同一操作栏。
- useTicketDraft.ts 按 user/admin 与工单ID分隔内存草稿；认证身份变化清空，不写localStorage。后台标签切换保留编辑器与撤销历史；未发送图片预览仅为内存Object URL，移除附件或退出会话身份时清理。
- 真实HTTP验收发现公开随机ID不能用于回复排序与增量比较：049_ticket_reply_order.sql 新增内部 reply_seq，自增且唯一，历史按 create_time/id 确定顺序；公开ID与 since=回复ID 的接口不变，由服务端查对应序号。LastReplyID与未读统计同步改为序号。迁移短暂锁定工单回复表，已有程序新增行由数据库分配序号，历史消息保留；运行账号不增加DDL权限。
- 048 继续增加可空rich_content，049为单独新迁移，不修改已应用048校验和。生产发布需先核验备份、受控执行两项增量迁移，再用在线更新安装后端及前端；回滚保留新增列。
- 关联 共享富文本编辑器、工单与附件、安装与在线更新、20261017-Tiptap工单接入与满高布局踩坑。当前仍为候选，最终版本与证据在上线完成后补记。
