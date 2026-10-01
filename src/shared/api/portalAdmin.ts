import { adminRequest, type ApiEnvelope } from "./request";
import type {
  ModuleDefinition,
  PortalDocument,
} from "../../apps/public-portal/contracts";
export interface PortalRevision {
  id: number;
  revision: number;
  actorId: string;
  operatorIp: string;
  action: string;
  createdAt: string;
}
export interface PortalMedia {
  id: string;
  name: string;
  path: string;
  mime: string;
  createdAt: string;
}
export const portalAdmin = {
  async products() {
    return (
      await adminRequest.get<ApiEnvelope<{ id: string; name: string }[]>>(
        "/portal/products",
      )
    ).data.data;
  },
  async config() {
    return (
      await adminRequest.get<ApiEnvelope<PortalDocument>>("/portal/config")
    ).data.data;
  },
  async definitions() {
    return (
      await adminRequest.get<
        ApiEnvelope<{
          themes: { id: string; label: string }[];
          modules: ModuleDefinition[];
        }>
      >("/portal/themes")
    ).data.data;
  },
  async save(document: PortalDocument, publish: boolean) {
    return (
      await adminRequest.put<ApiEnvelope<PortalDocument>>("/portal/config", {
        document,
        publish,
      })
    ).data.data;
  },
  async revisions() {
    return (
      await adminRequest.get<ApiEnvelope<PortalRevision[]>>("/portal/revisions")
    ).data.data;
  },
  async rollback(id: number) {
    return (
      await adminRequest.post<ApiEnvelope<PortalDocument>>(
        `/portal/revisions/${id}/rollback`,
      )
    ).data.data;
  },
  async preview(document: PortalDocument, path: string) {
    return (
      await adminRequest.post<string>(
        "/portal/preview",
        { document, path },
        { responseType: "text" },
      )
    ).data;
  },
  async media() {
    return (await adminRequest.get<ApiEnvelope<PortalMedia[]>>("/portal/media"))
      .data.data;
  },
  async upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    return (
      await adminRequest.post<ApiEnvelope<PortalMedia>>("/portal/media", body, {
        headers: { "Content-Type": undefined },
      })
    ).data.data;
  },
};
