declare module "@novnc/novnc" {
  export default class RFB extends EventTarget {
    constructor(target: HTMLElement, urlOrChannel: string | WebSocket, options?: {
      credentials?: { username?: string; password?: string; target?: string };
      shared?: boolean;
    });
    scaleViewport: boolean;
    resizeSession: boolean;
    showDotCursor: boolean;
    viewOnly: boolean;
    disconnect(): void;
    sendCtrlAltDel(): void;
    sendKey(keysym: number, code: string, down?: boolean): void;
    clipboardPasteFrom(text: string): void;
  }
}
