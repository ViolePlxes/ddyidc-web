import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Banner,
  Button,
  Input,
  Textarea,
  Switch,
  Select,
  Tabs,
  LayerCard,
  Link,
  Table,
} from "@cloudflare/kumo";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { getApiMessage } from "../../../shared/api/request";
import { portalAdmin } from "../../../shared/api/portalAdmin";
import {
  emptySEO,
  type PortalDocument,
  type SEO,
  type PortalLink,
  type PortalItem,
  type PortalModule,
} from "../../public-portal/contracts";

const id = () => crypto.randomUUID();
function SEOFields({
  value,
  onChange,
}: {
  value: SEO;
  onChange: (value: SEO) => void;
}) {
  return (
    <div className="grid gap-4">
      <Input
        label="Title 页面标题"
        value={value.title}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
      />
      <Input
        label="Keywords 关键词"
        value={value.keywords}
        onChange={(e) => onChange({ ...value, keywords: e.target.value })}
      />
      <Textarea
        label="Description 页面描述"
        value={value.description}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
      />
      <Input
        label="OG 社交分享图片 URL"
        value={value.image}
        onChange={(e) => onChange({ ...value, image: e.target.value })}
      />
      <Switch
        label="禁止搜索索引此页面"
        checked={value.noIndex}
        onCheckedChange={(noIndex) => onChange({ ...value, noIndex })}
      />
    </div>
  );
}
function LinksEditor({
  value,
  onChange,
  depth = 0,
}: {
  value: PortalLink[];
  onChange: (value: PortalLink[]) => void;
  depth?: number;
}) {
  const patch = (index: number, change: Partial<PortalLink>) =>
    onChange(
      value.map((item, i) => (i === index ? { ...item, ...change } : item)),
    );
  return (
    <div className="grid gap-4">
      {value.map((item, index) => (
        <LayerCard key={index} className="grid gap-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="名称"
              value={item.label}
              onChange={(e) => patch(index, { label: e.target.value })}
            />
            <Input
              label="链接 URL"
              value={item.href}
              onChange={(e) => patch(index, { href: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={index === 0}
              onClick={() => {
                const next = [...value];
                [next[index - 1], next[index]] = [
                  next[index]!,
                  next[index - 1]!,
                ];
                onChange(next);
              }}
            >
              上移
            </Button>
            <Button
              variant="secondary"
              disabled={index === value.length - 1}
              onClick={() => {
                const next = [...value];
                [next[index + 1], next[index]] = [
                  next[index]!,
                  next[index + 1]!,
                ];
                onChange(next);
              }}
            >
              下移
            </Button>
            <Button
              variant="destructive"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              移除链接
            </Button>
          </div>
          {depth < 1 ? (
            <LinksEditor
              depth={depth + 1}
              value={item.children || []}
              onChange={(children) => patch(index, { children })}
            />
          ) : null}
        </LayerCard>
      ))}
      <div>
        <Button
          variant="secondary"
          onClick={() =>
            onChange([
              ...value,
              { label: "新链接", href: "/products", children: [] },
            ])
          }
        >
          {depth ? "添加子链接" : "添加分组或链接"}
        </Button>
      </div>
    </div>
  );
}
function ItemsEditor({
  value,
  onChange,
}: {
  value: PortalItem[];
  onChange: (value: PortalItem[]) => void;
}) {
  return (
    <div className="grid gap-4">
      {value.map((item, index) => {
        const patch = (change: Partial<PortalItem>) =>
          onChange(
            value.map((row, i) => (i === index ? { ...row, ...change } : row)),
          );
        return (
          <LayerCard key={item.id || index} className="grid gap-4 p-4">
            <Input
              label="条目标题"
              value={item.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
            <Textarea
              label="条目文字"
              value={item.text}
              onChange={(e) => patch({ text: e.target.value })}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="条目图片 URL"
                value={item.image}
                onChange={(e) => patch({ image: e.target.value })}
              />
              <Input
                label="图片替代文字"
                value={item.alt}
                onChange={(e) => patch({ alt: e.target.value })}
              />
              <Input
                label="条目链接"
                value={item.href}
                onChange={(e) => patch({ href: e.target.value })}
              />
              <Input
                label="链接文案"
                value={item.label}
                onChange={(e) => patch({ label: e.target.value })}
              />
              <Input
                label="分类"
                value={item.category}
                onChange={(e) => patch({ category: e.target.value })}
              />
            </div>
            {item.image ? (
              <img
                src={item.image}
                alt={item.alt}
                className="max-h-40 max-w-full object-contain"
              />
            ) : null}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                disabled={!index}
                onClick={() => {
                  const next = [...value];
                  [next[index - 1], next[index]] = [
                    next[index]!,
                    next[index - 1]!,
                  ];
                  onChange(next);
                }}
              >
                上移条目
              </Button>
              <Button
                variant="destructive"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                移除条目
              </Button>
            </div>
          </LayerCard>
        );
      })}
      <div>
        <Button
          variant="secondary"
          onClick={() =>
            onChange([
              ...value,
              {
                id: id(),
                title: "新条目",
                text: "",
                image: "",
                alt: "",
                href: "",
                label: "了解更多",
                category: "",
              },
            ])
          }
        >
          添加条目
        </Button>
      </div>
    </div>
  );
}
function ModuleEditor({
  value,
  onChange,
}: {
  value: PortalModule;
  onChange: (value: PortalModule) => void;
}) {
  return (
    <div className="grid gap-4">
      <Input
        label="模块标题"
        value={value.title}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
      />
      <Input
        label="标题上方短语"
        value={value.eyebrow}
        onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
      />
      <Textarea
        label="模块文字"
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="模块图片 URL"
          value={value.image}
          onChange={(e) => onChange({ ...value, image: e.target.value })}
        />
        <Input
          label="图片替代文字"
          value={value.alt}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
        />
        <Input
          label="模块链接"
          value={value.href}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
        />
        <Input
          label="按钮文案"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
      </div>
      {value.image ? (
        <img
          src={value.image}
          alt={value.alt}
          className="max-h-48 max-w-full object-contain"
        />
      ) : null}
      {value.type === "product_solutions" ? (
        <>
          <Input
            label="展示产品数量（0 表示默认 6）"
            type="number"
            min={0}
            max={100}
            value={value.limit || 0}
            onChange={(e) =>
              onChange({ ...value, limit: Number(e.target.value) })
            }
          />
          <Input
            label="指定产品 ID，逗号分隔，留空按目录顺序"
            value={(value.productIds || []).join(",")}
            onChange={(e) =>
              onChange({
                ...value,
                productIds: e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
          />
        </>
      ) : null}
      {value.type === "banner_carousel" ? (
        <>
          <Input
            label="自动播放间隔（秒，默认 6）"
            type="number"
            min={3}
            max={60}
            value={value.interval || 6}
            onChange={(e) =>
              onChange({ ...value, interval: Number(e.target.value) })
            }
          />
          <Switch
            label="默认自动播放"
            checked={value.autoPlay}
            onCheckedChange={(autoPlay) => onChange({ ...value, autoPlay })}
          />
        </>
      ) : null}
      <ItemsEditor
        value={value.items || []}
        onChange={(items) => onChange({ ...value, items })}
      />
    </div>
  );
}

export function PortalContent() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "portal", "config"],
    queryFn: portalAdmin.config,
  });
  const definitions = useQuery({
    queryKey: ["admin", "portal", "definitions"],
    queryFn: portalAdmin.definitions,
  });
  const products = useQuery({
    queryKey: ["admin", "portal", "products"],
    queryFn: portalAdmin.products,
  });
  const revisions = useQuery({
    queryKey: ["admin", "portal", "revisions"],
    queryFn: portalAdmin.revisions,
  });
  const media = useQuery({
    queryKey: ["admin", "portal", "media"],
    queryFn: portalAdmin.media,
  });
  const [form, setForm] = useState<PortalDocument | null>(null);
  const [tab, setTab] = useState("modules");
  const [pageID, setPageID] = useState("home");
  const [moduleType, setModuleType] = useState("feature_sections");
  const [productID, setProductID] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState("");
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (query.data) setForm(structuredClone(query.data));
  }, [query.data]);
  const saved = (d: PortalDocument) => {
    setForm(d);
    client.setQueryData(["admin", "portal", "config"], d);
    void client.invalidateQueries({
      queryKey: ["admin", "portal", "revisions"],
    });
    setNotice("已保存，公开内容已按所选方式更新");
  };
  const save = useMutation({
    mutationFn: (publish: boolean) => {
      if (!form) throw new Error("配置未加载");
      return portalAdmin.save(form, publish);
    },
    onSuccess: saved,
    onError: (e) => setNotice(getApiMessage(e)),
  });
  const rollback = useMutation({
    mutationFn: portalAdmin.rollback,
    onSuccess: saved,
    onError: (e) => setNotice(getApiMessage(e)),
  });
  const upload = useMutation({
    mutationFn: portalAdmin.upload,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "portal", "media"] });
      setNotice("图片已上传，可复制 URL 到模块图片字段");
    },
    onError: (e) => setNotice(getApiMessage(e)),
  });
  const previewMutation = useMutation({
    mutationFn: () => {
      if (!form) throw new Error("配置未加载");
      return portalAdmin.preview(
        form,
        form.pages.find((p) => p.id === pageID)?.path || "/",
      );
    },
    onSuccess: setPreview,
    onError: (e) => setNotice(getApiMessage(e)),
  });
  if (!form)
    return (
      <PageState
        loading={query.isLoading}
        error={query.error ? getApiMessage(query.error) : null}
      >
        {null}
      </PageState>
    );
  const page = form.pages.find((p) => p.id === pageID) || form.pages[0]!;
  const updateSite = (change: Partial<PortalDocument["site"]>) =>
    setForm({ ...form, site: { ...form.site, ...change } });
  const updatePage = (change: Partial<typeof page>) =>
    setForm({
      ...form,
      pages: form.pages.map((p) =>
        p.id === page.id ? { ...p, ...change } : p,
      ),
    });
  const reorder = (index: number, offset: number) => {
    const next = [...page.modules].sort((a, b) => a.sort - b.sort);
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    updatePage({ modules: next.map((m, i) => ({ ...m, sort: i * 10 })) });
  };
  const actionBusy = save.isPending || rollback.isPending;
  return (
    <>
      <PageHeader
        title="门户首页配置"
        description={`配置版本 ${form.revision} · 保存并生效会自动生成静态页面，无需重新发布程序。`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={actionBusy}
              onClick={() => save.mutate(false)}
            >
              保存草稿
            </Button>
            <Button
              loading={save.isPending}
              disabled={rollback.isPending}
              onClick={() => save.mutate(true)}
            >
              保存并生效
            </Button>
          </div>
        }
      />
      {notice ? <Banner title="配置提示" description={notice} /> : null}
      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "modules", label: "首页与页面" },
          { value: "site", label: "站点与主题" },
          { value: "navigation", label: "导航与页脚" },
          { value: "seo", label: "SEO 与抓取" },
          { value: "media", label: "媒体库" },
          { value: "history", label: "发布记录" },
        ]}
      />
      {tab === "modules" || tab === "seo" ? (
        <LayerCard className="grid gap-4 p-5">
          <Select
            label="编辑页面"
            value={page.id}
            onValueChange={(v) => setPageID(String(v))}
            items={Object.fromEntries(
              form.pages.map((p) => [p.id, `${p.title} · ${p.path}`]),
            )}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="配置产品详情 SEO"
              value={productID}
              onValueChange={(v) => setProductID(String(v))}
              items={Object.fromEntries(
                (products.data || []).map((p) => [p.id, p.name]),
              )}
            />
            <Button
              variant="secondary"
              disabled={!productID}
              onClick={() => {
                const existing = form.pages.find(
                  (p) => p.path === `/products/${productID}`,
                );
                if (existing) {
                  setPageID(existing.id);
                  return;
                }
                const p = products.data?.find((p) => p.id === productID);
                if (!p) return;
                const newID = id();
                setForm({
                  ...form,
                  pages: [
                    ...form.pages,
                    {
                      id: newID,
                      path: `/products/${p.id}`,
                      title: p.name,
                      kind: "product",
                      enabled: true,
                      seo: emptySEO(),
                      modules: [],
                      updatedAt: "",
                    },
                  ],
                });
                setPageID(newID);
              }}
            >
              编辑此产品页面
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                const newID = id();
                setForm({
                  ...form,
                  pages: [
                    ...form.pages,
                    {
                      id: newID,
                      path: `/pages/${newID}`,
                      title: "新内容页",
                      kind: "page",
                      enabled: false,
                      seo: emptySEO(),
                      modules: [],
                      updatedAt: "",
                    },
                  ],
                });
                setPageID(newID);
              }}
            >
              添加内容页
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const newID = id();
                setForm({
                  ...form,
                  pages: [
                    ...form.pages,
                    {
                      id: newID,
                      path: `/news/${newID}`,
                      title: "新公告",
                      kind: "article",
                      enabled: false,
                      seo: emptySEO(),
                      modules: [],
                      updatedAt: "",
                    },
                  ],
                });
                setPageID(newID);
              }}
            >
              添加新闻公告
            </Button>
            <Button
              variant="secondary"
              loading={previewMutation.isPending}
              onClick={() => previewMutation.mutate()}
            >
              预览当前页面
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="页面名称"
              value={page.title}
              onChange={(e) => updatePage({ title: e.target.value })}
            />
            <Input
              label="公开路径"
              value={page.path}
              disabled={
                page.id === "home" ||
                page.id === "products" ||
                page.kind === "product"
              }
              onChange={(e) => updatePage({ path: e.target.value })}
            />
          </div>
          <Switch
            label="发布此页面"
            disabled={page.path === "/" || page.kind === "product"}
            checked={page.enabled}
            onCheckedChange={(enabled) => updatePage({ enabled })}
          />
          <SEOFields value={page.seo} onChange={(seo) => updatePage({ seo })} />
        </LayerCard>
      ) : null}
      {tab === "modules" ? (
        <div className="grid gap-5">
          {[...page.modules]
            .sort((a, b) => a.sort - b.sort)
            .map((m, index) => (
              <LayerCard key={m.id} className="grid gap-5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">
                    {definitions.data?.modules.find((d) => d.type === m.type)
                      ?.label || m.type}
                  </h2>
                  <Switch
                    label="模块开启"
                    checked={m.enabled}
                    onCheckedChange={(enabled) =>
                      updatePage({
                        modules: page.modules.map((row) =>
                          row.id === m.id ? { ...row, enabled } : row,
                        ),
                      })
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    disabled={index === 0}
                    onClick={() => reorder(index, -1)}
                  >
                    上移模块
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={index === page.modules.length - 1}
                    onClick={() => reorder(index, 1)}
                  >
                    下移模块
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      updatePage({
                        modules: page.modules.filter((row) => row.id !== m.id),
                      })
                    }
                  >
                    移除模块
                  </Button>
                </div>
                <ModuleEditor
                  value={m}
                  onChange={(value) =>
                    updatePage({
                      modules: page.modules.map((row) =>
                        row.id === m.id ? value : row,
                      ),
                    })
                  }
                />
              </LayerCard>
            ))}
          <LayerCard className="grid gap-4 p-5">
            <Select
              label="新模块类型"
              value={moduleType}
              onValueChange={(v) => setModuleType(String(v))}
              items={Object.fromEntries(
                (definitions.data?.modules || []).map((d) => [d.type, d.label]),
              )}
            />
            <Button
              onClick={() =>
                updatePage({
                  modules: [
                    ...page.modules,
                    {
                      id: id(),
                      type: moduleType,
                      enabled: true,
                      limit: 6,
                      productIds: [],
                      interval: 6,
                      autoPlay: true,
                      sort:
                        Math.max(0, ...page.modules.map((m) => m.sort)) + 10,
                      title: "新模块",
                      eyebrow: "",
                      text: "",
                      image: "",
                      alt: "",
                      href: "",
                      label: "了解更多",
                      items: [],
                    },
                  ],
                })
              }
            >
              添加独立模块
            </Button>
          </LayerCard>
        </div>
      ) : null}
      {tab === "site" ? (
        <LayerCard className="grid gap-5 p-5">
          <Input
            label="平台品牌"
            value={form.site.brand}
            onChange={(e) => updateSite({ brand: e.target.value })}
          />
          <Input
            label="公开站点 HTTPS 地址"
            value={form.site.origin}
            onChange={(e) => updateSite({ origin: e.target.value })}
          />
          <Input
            label="控制台 HTTPS 地址"
            value={form.site.consoleOrigin}
            onChange={(e) => updateSite({ consoleOrigin: e.target.value })}
          />
          <Input
            label="Logo URL"
            value={form.site.logo}
            onChange={(e) => updateSite({ logo: e.target.value })}
          />
          <Input
            label="版权信息"
            value={form.site.copyright}
            onChange={(e) => updateSite({ copyright: e.target.value })}
          />
          <Input
            label="备案文案"
            value={form.site.filing}
            onChange={(e) => updateSite({ filing: e.target.value })}
          />
          <Input
            label="备案链接"
            value={form.site.filingUrl}
            onChange={(e) => updateSite({ filingUrl: e.target.value })}
          />
          <Select
            label="已安装主题"
            value={form.site.theme}
            onValueChange={(v) => updateSite({ theme: String(v) })}
            items={Object.fromEntries(
              (definitions.data?.themes || []).map((t) => [t.id, t.label]),
            )}
          />
          <Switch
            label="门户总开关"
            checked={form.site.enabled}
            onCheckedChange={(enabled) => updateSite({ enabled })}
          />
          <p className="text-kumo-subtle">
            切换已安装主题会重新生成公开页面；新增主题代码需正常开发与发布。
          </p>
        </LayerCard>
      ) : null}
      {tab === "navigation" ? (
        <div className="grid gap-5">
          <LayerCard className="grid gap-5 p-5">
            <Switch
              label="显示顶部导航"
              checked={form.site.headerEnabled}
              onCheckedChange={(headerEnabled) => updateSite({ headerEnabled })}
            />
            <LinksEditor
              value={form.site.navigation}
              onChange={(navigation) => updateSite({ navigation })}
            />
          </LayerCard>
          <LayerCard className="grid gap-5 p-5">
            <Switch
              label="显示页脚"
              checked={form.site.footerEnabled}
              onCheckedChange={(footerEnabled) => updateSite({ footerEnabled })}
            />
            <LinksEditor
              value={form.site.footer}
              onChange={(footer) => updateSite({ footer })}
            />
          </LayerCard>
        </div>
      ) : null}
      {tab === "seo" ? (
        <LayerCard className="grid gap-5 p-5">
          <h2 className="text-lg font-semibold">站点默认 SEO</h2>
          <SEOFields
            value={form.site.seo}
            onChange={(seo) => updateSite({ seo })}
          />
          <Switch
            label="生成 llms.txt 辅助内容索引"
            checked={form.site.llms}
            onCheckedChange={(llms) => updateSite({ llms })}
          />
          <p className="text-kumo-subtle">
            sitemap.xml 和 robots.txt 随内容自动发布。公开页面允许
            Google、Bing、百度以及
            GPTBot、OAI-SearchBot、ClaudeBot、Claude-SearchBot、Google-Extended
            抓取；私人页面仍受权限保护。
          </p>
          <div className="flex gap-4">
            <Link href={`${form.site.origin}/sitemap.xml`} target="_blank">
              查看 sitemap
            </Link>
            <Link href={`${form.site.origin}/robots.txt`} target="_blank">
              查看 robots
            </Link>
          </div>
        </LayerCard>
      ) : null}
      {tab === "media" ? (
        <LayerCard className="grid gap-5 p-5">
          <Input
            label="上传 PNG、JPEG 或 GIF，最大 8 MB"
            type="file"
            accept="image/png,image/jpeg,image/gif"
            disabled={upload.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
            }}
          />
          {media.data?.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 border-b border-kumo-line pb-5"
            >
              <img
                src={item.path}
                alt={item.name}
                className="max-h-32 max-w-full object-contain"
              />
              <p>{item.name}</p>
              <Input label="图片 URL" readOnly value={item.path} />
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(item.path);
                  setNotice("已复制图片 URL");
                }}
              >
                复制 URL
              </Button>
            </div>
          ))}
        </LayerCard>
      ) : null}
      {tab === "history" ? (
        <LayerCard className="p-5">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>版本</Table.Head>
                <Table.Head>操作</Table.Head>
                <Table.Head>时间</Table.Head>
                <Table.Head>操作人</Table.Head>
                <Table.Head>恢复</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {revisions.data?.map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell>{row.revision}</Table.Cell>
                  <Table.Cell>
                    {row.action === "publish"
                      ? "发布"
                      : row.action === "draft"
                        ? "保存草稿"
                        : row.action === "rollback"
                          ? "回滚"
                          : "首次发布"}
                  </Table.Cell>
                  <Table.Cell>{row.createdAt}</Table.Cell>
                  <Table.Cell>{row.actorId}</Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="secondary"
                      disabled={actionBusy}
                      onClick={() => rollback.mutate(row.id)}
                    >
                      恢复并发布
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      ) : null}
      {preview ? (
        <LayerCard className="grid gap-4 p-5">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setMobile((v) => !v)}>
              {mobile ? "桌面预览" : "移动预览"}
            </Button>
            <Button variant="ghost" onClick={() => setPreview("")}>
              关闭预览
            </Button>
          </div>
          <iframe
            title="未发布页面预览"
            sandbox=""
            srcDoc={preview}
            className={`${mobile ? "max-w-sm" : "w-full"} h-[40rem] w-full border border-kumo-line`}
          />
          <p className="text-sm text-kumo-subtle">
            草稿预览禁止索引，未改变公开内容；此处展示无需 JavaScript
            的完整页面。
          </p>
        </LayerCard>
      ) : null}
    </>
  );
}
