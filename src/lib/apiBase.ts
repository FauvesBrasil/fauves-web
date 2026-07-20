import { resolveBundledCoverUrl } from './coverAssets';

// Centraliza a base da API com detecção resiliente.
// Estratégia revisada:
// 1. Usa VITE_BACKEND_URL se definido e responder 200 OK.
// 2. Usa base previamente persistida (localStorage) se ainda responde.
// 3. Prioriza portas do backend conhecido: 4000 primeiro; só tenta 4001 depois.
// 4. Ignora respostas 500 (trata como não saudável) e conexões recusadas.
// 5. Evita spam: remove candidato após 2 falhas consecutivas.
// 6. Persiste a base saudável (chave localStorage 'API_BASE_WORKING').

const LS_KEY = 'API_BASE_WORKING';

// Read stored candidate but keep it if it's localhost (dev environment needs it)
let stored = (typeof window !== 'undefined') ? window.localStorage.getItem(LS_KEY) : null;
// Normaliza env base removendo barras finais e um sufixo /api (para evitar construir /api/api/* em probes)
let _rawEnv = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL) || '';
_rawEnv = _rawEnv.replace(/\/$/, '');
if (/\/api$/i.test(_rawEnv)) {
  _rawEnv = _rawEnv.replace(/\/api$/i, '');
}
const envBase = _rawEnv || null;
const isProd = import.meta.env.PROD;

