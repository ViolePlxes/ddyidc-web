import { Banner, Button, Select } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { consoleApi } from "../../../shared/api/console";
import { promoCouponsApi } from "../../../shared/api/promoCoupons";
import { getApiMessage } from "../../../shared/api/request";
import { formatMoney } from "../../../shared/utils/format";
export function PromoOrderCoupon({
  orderId,
  amount,
}: {
  orderId: string;
  amount: number;
}) {
  const [coupon, setCoupon] = useState("");
  const client = useQueryClient();
  const list = useQuery({
    queryKey: ["coupons", "promo-usable", orderId, amount],
    queryFn: () => consoleApi.usableCoupons(amount),
  });
  const apply = useMutation({
    mutationFn: () => promoCouponsApi.apply(orderId, coupon),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["orders", orderId] }),
        client.invalidateQueries({ queryKey: ["coupons"] }),
      ]);
    },
  });
  const coupons =
    list.data?.filter((c) => c.name.startsWith("推广专属券 · ")) ?? [];
  if (!coupons.length) return null;
  return (
    <div className="grid gap-3">
      <Select
        label="推广专属优惠券"
        value={coupon}
        onValueChange={(v) => setCoupon(v ?? "")}
        items={coupons.map((c) => ({
          value: c.id,
          label: `${c.name} · 满${formatMoney(c.minAmount)}减${formatMoney(c.faceValue)}`,
        }))}
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={!coupon}
        loading={apply.isPending}
        onClick={() => apply.mutate()}
      >
        确认使用优惠券
      </Button>
      {apply.error ? (
        <Banner
          variant="error"
          title="优惠券未使用"
          description={getApiMessage(apply.error)}
        />
      ) : null}
    </div>
  );
}
