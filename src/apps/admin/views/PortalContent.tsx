import {PortalPolicyContent} from './PortalPolicyContent';
import {PortalDraftPreview} from './PortalDraftPreview';
import {PortalProductContent} from './PortalProductContent';
import {PortalPageCatalog} from './PortalPageCatalog';
import {ScopedTable as Table} from '../../../shared/components/ScopedTable';
import { PortalThemes, PortalIndexing, PortalCampaigns } from './PortalContentExtensions';
import { PortalScopedContent, PortalMenuSettings } from './PortalScopedContent';
import { contentScopes } from '../../../shared/utils/contentScopes';
import { resolveContentMenu } from '../../../shared/utils/contentMenu';
import { useContentDraft } from '../../../shared/components/ContentDraftBoundary';
import { Banner, Button, Collapsible, Input, InputGroup, LayerCard, LayerDialog, Select, Switch, Text, Textarea } from '@cloudflare/kumo';
import { MagnifyingGlassIcon, SlidersIcon } from '@phosphor-icons/react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalModules } from './PortalModules';
import { PortalLinks } from './PortalLinks';
import { PortalMedia } from './PortalMedia';
import { adminPath } from '../../../shared/utils/adminEntry';
import { getApiMessage } from '../../../shared/api/request';
import { blankSEO, previewPortalContent, rollbackPortalRevision, portalMediaURL, getPortalContent, getPortalRevisions, savePortalContent, type PortalDocument, type PortalPage, type PortalSEO } from '../../../shared/api/portalContent';

const RichTextEditor = lazy(() => import('../../../shared/components/editor/RichTextEditor'));
const queryKey = ['admin', 'portal-content'];

function SEOFields({ value, change }: { value: PortalSEO; change: (value: PortalSEO) => void }) {
  return <div className="grid gap-4"><Input label="搜索标题" maxLength={170} value={value.title} onChange={e => change({ ...value, title: e.target.value })} /><Input label="关键词" maxLength={340} value={value.keywords} onChange={e => change({ ...value, keywords: e.target.value })} /><Textarea label="搜索描述" maxLength={680} value={value.description} onChange={e => change({ ...value, description: e.target.value })} /><Input label="分享图片地址（可选）" value={value.image} onChange={e => change({ ...value, image: e.target.value })} /><Switch label="禁止搜索引擎索引" checked={value.noIndex} onCheckedChange={noIndex => change({ ...value, noIndex })} /></div>;
}