// Fallback production backend (hardcoded) to guarantee API calls work even if VITE_API_BASE
// was not set in the build environment or Vercel rewrite is not yet applied.
// This is a safe fallback during emergency; we can remove it once Vercel rewrites are stable.
const DEFAULT_PROD_BACKEND = 'https://fauves-backend-production.up.railway.app';
let finalEnvBase = envBase;
// Emergency: in production, force the known Railway backend as authoritative to avoid
// situations where VITE_API_BASE is misconfigured to the frontend origin and causes 405s.
if (isProd) {
  finalEnvBase = DEFAULT_PROD_BACKEND;
}
const hasRemoteEnvBase = !!finalEnvBase;
// In development, ignore build-time env bases that point to localhost (they often
// come from CI or incorrect configs and cause the client to probe a non-existent
// host like :3000). Keep this only for non-production to avoid breaking intended setups.
try {
  if (!isProd && finalEnvBase && /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(finalEnvBase)) {
    finalEnvBase = null;
  }
} catch (e) { }
// Runtime fetch override: rewrite any relative /api requests to the known backend host
// This ensures 3rd-party libraries or legacy calls that do direct fetch('/api/...')
// are routed to the backend instead of being served by Vercel (index.html -> 405).
if (typeof window !== 'undefined') {
  try {
    if (!((window as any).__apiFetchPatched) && window.location && window.location.hostname === 'app.fauves.com.br') {
      const originalFetch = window.fetch.bind(window);
      (window as any).__apiFetchPatched = true;
      window.fetch = async (input: RequestInfo, init?: RequestInit) => {
        try {
          // Injection: add Authorization header if token exists and not already present
          let token: string | null = null;
          try { token = window.localStorage.getItem('AUTH_TOKEN_V1'); } catch (e) {}
          if (token) {
            const headers = new Headers(init?.headers || {});
            if (!headers.has('Authorization')) {
              headers.set('Authorization', 'Bearer ' + token);
              init = { ...init, headers };
            }
          }

          // Rewrite string URLs starting with /api or absolute same-origin /api
          if (typeof input === 'string') {
            if (input.startsWith('/api/') || input === '/api' || input.startsWith('/api?')) {
              const rewritten = DEFAULT_PROD_BACKEND.replace(/\/$/, '') + input;
              input = rewritten;
            }
            // also handle relative paths that start with './api' or without leading slash
            else if (/^\.?\/?api\//.test(input)) {
              const path = input.replace(/^\.?\//, '/');
              const rewritten = DEFAULT_PROD_BACKEND.replace(/\/$/, '') + path;
              input = rewritten;
            }
          } else if (input instanceof Request) {
            const reqUrl = new URL(input.url, window.location.origin);
            if (reqUrl.origin === window.location.origin && reqUrl.pathname.startsWith('/api')) {
              const newUrl = DEFAULT_PROD_BACKEND.replace(/\/$/, '') + reqUrl.pathname + reqUrl.search;
              input = new Request(newUrl, input);
            }
          }
        } catch (e) {
          // swallow
        }
        return originalFetch(input as any, init);
      };
    }
  } catch (e) { }
  // DEV: also patch fetch while developing locally so any relative /api calls
  // are routed to the local backend (127.0.0.1:4000). This avoids the browser
  // hitting stale frontend origins (ex: localhost:3000) when the frontend dev
  // DEV: also patch fetch while developing locally so any relative /api calls
  // are routed to the local backend (127.0.0.1:4000). This avoids the browser
  // hitting stale frontend origins (ex: localhost:3000) when the frontend dev
  // server doesn't serve /api and prevents noisy probes.
  try {
    if (!((window as any).__apiFetchPatchedDev) && window.location) {
      const h = window.location.hostname;
      if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
        const originalFetchDev = window.fetch.bind(window);
        (window as any).__apiFetchPatchedDev = true;

        // Clean up mock tokens if present
        const currentToken = window.localStorage.getItem('AUTH_TOKEN_V1');
        const isMockToken = currentToken === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGZhdXZlcy5jb20uYnIiLCJuYW1lIjoiTGV2eSBDYXN0ZWxvIiwiaXNBZG1pbiI6ZmFsc2V9.signature';
        if (isMockToken) {
          window.localStorage.removeItem('AUTH_TOKEN_V1');
        }

        window.fetch = async (input: RequestInfo, init?: RequestInit) => {
          try {
            const urlString = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
            
            // Intercept auth/me and organization requests to return mock data only if we are using the mock token
            const currentToken = window.localStorage.getItem('AUTH_TOKEN_V1');
            const isMockToken = currentToken === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGZhdXZlcy5jb20uYnIiLCJuYW1lIjoiTGV2eSBDYXN0ZWxvIiwiaXNBZG1pbiI6ZmFsc2V9.signature';

            if (isMockToken) {
              if (urlString.includes('/api/auth/me')) {
                return new Response(JSON.stringify({
                  user: {
                    id: "mock-user-123",
                    email: "test@fauves.com.br",
                    name: "Levy Castelo",
                    isAdmin: false
                  }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
            }

            if (typeof input === 'string') {
              // rewrite /api, /api/whatever or api/whatever
              if (input === '/api' || input.startsWith('/api/') || /^\.?\/api\//.test(input) || /^api\//.test(input)) {
                const path = input.startsWith('/') ? input : (input.startsWith('./') ? input.replace(/^\.\//, '/') : '/' + input);
                const targetBase = hasRemoteEnvBase 
                  ? finalEnvBase.replace(/\/$/, '') 
                  : ((h === 'localhost' || h === '127.0.0.1') ? 'http://localhost:4000' : DEFAULT_PROD_BACKEND);
                input = targetBase + path;
              }
            } else if (input instanceof Request) {
              const reqUrl = new URL(input.url, window.location.origin);
              if (reqUrl.origin === window.location.origin && reqUrl.pathname.startsWith('/api')) {
                const targetBase = hasRemoteEnvBase 
                  ? finalEnvBase.replace(/\/$/, '') 
                  : ((h === 'localhost' || h === '127.0.0.1') ? 'http://localhost:4000' : DEFAULT_PROD_BACKEND);
                const newUrl = targetBase + reqUrl.pathname + reqUrl.search;
                input = new Request(newUrl, input);
              }
            }
          } catch (e) {
            // swallow
          }
          return originalFetchDev(input as any, init);
        };
      }
    }
  } catch (e) { }
}
// If the configured env base equals the current frontend origin (e.g. VERCEL set to the site URL),
// ignore it because that causes the app to call itself (leading to 405). Use default backend instead.
try {
  if (typeof window !== 'undefined' && finalEnvBase) {
    const origin = window.location.origin.replace(/\/$/, '');
    const norm = finalEnvBase.replace(/\/$/, '');
    if (norm === origin || norm.startsWith(origin + '/')) {
      finalEnvBase = DEFAULT_PROD_BACKEND;
    }
  }
} catch (e) { }

// Ordem montada dinamicamente
let candidates: string[] = [];
const localCandidates = ['http://localhost:4000', 'http://127.0.0.1:4000'];

if (isProd) {
  // In production: stored/cached base is most trusted, then envBase, then defaults
  if (stored && !candidates.includes(stored)) candidates.push(stored);
  if (finalEnvBase) candidates.unshift(finalEnvBase); // authoritative
} else {
  // In development: PRIORITIZE localhost over any envBase (like Railway) to ensure local tests work
  localCandidates.forEach(b => { if(!candidates.includes(b)) candidates.push(b); });
  if (finalEnvBase && !candidates.includes(finalEnvBase)) candidates.push(finalEnvBase);
  // Ensure the Railway production URL is always a candidate even in dev if localhost fails
  if (!candidates.includes(DEFAULT_PROD_BACKEND)) candidates.push(DEFAULT_PROD_BACKEND);
  if (stored && !candidates.includes(stored)) candidates.push(stored);
}

// Add local candidates if not present (fallback for prod too)
localCandidates.forEach(b => { if (!candidates.includes(b)) candidates.push(b); });

// Defensive filter: remove null/undefined candidates
try {
  candidates = candidates.filter(c => {
    if (!c) return false;
    return true;
  });
} catch (e) { }

let resolvedBase: string | null = null; // base atual saudável
let resolving = false;                 // lock de resolução
let resolvingPromise: Promise<string> | null = null; // promessa compartilhada para evitar tempestade
const failureCount: Record<string, number> = {}; // contador de falhas por base
const candidateBackoffUntil: Record<string, number> = {}; // timestamp ms até quando não devemos reprobar um candidato
let lastResolutionTs = 0;
const HEALTH_CACHE_TTL_MS = 300000; // 5 min
let backendDownUntil = 0; // epoch ms até quando evitamos novas tentativas
const BACKOFF_MS = 5000;
const CANDIDATE_BACKOFF_MS = 10000; // se um candidato falhar, não tentamos de novo por 10s
let envBaseBackoffUntil = 0; // epoch ms até quando não tentamos usar finalEnvBase
const ENVBASE_BACKOFF_MS = 60 * 1000; // 60s
let lastEnsureCall = 0; // ms - rate limit multiple callers

export type ApiConnectionReason = 'browser-offline' | 'server-unreachable' | 'timeout' | null;
export type ApiConnectionStatus = 'online' | 'offline' | 'checking';

export interface ApiConnectionState {
  status: ApiConnectionStatus;
  reason: ApiConnectionReason;
  checkedAt: number;
}

let apiConnectionState: ApiConnectionState = {
  status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online',
  reason: typeof navigator !== 'undefined' && navigator.onLine === false ? 'browser-offline' : null,
  checkedAt: 0,
};

const apiConnectionListeners = new Set<(state: ApiConnectionState) => void>();

function updateApiConnection(status: ApiConnectionStatus, reason: ApiConnectionReason = null) {
  if (apiConnectionState.status === status && apiConnectionState.reason === reason) return;
  apiConnectionState = { status, reason, checkedAt: Date.now() };
  apiConnectionListeners.forEach(listener => listener(apiConnectionState));
}

export function getApiConnectionState(): ApiConnectionState {
  return apiConnectionState;
}

export function subscribeApiConnection(listener: (state: ApiConnectionState) => void) {
  apiConnectionListeners.add(listener);
  return () => {
    apiConnectionListeners.delete(listener);
  };
}

async function probe(base: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 1800);
    // Se base já for root (sem /api), testamos /api/health; se futuramente /health direto existir, aceitamos fallback.
    const healthUrls = [base + '/api/health', base + '/health'];
    let r: Response | null = null;
    for (const u of healthUrls) {
      try {
        r = await fetch(u, { signal: ctrl.signal });
        if (r.ok) break;
      } catch {
        // tenta próxima
      }
    }
    clearTimeout(to);
    if (r && r.ok) return true; // somente 2xx/3xx considerados saudáveis
  } catch { }
  return false;
}

export async function ensureApiBase(force = false): Promise<string> {
  // Runtime override: if we're running on the public app domain, force the known Railway backend
  // This ensures the running bundle does not attempt to call the frontend origin and receive 405s
  // while Vercel rewrites or envs are being fixed. Temporary emergency measure.
  try {
    if (typeof window !== 'undefined' && window.location) {
      const h = window.location.hostname;
      if (h === 'app.fauves.com.br') {
        resolvedBase = DEFAULT_PROD_BACKEND;
        return resolvedBase;
      }
    }
  } catch (e) { }
  // If the development fetch override is active, short-circuit resolution and
  // use the local backend. This avoids probing build-time envs or stale
  // localStorage values.
  try {
    if (typeof window !== 'undefined' && (window as any).__apiFetchPatchedDev) {
      const h = window.location && window.location.hostname;
      if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
        const wanted = 'http://localhost:4000';
        if (resolvedBase !== wanted) {
          resolvedBase = wanted;
        }
        return resolvedBase;
      }
    }
  } catch (e) { }
  // If an envBase is provided (build-time), prefer it. Previously we only auto-used it in production
  // to allow local development probes; but in hosted previews/envs we want to trust the build-time value
  // to avoid resolving to localhost. This reduces cases where the app tries http://localhost:4000 in deployed sites.
  if (finalEnvBase) {
    // In production we trust the build-time env base. In development/preview, probe it briefly
    // and if it doesn't respond we fall back to probing candidates (localhost). This avoids
    // pointing the client to a VITE_API_BASE that is unreachable from the current environment.
    if (isProd) {
      resolvedBase = finalEnvBase;
      return resolvedBase;
    }
    // Non-production: probe the envBase quickly. If it responds, use it; otherwise continue resolution.
    try {
      // If we've recently seen envBase fail, skip re-probing for a while
      if (Date.now() < envBaseBackoffUntil) {
      } else {
        // quick probe with a short timeout
        const ok = await probe(finalEnvBase);
        if (ok) {
          resolvedBase = finalEnvBase;
          return resolvedBase;
        }
        // env base failed -> set backoff so we don't spam it
        envBaseBackoffUntil = Date.now() + ENVBASE_BACKOFF_MS;
      }
    } catch (e) {
      envBaseBackoffUntil = Date.now() + ENVBASE_BACKOFF_MS;
    }
  }
  const now = Date.now();
  // simple rate limit: if many callers call ensureApiBase in a tight loop, avoid
  // re-triggering full resolution more than once per second unless forced.
  if (!force && now - lastEnsureCall < 1000 && resolvedBase) {
    return resolvedBase;
  }
  lastEnsureCall = now;
  if (!force && resolvedBase && (now - lastResolutionTs) < HEALTH_CACHE_TTL_MS) return resolvedBase;
  if (!force && backendDownUntil && now < backendDownUntil && resolvedBase) return resolvedBase; // não reprobe durante backoff
  if (resolvingPromise) return resolvingPromise;
  resolving = true;
  const doResolve = async () => {
    let picked: string | null = null;
    for (const base of [...candidates]) {
      // skip candidate temporarily if it failed recently
      const backoffUntil = candidateBackoffUntil[base] || 0;
      if (Date.now() < backoffUntil) continue;
      if (failureCount[base] && failureCount[base] >= 2) {
        // mark shorter backoff for aggressively failing hosts
        candidateBackoffUntil[base] = Date.now() + CANDIDATE_BACKOFF_MS;
        continue;
      }
      const ok = await probe(base);
      if (ok) { picked = base; break; }
      failureCount[base] = (failureCount[base] || 0) + 1;
      // if it just failed, avoid immediate re-probing of this same candidate
      candidateBackoffUntil[base] = Date.now() + CANDIDATE_BACKOFF_MS;
      if (failureCount[base] >= 2 && base === stored) {
        try { window.localStorage.removeItem(LS_KEY); } catch { }
      }
    }
    if (!picked) {
      // nenhum saudável agora; mantém resolvedBase anterior ou assume preferida 4000 sem novos probes até backoff expirar
      if (!resolvedBase) picked = 'http://localhost:4000';
      backendDownUntil = Date.now() + BACKOFF_MS;
    }
    if (picked) {
      const changed = picked !== resolvedBase;
      resolvedBase = picked;
      lastResolutionTs = Date.now();
    }
    resolving = false;
    resolvingPromise = null;
    return resolvedBase!;
  };
  resolvingPromise = doResolve();
  return resolvingPromise;
}

export function apiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (!path.startsWith('/')) path = '/' + path;
  // Se já resolvido, retorna direto — senão usa primeiro candidato até ensureApiBase substituir posteriormente
  return (resolvedBase || candidates[0]) + path;
}

// Export base API URL for direct use
export function getApiBase(): string {
  return resolvedBase || candidates[0] || 'http://localhost:4000';
}

// Expor diagnósticos para painéis DEV sem permitir mutação externa
export function getApiDiagnostics() {
  return {
    resolvedBase,
    candidates: [...candidates],
    failureCount: { ...failureCount },
    backendDownUntil,
    backoffRemainingMs: backendDownUntil ? Math.max(backendDownUntil - Date.now(), 0) : 0,
    lastResolutionTs,
  };
}

const responseCache = new Map<string, { data: any; status: number; headers: [string, string][]; timestamp: number }>();
const pendingRequests = new Map<string, Promise<Response>>();

function isCacheable(method: string, path: string): boolean {
  if (method !== 'GET') return false;
  return path.includes('/api/event/') || path.includes('/api/ticket-type/') || path.includes('/events');
}

// Internal implementation of fetchApi to make the actual request.
async function executeFetchApi(path: string, init?: RequestInit): Promise<Response> {
  const now = Date.now();
  // Se estamos em período de backoff porque nada respondeu, devolve resposta fake 503 para evitar spam de network errors.
  if (backendDownUntil && now < backendDownUntil) {
    updateApiConnection(
      'offline',
      typeof navigator !== 'undefined' && navigator.onLine === false ? 'browser-offline' : 'server-unreachable',
    );
    return new Response(JSON.stringify({ error: 'backend_offline', hint: 'API indisponível (cache). Tentando novamente em breve.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
  await ensureApiBase();
  let finalUrl = apiUrl(path);
  // Adiciona Authorization se houver token salvo (lazy, sem depender de contexto React aqui)
  let authToken: string | null = null;
  try { authToken = (typeof window !== 'undefined') ? window.localStorage.getItem('AUTH_TOKEN_V1') : null; } catch { }
  const headers = new Headers(init?.headers || {});
  if (authToken && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + authToken);
  const finalInit: RequestInit = { ...init, headers, credentials: 'include' };
  // Apply a request timeout so slow endpoints don't hang forever. Default 10s.
  const TIMEOUT_MS = 10000;
  const ctrl = new AbortController();
  const userSignal = init && (init as any).signal;
  // If caller passed a signal, propagate its abort to our controller
  if (userSignal) {
    if ((userSignal as AbortSignal).aborted) ctrl.abort();
    else (userSignal as AbortSignal).addEventListener('abort', () => ctrl.abort());
  }
  let timedOut = false;
  const to = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, TIMEOUT_MS);
  const reqStart = Date.now();
  try {
    const finalInitWithSignal: RequestInit = { ...finalInit, signal: ctrl.signal };
    const r = await fetch(finalUrl, finalInitWithSignal);
    if (!r.ok && (r.status >= 500 || r.status === 404) && /\/api\/health$/.test(path)) {
      failureCount[resolvedBase!] = (failureCount[resolvedBase!] || 0) + 1;
      if (failureCount[resolvedBase!] >= 2) {
        backendDownUntil = Date.now() + BACKOFF_MS;
      }
    }
    clearTimeout(to);
    // Qualquer resposta HTTP comprova que o navegador alcançou o servidor. Erros
    // específicos (401, 404, 500 etc.) devem ser tratados pela tela que fez a chamada.
    updateApiConnection('online');
    // no-op diagnostics removed for production cleanliness
    return r;
  } catch (e) {
    clearTimeout(to);
    if (resolvedBase) {
      failureCount[resolvedBase] = (failureCount[resolvedBase] || 0) + 1;
      if (failureCount[resolvedBase] >= 2) {
        backendDownUntil = Date.now() + BACKOFF_MS;
      }
    }
    const isAbort = (e && (e.name === 'AbortError' || e instanceof DOMException && e.name === 'AbortError')) || (ctrl.signal && ctrl.signal.aborted);
    const browserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    // Um cancelamento solicitado pelo próprio componente não significa que a API caiu.
    if (!isAbort || timedOut || browserOffline) {
      updateApiConnection('offline', browserOffline ? 'browser-offline' : (timedOut ? 'timeout' : 'server-unreachable'));
    }
    // Differentiate timeout/abort from network refused
    // no-op diagnostics removed for production cleanliness
    if (isAbort) {
      return new Response(JSON.stringify({ error: 'request_aborted', base: resolvedBase, hint: 'request aborted or timed out' }), { status: 504, headers: { 'Content-Type': 'application/json' } });
    }
    // Resposta offline controlada
    return new Response(JSON.stringify({ error: 'network_refused', base: resolvedBase, hint: 'API não acessível agora. Repetiremos automaticamente.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

// Helper para fazer fetch com fallback automático se a base falhar na primeira tentativa.
export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const method = init?.method?.toUpperCase() || 'GET';
  if (method !== 'GET') {
    responseCache.clear();
  }

  if (!isCacheable(method, path)) {
    return executeFetchApi(path, init);
  }

  const cacheKey = `${method}:${path}`;

  // 1. Check cache
  const cached = responseCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < 15000) { // 15 seconds TTL
    return new Response(JSON.stringify(cached.data), {
      status: cached.status,
      headers: cached.headers,
    });
  }

  // 2. Check pending request to de-duplicate parallel requests
  let pending = pendingRequests.get(cacheKey);
  if (!pending) {
    pending = executeFetchApi(path, init);
    pendingRequests.set(cacheKey, pending);
  }

  try {
    const res = await pending;
    const clonedRes = res.clone();

    if (clonedRes.ok) {
      try {
        const data = await clonedRes.json();
        const headers: [string, string][] = [];
        clonedRes.headers.forEach((value, name) => {
          headers.push([name, value]);
        });
        responseCache.set(cacheKey, {
          data,
          status: clonedRes.status,
          headers,
          timestamp: Date.now(),
        });
      } catch (err) {
        // Fail silent: Not JSON, skip caching
      }
    }

    pendingRequests.delete(cacheKey);
    return res.clone();
  } catch (err) {
    pendingRequests.delete(cacheKey);
    throw err;
  }
}

/**
 * Ignora os backoffs anteriores e testa a API imediatamente. É usado pelo aviso
 * global de conexão e pelo botão "Reconectar".
 */
export async function retryApiConnection(options: { showChecking?: boolean } = {}): Promise<boolean> {
  const browserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (browserOffline) {
    updateApiConnection('offline', 'browser-offline');
    return false;
  }

  if (options.showChecking !== false) updateApiConnection('checking');
  backendDownUntil = 0;
  envBaseBackoffUntil = 0;
  Object.keys(failureCount).forEach(key => { failureCount[key] = 0; });
  Object.keys(candidateBackoffUntil).forEach(key => { candidateBackoffUntil[key] = 0; });

  try {
    const base = await ensureApiBase(true);
    const ok = await probe(base);
    if (ok) {
      backendDownUntil = 0;
      lastResolutionTs = Date.now();
      updateApiConnection('online');
      return true;
    }
  } catch {
    // O estado offline abaixo dá um retorno único e consistente à interface.
  }

  backendDownUntil = Date.now() + BACKOFF_MS;
  updateApiConnection('offline', 'server-unreachable');
  return false;
}

/**
 * Resolve image URLs to incluir a base do backend se necessário
 * @param imagePath - Caminho relativo ou URL completa
 * @returns URL completa ou original
 */
export function resolveImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  const bundledCoverUrl = resolveBundledCoverUrl(imagePath);
  if (bundledCoverUrl) return bundledCoverUrl;

  let path = imagePath;
  // Se estivermos em produção e o caminho apontar para localhost/127.0.0.1, reescreve para o backend de produção.
  if (isProd && (path.includes('localhost') || path.includes('127.0.0.1'))) {
    path = path.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, DEFAULT_PROD_BACKEND);
  }

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('/src/')) {
    return path;
  }
  const base = resolvedBase || (isProd ? DEFAULT_PROD_BACKEND : 'http://localhost:4000');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Chamar cedo (ex.: em App.tsx) para já resolver a base antes dos primeiros hooks.
export function initApiDetection() {
  (async () => {
    try {
      // If we have a stored candidate, probe it once and remove if it's unreachable.
      if (typeof window !== 'undefined') {
        try {
          const storedCandidate = window.localStorage.getItem(LS_KEY);
          if (storedCandidate) {
            // Only remove if probe fails, keep localhost candidates for dev
            const ok = await probe(storedCandidate).catch(() => false);
            if (!ok) {
              try { window.localStorage.removeItem(LS_KEY); } catch (e) { }
            }
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) { }
    ensureApiBase().catch(() => { });
  })();
}
