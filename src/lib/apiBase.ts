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
// In development, ignore build-time env bases that point to localhost (they often
// come from CI or incorrect configs and cause the client to probe a non-existent
// host like :3000). Keep this only for non-production to avoid breaking intended setups.
try {
  if (!isProd && finalEnvBase && /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(finalEnvBase)) {
    console.debug('[apiBase] ignoring VITE_API_BASE pointing to localhost in dev:', finalEnvBase);
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
          // Rewrite string URLs starting with /api or absolute same-origin /api
          if (typeof input === 'string') {
            if (input.startsWith('/api/') || input === '/api' || input.startsWith('/api?')) {
              const rewritten = DEFAULT_PROD_BACKEND.replace(/\/$/, '') + input;
              console.debug('[apiBase] fetch override: rewriting', input, '->', rewritten);
              input = rewritten;
            }
            // also handle relative paths that start with './api' or without leading slash
            else if (/^\.?\/?api\//.test(input)) {
              const path = input.replace(/^\.?\//, '/');
              const rewritten = DEFAULT_PROD_BACKEND.replace(/\/$/, '') + path;
              console.debug('[apiBase] fetch override: rewriting', input, '->', rewritten);
              input = rewritten;
            }
          } else if (input instanceof Request) {
            const reqUrl = new URL(input.url, window.location.origin);
            if (reqUrl.origin === window.location.origin && reqUrl.pathname.startsWith('/api')) {
              const newUrl = DEFAULT_PROD_BACKEND.replace(/\/$/, '') + reqUrl.pathname + reqUrl.search;
              console.debug('[apiBase] fetch override: rewriting Request ->', newUrl);
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
  // server doesn't serve /api and prevents noisy probes.
  try {
    if (!((window as any).__apiFetchPatchedDev) && window.location) {
      const h = window.location.hostname;
      if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
        const originalFetchDev = window.fetch.bind(window);
        (window as any).__apiFetchPatchedDev = true;
        window.fetch = async (input: RequestInfo, init?: RequestInit) => {
          try {
            if (typeof input === 'string') {
              // rewrite /api, /api/whatever or api/whatever
              if (input === '/api' || input.startsWith('/api/') || /^\.?\/api\//.test(input) || /^api\//.test(input)) {
                const path = input.startsWith('/') ? input : (input.startsWith('./') ? input.replace(/^\.\//, '/') : '/' + input);
                const targetBase = (finalEnvBase && !/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(finalEnvBase)) 
                  ? finalEnvBase.replace(/\/$/, '') 
                  : 'http://127.0.0.1:4000';
                input = targetBase + path;
              }
            } else if (input instanceof Request) {
              const reqUrl = new URL(input.url, window.location.origin);
              if (reqUrl.origin === window.location.origin && reqUrl.pathname.startsWith('/api')) {
                const newUrl = 'http://127.0.0.1:4000' + reqUrl.pathname + reqUrl.search;
                input = new Request(newUrl, input);
              }
            }
          } catch (e) {
            // swallow
          }
          return originalFetchDev(input as any, init);
        };
        console.debug('[apiBase] fetch override (dev): rewriting /api -> http://127.0.0.1:4000');
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
      console.debug('[apiBase] detected VITE_API_BASE pointing to frontend origin; switching to default backend');
      finalEnvBase = DEFAULT_PROD_BACKEND;
    }
  }
} catch (e) { }

// Ordem montada dinamicamente
// Ordem montada dinamicamente
let candidates: string[] = [];
const localCandidates = ['http://localhost:4000', 'http://127.0.0.1:4000'];

if (isProd) {
  // In production: stored/cached base is most trusted, then envBase, then defaults
  if (stored && !candidates.includes(stored)) candidates.push(stored);
  if (finalEnvBase) candidates.unshift(finalEnvBase); // authoritative
} else {
  // In development: prefer localhost candidates first! 
  // This prevents a stale production URL in localStorage from hijacking the dev session.
  localCandidates.forEach(b => candidates.push(b));
  // Add envBase if exists (and not localhost, though we filtered that above)
  if (finalEnvBase && !candidates.includes(finalEnvBase)) candidates.push(finalEnvBase);
  // Stored is last resort in dev
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
    if (typeof window !== 'undefined' && window.location && window.location.hostname === 'app.fauves.com.br') {
      resolvedBase = DEFAULT_PROD_BACKEND;
      console.debug('[apiBase] runtime override: using DEFAULT_PROD_BACKEND for app.fauves.com.br');
      return resolvedBase;
    }
  } catch (e) { }
  // If the development fetch override is active, short-circuit resolution and
  // use the local backend. This avoids probing build-time envs or stale
  // localStorage values.
  try {
    if (typeof window !== 'undefined' && (window as any).__apiFetchPatchedDev) {
      const h = window.location && window.location.hostname;
      if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
        const wanted = 'http://127.0.0.1:4000';
        if (resolvedBase !== wanted) {
          resolvedBase = wanted;
          console.debug('[apiBase] dev fetch override active — short-circuiting resolution to', resolvedBase);
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
      console.debug('[apiBase] using env VITE_API_BASE (production)');
      return resolvedBase;
    }
    // Non-production: probe the envBase quickly. If it responds, use it; otherwise continue resolution.
    try {
      // If we've recently seen envBase fail, skip re-probing for a while
      if (Date.now() < envBaseBackoffUntil) {
        console.debug('[apiBase] skipping env VITE_API_BASE probe due to backoff');
      } else {
        // quick probe with a short timeout
        const ok = await probe(finalEnvBase);
        if (ok) {
          resolvedBase = finalEnvBase;
          console.debug('[apiBase] using env VITE_API_BASE (build-time)');
          return resolvedBase;
        }
        // env base failed -> set backoff so we don't spam it
        envBaseBackoffUntil = Date.now() + ENVBASE_BACKOFF_MS;
        console.debug('[apiBase] env VITE_API_BASE did not respond, falling back to probing candidates and backing off for', ENVBASE_BACKOFF_MS, 'ms');
      }
    } catch (e) {
      console.log('[apiBase] probe of VITE_API_BASE failed, falling back to candidates', e);
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
      try { if (picked && Date.now() < backendDownUntil) { /* não persistir se sabemos que está down */ } else if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, picked); } catch { }
      if (changed) console.debug('[apiBase] base resolvida', picked);
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

// Helper para fazer fetch com fallback automático se a base falhar na primeira tentativa.
export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const now = Date.now();
  // Se estamos em período de backoff porque nada respondeu, devolve resposta fake 503 para evitar spam de network errors.
  if (backendDownUntil && now < backendDownUntil) {
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
  const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
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
    // Differentiate timeout/abort from network refused
    // no-op diagnostics removed for production cleanliness
    if (isAbort) {
      return new Response(JSON.stringify({ error: 'request_aborted', base: resolvedBase, hint: 'request aborted or timed out' }), { status: 504, headers: { 'Content-Type': 'application/json' } });
    }
    // Resposta offline controlada
    return new Response(JSON.stringify({ error: 'network_refused', base: resolvedBase, hint: 'API não acessível agora. Repetiremos automaticamente.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

/**
 * Resolve image URLs to incluir a base do backend se necessário
 * @param imagePath - Caminho relativo ou URL completa
 * @returns URL completa ou original
 */
export function resolveImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  const base = resolvedBase || (isProd ? DEFAULT_PROD_BACKEND : 'http://localhost:4000');
  return `${base}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
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
              console.debug('[apiBase] removed stored API_BASE_WORKING because probe failed', storedCandidate);
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
