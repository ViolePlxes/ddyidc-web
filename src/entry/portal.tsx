import { PortalApp } from "../apps/portal/PortalApp";
import { createEntry } from "./createEntry";

const lifecycle = createEntry(PortalApp);
export const { bootstrap, mount, unmount } = lifecycle;
lifecycle.standalone();
