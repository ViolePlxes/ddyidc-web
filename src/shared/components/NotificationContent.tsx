// Renders a notification body the way the recipient sees it. The stored
// snapshots come from server-side templates and may contain simple HTML, so
// scriptable markup and event handlers are stripped before rendering.
export function sanitizeNotificationHtml(input: string): string {
 const template = document.createElement("template");
 template.innerHTML = input;
 const allowed = new Set(["P","BR","DIV","SPAN","STRONG","B","EM","I","U","S","UL","OL","LI","H1","H2","H3","H4","BLOCKQUOTE","PRE","CODE","TABLE","THEAD","TBODY","TFOOT","TR","TH","TD","HR","A"]);
 const blocked = new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","SVG","MATH","FORM","INPUT","BUTTON","TEXTAREA","SELECT","TEMPLATE"]);
 const clean = (parent: Element | DocumentFragment) => {
  for (const node of Array.from(parent.childNodes)) {
   if (node.nodeType === Node.COMMENT_NODE) { node.remove(); continue; }
   if (!(node instanceof Element)) continue;
   if (blocked.has(node.tagName)) { node.remove(); continue; }
   clean(node);
   if (!allowed.has(node.tagName)) { node.replaceWith(...Array.from(node.childNodes)); continue; }
   for (const attr of Array.from(node.attributes)) {
    const key=attr.name.toLowerCase();
    if (node.tagName === "A" && key === "href") {
     try { const url=new URL(attr.value); if (["https:","http:","mailto:"].includes(url.protocol)) { node.setAttribute("rel","noopener noreferrer"); continue; } } catch { /* Drop invalid links. */ }
    }
    if (["TH","TD"].includes(node.tagName) && ["colspan","rowspan"].includes(key) && /^[1-9][0-9]?$/.test(attr.value)) continue;
    node.removeAttribute(attr.name);
   }
  }
 };
 clean(template.content);
 return template.innerHTML;
}
const prose = "text-sm leading-relaxed text-kumo-default [&_a]:underline [&_br]:block [&_h1]:my-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:my-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:my-1 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:my-2 [&_td]:border [&_td]:border-kumo-line [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-kumo-line [&_th]:px-2 [&_th]:py-1";
export function NotificationContent({html,empty="未记录内容快照",className=""}:{html?:string;empty?:string;className?:string}){
 const raw=(html??"").trim();
 if(!raw) return <p className="text-sm text-kumo-subtle">{empty}</p>;
 const markup=/<[a-z][\s\S]*?>/i.test(raw);
 if(!markup) return <pre className={`whitespace-pre-wrap break-words font-sans ${prose} ${className}`}>{raw}</pre>;
 return <div className={`rounded-md border border-kumo-line bg-kumo-base p-3 ${prose} ${className}`} dangerouslySetInnerHTML={{__html:sanitizeNotificationHtml(raw)}} />;
}
