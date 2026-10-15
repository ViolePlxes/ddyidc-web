import { Dialog as KumoDialog, type DialogProps } from '@cloudflare/kumo';
import { cloneElement, createContext, isValidElement, useContext, useLayoutEffect, useState, type ComponentProps, type ReactElement, type ReactNode } from 'react';

/** Optional visibility owner for data-driven forms retained during exit animation. */
const DialogVisibility = createContext<{ open: boolean; closed: () => void } | undefined>(undefined);

/** Keep the form through Kumo exit animation, then dispose it; reopen with fresh state. */
export function DialogPresence({ children }: { children: ReactNode }) {
  const open = isValidElement(children);
  const [previous, setPrevious] = useState<ReactElement | null>(null);
  const [phase, setPhase] = useState({ open, generation: 0 });
  if (open !== phase.open) setPhase({ open, generation: phase.generation + (open ? 1 : 0) });
  useLayoutEffect(() => { if (isValidElement(children)) setPrevious(children); }, [children]);
  const content = isValidElement(children) ? children : previous;
  return <DialogVisibility.Provider value={{ open, closed: () => { if (!open) setPrevious(null); } }}>
    {content ? cloneElement(content, { key: `${phase.generation}:${content.key ?? ''}` }) : null}
  </DialogVisibility.Provider>;
}

function DialogRoot(props: ComponentProps<typeof KumoDialog.Root>) {
  const visibility = useContext(DialogVisibility);
  return <DialogVisibility.Provider value={undefined}><KumoDialog.Root {...props}
    open={visibility?.open ?? props.open}
    onOpenChangeComplete={open => { props.onOpenChangeComplete?.(open); if (!open) visibility?.closed(); }}
  /></DialogVisibility.Provider>;
}

/** Keep Kumo behavior and visuals; share viewport/scroll constraints across apps. */
function DialogContent({ className = '', ...props }: DialogProps) {
  return <KumoDialog {...props} className={`ddy-dialog p-8 ${className}`} />;
}

function DialogTitle({ className = '', ...props }: ComponentProps<typeof KumoDialog.Title>) {
  return <KumoDialog.Title {...props} className={`text-2xl font-semibold ${className}`} />;
}

function DialogDescription({ className = '', ...props }: ComponentProps<typeof KumoDialog.Description>) {
  return <KumoDialog.Description {...props} className={`text-kumo-subtle ${className}`} />;
}

export const Dialog = Object.assign(DialogContent, {
  Root: DialogRoot,
  Trigger: KumoDialog.Trigger,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: KumoDialog.Close,
});
