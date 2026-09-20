export interface OperationStatus { status: number; powerStatus: string; warning?: string }

export async function pollInstanceOperation<T extends OperationStatus>(
  action: string,
  controller: AbortController,
  callbacks: { read: () => Promise<T>; update: (status: T) => void; complete: () => void; timeout: () => void },
  limits = { attempts: 20, duration: 5 * 60_000, interval: 5_000 },
) {
  const target = action === 'stop' ? 'stopped' : 'running';
  const expire = () => {
    if (!controller.signal.aborted) { callbacks.timeout(); controller.abort(); }
  };
  const deadline = setTimeout(expire, limits.duration);
  try {
    for (let attempt = 0; attempt < limits.attempts && !controller.signal.aborted; attempt++) {
      await new Promise<void>(resolve => {
        const done = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', done); resolve(); };
        const timer = setTimeout(done, limits.interval);
        controller.signal.addEventListener('abort', done, { once: true });
      });
      if (controller.signal.aborted) return;
      try {
        const status = await callbacks.read();
        if (controller.signal.aborted) return;
        callbacks.update(status);
        if (!status.warning && status.powerStatus === target) { callbacks.complete(); return; }
      } catch { if (controller.signal.aborted) return; }
    }
    expire();
  } finally { clearTimeout(deadline); }
}
