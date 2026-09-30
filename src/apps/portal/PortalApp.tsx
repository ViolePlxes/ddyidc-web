import { lazy } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { readRememberedProfile } from "../../shared/api/refreshSession";
import { PortalLayout } from "../../layouts/PortalLayout";
import { SessionBoundary } from "../../shared/router/EntryGuards";
import { useAuthStore } from "../../shared/stores/auth";
import { LazyRoute } from "../../shared/router/LazyRoute";
import { routeModules } from "../../shared/router/routeModules";
import { GroupBuyGate } from "../../shared/router/GroupBuyGate";
import { MarketplaceGate } from "../../shared/router/MarketplaceGate";

const LoginPage = lazy(() =>
  routeModules.portalLogin().then((module) => ({ default: module.LoginPage })),
);
const SocialComplete = lazy(() => import("./views/SocialComplete").then(module => ({ default: module.SocialComplete })));
const RegisterPage = lazy(() =>
  routeModules
    .portalRegister()
    .then((module) => ({ default: module.RegisterPage })),
);
const AgreementPlaceholder = lazy(() =>
  routeModules
    .portalAgreement()
    .then((module) => ({ default: module.AgreementPlaceholder })),
);
const PortalHome = lazy(() =>
  routeModules
    .portalPublic()
    .then((module) => ({ default: module.PortalHome })),
);
const PublicProducts = lazy(() =>
  routeModules
    .portalPublic()
    .then((module) => ({ default: module.PublicProducts })),
);
const PublicProductDetail = lazy(() =>
  routeModules
    .portalPublic()
    .then((module) => ({ default: module.PublicProductDetail })),
);
const About = lazy(() =>
  routeModules.portalPublic().then((module) => ({ default: module.About })),
);
const ResetPassword = lazy(() =>
  routeModules
    .portalPublic()
    .then((module) => ({ default: module.ResetPassword })),
);
const GroupBuyMarketplace = lazy(() =>
  routeModules
    .portalGroupBuy()
    .then((module) => ({ default: module.GroupBuyMarketplace })),
);
const GroupBuyPublicShare = lazy(() =>
  routeModules
    .portalGroupBuy()
    .then((module) => ({ default: module.GroupBuyPublicShare })),
);
const MarketplaceHome = lazy(() =>
  routeModules
    .portalMarketplace()
    .then((module) => ({ default: module.MarketplaceHome })),
);
const MarketplaceListingDetail = lazy(() =>
  routeModules
    .portalMarketplace()
    .then((module) => ({ default: module.MarketplaceListingDetail })),
);

function UserSessionBoundary() {
  const state = useAuthStore();
  const location = useLocation();
  // Login is an explicit account choice when a persistent credential exists.
  // OAuth completion must exchange its ticket before restoring any old account.
  if (location.pathname === "/auth/social/complete" || (location.pathname === "/login" && readRememberedProfile())) return <Outlet />;
  return (
    <SessionBoundary
      initialized={state.initialized}
      restoreSession={state.restoreSession}
      clearSession={state.clearSession}
      unauthorizedEvent="ddyidc:user-unauthorized"
      catalogPlaceholder={false}
    />
  );
}

export function PortalApp() {
  return (
    <Routes>
      <Route path="/auth/social/complete" element={<LazyRoute><SocialComplete /></LazyRoute>} />
      <Route element={<UserSessionBoundary />}>
        <Route element={<PortalLayout />}>
          <Route
            path="/"
            element={
              <LazyRoute>
                <PortalHome />
              </LazyRoute>
            }
          />
          <Route
            path="/products"
            element={
              <LazyRoute>
                <PublicProducts />
              </LazyRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <LazyRoute>
                <PublicProductDetail />
              </LazyRoute>
            }
          />
          <Route
            path="/about"
            element={
              <LazyRoute>
                <About />
              </LazyRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <LazyRoute>
                <ResetPassword />
              </LazyRoute>
            }
          />
          <Route
            path="/groupbuy"
            element={
              <GroupBuyGate scope="public">
                <LazyRoute>
                  <GroupBuyMarketplace />
                </LazyRoute>
              </GroupBuyGate>
            }
          />
          <Route
            path="/groupbuy/share/:inviteCode"
            element={
              <GroupBuyGate scope="public">
                <LazyRoute>
                  <GroupBuyPublicShare />
                </LazyRoute>
              </GroupBuyGate>
            }
          />
          <Route
            path="/marketplace"
            element={
              <MarketplaceGate scope="public">
                <LazyRoute>
                  <MarketplaceHome />
                </LazyRoute>
              </MarketplaceGate>
            }
          />
          <Route
            path="/marketplace/listing/:id"
            element={
              <MarketplaceGate scope="public">
                <LazyRoute>
                  <MarketplaceListingDetail />
                </LazyRoute>
              </MarketplaceGate>
            }
          />
        </Route>
        <Route
          path="/login"
          element={
            <LazyRoute>
              <LoginPage />
            </LazyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <LazyRoute>
              <RegisterPage />
            </LazyRoute>
          }
        />
        <Route
          path="/terms/:kind"
          element={
            <LazyRoute>
              <AgreementPlaceholder />
            </LazyRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
