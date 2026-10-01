import type { PaymentChannel, PaymentCheckout } from "../../../shared/api/payment";

export function amountInCents(value: string): number | null {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents >= 100 && cents <= 100_000_000 ? cents : null;
}

export function checkoutCode(checkout: PaymentCheckout, channel: PaymentChannel): string {
  if (channel === "wechat") {
    if (!checkout.wechat?.codeUrl?.startsWith("weixin://wxpay/")) throw new Error("微信未返回有效的付款二维码");
    return checkout.wechat.codeUrl;
  }
  const raw = checkout.alipay?.payUrl;
  if (!raw) throw new Error("支付宝未返回官方收银台地址");
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") ||
    !["openapi.alipay.com", "openapi.alipaydev.com", "openapi-sandbox.dl.alipaydev.com"].includes(url.hostname)) {
    throw new Error("支付宝未返回有效的官方收银台地址");
  }
  return url.toString();
}