export function PortalContent() {
  const { draft, update: updateDraft } = useContentDraft();
  const navigate = useNavigate();
  const { section: routeSection = 'site' } = useParams();
  const { root: menuRoot, item: menuItem, section } = resolveContentMenu(routeSection);
  const menuGroups = menuRoot.groups;
  const sectionTitle = menuItem?.label ?? '内容管理';
  const query = useQuery({ queryKey, queryFn: getPortalContent, refetchOnWindowFocus: false });
  const history = useQuery({ queryKey: [...queryKey, 'revisions'], queryFn: getPortalRevisions, enabled: section === 'revisions' });
  const client = useQueryClient();
  const [document, setDocument] = useState<PortalDocument | undefined>(draft.document);
  const [dirty, setDirty] = useState(draft.dirty);
  const [selected, setSelected] = useState('');
  const [modulePreviewPath, setModulePreviewPath] = useState('/');
  const [search, setSearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [showMenu, setShowMenu] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [categoryKind, setCategoryKind] = useState<'news' | 'help'>('news');
  const contentType = section === 'help' ? 'help' : 'news';
  const [confirm, setConfirm] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [previewState,setPreviewState]=useState<{document:PortalDocument;path:string}|null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<{ id: string; revision: number } | null>(null);
  useEffect(() => { if (query.data && !dirty) setDocument(query.data); }, [query.data, dirty]);
  useEffect(() => { updateDraft({ document, dirty }); }, [document, dirty, updateDraft]);
  const change = (value: PortalDocument) => { setDocument(value); setDirty(true); save.reset(); };
  const save = useMutation({ mutationFn: (publish: boolean) => {
    if (!document) throw new Error('请先加载内容');
    return savePortalContent(document, publish);
  }, onSuccess: (value, publish) => { if (publish) { void client.invalidateQueries({ queryKey: ['published-portal-content'] }); } setDirty(false); setDocument(value); client.setQueryData(queryKey, value); setConfirm(false); void client.invalidateQueries({ queryKey: [...queryKey, 'revisions'] }); } });
  const preview = useMutation({ mutationFn: async (path: string) => { if (!document) throw new Error('请先加载内容');const snapshot=structuredClone(document);await previewPortalContent(snapshot,path);return {document:snapshot,path}; }, onSuccess:setPreviewState });
  const rollback = useMutation({ mutationFn: () => { if (!document || !rollbackTarget || dirty) throw new Error('请先保存草稿并确认回滚版本'); return rollbackPortalRevision(rollbackTarget.id, document.revision); }, onSuccess: value => { setDirty(false); setDocument(value); client.setQueryData(queryKey, value); setSelected(''); setRollbackTarget(null); void client.invalidateQueries({ queryKey: [...queryKey, 'revisions'] }); } });
  const page = document?.pages.find(item => item.id === selected);
  const updatePage = (value: PortalPage) => { if (document) change({ ...document, pages: document.pages.map(item => item.id === value.id ? value : item) }); };
  const addArticle = () => {
    if (!document) return;
    const id = `article-${crypto.randomUUID()}`;
    const article: PortalPage = { id, path: `/${contentType}/${id}`, contentType, title: '新文章', kind: 'article', enabled: false, seo: blankSEO(), updatedAt: '', modules: [{ id: `${id}-body`, type: 'feature_sections', enabled: true, sort: 0, title: '', text: '' }] };
    change({ ...document, pages: [...document.pages, article] }); setSelected(id);
  };
  if (query.isPending) return <p>正在读取内容…</p>;
  if (query.error || !document) return <Banner variant="error" title="读取内容失败" description={getApiMessage(query.error)} />;
  const disabled = save.isPending || rollback.isPending;
  const articleBody = page?.modules?.find(module => module.type === 'feature_sections');
  return <div className="flex min-h-[calc(100svh-58px)] min-w-0 flex-col md:flex-row">
    {showMenu && <aside className="w-full shrink-0 border-b border-kumo-line bg-(--ddy-navigation-bg) md:w-72 md:border-r md:border-b-0" aria-label="内容管理二级菜单">
      <div className="sticky top-0 flex min-h-16 items-center border-b border-kumo-line bg-(--ddy-navigation-bg) px-3 py-3"><InputGroup className="mb-0! w-full"><InputGroup.Addon><MagnifyingGlassIcon size={16} /></InputGroup.Addon><InputGroup.Input aria-label="搜索内容菜单" placeholder="搜索菜单…" value={menuSearch} onChange={event => setMenuSearch(event.target.value)} /></InputGroup></div>
      <nav aria-label="内容管理栏目">{menuGroups.map(group => {
        const items = group.items.filter(item => !menuSearch.trim() || `${group.label} ${item.label}`.toLowerCase().includes(menuSearch.trim().toLowerCase()));
        if (!items.length) return null;
        return <Collapsible.Root key={`${group.label}-${menuSearch ? 'search' : section}`} defaultOpen={Boolean(menuSearch) || group.items.some(item => item.id === menuItem?.id)} className="min-w-0 border-b border-kumo-line">
          <Collapsible.DefaultTrigger className="min-h-10 w-full px-3 py-2.5 text-left"><Text as="span" size="sm" bold>{group.label}</Text></Collapsible.DefaultTrigger>
          <Collapsible.Panel><div className="ml-5 min-w-0 pl-3">{items.map(({ id: key, label }) => <div key={key} className="relative before:absolute before:-left-3 before:top-5 before:w-3 before:border-t before:border-kumo-line after:absolute after:top-0 after:bottom-0 after:-left-3 after:border-l after:border-kumo-line last:after:bottom-auto last:after:h-5"><Button variant="ghost" className="min-h-10 h-auto w-full justify-start rounded-none px-3 py-2.5 text-left shadow-none" aria-current={menuItem?.id === key ? 'page' : undefined} onClick={() => { navigate(adminPath(`/admin/content/${key}`)); setSelected(''); }}><Text as="span" size="sm" bold={menuItem?.id === key}>{label}</Text></Button></div>)}</div></Collapsible.Panel>
        </Collapsible.Root>;
      })}{menuSearch.trim() && !menuGroups.some(group => group.items.some(item => `${group.label} ${item.label}`.toLowerCase().includes(menuSearch.trim().toLowerCase()))) ? <p role="status" className="p-3 text-sm text-kumo-subtle">没有匹配的菜单</p> : null}</nav>
    </aside>}
    <div className="grid min-w-0 flex-1 content-start gap-5">
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-kumo-line px-4 py-3"><div className="flex items-center gap-3"><Button variant="secondary" shape="square" aria-label={showMenu ? '收起内容菜单' : '展开内容菜单'} aria-expanded={showMenu} icon={<SlidersIcon />} onClick={() => setShowMenu(value => !value)} /></div><div className="flex flex-wrap gap-2"><Button disabled={disabled || !dirty || section === 'pending'} loading={save.isPending && !confirm} onClick={() => save.mutate(false)}>保存草稿</Button><Button disabled={disabled || preview.isPending || section === 'pending' || (['campaignCreate', 'campaignList'].includes(section) && !modulePreviewPath) || Boolean(contentScopes[section] && !document.pages.some(item => item.kind === 'page' && item.path === contentScopes[section]!.path))} loading={preview.isPending} onClick={() => preview.mutate(contentScopes[section]?.path ?? (['pages', 'modules', 'htmlEditor', 'campaignCreate', 'campaignList'].includes(section) ? modulePreviewPath : page?.path ?? "/"))}>预览草稿</Button><Button variant="primary" disabled={disabled || section === 'pending'} onClick={() => { save.reset(); setConfirm(true); }}>发布站点</Button></div></div>
    <div className="grid min-w-0 content-start gap-4 px-4 pb-4"><Text as="h1" variant="heading">{sectionTitle}</Text>
    {section !== 'pending' && <p className="text-sm text-kumo-subtle">草稿版本 {document.revision} · {dirty ? '有未保存修改' : '已读取保存版本'}。发布会使整个站点草稿生效，仅超级管理员可操作。</p>}
    {preview.error ? <Banner variant="error" title="预览失败" description={getApiMessage(preview.error)} /> : null}
    {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
    {save.isSuccess ? <Banner title={save.variables ? '站点已发布' : '草稿已保存，公开站点未变更'} /> : null}
    <fieldset disabled={disabled} className="min-w-0"><LayerCard><LayerCard.Primary className="grid gap-5">
      {section === 'site' && <><h2 className="text-lg font-semibold">站务信息</h2>{([{ key: 'brand', label: '品牌名称' }, { key: 'origin', label: '门户地址（HTTPS）' }, { key: 'consoleOrigin', label: '用户中心地址（HTTPS）' }, { key: 'logo', label: 'Logo 地址' }, { key: 'copyright', label: '版权信息' }, { key: 'filing', label: '备案号' }, { key: 'filingUrl', label: '备案查询链接' }] as const).map(field => <Input key={field.key} label={field.label} value={document.site[field.key]} onChange={e => change({ ...document, site: { ...document.site, [field.key]: e.target.value } })} />)}<Switch label="启用门户" checked={document.site.enabled} onCheckedChange={enabled => change({ ...document, site: { ...document.site, enabled } })} /></>}
      {section === 'seo' && <><h2 className="text-lg font-semibold">站点 SEO</h2><SEOFields value={document.site.seo} change={seo => change({ ...document, site: { ...document.site, seo } })} /></>}
      {['navigation', 'footer'].includes(section) && <><h2 className="text-lg font-semibold">{section === 'footer' ? '底部链接' : '顶部导航'}</h2><p className="text-sm text-kumo-subtle">支持站内路径或 HTTPS 地址，最多三级。移除和编辑先写入草稿。</p><PortalLinks value={document.site[section === 'footer' ? 'footer' : 'navigation']} change={value => change({ ...document, site: { ...document.site, [section === 'footer' ? 'footer' : 'navigation']: value } })} /></>}
      {section === 'themes' && <PortalThemes document={document} change={change} />}
      {section === 'indexingSettings' && <PortalIndexing document={document} change={change} />}
      {['campaignCreate', 'campaignList'].includes(section) && <PortalCampaigns document={document} change={change} onPageChange={setModulePreviewPath} />}
      {section === 'menuSettings' && <PortalMenuSettings document={document} change={change} />}
      {section === 'publicPolicies' && <PortalPolicyContent document={document} change={change} onEdit={path=>{setModulePreviewPath(path);navigate(adminPath('/content/pages'));}}/>}
      {section === 'productIntroductions' && <PortalProductContent document={document} change={change} onEdit={path=>{setModulePreviewPath(path);navigate(adminPath('/content/pages'));}}/>}
      {section === 'publicPages' && <PortalPageCatalog document={document} change={change} onPageChange={path => { setModulePreviewPath(path); navigate(adminPath('/content/pages')); }} />}
      {(['pages', 'htmlEditor'].includes(section) || Boolean(contentScopes[section])) && <PortalScopedContent key={section} document={document} change={change} section={section} preferredPath={modulePreviewPath} onPageChange={setModulePreviewPath} />}
      {section === 'modules' && <PortalModules document={document} change={change} onPageChange={setModulePreviewPath} />}
      {['articles', 'help'].includes(section) && <><div className="flex flex-wrap items-end gap-3"><Input label="搜索文章" value={search} onChange={e => setSearch(e.target.value)} /><Button onClick={addArticle} disabled={document.pages.length >= 500}>新建文章</Button></div><Table tableId="apps/admin/views/PortalContent.tsx:1"><Table.Header><Table.Row><Table.Head>标题</Table.Head><Table.Head>路径</Table.Head><Table.Head>草稿状态</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{document.pages.filter(item => item.kind === 'article' && (item.contentType ?? 'news') === contentType && `${item.title} ${item.path}`.toLowerCase().includes(search.toLowerCase())).map(item => <Table.Row key={item.id}><Table.Cell>{item.title}</Table.Cell><Table.Cell>{item.path}</Table.Cell><Table.Cell>{item.enabled ? '发布时可见' : '发布时隐藏'}</Table.Cell><Table.Cell><Button variant="ghost" onClick={() => setSelected(item.id)}>编辑</Button></Table.Cell></Table.Row>)}</Table.Body></Table>
        {page && <div className="grid gap-4"><h2 className="text-lg font-semibold">编辑文章</h2><Select label="所属分类" value={page.categoryId || 'none'} items={[{ value: 'none', label: '未分类' }, ...(document.categories ?? []).filter(item => item.kind === (page.contentType ?? 'news')).map(item => ({ value: item.id, label: item.name }))]} onValueChange={value => updatePage({ ...page, categoryId: value === 'none' ? undefined : value ?? undefined })} /><Input label="文章标题" value={page.title} maxLength={170} onChange={e => updatePage({ ...page, title: e.target.value })} /><Input label="公开路径" value={page.path} onChange={e => updatePage({ ...page, path: e.target.value })} /><Switch label="发布时公开此文章" checked={page.enabled} onCheckedChange={enabled => updatePage({ ...page, enabled })} />{articleBody ? <><Suspense fallback={<p>正在加载编辑器…</p>}><RichTextEditor key={page.id} label="正文" text={articleBody.text} value={articleBody.richContent} disabled={disabled} features={['加粗','斜体','项目列表','编号列表','引用','代码块','链接','历史']} onChange={(text, richContent) => updatePage({ ...page, modules: page.modules!.map(module => module.id === articleBody.id ? { ...module, text, richContent } : module) })} /></Suspense><div className="flex flex-wrap items-end gap-3"><Input label="封面图片地址" value={typeof articleBody.image === 'string' ? articleBody.image : ''} onChange={event => updatePage({ ...page, modules: page.modules!.map(module => module.id === articleBody.id ? { ...module, image: event.target.value } : module) })} /><Button onClick={() => setMediaOpen(true)}>从媒体库选择</Button></div><Input label="封面替代文字" value={typeof articleBody.alt === 'string' ? articleBody.alt : ''} onChange={event => updatePage({ ...page, modules: page.modules!.map(module => module.id === articleBody.id ? { ...module, alt: event.target.value } : module) })} /></> : <Banner title="这篇文章使用其他内容模块，请保留原有正文结构" />}<SEOFields value={page.seo} change={seo => updatePage({ ...page, seo })} /></div>}
      </>}
      {section === 'media' && <><h2 className="text-lg font-semibold">媒体管理</h2><PortalMedia /></>}
      {section === 'categories' && <><h2 className="text-lg font-semibold">内容分类</h2><div className="flex flex-wrap items-end gap-3"><Input label="分类名称" maxLength={50} value={categoryName} onChange={e => setCategoryName(e.target.value)} /><Select label="分类类型" value={categoryKind} items={[{ value: 'news', label: '新闻公告' }, { value: 'help', label: '帮助文档' }]} onValueChange={value => setCategoryKind(value === 'help' ? 'help' : 'news')} /><Button disabled={!categoryName.trim() || (document.categories?.length ?? 0) >= 100 || (document.categories ?? []).some(item => item.kind === categoryKind && item.name.trim().toLowerCase() === categoryName.trim().toLowerCase())} onClick={() => { change({ ...document, categories: [...(document.categories ?? []), { id: `category-${crypto.randomUUID()}`, name: categoryName.trim(), kind: categoryKind }] }); setCategoryName(''); }}>添加分类</Button></div><Table tableId="apps/admin/views/PortalContent.tsx:2"><Table.Header><Table.Row><Table.Head>分类名称</Table.Head><Table.Head>类型</Table.Head><Table.Head>关联文章</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{(document.categories ?? []).map(item => { const count = document.pages.filter(page => page.categoryId === item.id).length; return <Table.Row key={item.id}><Table.Cell><Input aria-label={`分类名称 ${item.name}`} maxLength={50} value={item.name} onChange={e => change({ ...document, categories: document.categories!.map(category => category.id === item.id ? { ...category, name: e.target.value } : category) })} /></Table.Cell><Table.Cell>{item.kind === 'help' ? '帮助文档' : '新闻公告'}</Table.Cell><Table.Cell>{count}</Table.Cell><Table.Cell><Button disabled={count > 0} onClick={() => change({ ...document, categories: document.categories!.filter(category => category.id !== item.id) })}>{count ? '关联中，不能删除' : '移除草稿分类'}</Button></Table.Cell></Table.Row>; })}</Table.Body></Table></>}
      {section === 'revisions' && <><h2 className="text-lg font-semibold">草稿与发布记录</h2>{history.error ? <Banner variant="error" title={getApiMessage(history.error)} /> : history.isPending ? <p>正在读取记录…</p> : <Table tableId="apps/admin/views/PortalContent.tsx:3"><Table.Header><Table.Row><Table.Head>版本</Table.Head><Table.Head>动作</Table.Head><Table.Head>时间</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{(history.data ?? []).map(item => <Table.Row key={item.id}><Table.Cell>{item.revision}</Table.Cell><Table.Cell>{item.action === 'publish' ? '发布' : item.action === 'draft' ? '保存草稿' : item.action === 'rollback' ? '回滚发布' : item.action}</Table.Cell><Table.Cell>{item.createdAt}</Table.Cell><Table.Cell><Button disabled={disabled || dirty} onClick={() => { rollback.reset(); setRollbackTarget(item); }}>回滚到此版本</Button></Table.Cell></Table.Row>)}</Table.Body></Table>}</>}
      {section === 'pending' && <div className="grid min-h-48 content-center justify-items-center gap-3"><Text as="h2" variant="heading2">{sectionTitle}</Text><Text variant="secondary">此栏目尚未接入功能</Text></div>}
    </LayerCard.Primary></LayerCard></fieldset>
    <LayerDialog.Root open={Boolean(previewState)} onOpenChange={open => { if (!open) setPreviewState(null); }}><LayerDialog.Content size="xl" closeLabel="关闭"><LayerDialog.Title>草稿预览</LayerDialog.Title><LayerDialog.Description>预览与官网共用页面组件，内容仅用于当前预览，不会改变公开版本。</LayerDialog.Description><LayerDialog.Body>{previewState&&<PortalDraftPreview document={previewState.document} initialPath={previewState.path}/>}</LayerDialog.Body></LayerDialog.Content></LayerDialog.Root>
    <LayerDialog.Root open={mediaOpen} onOpenChange={setMediaOpen}><LayerDialog.Content size="xl" closeLabel="关闭"><LayerDialog.Title>选择封面图片</LayerDialog.Title><LayerDialog.Body><PortalMedia onSelect={item => { if (page && articleBody) updatePage({ ...page, modules: page.modules!.map(module => module.id === articleBody.id ? { ...module, image: portalMediaURL(item.id), alt: item.name } : module) }); setMediaOpen(false); }} /></LayerDialog.Body></LayerDialog.Content></LayerDialog.Root>
    <LayerDialog.Root open={Boolean(rollbackTarget)} dismissDisabled={rollback.isPending} onOpenChange={open => { if (!open) setRollbackTarget(null); }}><LayerDialog.Content><LayerDialog.Title>确认回滚并发布版本 {rollbackTarget?.revision}？</LayerDialog.Title><LayerDialog.Description>该版本将替换整个站点的当前草稿并立即发布，包括导航和全部文章。现有版本保留在历史记录中。</LayerDialog.Description><LayerDialog.Body>{rollback.error ? <Banner variant="error" title="回滚失败" description={getApiMessage(rollback.error)} /> : null}</LayerDialog.Body><LayerDialog.Actions dismissLabel="取消"><LayerDialog.Action variant="destructive" disabled={rollback.isPending || dirty} loading={rollback.isPending} onClick={() => rollback.mutate()}>确认回滚并发布</LayerDialog.Action></LayerDialog.Actions></LayerDialog.Content></LayerDialog.Root>
    <LayerDialog.Root open={confirm} dismissDisabled={disabled} onOpenChange={setConfirm}><LayerDialog.Content><LayerDialog.Title>确认发布整个站点？</LayerDialog.Title><LayerDialog.Description>站务信息、SEO、导航和所有页面草稿将一起生效。隐藏文章不会公开。发布失败时保留原公开版本。</LayerDialog.Description><LayerDialog.Body>{save.error ? <Banner variant="error" title="发布失败" description={getApiMessage(save.error)} /> : null}</LayerDialog.Body><LayerDialog.Actions dismissLabel="取消"><LayerDialog.Action variant="primary" loading={disabled} disabled={disabled} onClick={() => save.mutate(true)}>确认发布</LayerDialog.Action></LayerDialog.Actions></LayerDialog.Content></LayerDialog.Root>
  </div></div></div>;
}
