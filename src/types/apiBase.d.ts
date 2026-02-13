declare module "@/lib/apiBase" {
  export function fetchApi(path: string, init?: RequestInit): Promise<Response>;
  export function apiUrl(path: string): string;
  export function ensureApiBase(force?: boolean): Promise<string>;
  export function getApiDiagnostics(): any;
  export function initApiDetection(): void;
}

