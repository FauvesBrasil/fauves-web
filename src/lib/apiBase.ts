// Centraliza a base da API com detecção resiliente.
// Estratégia revisada:
// 1. Usa VITE_BACKEND_URL se definido e responder 200 OK.
// 2. Usa base previamente persistida (localStorage) se ainda responde.
// 3. Prioriza portas do backend conhecido: 4000 primeiro; só tenta 4001 depois.
// 4. Ignora respostas 500 (trata como não saudável) e conexões recusadas.
// 5. Evita spam: remove candidato após 2 falhas consecutivas.
// 6. Persiste a base saudável (chave localStorage 'API_BASE_WORKING').

const LS_KEY = 'API_BASE_WORKING';
const stored = (typeof window !== 'undefined') ? window.localStorage.getItem(LS_KEY) : null;
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
// If the configured env base equals the current frontend origin (e.g. VERCEL set to the site URL),
// ignore it because that causes the app to call itself (leading to 405). Use default backend instead.
try {
  if (typeof window !== 'undefined' && finalEnvBase) {
    const origin = window.location.origin.replace(/\/$/, '');
    const norm = finalEnvBase.replace(/\/$/, '');
    if (norm === origin || norm.startsWith(origin + '/')) {
      console.log('[apiBase] detected VITE_API_BASE pointing to frontend origin; switching to default backend');
      finalEnvBase = DEFAULT_PROD_BACKEND;
    }
  }
} catch (e) {}

// Ordem montada dinamicamente
const candidates: string[] = [];
// In non-production prefer local candidates first and leave envBase as a last-resort candidate.
if (stored && !candidates.includes(stored)) candidates.push(stored);
['http://localhost:4000','http://127.0.0.1:4000']
  .forEach(b => { if (!candidates.includes(b)) candidates.push(b); });
if (finalEnvBase) {
  if (isProd) candidates.unshift(finalEnvBase); // production: envBase (or default) is authoritative
  else if (!candidates.includes(finalEnvBase)) candidates.push(finalEnvBase); // dev: keep envBase as fallback
}

let resolvedBase: string | null = null; // base atual saudável
let resolving = false;                 // lock de resolução
let resolvingPromise: Promise<string> | null = null; // promessa compartilhada para evitar tempestade
const failureCount: Record<string, number> = {}; // contador de falhas por base
let lastResolutionTs = 0;
let backendDownUntil = 0; // epoch ms até quando evitamos novas tentativas
const BACKOFF_MS = 5000;

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
  } catch {}
  return false;
}

export async function ensureApiBase(force = false): Promise<string> {
  // If an envBase is provided (build-time), prefer it. Previously we only auto-used it in production
  // to allow local development probes; but in hosted previews/envs we want to trust the build-time value
  // to avoid resolving to localhost. This reduces cases where the app tries http://localhost:4000 in deployed sites.
  if (finalEnvBase) {
    // In production we trust the build-time env base. In development/preview, probe it briefly
    // and if it doesn't respond we fall back to probing candidates (localhost). This avoids
    // pointing the client to a VITE_API_BASE that is unreachable from the current environment.
    if (isProd) {
      resolvedBase = finalEnvBase;
      console.log('[apiBase] using env VITE_API_BASE (production)');
      return resolvedBase;
    }
    // Non-production: probe the envBase quickly. If it responds, use it; otherwise continue resolution.
    try {
      // quick probe with a short timeout
      const ok = await probe(finalEnvBase);
      if (ok) {
        resolvedBase = finalEnvBase;
        console.log('[apiBase] using env VITE_API_BASE (build-time)');
        return resolvedBase;
      }
      console.log('[apiBase] env VITE_API_BASE did not respond, falling back to probing candidates');
    } catch (e) {
      console.log('[apiBase] probe of VITE_API_BASE failed, falling back to candidates');
    }
  }
  const now = Date.now();
  if (!force && resolvedBase && (now - lastResolutionTs) < 5000) return resolvedBase;
  if (!force && backendDownUntil && now < backendDownUntil && resolvedBase) return resolvedBase; // não reprobe durante backoff
  if (resolvingPromise) return resolvingPromise;
  resolving = true;
  const doResolve = async () => {
    let picked: string | null = null;
    for (const base of [...candidates]) {
      if (failureCount[base] && failureCount[base] >= 2) continue;
      const ok = await probe(base);
      if (ok) { picked = base; break; }
      failureCount[base] = (failureCount[base] || 0) + 1;
      if (failureCount[base] >= 2 && base === stored) {
        try { window.localStorage.removeItem(LS_KEY); } catch {}
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
      try { if (picked && Date.now() < backendDownUntil) { /* não persistir se sabemos que está down */ } else if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, picked); } catch {}
      if (changed) console.log('[apiBase] base resolvida', picked);
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
  try { authToken = (typeof window !== 'undefined') ? window.localStorage.getItem('AUTH_TOKEN_V1') : null; } catch {}
  const headers = new Headers(init?.headers || {});
  if (authToken && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + authToken);
  const finalInit: RequestInit = { ...init, headers };
  // Apply a request timeout so slow endpoints don't hang forever. Default 4s.
  const TIMEOUT_MS = 4000;
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

// Chamar cedo (ex.: em App.tsx) para já resolver a base antes dos primeiros hooks.
export function initApiDetection() {
  ensureApiBase().catch(()=>{});
}