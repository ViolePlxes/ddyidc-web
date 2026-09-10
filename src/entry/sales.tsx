import { SalesApp } from "../apps/sales/SalesApp";
import { createEntry } from "./createEntry";

const lifecycle = createEntry(SalesApp);
export const { bootstrap, mount, unmount } = lifecycle;
lifecycle.standalone();
