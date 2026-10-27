export const rechargeStatuses: Record<string,string> = { '1':'待支付', '2':'成功', '3':'失败', '4':'已关闭' };
export const rechargeChannels: Record<string,string> = { alipay:'支付宝', wechat:'微信', bank_transfer:'银行转账', offline:'线下支付' };
export const rechargePaymentStatuses: Record<string,string> = {pending:'待支付',paid:'支付成功',closed:'已关闭',failed:'支付失败',refunded:'已退款',received_review:'收款待核对'};
export function rechargeRecordID(value: string) { return /^[1-9]\d{0,18}$/.test(value) && BigInt(value)<=9223372036854775807n; }
