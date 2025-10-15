import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserDropdown from "@/components/UserDropdown";
import { useAuth } from "@/context/AuthContext";
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';

import { useOrganization } from '@/context/OrganizationContext';
import { toast } from '@/components/ui/sonner';
import RequireOrganization from './RequireOrganization';

interface OrganizationOption { id: string; name: string; }

  const OrganizationDropdown: React.FC = () => {
  const { orgs, selectedOrg, setSelectedOrgById, loading, error, refresh, addOrganization } = useOrganization();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return;
      if (panelRef.current && panelRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label = selectedOrg?.name || (loading ? 'Carregando...' : 'Organização');

  // Small avatar helper that shows the org logo if available, otherwise initials.
  const OrganizationAvatar: React.FC<{ org?: { id: string; name: string; logoUrl?: string } | null; sizeClass?: string }> = ({ org, sizeClass = 'w-8 h-8' }) => {
    const [errored, setErrored] = useState(false);
    useEffect(() => { setErrored(false); }, [org?.logoUrl]);
    if (loading) {
      return <div className={`${sizeClass} rounded-full bg-zinc-200 animate-pulse`} />;
    }
    if (org?.logoUrl && !errored) {
      return (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={org.logoUrl}
          onError={() => setErrored(true)}
          className={`${sizeClass} rounded-full object-cover`} />
      );
    }
    const initials = (org?.name || label || '').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    return (
      <div className={`${sizeClass} rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700`}>{initials}</div>
    );
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-[#F6F7F9] rounded-full pl-1 pr-3 py-1 cursor-pointer focus:outline-none transition hover:bg-[#e9eaf0]"
      >
        <OrganizationAvatar org={selectedOrg} />
  <span className="text-[#091747] font-bold text-[15px] max-w-[140px] truncate" title={label}>{loading ? 'Carregando...' : label}</span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="ml-1 text-[#091747]"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div ref={panelRef} className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-blue-200 z-50 flex flex-col max-h-[320px] overflow-auto">
          <div className="px-5 pt-4 pb-2 text-[13px] font-semibold text-slate-500">Selecione a organização</div>
          {loading && (
            <div className="px-5 py-4 text-[14px] text-slate-500">Carregando...</div>
          )}
          {!loading && orgs.length === 0 && !error && (
            <div className="px-5 py-4 text-[14px] text-slate-500">Nenhuma organização</div>
          )}
          {error && (
            <div className="px-5 py-4 text-[13px] text-red-600">Erro: {error}</div>
          )}
          {/* fire a non-blocking toast on error once */}
          {error && (() => { try { toast.error('Erro ao carregar organizações'); } catch(e){}; return null; })()}
          {Array.from(new Map(orgs.map(o=> [o.id, o])).values()).map(o => {
            const active = selectedOrg?.id === o.id;
            return (
              <button
                key={o.id}
                className={`flex items-center gap-3 px-5 py-3 text-[14px] text-left hover:bg-blue-50 transition ${active ? 'bg-blue-50 font-semibold text-[#091747]' : 'text-[#091747]'}`}
                onClick={() => { setSelectedOrgById(o.id); setOpen(false); }}
              >
                <OrganizationAvatar org={o} />
                <div className="flex-1 truncate" title={o.name}>{o.name}</div>
                {active && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-indigo-600"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            );
          })}
          <div className="border-t border-blue-100 mt-1" />
          <button
            className="flex items-center gap-2 px-5 py-3 text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-40"
            disabled={loading}
            onClick={() => {
              // close dropdown first, then open modal on next tick to avoid event/stacking conflicts
              setOpen(false);
              setTimeout(() => setShowCreateOrg(true), 0);
            }}
          >
            + Criar organização
          </button>
        </div>
      )}
      {/* Render the RequireOrganization modal outside the dropdown panel so it can mount
          even after the dropdown is closed. This avoids the case where setOpen(false)
          unmounts the panel before setShowCreateOrg(true) runs. */}
      {showCreateOrg && (
        <RequireOrganization
          onCreated={(org) => {
            // optimistic add to update dropdown immediately, then return refresh Promise so animation waits
            try {
              const createdObj = org?.organization || org || null;
              const createdId = createdObj?.id || createdObj?.organizationId || org?.id || org?.organizationId || null;
              const createdName = createdObj?.name || org?.name || '';
              const createdLogo = createdObj?.logoUrl || createdObj?.logo || org?.logoUrl || org?.logo || '';
              if (createdId) {
                try { addOrganization({ id: createdId, name: createdName, logoUrl: createdLogo }); } catch(_) {}
              }
            } catch (e) { /* ignore */ }
            try { return refresh(); } catch (e) { return Promise.resolve(); }
          }}
          onClose={() => setShowCreateOrg(false)}
        />
      )}
    </div>
  );
};

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalLeft, detailWidth } = useLayoutOffsets();
  const userName = user?.name ? user.name.split(' ')[0] : (user?.email ? user.email.split('@')[0] : "Visitante");
  const userEmail = user?.email || "";

  const internalPad = 20;
  const dynamicStyle: React.CSSProperties = { paddingLeft: totalLeft + internalPad };
  return (
    <div style={{ ...dynamicStyle, zIndex: 10, pointerEvents: 'auto' }} className={`flex absolute top-0 left-0 w-full items-center pr-5 py-4 bg-white border-b border-solid border-zinc-100 h-[60px] max-md:relative max-md:flex-wrap max-md:gap-4 max-md:px-5 max-md:py-4 max-md:w-full max-sm:px-4 max-sm:py-2.5 transition-all duration-200`}>
      {/* Left: apenas seletor de organização (oculto quando existe sidebar de detalhe) */}
      <div className="flex items-center gap-4 flex-1 min-w-[240px]">
        {detailWidth === 0 && <OrganizationDropdown />}
      </div>
      {/* Right: Criar evento + UserDropdown */}
      <div className="flex items-center gap-6 justify-end flex-1 min-w-[300px]">
        <div className="text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-700 transition-colors" onClick={() => navigate('/create-event')}>Criar evento</div>
        <UserDropdown userName={userName} userEmail={userEmail} />
      </div>
    </div>
  );
};

export default AppHeader;
