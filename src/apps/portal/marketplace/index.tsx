import {
  Badge,
  Banner,
  Button,
  Input,
  LayerCard,
  Select,
} from "@cloudflare/kumo";
import {
  HeartIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { marketplaceApi, type Listing } from "../../../shared/api/marketplace";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { marketplaceFee } from "../../../shared/components/MarketplaceStatusBadge";
import { useAuthStore } from "../../../shared/stores/auth";

const money = (value: string) => `¥${Number(value || 0).toFixed(2)}`;
const statusText: Record<string, string> = {
  on_sale: "在售",
  pending: "审核中",
  locked: "交易锁定",
  sold: "已售出",
  off_shelf: "已下架",
  expired: "已过期",
};

function ListingCard({ row, refundEnabled, feeRate }: { row: Listing; refundEnabled?: boolean; feeRate?: string }) {
  const belowRenewal = Number(row.originalRenewalPrice) > 0 && Number(row.price) < Number(row.originalRenewalPrice);
  const summary = Object.values(row.configSnapshot ?? {}).filter((value) => typeof value === "string" || typeof value === "number").slice(0, 3).join(" · ");
  return (
    <LayerCard className="flex min-h-72 flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center bg-kumo-control text-kumo-brand">
          <StorefrontIcon />
        </span>
        <div className="flex flex-wrap gap-2">
          {row.isRecommended ? <Badge variant="success">推荐</Badge> : null}
          {belowRenewal ? <Badge variant="success">低于续费价</Badge> : null}
          {refundEnabled ? <Badge variant="outline">可退款</Badge> : null}
          {Number(feeRate ?? 0) <= 2 ? <Badge variant="outline">低手续费</Badge> : null}
          <Badge variant="outline">
            {statusText[row.status] ?? row.status}
          </Badge>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-kumo-strong">
          {row.productName}
        </h2>
        <p className="text-sm text-kumo-subtle">
          {row.region || "区域不限"} · 剩余 {row.remainingDays} 天
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 bg-kumo-control p-4">
        <div>
          <span className="text-xs text-kumo-subtle">转让价</span>
          <p className="text-xl font-semibold text-kumo-strong">
            {money(row.price)}
          </p>
        </div>
        <div>
          <span className="text-xs text-kumo-subtle">原续费价</span>
          <p className="text-kumo-default">{money(row.originalRenewalPrice)}</p>
        </div>
      </div>
      <p className="line-clamp-2 text-sm text-kumo-subtle">
        {summary || row.sellerNote || "卖家暂未填写补充说明"}
      </p>
      <div className="mt-auto flex items-center justify-between border-t border-kumo-line pt-4">
        <span className="text-xs text-kumo-subtle">
          {row.views} 次浏览 · {row.favoriteCount} 人收藏
        </span>
        <Link to={`/marketplace/listing/${row.id}`}>
          <Button>查看详情</Button>
        </Link>
      </div>
    </LayerCard>
  );
}

export function MarketplaceHome() {
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState("newest");
  const [quick, setQuick] = useState("all");
  const query = useQuery({
    queryKey: ["marketplace", "public", keyword, region, sort, quick],
    queryFn: () =>
      marketplaceApi.listings({ keyword, region, sort, quick: quick === "all" ? undefined : quick, pageSize: 24 }),
  });
  const status = useQuery({ queryKey: ["marketplace", "status"], queryFn: marketplaceApi.status });
  const notice = useQuery({
    queryKey: ["marketplace", "announcement"],
    queryFn: marketplaceApi.announcement,
  });
  const wants = useQuery({
    queryKey: ["marketplace", "wants", "public"],
    queryFn: () => marketplaceApi.wants({ pageSize: 6 }),
  });
  return (
    <>
      <PageHeader
        title="交易市场"
        description="安全流转站内云产品，成交后系统自动完成归属变更。"
        actions={
          <Link to="/console/marketplace?tab=sell">
            <Button>出售云产品</Button>
          </Link>
        }
      />
      {notice.data?.maintenance ? (
        <Banner
          variant="alert"
          title="交易市场维护中"
          description={notice.data.maintenanceTip}
        />
      ) : notice.data?.announcement ? (
        <Banner
          variant="default"
          title="市场公告"
          description={notice.data.announcement}
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["出售中", status.data?.onSale ?? 0], ["已成交", status.data?.sold ?? 0], ["求购", status.data?.wants ?? 0], ["平台手续费率", `${status.data?.feeRate ?? "0"}%`]].map(([label, value]) => <LayerCard key={String(label)} className="grid gap-1 p-5"><span className="text-sm text-kumo-subtle">{label}</span><strong className="text-2xl text-kumo-strong">{value}</strong></LayerCard>)}
      </div>
      <LayerCard className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label="搜索产品、配置"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Input
          label="区域"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <Select
          label="排序"
          value={sort}
          onValueChange={(v) => setSort(v ?? "newest")}
          items={{
            newest: "最新发布",
            price_asc: "价格从低到高",
            price_desc: "价格从高到低",
            hot: "热度优先",
          }}
        />
        <Select label="快速筛选" value={quick} onValueChange={(value) => setQuick(value ?? "all")} items={{ all: "全部商品", below_renewal: "低于续费价", low_price: "百元内低价" }} />
      </LayerCard>
      <PageState
        loading={query.isLoading}
        skeleton="products"
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.data?.list.length}
        emptyTitle="暂无在售产品"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data?.list.map((row) => (
            <ListingCard key={row.id} row={row} refundEnabled={status.data?.refundEnabled} feeRate={status.data?.feeRate} />
          ))}
        </div>
      </PageState>
      {wants.data?.list.length ? (
        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold text-kumo-strong">求购信息</h2>
            <p className="text-sm text-kumo-subtle">
              有合适资源可登录后提交报价。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {wants.data.list.map((want) => (
              <LayerCard key={want.id} className="grid gap-3 p-5">
                <div className="flex justify-between">
                  <strong className="text-kumo-strong">{want.title}</strong>
                  <Badge variant="outline">求购</Badge>
                </div>
                <p className="text-sm text-kumo-subtle">
                  {want.region || "区域不限"}
                </p>
                <p>
                  {money(want.budgetMin)} – {money(want.budgetMax)}
                </p>
                <p className="line-clamp-2 text-sm text-kumo-subtle">
                  {want.description}
                </p>
              </LayerCard>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function MarketplaceListingDetail() {
  const { id = "" } = useParams();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const [showAgreement, setShowAgreement] = useState(false);
  const query = useQuery({
    queryKey: ["marketplace", "listing", id],
    queryFn: () => marketplaceApi.listing(id),
    enabled: Boolean(id),
  });
  const status = useQuery({ queryKey: ["marketplace", "status"], queryFn: marketplaceApi.status });
  const agreement = useQuery({ queryKey: ["marketplace", "agreement"], queryFn: marketplaceApi.agreement, enabled: showAgreement });
  const buy = useMutation({
    mutationFn: () => marketplaceApi.createOrder(id),
    onSuccess: () => navigate("/console/marketplace?tab=orders"),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  const favorite = useMutation({
    mutationFn: (value: boolean) => marketplaceApi.favorite(id, value),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["marketplace", "listing", id] }),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  const report = useMutation({
    mutationFn: () =>
      marketplaceApi.report({
        listingId: id,
        reason: "信息异常",
        detail: "请管理员复核该挂牌信息",
      }),
    onSuccess: () => setMessage("举报已提交，管理员将尽快处理。"),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  const row = query.data;
  return (
    <PageState
      loading={query.isLoading}
      skeleton="product"
      error={query.error ? getApiMessage(query.error) : null}
    >
      {row ? (
        <>
          <PageHeader
            title={row.productName}
            description={`挂牌编号 ${row.listingNo}`}
            actions={
              <Link to="/marketplace">
                <Button variant="secondary">返回市场</Button>
              </Link>
            }
          />
          {message ? <Banner variant="default" title={message} /> : null}
          {showAgreement ? <LayerCard className="grid gap-3 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-kumo-strong">交易规则协议</h2><Button variant="ghost" onClick={() => setShowAgreement(false)}>关闭</Button></div><p className="whitespace-pre-wrap text-sm text-kumo-subtle">{agreement.data?.agreement || "正在加载协议…"}</p></LayerCard> : null}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="grid gap-5">
              <LayerCard className="grid gap-5 p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">站内归属转移</Badge>
                  <Badge variant="outline">{row.region || "区域不限"}</Badge>
                  <Badge variant="outline">剩余 {row.remainingDays} 天</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <span className="text-sm text-kumo-subtle">产品类型</span>
                    <p className="font-medium text-kumo-strong">
                      {row.productType}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-kumo-subtle">浏览</span>
                    <p>{row.views}</p>
                  </div>
                  <div>
                    <span className="text-sm text-kumo-subtle">收藏</span>
                    <p>{row.favoriteCount}</p>
                  </div>
                </div>
                <div>
                  <h2 className="font-semibold text-kumo-strong">配置信息</h2>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap bg-kumo-control p-4 text-sm">
                    {JSON.stringify(row.configSnapshot ?? {}, null, 2)}
                  </pre>
                </div>
                <div>
                  <h2 className="font-semibold text-kumo-strong">卖家说明</h2>
                  <p className="mt-2 whitespace-pre-wrap text-kumo-subtle">
                    {row.sellerNote || "无"}
                  </p>
                </div>
              </LayerCard>
              <LayerCard className="grid gap-3 p-5">
                <h2 className="font-semibold text-kumo-strong">价格变动</h2>
                {row.priceHistory?.length ? (
                  row.priceHistory.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between border-b border-kumo-line py-2 text-sm"
                    >
                      <span>
                        {new Date(p.createdAt).toLocaleString("zh-CN")}
                      </span>
                      <span>
                        {money(p.oldPrice)} → {money(p.newPrice)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-kumo-subtle">暂无调价记录</p>
                )}
              </LayerCard>
            </div>
            <LayerCard className="grid content-start gap-4 p-5">
              <div>
                <span className="text-sm text-kumo-subtle">转让价格</span>
                <p className="text-3xl font-semibold text-kumo-strong">
                  {money(row.price)}
                </p>
              </div>
              <p className="text-sm text-kumo-subtle">
                原续费价格 {money(row.originalRenewalPrice)}
              </p>
              <p className="text-sm text-kumo-subtle">平台服务费预估 {money(String(marketplaceFee(row.price, status.data?.feeType ?? "ratio", status.data?.feeRate ?? "0", status.data?.feeFixed ?? "0")))} · {status.data?.refundEnabled ? "支持退款窗口仲裁" : "不支持自助退款"}</p>
              <div className="flex items-start gap-2 bg-kumo-control p-4">
                <ShieldCheckIcon className="mt-0.5 shrink-0" />
                <p className="text-sm">
                  支付成功后，平台在本地事务内变更产品归属；交易期间资源操作会被锁定。
                </p>
              </div>
              <Button
                loading={buy.isPending}
                disabled={row.status !== "on_sale"}
                onClick={() =>
                  user
                    ? window.confirm("确认下单并锁定此商品？订单超时未支付将自动取消。") && buy.mutate()
                    : navigate(
                        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
                      )
                }
              >
                立即购买
              </Button>
              {user ? (
                <Button
                  variant="secondary"
                  icon={<HeartIcon />}
                  loading={favorite.isPending}
                  onClick={() => favorite.mutate(!row.favorite)}
                >
                  {row.favorite ? "取消收藏" : "收藏"}
                </Button>
              ) : null}
              {user ? (
                <Button
                  variant="ghost"
                  loading={report.isPending}
                  onClick={() => report.mutate()}
                >
                  举报此商品
                </Button>
              ) : null}
              <Button variant="secondary" icon={<ShareNetworkIcon />} onClick={() => void navigator.clipboard.writeText(window.location.href).then(() => setMessage("商品链接已复制。"))}>分享商品</Button>
              <Button variant="ghost" onClick={() => setShowAgreement(true)}>查看交易协议</Button>
            </LayerCard>
          </div>
        </>
      ) : null}
    </PageState>
  );
}
