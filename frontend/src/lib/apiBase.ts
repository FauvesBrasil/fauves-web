// Centraliza a base da API com detecção resiliente e exports estáveis.

const LS_KEY = 'API_BASE_WORKING';
let resolvedBase: string | null = null;
let lastResolutionTs = 0;
let lastEnsureCall = 0;
const HEALTH_CACHE_TTL_MS = 300000; // 5 min

// Normaliza env
let _rawEnv = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
if (/\/api$/i.test(_rawEnv)) _rawEnv = _rawEnv.replace(/\/api$/i, '');
const envBase = _rawEnv || null;
const isProd = import.meta.env.PROD;
const DEFAULT_PROD_BACKEND = 'https://fauves-backend-production.up.railway.app';

const candidates: string[] = [
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://localhost:8080',
];

try {
  const stored = (typeof window !== 'undefined') ? window.localStorage.getItem(LS_KEY) : null;
  if (stored && !candidates.includes(stored)) candidates.unshift(stored);
} catch {}

if (envBase) {
  if (isProd) candidates.unshift(envBase);
  else if (!candidates.includes(envBase)) candidates.push(envBase);
}

async function isBackendHealthy(base: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 1500);
    const urls = [base + '/api/health', base + '/health'];
    let r: Response | null = null;
    for (const u of urls) {
      try { r = await fetch(u, { signal: ctrl.signal }); if (r.ok) break; } catch {}
    }
    clearTimeout(to);
    if (r && r.ok) {
      try { const j = await r.clone().json(); if (j && typeof j.time === 'string') return true; } catch {}
    }
  } catch {}
  return false;
}

export async function ensureApiBase(force = false): Promise<string> {
  // Produção: confiar no backend conhecido se o env apontar para o próprio frontend
  try {
    if (isProd && typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');
      const base = (envBase || '').replace(/\/$/, '');
      if (base && (base === origin || base.startsWith(origin + '/'))) {
        resolvedBase = DEFAULT_PROD_BACKEND; return resolvedBase;
      }
    }
  } catch {}

  const now = Date.now();
  if (!force && resolvedBase && (now - lastResolutionTs) < HEALTH_CACHE_TTL_MS) return resolvedBase;
  if (!force && now - lastEnsureCall < 500 && resolvedBase) return resolvedBase;
  lastEnsureCall = now;

  for (const base of candidates) {
    const ok = await isBackendHealthy(base);
    if (ok) {
      resolvedBase = base; lastResolutionTs = Date.now();
      try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, base); } catch {}
      return resolvedBase;
    }
  }
  if (!resolvedBase) resolvedBase = 'http://localhost:4000';
  return resolvedBase;
}

export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (!path.startsWith('/')) path = '/' + path;
  return (resolvedBase || 'http://localhost:4000') + path;
}

export function getApiDiagnostics() {
  return { resolvedBase, candidates: [...candidates], lastResolutionTs };
}

export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  await ensureApiBase();
  const url = apiUrl(path);
  const headers = new Headers(init?.headers || {});
  try {
    const token = (typeof window !== 'undefined') ? window.localStorage.getItem('AUTH_TOKEN_V1') : null;
    if (token && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
  } catch {}
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 4000);
  try { const res = await fetch(url, { ...init, headers, signal: ctrl.signal }); clearTimeout(to); return res; }
  catch (e) { clearTimeout(to); throw e; }
}

export function initApiDetection() { try { ensureApiBase().catch(()=>{}); } catch {} }
