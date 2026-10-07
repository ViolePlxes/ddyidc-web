import { Badge } from "../../shared/components/Badge";
import { Banner, Button, LayerCard, Link, Surface } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { Route, Routes, useParams } from "react-router-dom";
import type { ProductDetail, ProductSummary } from "../../shared/api/console";
import { PageHeader } from "../../shared/components/PageHeader";
import { PageState } from "../../shared/components/PageState";
import { cycleLabels } from "../../shared/utils/format";

// Public reads never carry a customer session. Purchasing stays on the console.
const consoleOrigin = window.location.hostname === "cloud.ddoidc.com"
  ? "https://console.ddoidc.com" : window.location.origin;

async function readPublic<T>(path: string): Promise<T> {
  const response = await fetch(`${consoleOrigin}/api/v1${path}`, {
    method: "GET", credentials: "omit", headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("产品介绍暂时无法读取，请稍后重试");
  const envelope = await response.json() as { code: number; data: T; message?: string };
  if (envelope.code !== 0) throw new Error(envelope.message || "产品介绍读取失败");
  return envelope.data;
}

function textDescription(product: ProductSummary) {
  for (const source of [product.summary, product.description]) {
    if (!source) continue;
    const document = new DOMParser().parseFromString(source, "text/html");
    document.querySelectorAll("script, style, noscript, iframe, object, template").forEach(node => node.remove());
    const text = document.body.textContent?.replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "暂无产品简介";
}

function Home() {
  return <section className="grid gap-6 py-10">
    <h1 className="text-4xl font-semibold text-kumo-strong md:text-5xl">一处管理您的全球云资源</h1>
    <p className="max-w-xl text-lg text-kumo-subtle">从选购、部署到续费与账单，DDYIDC 提供统一的云服务器管理体验。</p>
    <div className="flex flex-wrap gap-3">
      <Link href="/products"><Button>查看云产品</Button></Link>
      <Link href={`${consoleOrigin}/login`}><Button variant="secondary">进入控制台</Button></Link>
    </div>
  </section>;
}

function Products() {
  const query = useQuery({ queryKey: ["public-product-introductions"], queryFn: async () => {
    const first = await readPublic<{ items: ProductSummary[]; total: number }>("/products?pageSize=100&page=1");
    const items = [...(first.items ?? [])];
    for (let page = 2; items.length < first.total; page += 1) {
      const next = await readPublic<{ items: ProductSummary[] }>(`/products?pageSize=100&page=${page}`);
      if (!next.items?.length) throw new Error("产品目录已更新，请刷新页面");
      items.push(...next.items);
    }
    return items;
  } });
  return <>
    <PageHeader title="云产品" description="了解产品规格与服务，选购和账户操作请前往控制台。" />
    <PageState loading={query.isLoading} error={query.error?.message} empty={query.isSuccess && !query.data.length} emptyTitle="暂无已发布产品">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {query.data?.map(product => <LayerCard key={product.id} className="grid gap-4 p-5">
          <h2 className="text-lg font-semibold text-kumo-strong">{product.name}</h2>
          <p className="text-kumo-subtle">{textDescription(product)}</p>
          <Badge variant="outline">{cycleLabels[product.cycle] || product.cycle}</Badge>
          <p className="text-kumo-strong">¥{product.price.toFixed(2)} 起</p>
          <Link href={`/products/${product.id}`}><Button variant="secondary">查看产品介绍</Button></Link>
        </LayerCard>)}
      </div>
    </PageState>
  </>;
}

function Product() {
  const { id = "" } = useParams();
  const query = useQuery({ queryKey: ["public-product-introduction", id], queryFn: () => readPublic<ProductDetail>(`/products/${encodeURIComponent(id)}`), enabled: Boolean(id) });
  const product = query.data;
  return <>
    <PageHeader title={product?.name || "产品介绍"} description="产品选购与配置在控制台完成。" />
    <PageState loading={query.isLoading} error={query.error?.message} empty={query.isSuccess && !product} emptyTitle="产品不存在或已下架">
      {product && <LayerCard className="grid gap-5 p-6">
		{product.readOnly && <Banner variant="secondary" title={product.infoSource === "upstream" ? "已获取实时商品信息" : "当前显示已保存的商品信息"} description="当前仅开放规格查询，购买暂未开放。" />}
		{product.warning && <Banner variant="alert" title="商品信息提示" description={product.warning} />}
		{Object.entries(product.config ?? {}).length > 0 && <dl className="grid gap-2">{Object.entries(product.config ?? {}).map(([name,value]) => <div key={name} className="flex flex-wrap gap-2"><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}
        <p className="whitespace-pre-wrap text-kumo-subtle">{textDescription(product)}</p>
        <p className="text-lg text-kumo-strong">¥{product.price.toFixed(2)} 起 / {cycleLabels[product.cycle] || product.cycle}</p>
        {product.specs?.length > 0 && <div className="grid gap-3">{product.specs.map(spec => <p key={spec.id} className="text-kumo-subtle">{spec.name} · {spec.vcpu} vCPU · {spec.memory}</p>)}</div>}
        <Link href={`${consoleOrigin}/console/products/${encodeURIComponent(product.id)}`}><Button>前往控制台选购</Button></Link>
      </LayerCard>}
    </PageState>
  </>;
}

export function PublicPortalApp() {
  return <div className="min-h-svh bg-kumo-recessed">
    <Surface className="border-b border-kumo-line">
      <nav className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="text-lg font-semibold">DDYIDC</Link>
        <div className="flex items-center gap-5"><Link href="/products">云产品</Link><Link href={`${consoleOrigin}/login`}>进入控制台</Link></div>
      </nav>
    </Surface>
    <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:p-8">
      <Routes><Route path="/" element={<Home />} /><Route path="/products" element={<Products />} /><Route path="/products/:id" element={<Product />} /><Route path="*" element={<PageHeader title="页面不存在" description="请返回首页查看公开内容。" />} /></Routes>
    </main>
  </div>;
}
