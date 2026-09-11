import { Badge } from "@cloudflare/kumo";

const labels:Record<string,string>={gain:"获得",deduct:"扣除",virtual:"虚拟商品",physical:"实物商品",coupon:"代金券",balance:"余额",system:"系统商品",card:"卡密",pending:"待处理",processing:"处理中",completed:"已完成",cancelled:"已取消",newbie:"新手任务",daily:"日常任务",growth:"成长任务"};
export function PointsBadge({value,level}:{value?:string;level?:number}){
  const variant=level?level>=4?"error":level>=3?"warning":level>=2?"info":"outline":value==="gain"||value==="completed"?"success":value==="deduct"||value==="cancelled"?"error":value==="processing"||value==="pending"?"warning":"outline";
  return <Badge variant={variant}>{level?`风险等级 ${level}`:labels[value??""]??value??"—"}</Badge>;
}
