import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, Banner } from "@cloudflare/kumo";

function CarouselControls({ region }: { region: HTMLElement }) {
  const slides = Array.from(
    region.querySelectorAll<HTMLElement>("[data-portal-slide]"),
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(
    region.dataset.carouselAutoplay !== "true",
  );
  useEffect(() => {
    region.classList.remove("md:grid-cols-2");
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
      slide.setAttribute("aria-hidden", String(i !== index));
    });
  }, [index, region]);
  useEffect(() => {
    if (
      paused ||
      slides.length < 2 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const interval =
      Math.max(3, Math.min(60, Number(region.dataset.carouselInterval) || 6)) *
      1000;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      interval,
    );
    return () => clearInterval(timer);
  }, [paused, slides.length, region]);
  useEffect(() => {
    const pause = () => setPaused(true);
    region.addEventListener("mouseenter", pause);
    region.addEventListener("focusin", pause);
    return () => {
      region.removeEventListener("mouseenter", pause);
      region.removeEventListener("focusin", pause);
    };
  }, [region]);
  if (slides.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-3" aria-label="轮播控制">
      <Button
        variant="secondary"
        onClick={() => {
          setPaused(true);
          setIndex((i) => (i + slides.length - 1) % slides.length);
        }}
      >
        上一条
      </Button>
      <span aria-live="polite">
        {index + 1} / {slides.length}
      </span>
      <Button
        variant="secondary"
        onClick={() => {
          setPaused(true);
          setIndex((i) => (i + 1) % slides.length);
        }}
      >
        下一条
      </Button>
      <Button variant="ghost" onClick={() => setPaused((v) => !v)}>
        {paused ? "自动播放" : "暂停播放"}
      </Button>
    </div>
  );
}
function ProductControls({ region }: { region: HTMLElement }) {
  const cards = Array.from(
    region.querySelectorAll<HTMLElement>("[data-product-group]"),
  );
  const groups = [
    ...new Set(cards.map((card) => card.dataset.productGroup || "其他")),
  ];
  const [active, setActive] = useState("全部");
  useEffect(() => {
    cards.forEach((card) => {
      card.hidden = active !== "全部" && card.dataset.productGroup !== active;
    });
  }, [active]);
  if (!groups.length) return null;
  return (
    <div className="flex flex-wrap gap-3" aria-label="产品分类">
      {["全部", ...groups].map((group) => (
        <Button
          key={group}
          variant={group === active ? "primary" : "secondary"}
          aria-pressed={group === active}
          onClick={() => setActive(group)}
        >
          {group}
        </Button>
      ))}
    </div>
  );
}
function RevisionNotice() {
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    let alive = true;
    const initial = document.body.dataset.portalRevision;
    const timer = setInterval(() => {
      void fetch("/api/v1/portal/revision", {
        credentials: "omit",
        cache: "no-cache",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (
            alive &&
            data?.data?.revision !== undefined &&
            String(data.data.revision) !== initial
          )
            setChanged(true);
        })
        .catch(() => {});
    }, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  return changed ? (
    <Banner title="页面内容已更新" description="刷新即可查看最新版本。">
      <Button onClick={() => window.location.reload()}>刷新页面</Button>
    </Banner>
  ) : null;
}
export function enhancePortal() {
  document
    .querySelectorAll<HTMLElement>("[data-portal-carousel-controls]")
    .forEach((node) => {
      const region = node.parentElement?.querySelector<HTMLElement>(
        "[data-portal-carousel]",
      );
      if (region) createRoot(node).render(<CarouselControls region={region} />);
    });
  document
    .querySelectorAll<HTMLElement>("[data-portal-product-controls]")
    .forEach((node) => {
      if (node.parentElement)
        createRoot(node).render(
          <ProductControls region={node.parentElement} />,
        );
    });
  const notice = document.querySelector<HTMLElement>(
    "[data-portal-revision-notice]",
  );
  if (notice) createRoot(notice).render(<RevisionNotice />);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape")
      document
        .querySelectorAll<HTMLDetailsElement>("header details[open]")
        .forEach((menu) => (menu.open = false));
  });
  document.addEventListener("click", (event) =>
    document
      .querySelectorAll<HTMLDetailsElement>("header details[open]")
      .forEach((menu) => {
        if (!menu.contains(event.target as Node)) menu.open = false;
      }),
  );
}
