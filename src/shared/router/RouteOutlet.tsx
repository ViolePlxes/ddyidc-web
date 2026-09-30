import { Outlet } from "react-router-dom";
import { ContentFade } from "../components/ContentFade";

export function RouteOutlet({ className }: { className: string }) {
  return (
    <ContentFade className={className}>
      <Outlet />
    </ContentFade>
  );
}
