import { PageHeader } from "../../../shared/components/PageHeader";
import { BalanceTransactions } from "../../../shared/components/BalanceTransactions";
export function Transactions(){return <><PageHeader title="交易流水" description="查看账户全部余额变动，包括后台人工增加或扣减。"/><BalanceTransactions/></>;}
