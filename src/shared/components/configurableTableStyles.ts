/** Single visual source for every ConfigurableTable; Kumo tokens only. */
export const configurableTableStyles = {
  "table": "border-separate border-spacing-0 [&_th]:h-11 [&_th]:bg-kumo-canvas! [&_th]:border-kumo-line! [&_th]:px-3 [&_th]:py-2! [&_th]:text-sm! [&_th]:font-medium! [&_th]:text-kumo-subtle [&_td]:h-11 [&_td]:border-b [&_td]:border-kumo-line [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle [&_tbody>tr]:bg-kumo-base [&_tbody>tr]:even:bg-kumo-base [&_tbody>tr:hover]:bg-kumo-overlay [&_tbody>tr:last-child_td]:border-b-0",
  "resizeLine": "block h-1/2 w-px bg-kumo-line transition-all group-hover/resize:h-full group-hover/resize:w-0.5 group-hover/resize:bg-kumo-brand group-focus-visible/resize:h-full group-focus-visible/resize:w-0.5 group-focus-visible/resize:bg-kumo-brand",
  "headerControls": "inline-flex w-0 shrink-0 overflow-hidden opacity-0 has-data-popup-open:w-auto has-data-popup-open:overflow-visible has-data-popup-open:opacity-100 group-hover/header:w-auto group-hover/header:overflow-visible group-hover/header:opacity-100 has-focus-visible:w-auto has-focus-visible:overflow-visible has-focus-visible:opacity-100",
  "dragPreview": "flex min-h-11 w-48 cursor-grabbing items-center gap-1 rounded-md border border-kumo-line bg-kumo-canvas px-4 py-2 text-sm font-medium text-kumo-subtle shadow-lg",
  "fieldsDialog": "flex top-1/2! -translate-y-1/2 w-[500px] sm:w-[500px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] flex-col overflow-hidden p-0 sm:max-h-[calc(100dvh-8rem)]"
} as const;
