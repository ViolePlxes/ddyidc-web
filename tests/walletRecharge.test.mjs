import assert from "node:assert/strict";
const { amountInCents, checkoutCode } = await import(process.env.WALLET_HELPER_PATH);

for (const [input, cents] of [["1", 100], ["10.01", 1001], ["50.10", 5010], [" 1000 ", 100000], ["1000000", 100000000]]) {
  assert.equal(amountInCents(input), cents);
}
for (const input of ["", "0", "0.99", "-1", "1.001", "1e3", "Infinity", "NaN", "1000000.01", "10000000", "1,000"]) {
  assert.equal(amountInCents(input), null, input);
}
const checkout = { paymentId: "1", payNo: "1", status: "pending", expireAt: "", wechat: { codeUrl: "weixin://wxpay/bizpayurl?pr=unit" } };
assert.equal(checkoutCode(checkout, "wechat"), checkout.wechat.codeUrl);
assert.throws(() => checkoutCode({ ...checkout, wechat: { codeUrl: "https://example.com" } }, "wechat"));
for (const payUrl of ["http://openapi.alipay.com/gateway.do", "https://openapi.alipay.com.evil.example/", "javascript:alert(1)", "https://user:password@openapi.alipay.com/", "https://openapi.alipay.com:8443/"]) {
  assert.throws(() => checkoutCode({ ...checkout, alipay: { payUrl, mode: "page" } }, "alipay"));
}
const payUrl = "https://openapi.alipay.com/gateway.do?method=alipay.trade.page.pay";
assert.equal(checkoutCode({ ...checkout, alipay: { payUrl, mode: "page" } }, "alipay"), payUrl);
assert.throws(() => checkoutCode(checkout, "alipay"));
console.log("Wallet amount boundaries and checkout URL validation passed.");
