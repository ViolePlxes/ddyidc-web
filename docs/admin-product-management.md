# 后台商品管理

后台 `/products` 是商品与分组的统一入口，旧 `/products/groups` replace跳转。已有导航节点在前端归并为“商品管理”，部署不迁移导航数据库。

## 页面

左侧使用 Kumo Sidebar 两级分组目录，支持搜索、展开收起与选中态；右侧编辑选中分组，并显示“分组商品”。商品区域严格沿用 LayerCard Filter Toolbar with Small Tabs：Secondary标题、Primary内小尺寸搜索与分段标签、轻量三列列表（商品/售价/操作）、细分隔线及显示数量。

标签为“全部/上架中/已下架”，按名称或ID搜索。商品名称前保留拖拽手柄；筛选时禁用拖拽及上下移动，避免以部分目录覆盖全组顺序。规格编辑在右侧原位展开，不使用弹窗。移动商品和删除确认复用原有Dialog。

分组支持名称、图标、显示状态、排序和跨父移动。未保存草稿阻止切换，取消恢复原值；保存期间锁定切换及重复保存，规格刷新不覆盖草稿。手机侧栏上下排列，列表在自身容器内滚动。

## 商品上下架

商品行使用可点击Dot状态“上架中/已下架”。通过完整分页读取供应商映射并精确匹配productId，复用 `PUT /admin/v1/upstream/products/:id/hidden`；该接口事务同步映射与本地商品hidden。不发供应商开关机或上下架请求。没有映射、多重映射、目录读取不完整时显示错误；status不可售时不能通过hidden开关绕过限制。成功后刷新目录及公开缓存。

## 代码与部署

代码：`src/apps/admin/views/ProductGroups.tsx`、`GroupProducts.tsx`、`Products.tsx`、`src/apps/admin/AdminApp.tsx`、`src/shared/hooks/useNavigation.ts`、`src/shared/api/adminProducts.ts`。

本次仅发布前端v0.1.126，无后端修改、数据库迁移或测试数据导入。通过隔离VM依赖安装、TypeScript、构建、发布包检查及真实浏览器验证后，按平台在线更新流程安装；部署结果与完整SHA见deploy-notes发布记录。

参考：[Kumo Sidebar](https://kumo-ui.com/components/sidebar/) · [Filter Toolbar with Small Tabs](https://kumo-ui.com/components/layer-card/#filter-toolbar-with-small-tabs)。
