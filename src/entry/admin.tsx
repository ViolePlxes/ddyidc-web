import { AdminApp } from "../apps/admin/AdminApp";
import { createEntry } from "./createEntry";

const lifecycle = createEntry(AdminApp);
export const { bootstrap, mount, unmount } = lifecycle;
lifecycle.standalone();
