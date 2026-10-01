import "../styles/tailwind.css";
import { enhancePortal } from "../apps/public-portal/enhance";
// Server-generated public HTML is never replaced with an empty SPA root.
enhancePortal();
