import type {NavigationGroup} from '../../layouts/DashboardLayout';
/** Normalize persisted older menus without changing admin or sales navigation. */
export function withBillingNavigation(groups:NavigationGroup[]):NavigationGroup[]{
 const matches=(href:string)=>['/console/orders','/console/billing','/billing'].includes(href.replace(/\/$/,''));
 const found=groups.flatMap(group=>group.items).find(item=>matches(item.href));if(!found)return groups;
 const next=groups.map(group=>({...group,items:group.items.filter(item=>!matches(item.href))}));
 let target=next.find(group=>group.label==='资源与账单');if(!target){target={label:'资源与账单',items:[]};next.push(target)}
 const index=Math.max(0,target.items.findIndex(item=>item.href==='/user/productList.htm'||item.href==='/console/instances')+1);
 target.items.splice(index,0,{...found,label:'统一账单',href:'/console/billing'});return next.filter(group=>group.items.length);
}
