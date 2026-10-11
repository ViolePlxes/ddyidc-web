import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { consoleApi } from "../api/console";

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: () => consoleApi.products(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    retry: 1,
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => consoleApi.product(id),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

export const useOrderPage = (productId: string, configurable: boolean) =>
  useQuery({
    queryKey: ["upstream-order-page", productId],
    queryFn: () => consoleApi.orderPage(productId),
    enabled: Boolean(configurable && productId),
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

export const useOrders = (status: number | undefined, page: number, pageSize = 10) =>
  useQuery({
    queryKey: ["orders", { status, page, pageSize }],
    queryFn: () => consoleApi.orders(status, page, pageSize),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: ["orders", id],
    queryFn: () => consoleApi.order(id),
    enabled: Boolean(id),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useRecharges = (page = 1) =>
  useQuery({
    queryKey: ["finance", "recharges", page],
    queryFn: () => consoleApi.recharges(page),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

export const useCoupons = (status: number, page = 1) =>
  useQuery({
    queryKey: ["coupons", { status, page }],
    queryFn: () => consoleApi.coupons(status, page),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
