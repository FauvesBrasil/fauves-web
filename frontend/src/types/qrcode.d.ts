// Minimal type declarations for 'qrcode' package to silence TS 2307 if @types not present.
// Extend as needed.
declare module 'qrcode' {
  interface QRCodeToDataURLOptions {
    margin?: number;
    width?: number;
    scale?: number;
    color?: { dark?: string; light?: string };
  }
  export function toDataURL(text: string, opts?: QRCodeToDataURLOptions): Promise<string>;
}
