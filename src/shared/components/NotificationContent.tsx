// Renders a notification body the way the recipient sees it. The stored
// snapshots come from server-side templates and may contain simple HTML, so
// scriptable markup and event handlers are stripped before rendering.
export function sanitizeNotificationHtml(input: string): string {
 return input
  .replace(/<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
  .replace(/<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)[^>]*\/?>/gi, '')
  .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/\s(srcdoc|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/javascript:/gi, '');
}
const prose = "text-sm leading-relaxed text-kumo-default [&_a]:underline [&_br]:block [&_h1]:my-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:my-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:my-1 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:my-2 [&_td]:border [&_td]:border-kumo-line [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-kumo-line [&_th]:px-2 [&_th]:py-1";
export function NotificationContent({html,empty="未记录内容快照",className=""}:{html?:string;empty?:string;className?:string}){
 const raw=(html??"").trim();
 if(!raw) return <p className="text-sm text-kumo-subtle">{empty}</p>;
 const markup=/<[a-z][\s\S]*?>/i.test(raw);
 if(!markup) return <pre className={`whitespace-pre-wrap break-words font-sans ${prose} ${className}`}>{raw}</pre>;
 return <div className={`rounded-md border border-kumo-line bg-kumo-base p-3 ${prose} ${className}`} dangerouslySetInnerHTML={{__html:sanitizeNotificationHtml(raw)}} />;
}
