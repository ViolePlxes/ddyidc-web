import { adminRequest, type ApiEnvelope } from './request';
import type { RichDocument } from '../components/editor/document';

export interface PortalSEO { title: string; keywords: string; description: string; image: string; noIndex: boolean }
export interface PortalLink { label: string; href: string; children: PortalLink[] | null }
export interface PortalModule { id: string; type: string; enabled: boolean; sort: number; title: string; text: string; richContent?: RichDocument; [key: string]: unknown }
export interface PortalPage { id: string; path: string; title: string; kind: string; contentType?: 'news' | 'help'; categoryId?: string; enabled: boolean; seo: PortalSEO; modules: PortalModule[] | null; updatedAt: string }
export interface PortalCategory { id: string; name: string; kind: 'news' | 'help' }
export interface PortalDocument {
  categories?: PortalCategory[];
  schemaVersion: number; revision: number;
  site: { brand: string; origin: string; consoleOrigin: string; logo: string; copyright: string; filing: string; filingUrl: string; theme: string; enabled: boolean; headerEnabled: boolean; footerEnabled: boolean; llms: boolean; seo: PortalSEO; navigation: PortalLink[] | null; footer: PortalLink[] | null };
  pages: PortalPage[];
}
export interface PortalRevision { id: string; revision: number; action: string; createdAt: string }
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (envelope.code !== 0 && envelope.code !== 200) throw new Error(envelope.message || '内容请求失败');
  return envelope.data;
}
export async function getPortalContent() { return unwrap((await adminRequest.get<ApiEnvelope<PortalDocument>>('/portal/config')).data); }
export async function savePortalContent(document: PortalDocument, publish: boolean) { return unwrap((await adminRequest.put<ApiEnvelope<PortalDocument>>('/portal/config', { document, publish })).data); }
export async function getPortalRevisions() { return unwrap((await adminRequest.get<ApiEnvelope<PortalRevision[]>>('/portal/revisions')).data); }
export async function rollbackPortalRevision(id: string, expectedRevision: number) { return unwrap((await adminRequest.post<ApiEnvelope<PortalDocument>>(`/portal/revisions/${encodeURIComponent(id)}/rollback`, { expectedRevision })).data); }
export async function previewPortalContent(document: PortalDocument, path: string) {
  const preview = { ...document, pages: document.pages.map(page => page.path === path ? { ...page, enabled: true } : page) };
  return (await adminRequest.post<string>('/portal/preview', { document: preview, path }, { responseType: 'text' })).data;
}
export interface PortalMediaItem { id: string; name: string; path: string; mime: string; createdAt: string }
export const portalMediaURL = (id: string) => `/api/v1/portal/media/${encodeURIComponent(id)}`;
export async function getPortalMedia() { return unwrap((await adminRequest.get<ApiEnvelope<PortalMediaItem[]>>('/portal/media')).data); }
export async function uploadPortalMedia(file: File) {
  const form = new FormData(); form.append('file', file);
  return unwrap((await adminRequest.post<ApiEnvelope<PortalMediaItem>>('/portal/media', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data);
}
export const blankSEO = (): PortalSEO => ({ title: '', keywords: '', description: '', image: '', noIndex: false });
