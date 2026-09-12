import { Outlet } from "react-router-dom";

export function RouteOutlet({ className }: { className: string }) {
  return (
    <div className={className}>
      <Outlet />
    </div>
  );
}
