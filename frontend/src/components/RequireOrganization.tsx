import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrgLogoUpload from "./OrgLogoUpload";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from 'react-router-dom';

interface RequireOrganizationProps {
  // onCreated may return a Promise (for example parent awaits a refresh) or void
  onCreated: (org: any) => Promise<any> | void;
  onClose?: () => void;
}

const RequireOrganization: React.FC<RequireOrganizationProps> = ({ onCreated, onClose }) => {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState<File|null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  // animation phases after successful create
  // 0 = none, 1..5 = steps (Criando organização, Montando palco, Preparando camarim, Testando luzes, Testando som)
  const [phase, setPhase] = useState<number>(0);
  // when true, show the full-screen immersive animation overlay
  const [fullScreenAnimating, setFullScreenAnimating] = useState(false);
  // set to true briefly to play a closing animation before hiding the overlay
  const [exiting, setExiting] = useState(false);
  const { user, loading: userLoading } = useAuth();
  const navigate = useNavigate();
  // Preview do logo
  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  };
  // Removido: supabase. Usuário agora vem do AuthContext/JWT.
  const handleCreate = async () => {
    setError("");
    console.log('[RequireOrganization] Clique no botão Criar organização');
    if (userLoading || user === undefined) {
      setError("Aguardando autenticação do usuário...");
      return;
    }
    if (!user || !user.id) {
      setError("Usuário não autenticado. Faça login novamente.");
      return;
    }
    if (!orgName.trim()) {
      setError("Nome da organização obrigatório");
      return;
    }

    // Start the immersive full-screen animation immediately and run network work in background
    setFullScreenAnimating(true);
    setPhase(1);
    const phaseDurations = [0, 900, 1000, 1000, 900, 800]; // ms for phases 1..5
    const timers: number[] = [];

    // advance visual phases according to durations
    let acc = 0;
    for (let p = 2; p <= 5; p++) {
      acc += phaseDurations[p - 1] || 900;
      const t = window.setTimeout(() => setPhase(p), acc);
      timers.push(t as unknown as number);
    }

    // a promise that resolves after the minimum animation duration (sum of durations)
    const minAnimDuration = phaseDurations.slice(1, 6).reduce((a, b) => a + b, 0);
    const animPromise = new Promise<void>((resolve) => {
      const t = window.setTimeout(() => resolve(), minAnimDuration + 300);
      timers.push(t as unknown as number);
    });

    // perform upload + create in background
    const networkPromise = (async () => {
      setLoading(true);
      let finalLogoUrl = "";
      try {
        if (logoFile) {
          const formData = new FormData();
          formData.append('file', logoFile, logoFile.name || 'logo.png');
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!uploadRes.ok) {
            const errText = await uploadRes.text().catch(() => '');
            throw new Error('Erro ao enviar imagem: ' + errText);
          }
          const data = await uploadRes.json().catch(() => ({}));
          finalLogoUrl = data?.url || '';
        }

        const attempt = async (url: string) => {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: orgName,
              userId: user.id,
              userEmail: user.email,
              userName: user.name || user.email?.split('@')[0] || null,
              logoUrl: finalLogoUrl,
            }),
          });
          return r;
        };

        let res = await attempt('/api/organization');
        if (!res.ok) {
          try { res = await attempt('http://localhost:4000/api/organization'); } catch (e) { /* swallow */ }
        }
        if (!res) throw new Error('Falha de rede ao criar organização');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || err?.message || `Erro ao criar organização (status ${res.status})`);
        }
        const org = await res.json().catch(() => ({}));
        return org;
      } finally {
        // don't set loading false here; we'll clear after the overall flow finishes
      }
    })();

    // Wait for network + min animation to finish. When network resolves, call onCreated and await its promise as well.
    try {
      const org = await networkPromise;
      // call parent's onCreated (may return a promise)
      let parentPromise: Promise<any> | void = undefined;
      try { parentPromise = onCreated(org) as any; } catch (e) { console.warn('[RequireOrganization] onCreated threw', e); }

      // Wait for both animation minimum and parent refresh (if present)
      if (parentPromise && typeof parentPromise.then === 'function') {
        await Promise.all([animPromise, parentPromise]);
      } else {
        await animPromise;
      }

  // show a final flourish (confetti / lights) for 700ms
  setPhase(5);
  await new Promise((r) => { const t = window.setTimeout(r, 700); timers.push(t as unknown as number); });

  // play exit animation then hide overlay
  setExiting(true);
  await new Promise((r) => { const t = window.setTimeout(r, 420); timers.push(t as unknown as number); r(null); });
  setFullScreenAnimating(false);
  setExiting(false);
  setPhase(0);
  setLoading(false);
  if (onClose) onClose();
  else { try { navigate(-1); } catch(e) { window.history.back(); } }
    } catch (e: any) {
  // network or parent refresh failed — stop animation and show error inside modal
  console.error('[RequireOrganization] criação falhou', e);
  // clear timers
  timers.forEach(t => clearTimeout(t));
  // play a short exit animation to avoid abrupt removal
  setExiting(true);
  await new Promise((r) => { const t = window.setTimeout(r, 300); timers.push(t as unknown as number); });
  setFullScreenAnimating(false);
  setExiting(false);
  setPhase(0);
  setLoading(false);
  setError(e?.message || 'Erro ao criar organização');
    }
  };
  if (user === undefined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-2xl p-8 min-w-[340px] flex flex-col items-center">
          <span className="text-indigo-900 text-lg font-semibold">Carregando autenticação...</span>
        </div>
      </div>
    );
  }
  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F6F7F9]/90">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-8 flex flex-col items-center border border-[#E5E7EB]" style={{maxWidth: 420, minWidth: 340}}>
        {/* Intentionally no top-right close button: modal must be dismissed only via the Cancel button which navigates back. */}
        {/* if animating, show the circular stepper animation UI */}
  {!fullScreenAnimating && (
          <>
            <span className="text-[18px] font-bold text-[#091747] text-center mb-7 leading-snug" style={{lineHeight: 1.25}}>
              Crie o perfil da sua organização<br />antes de cadastrar seu evento.
            </span>
            <div className="flex items-center gap-4 w-full justify-center mb-7">
              <OrgLogoUpload logoUrl={logoUrl} onSelect={handleLogoSelect} />
              <Input
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="Nome da organização"
                className="flex-1 h-14 rounded-full border border-[#E5E7EB] bg-white px-6 text-base text-[#091747] font-medium shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-[#2A2AD7]"
                style={{maxWidth: 260, minWidth: 180}}
              />
            </div>
            {error && <div className="text-red-600 text-sm mb-2 text-center w-full">{error}</div>}
            <Button
              onClick={handleCreate}
              disabled={loading || userLoading || !user || !user.id || !orgName.trim()}
              className="w-full mt-0 shadow bg-[#2A2AD7] hover:bg-[#1e1eb8] text-white font-bold rounded-full py-4 text-base text-center"
              style={{minHeight: 56, fontSize: 18, background:'#2A2AD7'}}
            >
              {/* Do not show 'Criando...' on the button — the immersive overlay takes over */}
              {userLoading ? "Carregando..." : "Criar organização"}
            </Button>
            <div className="w-full mt-3">
              <Button
                variant="ghost"
                onClick={() => {
                  // navigate back to previous page; do not allow closing the modal in-place
                  try { navigate(-1); } catch (e) { window.history.back(); }
                  if (onClose) onClose();
                }}
                className="w-full mt-0 text-sm text-gray-700 bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-full py-3"
              >
                Cancelar
              </Button>
            </div>
          </>
        )}

        {/* When fullScreenAnimating is active, we render the immersive overlay separately below */}
      </div>
    </div>
    {/* Full-screen 5-phase circular animation overlay (matches provided screenshots) */}
    {fullScreenAnimating && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <style>{`
          .phase-text { transition: opacity 420ms ease, transform 420ms ease; }
          .phase-text.fade { opacity: 0.25; transform: translateY(4px); }
          .phase-text.current { opacity: 1; transform: translateY(0); }
          .ring-bg { transition: opacity 300ms ease; }
          .ring-arc { transition: stroke-dasharray 500ms cubic-bezier(.2,.9,.2,1); stroke-linecap: round; }
        `}</style>

        <div className={`relative z-10 w-full max-w-xs px-6 py-20 flex flex-col items-center ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`} style={{transition:'transform 420ms ease, opacity 420ms ease'}}>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute -rotate-90" width="160" height="160" viewBox="0 0 100 100">
                {/* light grey full ring */}
                <circle cx="50" cy="50" r="44" stroke="#F1F5F9" strokeWidth="8" fill="none" className="ring-bg" />
                {/* small red arc proportional to phase (thinner) */}
                <circle cx="50" cy="50" r="44" stroke="#EF4444" strokeWidth="4" fill="none"
                  className="ring-arc"
                  strokeDasharray={`${(phase / 5) * 276.46} 276.46`} />
              </svg>

              <div className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-md">
                {/* phase-specific icons centered; keep same sizes as previous logo */}
                <div className="w-20 h-20 flex items-center justify-center">
                  {phase === 1 && (
                    // upload / org logo placeholder - use uploaded logo if present
                    logoUrl ? <img src={logoUrl} alt="logo" className="w-20 h-20 object-cover rounded-full" /> : (
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="1.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    )
                  )}
                  {phase === 2 && (
                    // stage icon
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.3"><path d="M2 9h20v7H2z"/><path d="M7 9v-3h2v3"/><path d="M15 9v-3h2v3"/></svg>
                  )}
                  {phase === 3 && (
                    // dressing room / door icon
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.3"><rect x="4" y="3" width="16" height="18" rx="1"/><circle cx="15" cy="12" r="0.8"/></svg>
                  )}
                  {phase === 4 && (
                    // lights icon
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.3"><path d="M12 2l4 8H8l4-8z"/><path d="M5 13h14v6H5z"/></svg>
                  )}
                  {phase === 5 && (
                    // speaker icon
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.3"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M19 8a4 4 0 0 1 0 8"/></svg>
                  )}
                </div>
              </div>
            </div>

            {/* sliding stacked phase texts: we render all items in a column and translateY the inner stack for 'arrasto' */}
            <div className="relative overflow-hidden h-8 mt-2" style={{width:'240px'}} aria-hidden={false}>
              <style>{`.texts-inner { transition: transform 520ms cubic-bezier(.2,.9,.2,1); } .texts-item { transition: opacity 260ms ease; }`}</style>
              {/* lineHeight in px must match visual; using 32 for safe spacing */}
              {
                (() => {
                  const lineH = 32; // px
                  const translateY = -((phase - 1) * lineH);
                  return (
                    <div className="texts-inner" style={{transform: `translateY(${translateY}px)`}}>
                      <div className="texts-item text-[18px] font-semibold text-slate-900" style={{height: lineH, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: phase === 1 ? 1 : 0.25}}>Criando organização...</div>
                      <div className="texts-item text-[18px] text-slate-400" style={{height: lineH, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: phase === 2 ? 1 : 0.25}}>Montando palco...</div>
                      <div className="texts-item text-[18px] text-slate-400" style={{height: lineH, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: phase === 3 ? 1 : 0.25}}>Preparando camarim...</div>
                      <div className="texts-item text-[18px] text-slate-400" style={{height: lineH, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: phase === 4 ? 1 : 0.25}}>Testando luzes...</div>
                      <div className="texts-item text-[18px] text-slate-400" style={{height: lineH, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: phase === 5 ? 1 : 0.25}}>Testando som...</div>
                    </div>
                  );
                })()
              }
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
export default RequireOrganization;
