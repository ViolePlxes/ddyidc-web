import { Dialog as KumoDialog, type DialogProps } from '@cloudflare/kumo';

/** Keep Kumo behavior and visuals; share viewport/scroll constraints across apps. */
function DialogContent({ className = '', ...props }: DialogProps) {
  return <KumoDialog {...props} className={`ddy-dialog ${className}`} />;
}

export const Dialog = Object.assign(DialogContent, {
  Root: KumoDialog.Root,
  Trigger: KumoDialog.Trigger,
  Title: KumoDialog.Title,
  Description: KumoDialog.Description,
  Close: KumoDialog.Close,
});
