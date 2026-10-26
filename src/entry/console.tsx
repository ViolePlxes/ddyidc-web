import { ConsoleApp } from "../apps/console/ConsoleApp";
import { createEntry } from "./createEntry";

const lifecycle = createEntry(ConsoleApp, { dataRouter: true });
export const { bootstrap, mount, unmount } = lifecycle;
lifecycle.standalone();
