import { ArrowsClockwiseIcon, BellIcon, BuildingsIcon, ChartLineIcon, ChatCenteredTextIcon, ChatsCircleIcon, CloudArrowDownIcon, CloudCheckIcon, CoinsIcon, CreditCardIcon, FolderIcon, GearIcon, GiftIcon, GlobeIcon, HouseIcon, IdentificationCardIcon, LinkIcon, MegaphoneIcon, PackageIcon, PercentIcon, ReceiptIcon, ShieldCheckIcon, ShoppingCartIcon, StorefrontIcon, TreeStructureIcon, UserCircleIcon, UsersIcon, UsersThreeIcon } from "@phosphor-icons/react";

export const navigationIcons = { ArrowsClockwiseIcon, BellIcon, BuildingsIcon, ChartLineIcon, ChatCenteredTextIcon, ChatsCircleIcon, CloudArrowDownIcon, CloudCheckIcon, CoinsIcon, CreditCardIcon, FolderIcon, GearIcon, GiftIcon, GlobeIcon, HouseIcon, IdentificationCardIcon, LinkIcon, MegaphoneIcon, PackageIcon, PercentIcon, ReceiptIcon, ShieldCheckIcon, ShoppingCartIcon, StorefrontIcon, TreeStructureIcon, UserCircleIcon, UsersIcon, UsersThreeIcon };
export function navigationIcon(name: string) {
  return navigationIcons[name as keyof typeof navigationIcons] ?? LinkIcon;
}
