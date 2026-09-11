import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
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
  return (
    <SessionBoundary
      initialized={state.initialized}
      restoreSession={state.restoreSession}
      clearSession={state.clearSession}
      unauthorizedEvent="ddyidc:user-unauthorized"
    />
  );
}

export function PortalApp() {
  return (
    <Routes>
      <Route element={<UserSessionBoundary />}>
        <Route element={<PortalLayout />}>
          <Route
            path="/"
            element={
              <LazyRoute kind="detail">
                <PortalHome />
              </LazyRoute>
            }
          />
          <Route
            path="/products"
            element={
              <LazyRoute kind="products">
                <PublicProducts />
              </LazyRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <LazyRoute kind="product">
                <PublicProductDetail />
              </LazyRoute>
            }
          />
          <Route
            path="/about"
            element={
              <LazyRoute kind="detail">
                <About />
              </LazyRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <LazyRoute kind="form">
                <ResetPassword />
              </LazyRoute>
            }
          />
          <Route
            path="/groupbuy"
            element={
              <GroupBuyGate scope="public">
                <LazyRoute kind="products">
                  <GroupBuyMarketplace />
                </LazyRoute>
              </GroupBuyGate>
            }
          />
          <Route
            path="/groupbuy/share/:inviteCode"
            element={
              <GroupBuyGate scope="public">
                <LazyRoute kind="detail">
                  <GroupBuyPublicShare />
                </LazyRoute>
              </GroupBuyGate>
            }
          />
          <Route
            path="/marketplace"
            element={
              <MarketplaceGate scope="public">
                <LazyRoute kind="products">
                  <MarketplaceHome />
                </LazyRoute>
              </MarketplaceGate>
            }
          />
          <Route
            path="/marketplace/listing/:id"
            element={
              <MarketplaceGate scope="public">
                <LazyRoute kind="product">
                  <MarketplaceListingDetail />
                </LazyRoute>
              </MarketplaceGate>
            }
          />
        </Route>
        <Route
          path="/login"
          element={
            <LazyRoute kind="form">
              <LoginPage />
            </LazyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <LazyRoute kind="form">
              <RegisterPage />
            </LazyRoute>
          }
        />
        <Route
          path="/terms/:kind"
          element={
            <LazyRoute kind="form">
              <AgreementPlaceholder />
            </LazyRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
