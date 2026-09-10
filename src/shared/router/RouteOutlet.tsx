import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function RouteOutlet({ className }: { className: string }) {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (
      "startViewTransition" in document ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;
    containerRef.current?.animate(
      [
        { opacity: 0.88, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 180, easing: "ease-out" },
    );
  }, [location.key]);

  return (
    <div ref={containerRef} className={`route-content ${className}`}>
      <Outlet />
    </div>
  );
}
