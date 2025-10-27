// MarketingTools (clean production baseline) - all debug & test artifacts removed
import React, { useEffect, useRef, useState } from 'react';
import { fetchApi, ensureApiBase, apiUrl } from '@/lib/apiBase';
import SidebarMenu from '@/components/SidebarMenu';
import AppHeader from '@/components/AppHeader';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose, DrawerTrigger, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useOrganization } from '@/context/OrganizationContext';

interface EventLite { id:string; name:string; startDate?:string|null }
interface CampaignRow { id:string; name:string; status:'rascunho'|'agendado'|'enviado'; openRate?:number|null; clickRate?:number|null }
interface CouponRow { id:string; eventId:string; code:string; type:'PERCENT'|'FIXED'; value:number; maxUses?:number|null; usedCount?:number; status:'ACTIVE'|'INACTIVE'|'EXPIRED'; startsAt?:string|null; endsAt?:string|null; createdAt?:string }
interface Toast { id:string; message:string; type?:'success'|'error' }

const tasks = [
  { key:'share', title:'Compartilhar nas redes sociais', desc:'Divulgue seu evento em várias redes.' },
  { key:'announce', title:'Enviar comunicado', desc:'Avise seu público sobre novidades.' },
  { key:'ad', title:'Lançar anúncio pago', desc:'Crie anúncios segmentados rapidamente.' },
  { key:'reminder', title:'E-mail de lembrete', desc:'Engaje inscritos que ainda não converteram.' }
];

const MarketingTools: React.FC = () => {
  // Obtém userId via supabase igual OrganizerEvents
  // Boot do usuário igual OrganizerEvents
  const [userId, setUserId] = useState<string | null>(null);
  const [userBooted, setUserBooted] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await (window as any).supabase?.auth?.getUser?.() || {};
        const uid = data?.user?.id || null;
        if (uid) {
          setUserId(uid);
          (window as any).userId = uid;
          let tries = 0;
          while (!window.localStorage.getItem('AUTH_TOKEN_V1') && tries < 10) {
            await new Promise(res => setTimeout(res, 200));
            tries++;
          }
          setUserBooted(true);
        }
      } catch {}
    })();
  }, []);
  const { selectedOrg, orgs, setSelectedOrgById } = useOrganization();

  // Seleciona automaticamente a primeira organização disponível ao carregar orgs
  useEffect(() => {
    if (!selectedOrg && orgs.length > 0) {
      setSelectedOrgById(orgs[0].id);
    }
  }, [selectedOrg, orgs, setSelectedOrgById]);

  // Events
  const [events,setEvents] = useState<EventLite[]>([]);
  const [activeEventId,setActiveEventId] = useState<string|null>(null);
  const [loadingEvents,setLoadingEvents] = useState(false);
  const [selectorOpen,setSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement|null>(null);

  // Tabs
  const [tab,setTab] = useState<'painel'|'campanhas'|'promocoes'>('painel');

  // Campaigns
  const [campaigns,setCampaigns] = useState<CampaignRow[]>([]);
  const [campaignsLoading,setCampaignsLoading] = useState(false);
  const [campaignSearch,setCampaignSearch] = useState('');
  // Create campaign modal
  const [campaignModalOpen,setCampaignModalOpen] = useState(false);
  const [campaignSubject,setCampaignSubject] = useState('');
  const [campaignBody,setCampaignBody] = useState('');
  const [emailLists,setEmailLists] = useState<{id:string;name:string;}[]>([]);
  const [selectedListId,setSelectedListId] = useState<string|null>(null);
  const [manualRecipients,setManualRecipients] = useState('');
  const [creatingCampaign,setCreatingCampaign] = useState(false);
  // Editor tabs and content tab state
  const [editorTab, setEditorTab] = useState<'info'|'conteudo'|'estilo'>('info');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [eventsSearch, setEventsSearch] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const editorRef = React.useRef<HTMLDivElement|null>(null);
  // Initial 'Nova campanha' modal (name only)
  const [campaignStartOpen, setCampaignStartOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  // Basic info / footer / logo fields
  const [fromName, setFromName] = useState<string>((window as any).userName || '');
  const [replyTo, setReplyTo] = useState<string>((window as any).userEmail || '');
  const [organizerName, setOrganizerName] = useState<string>((window as any).organizerName || '');
  const [organizerAddress, setOrganizerAddress] = useState<string>((window as any).organizerAddress || '');
  const [organizerComplement, setOrganizerComplement] = useState<string>('');
  const [organizerCity, setOrganizerCity] = useState<string>((window as any).organizerCity || '');
  const [organizerState, setOrganizerState] = useState<string>((window as any).organizerState || '');
  const [organizerPostalCode, setOrganizerPostalCode] = useState<string>('');
  const [organizerCountry, setOrganizerCountry] = useState<string>((window as any).organizerCountry || 'Brasil');
  const [facebookLink, setFacebookLink] = useState<string>('');
  const [instagramLink, setInstagramLink] = useState<string>('');
  const [twitterLink, setTwitterLink] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File|null>(null);
  const [logoPreview, setLogoPreview] = useState<string|null>(null);
  useEffect(()=>{
    if(!logoFile){ setLogoPreview(null); return; }
    const fr = new FileReader();
    fr.onload = ()=> setLogoPreview(String(fr.result));
    fr.readAsDataURL(logoFile);
  }, [logoFile]);

  // Load email lists when opening campaign modal
  useEffect(()=>{
    if(!campaignModalOpen) return;
    let cancelled = false;
    (async ()=>{
      try{
        await ensureApiBase().catch(()=>{});
        const r = await fetchApi('/email-lists');
        if(!r.ok) return;
        const j = await r.json().catch(()=>[]);
        if(cancelled) return;
        if(Array.isArray(j)) setEmailLists(j.map((x:any)=> ({ id: x.id, name: x.name })));
      }catch{}
    })();
    return ()=> { cancelled = true; };
  }, [campaignModalOpen]);

  // Coupons
  const [coupons,setCoupons] = useState<CouponRow[]>([]);
  const [couponsLoading,setCouponsLoading] = useState(false);
  const [couponError,setCouponError] = useState<string|undefined>();
  const [couponDrawerOpen,setCouponDrawerOpen] = useState(false);
  const [editingCouponId,setEditingCouponId] = useState<string|null>(null);
  const [savingCoupon,setSavingCoupon] = useState(false);
  const [couponForm,setCouponForm] = useState<{eventId:string; code:string; type:'PERCENT'|'FIXED'; value:string; maxUses:string; startsAt:string; endsAt:string}>(
    { eventId:'', code:'', type:'PERCENT', value:'', maxUses:'', startsAt:'', endsAt:'' }
  );

  // Toasts
  const [toasts,setToasts] = useState<Toast[]>([]);
  const pushToast = (message:string,type:Toast['type']='success')=> {
    const id = Date.now()+':'+Math.random().toString(36).slice(2);
    setToasts(t=> [...t,{id,message,type}]);
    setTimeout(()=> setToasts(t=> t.filter(x=> x.id!==id)), 4200);
  };

  // Close selector on outside click
  useEffect(()=> { const h=(e:MouseEvent)=> { if(!selectorRef.current) return; if(!(e.target instanceof HTMLElement)) return; if(!selectorRef.current.contains(e.target)) setSelectorOpen(false); }; window.addEventListener('click',h); return ()=> window.removeEventListener('click',h); }, []);

  // Checklist state (per event) persisted in localStorage
  type ChecklistMap = Record<string, string[]>; // eventId -> list of completed task keys
  const CHECKLIST_KEY = 'marketing_checklist_v1';
  const [checklist, setChecklist] = useState<ChecklistMap>({});
  useEffect(()=>{
    try {
      const raw = window.localStorage.getItem(CHECKLIST_KEY);
      if(raw) setChecklist(JSON.parse(raw));
    } catch {}
  }, []);
  const saveChecklist = (next:ChecklistMap) => { try { window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next)); } catch {} };
  const isTaskDone = (eventId:string|null, key:string) => { if(!eventId) return false; return Array.isArray(checklist[eventId]) && checklist[eventId].includes(key); };
  const setTaskDone = (eventId:string|null, key:string, done:boolean) => {
    if(!eventId) return;
    setChecklist(prev => {
      const cur = {...prev};
      const arr = Array.isArray(cur[eventId])? [...cur[eventId]] : [];
      const has = arr.includes(key);
      if(done && !has) arr.push(key);
      if(!done && has) { const idx = arr.indexOf(key); if(idx>=0) arr.splice(idx,1); }
      cur[eventId] = arr;
      saveChecklist(cur);
      return cur;
    });
  };

  // Expose global helper so other components / integrations can mark a task as done
  useEffect(()=>{
    const api = {
      markTaskForEvent: (eventId:string, key:string) => setTaskDone(eventId, key, true),
      unmarkTaskForEvent: (eventId:string, key:string) => setTaskDone(eventId, key, false),
    };
    try { (window as any).marketingTools = api; } catch {}
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail || {};
        const { eventId, key } = detail;
        if(eventId && key) setTaskDone(eventId, key, true);
      } catch {}
    };
    window.addEventListener('marketing-tool-used', handler as EventListener);
    return () => { try { delete (window as any).marketingTools; } catch {}; window.removeEventListener('marketing-tool-used', handler as EventListener); };
  }, []);

  // Busca eventos sempre que selectedOrg mudar
  useEffect(() => {
    if (!selectedOrg?.id) return;
    let cancelled = false;
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        await ensureApiBase();
        const path = `/api/organization/${selectedOrg.id}/events`;
        const attempts = [ apiUrl(path), `http://localhost:4000${path}` ];
        let loaded: any[] | null = null;
        for (const u of attempts) {
          try {
            const r = await fetch(u, { headers: { 'Accept': 'application/json' } });
            if (!r.ok) continue;
            const j = await r.json();
            if (Array.isArray(j)) { loaded = j; break; }
          } catch (e) {
            // ignore and try next
          }
        }
        if (cancelled) return;
        if (loaded) {
          const eventsList = loaded;
          const mapped: EventLite[] = eventsList.map(e => ({ id: e.id, name: e.name, startDate: e.startDate || e.startDateUtc || null }));
          setEvents(mapped);
          setActiveEventId(prev => mapped.some(m => m.id === prev) ? prev : (mapped[0]?.id || null));
          // no events for this org
        } else {
          // none of the endpoints responded for this org
          setEvents([]);
          setActiveEventId(null);
        }
      } catch (err) {
  // erro ao buscar eventos (logged server-side)
        setEvents([]);
        setActiveEventId(null);
      } finally { if (!cancelled) setLoadingEvents(false); }
    };
    fetchEvents();
    return () => { cancelled = true; };
  }, [selectedOrg]);

  // Exibe todos eventos recebidos, sem filtro
  const visibleEvents = events;

  // Load real campaigns when entering campaigns tab
  const [campaignStatusFilter,setCampaignStatusFilter] = useState<string>('all');
  useEffect(()=>{
    let cancelled = false;
    if(tab!=='campanhas') return;
    (async ()=>{
      setCampaignsLoading(true);
      try{
        await ensureApiBase().catch(()=>{});
        const r = await fetchApi(`/api/organization/${selectedOrg?.id}/campaigns/email`);
        if(!r.ok){ setCampaigns([]); return; }
        const j = await r.json().catch(()=>[]);
        if(cancelled) return;
        const normalized = Array.isArray(j)? j.map((c:any)=> ({ id:c.id, name:c.name||c.subject||'Campanha', status: c.status || 'rascunho', openRate: c.openRate || null, clickRate: c.clickRate || null })) : [];
        setCampaigns(normalized);
      }catch(e){ setCampaigns([]); }
      finally { if(!cancelled) setCampaignsLoading(false); }
    })();
    return ()=> { cancelled = true; };
  }, [tab, selectedOrg]);

  // Load coupons
  const loadCoupons = React.useCallback( async ()=> {
    if(tab!=='promocoes') return;
    setCouponsLoading(true); setCouponError(undefined);
    try {
      const qs: string[] = [];
      if(activeEventId) qs.push('eventId='+encodeURIComponent(activeEventId));
      const qp = qs.length? '?'+qs.join('&'): '';
      await ensureApiBase().catch(()=>{});
      const r = await fetchApi('/api/coupons'+qp);
      const data = await r.json().catch(()=>({items:[]}));
      if(!r.ok) throw new Error('Falha ao carregar');
      const arr = Array.isArray(data)? data : Array.isArray(data.items)? data.items : [];
      setCoupons(arr);
    } catch(e:any){ setCouponError(e.message||'Erro ao listar cupons'); }
    finally { setCouponsLoading(false); }
  }, [tab, activeEventId]);
  useEffect(()=> { loadCoupons(); }, [loadCoupons]);
  const refreshCoupons = () => loadCoupons();

  const submitCoupon = async (e:React.FormEvent)=> {
    e.preventDefault();
    if(!couponForm.eventId) { pushToast('Selecione o evento para o cupom','error'); return; }
    if(!couponForm.code.trim()) { pushToast('Código obrigatório','error'); return; }
    const rawValue = Number(couponForm.value.replace(',','.'));
    if(!rawValue || rawValue<=0) { pushToast('Valor inválido','error'); return; }
    const body = {
      eventId: couponForm.eventId,
      code: couponForm.code.trim().toUpperCase(),
      type: couponForm.type,
      value: rawValue,
      maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : null,
      startsAt: couponForm.startsAt || null,
      endsAt: couponForm.endsAt || null
    } as any;
    if(body.type==='PERCENT' && body.value>100){ pushToast('Percentual > 100%','error'); return; }
    setSavingCoupon(true);
    try {
      await ensureApiBase().catch(()=>{});
      const method = editingCouponId? 'PUT':'POST';
      const url = editingCouponId? `/api/coupons/${editingCouponId}` : '/api/coupons';
      const r = await fetchApi(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const text = await r.text(); let data:any={}; try { data = text? JSON.parse(text): {}; } catch{}
      if(!r.ok){
        if(data==='duplicate_code' || data?.message==='duplicate_code' || data?.error==='duplicate_code'){
          // Suggest next code variant
            const base = body.code.toUpperCase();
            const match = base.match(/^(.*?)(?:-(\d+))?$/); let root = base; let n = 2; if(match){ root = match[1].replace(/-$/,''); if(match[2]) n = Number(match[2])+1; }
            let suggestion = root+'-'+n; const existing = new Set(coupons.filter(c=> c.eventId===body.eventId).map(c=> c.code.toUpperCase()));
            while(existing.has(suggestion) && n<200){ n++; suggestion=root+'-'+n; }
            setCouponForm(f=> ({...f, code: suggestion }));
            pushToast('Código já existe. Sugestão: '+suggestion,'error');
            return;
        }
        pushToast(data?.message||data?.error||'Erro ao salvar','error');
        return;
      }
      pushToast(editingCouponId? 'Cupom atualizado':'Cupom criado');
      setCouponForm(f=> ({...f, code:'', value:'', maxUses:'', startsAt:'', endsAt:'' }));
      setEditingCouponId(null);
      refreshCoupons();
    } catch(e:any){ pushToast(e.message||'Falha ao salvar','error'); }
    finally { setSavingCoupon(false); }
  };

  const toggleCouponStatus = async (c:CouponRow, target:'ACTIVE'|'INACTIVE')=> {
    try {
      await ensureApiBase().catch(()=>{});
      const r = await fetchApi(`/api/coupons/${c.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: target }) });
      if(!r.ok) throw new Error('Falha ao atualizar');
      pushToast('Status atualizado');
      refreshCoupons();
    } catch(e:any){ pushToast(e.message||'Erro ao atualizar','error'); }
  };

  const activeEvent = visibleEvents.find(e=> e.id===activeEventId) || null;
  const daysUntil = activeEvent?.startDate ? Math.max(0, Math.ceil((new Date(activeEvent.startDate).getTime()-Date.now())/86400000)) : null;
  const formatDate = (iso?:string|null)=> { if(!iso) return '—'; try { return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});} catch { return '—'; } };

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0b0b0b] dark:text-white flex justify-center items-start">
      <SidebarMenu activeKeyOverride="marketing" />
      <div className="rounded-3xl w-[1352px] bg-white dark:bg-[#0b0b0b] dark:border-[#1F1F1F] max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4 pb-32">
          <div className="flex flex-col gap-1">
            <span className="text-[18px] font-semibold text-[#0205D3] dark:text-indigo-300">FauvesBoost</span>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Ferramentas de marketing</h1>
          </div>
          {/* Eventos list removed in production UI */}
          <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-700 -mb-2">
            <button
              onClick={()=> setTab('painel')}
              className={`pb-2 text-base font-bold transition ${tab==='painel' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Painel
            </button>
            <div className="inline-flex items-center">
              <button
                // campaigns tab temporarily disabled
                onClick={(e)=> { e.preventDefault(); /* ignore - disabled */ }}
                aria-disabled="true"
                  className={`pb-2 text-base font-bold transition cursor-not-allowed text-slate-400 dark:text-slate-600`}>
                Campanhas de e-mail
              </button>
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 align-middle">em breve</span>
            </div>
            <button
              onClick={()=> setTab('promocoes')}
              className={`pb-2 text-base font-bold transition ${tab==='promocoes' ? 'border-b-2 border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Promoções
            </button>
          </div>
          {tab==='painel' && (
            <div className="bg-[#F6F7FB] dark:bg-[#0b0b0b] rounded-xl border border-zinc-200 dark:border-zinc-700 px-8 pt-8 pb-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                {loadingEvents ? (
                  <div className="animate-pulse space-y-2"><div className="h-4 w-72 bg-zinc-200 rounded" /><div className="h-3 w-96 bg-zinc-200 rounded" /></div>
                ) : (
                  <>
                    {daysUntil!==null && <p className="text-[22px] font-medium text-slate-900 dark:text-white">Seu próximo evento acontecerá em <span className="text-indigo-700 dark:text-indigo-300 font-semibold underline decoration-2 underline-offset-[3px]">{daysUntil} {daysUntil===1?'dia':'dias'}</span></p>}
                    <p className="text-[14px] text-slate-500 dark:text-slate-400">Use essas ferramentas para promover seu evento e vender mais ingressos.</p>
                  </>
                )}
              </div>
              <div className="bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 relative" ref={selectorRef}>
                {/* status removed from UI */}
                {loadingEvents ? (
                  <div className="animate-pulse flex items-center gap-4"><div className="w-12 h-12 rounded-md bg-zinc-200" /><div className="flex-1 space-y-2"><div className="h-4 w-56 bg-zinc-200 rounded" /><div className="h-3 w-40 bg-zinc-200 rounded" /></div></div>
                ) : (
                  <button onClick={()=> setSelectorOpen(o=> !o)} className="flex items-center gap-4 w-full text-left">
                    <div className="w-14 h-14 rounded-md bg-zinc-300 dark:bg-zinc-700" />
                    <div className="flex flex-col">
                      <div className="text-[13px] font-medium text-slate-900 dark:text-white">{activeEvent?.name || 'Selecione um evento'}</div>
                      <div className="text-[11px] text-orange-600 mt-0.5">{activeEvent?.startDate ? `Inicia ${formatDate(activeEvent?.startDate)}` : ''}</div>
                    </div>
                    <span className={`ml-auto text-slate-700 dark:text-slate-300 text-sm transition-transform ${selectorOpen? 'rotate-180':''}`}>▾</span>
                  </button>
                )}
                {!loadingEvents && selectorOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden z-20">
                    {visibleEvents.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Nenhum evento disponível para esta organização.</div>
                    ) : (
                      <ul className="max-h-64 overflow-auto divide-y divide-zinc-100 dark:divide-zinc-700 text-sm">
                        {visibleEvents.map(ev => (
                          <li key={ev.id}><button onClick={()=> { setActiveEventId(ev.id); setSelectorOpen(false); }} className={`w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${ev.id===activeEventId? 'bg-indigo-50/60 dark:bg-indigo-900/20 font-medium text-indigo-800 dark:text-indigo-300':'text-slate-700 dark:text-slate-300'}`}>{ev.name}</button></li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {tasks.map(t => {
                  const done = isTaskDone(activeEventId, t.key);
                  return (
                    <div key={t.key} className={`p-5 border ${done? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900':'border-zinc-200 bg-white dark:bg-[#121212]'} rounded-xl flex flex-col gap-2 hover:shadow-sm transition`}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={done} onChange={e=> setTaskDone(activeEventId, t.key, e.target.checked)} className="mt-1" />
                        <div>
                          <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{t.title}</div>
                          <div className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">{t.desc}</div>
                        </div>
                      </div>
                      <button onClick={()=> { setTaskDone(activeEventId, t.key, true); /* TODO: open a modal or navigate to tool */ }} className="mt-auto self-start text-[12px] text-indigo-700 font-medium hover:underline">Abrir</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {tab==='campanhas' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <input value={campaignSearch} onChange={e=> setCampaignSearch(e.target.value)} placeholder="Pesquisar campanhas" className="flex-1 h-12 rounded-xl border border-[#E5E7EB] px-5 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                <div>
                  <select value={campaignStatusFilter} onChange={e=> setCampaignStatusFilter(e.target.value)} className="h-11 rounded-xl border px-3">
                    <option value="all">Filtrar por status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="agendado">Agendado</option>
                    <option value="enviado">Enviado</option>
                  </select>
                </div>
                <div className="ml-auto">
                  <Button onClick={()=> { setCampaignStartOpen(true); setCampaignName(''); }} size="lg" className="h-12 rounded-xl bg-[#D95323] hover:bg-[#C74214] text-white text-sm font-semibold">Nova campanha</Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#F6F7FB] text-slate-600 text-xs font-medium"><tr><th className="py-4 px-6">Campanhas</th><th className="py-4 px-6">Aberto</th><th className="py-4 px-6">Clicaram</th><th className="py-4 px-6">Status</th><th className="py-4 px-6"> </th></tr></thead>
                  <tbody className="divide-y divide-zinc-100 text-[13px]">
                    {campaignsLoading ? (
                      Array.from({length:3}).map((_,i)=>(<tr key={i} className="animate-pulse"><td className="py-4 px-6"><div className="h-4 w-56 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-14 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-14 bg-zinc-200 rounded" /></td></tr>))
                    ) : (
                      campaigns
                        .filter(c => (campaignSearch==='' || c.name.toLowerCase().includes(campaignSearch.toLowerCase())) && (campaignStatusFilter==='all' || c.status===campaignStatusFilter))
                        .map(c => (
                        <tr key={c.id} className="hover:bg-[#F8F9FC] align-middle">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-md bg-zinc-100" />
                              <div className="flex flex-col">
                                <div className="text-[13px] font-semibold text-slate-900 truncate max-w-[520px]">{c.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-700">{c.openRate!=null? (c.openRate*100).toFixed(0)+'%':'--'}</td>
                          <td className="py-4 px-6 text-slate-700">{c.clickRate!=null? (c.clickRate*100).toFixed(0)+'%':'--'}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded text-[11px] font-semibold inline-block ${c.status==='rascunho'? 'bg-zinc-200 text-zinc-700': c.status==='agendado'? 'bg-indigo-50 text-indigo-700':'bg-emerald-100 text-emerald-700'}`}>{c.status}</span>
                          </td>
                          <td className="py-4 px-6">
                            <CampaignActionsDropdown orgId={selectedOrg?.id} campaign={c} onDeleted={() => { setCampaigns(cs => cs.filter(x => x.id !== c.id)); pushToast('Campanha excluída'); }} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab==='promocoes' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <select value={activeEventId||''} onChange={e=> { const val=e.target.value||null; setActiveEventId(val); setCouponForm(f=> ({...f,eventId: val||''})); }} className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Selecione um evento</option>
                    {visibleEvents.map(ev => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                  </select>
                </div>
                <Drawer open={couponDrawerOpen} onOpenChange={(o)=> { setCouponDrawerOpen(o); if(o){ setCouponForm(f=> ({...f,eventId: activeEventId||f.eventId})); } }}>
                  <DrawerTrigger asChild>
                    <Button size="lg" className="ml-auto h-11 rounded-xl px-6 bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white text-sm font-semibold">+ Criar cupom</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="p-6 pb-2 border-b border-gray-100">
                      <DrawerTitle className="text-xl font-bold text-indigo-950">{editingCouponId? 'Editar cupom':'Criar cupom'}</DrawerTitle>
                      <DrawerDescription className="text-[13px] text-slate-500">Configure código, desconto e validade.</DrawerDescription>
                    </DrawerHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                      <form id="couponForm" onSubmit={submitCoupon} className="flex flex-col gap-5 text-[13px]">
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-medium text-slate-600">Código</Label>
                          <Input value={couponForm.code} onChange={e=> setCouponForm(f=> ({...f,code:e.target.value.toUpperCase()}))} placeholder="EXEMPLO10" className="h-11 rounded-xl text-sm" />
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="flex-1 flex flex-col gap-2">
                            <Label className="text-[12px] font-medium text-slate-600">Desconto</Label>
                            <Input type="number" min="0" value={couponForm.value} onChange={e=> setCouponForm(f=> ({...f,value:e.target.value}))} placeholder="10" className="h-11 rounded-xl text-sm" />
                          </div>
                          <div className="flex flex-col gap-2 justify-end">
                            <Label className="text-[12px] font-medium text-slate-600 invisible">Tipo</Label>
                            <div className="flex flex-row gap-1 h-11">
                              <Button type="button" variant={couponForm.type==='FIXED'?'default':'outline'} className={`rounded-l-xl rounded-r-none h-11 px-4 text-sm ${couponForm.type==='FIXED'?'bg-indigo-600 text-white':'bg-white text-indigo-700 border-indigo-600'}`} onClick={()=> setCouponForm(f=> ({...f,type:'FIXED'}))}>Valor</Button>
                              <Button type="button" variant={couponForm.type==='PERCENT'?'default':'outline'} className={`rounded-r-xl rounded-l-none h-11 px-4 text-sm ${couponForm.type==='PERCENT'?'bg-indigo-600 text-white':'bg-white text-indigo-700 border-indigo-600'}`} onClick={()=> setCouponForm(f=> ({...f,type:'PERCENT'}))}>Porcentagem</Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row gap-2">
                          <div className="flex-1 flex flex-col gap-2">
                            <Label className="text-[12px] font-medium text-slate-600">Validade do cupom</Label>
                            <Input type="date" value={couponForm.endsAt?.slice(0,10) || ''} onChange={e=> setCouponForm(f=> ({...f,endsAt:e.target.value}))} className="h-11 rounded-xl text-sm" />
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <Label className="text-[12px] font-medium text-slate-600">Qtd. máxima de cupons</Label>
                            <Input type="number" min="1" value={couponForm.maxUses} onChange={e=> setCouponForm(f=> ({...f,maxUses:e.target.value}))} placeholder="100" className="h-11 rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-medium text-slate-600">Evento</Label>
                          <select value={couponForm.eventId} onChange={e=> setCouponForm(f=> ({...f,eventId:e.target.value}))} className="h-11 rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            <option value="">Selecione um evento</option>
                            {visibleEvents.map(ev => (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
                          </select>
                        </div>
                        {couponError && <div className="text-[12px] text-red-600">{couponError}</div>}
                      </form>
                    </div>
                    <DrawerFooter className="flex flex-row gap-4 justify-between p-6 border-t border-gray-100">
                      <DrawerClose asChild>
                        <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl text-sm">Cancelar</Button>
                      </DrawerClose>
                      <Button form="couponForm" disabled={savingCoupon} className="flex-1 h-11 rounded-xl bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white text-sm font-bold shadow-sm disabled:opacity-60">{savingCoupon? 'Salvando...': (editingCouponId? 'Salvar':'Criar')}</Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#F6F7FB] text-slate-600 text-xs font-medium">
                    <tr>
                      <th className="py-4 px-6">Evento / Código</th>
                      <th className="py-4 px-6">Tipo</th>
                      <th className="py-4 px-6">Desconto</th>
                      <th className="py-4 px-6">Usos</th>
                      <th className="py-4 px-6">Janela</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-[13px]">
                    {couponsLoading ? (
                      Array.from({length:4}).map((_,i)=>(<tr key={i} className="animate-pulse"><td className="py-4 px-6"><div className="h-4 w-48 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-16 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-12 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-16 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-24 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-14 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 rounded" /></td></tr>))
                    ) : coupons.length===0 ? (
                      <tr><td colSpan={7} className="py-10 px-6 text-center text-slate-500">Nenhum cupom cadastrado</td></tr>
                    ) : (
                      coupons.map(c => {
                        const evName = events.find(e=> e.id===c.eventId)?.name || 'Evento';
                        const desconto = c.type==='PERCENT'? (c.value+'%'): (()=>{ const num = Number(c.value); return (num).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); })();
                        const used = c.usedCount || 0; const max = c.maxUses!=null? c.maxUses : null; const usos = `${used}/${max!=null? max:'∞'}`;
                        const janela = [c.startsAt? new Date(c.startsAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):null, c.endsAt? new Date(c.endsAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):null].filter(Boolean).join(' → ');
                        const statusColor = c.status==='ACTIVE'? 'bg-emerald-100 text-emerald-700': c.status==='INACTIVE'? 'bg-zinc-200 text-zinc-700':'bg-yellow-100 text-yellow-700';
                        const typeBadge = c.type==='PERCENT'
                          ? <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 text-orange-600 px-1.5 py-0.5 text-[10px] font-semibold"><span>%</span></span>
                          : <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 text-indigo-700 px-1.5 py-0.5 text-[10px] font-semibold"><span>R$</span></span>;
                        return (
                          <tr key={c.id} className="hover:bg-[#F8F9FC] align-middle">
                            <td className="py-3 px-6">
                              <div className="flex flex-col leading-tight">
                                <span className="text-[13px] font-semibold text-slate-900 truncate max-w-[220px]" title={evName}>{evName}</span>
                                <span className="text-[11px] text-indigo-700 tracking-wide font-semibold">{c.code}</span>
                              </div>
                            </td>
                            <td className="py-3 px-6"><div className="flex items-center gap-2 text-slate-700 text-[13px]">{typeBadge}<span>{c.type==='PERCENT'? 'Percentual':'Valor fixo'}</span></div></td>
                            <td className="py-3 px-6 text-[13px] text-slate-700 whitespace-nowrap">{desconto}</td>
                            <td className="py-3 px-6 text-[13px] text-slate-700 whitespace-nowrap">{usos}</td>
                            <td className="py-3 px-6 text-[13px] text-slate-700 whitespace-nowrap">{janela || '—'}</td>
                            <td className="py-3 px-6"><span className={`px-2 py-1 rounded text-[11px] font-semibold inline-block ${statusColor}`}>{c.status}</span></td>
                            <td className="py-3 px-6">
                              <CouponActionsDropdown
                                coupon={c}
                                onEdit={()=> { setEditingCouponId(c.id); setCouponForm({ eventId:c.eventId, code:c.code, type:c.type as any, value:String(c.value), maxUses:c.maxUses!=null? String(c.maxUses):'', startsAt:c.startsAt? c.startsAt.slice(0,16):'', endsAt:c.endsAt? c.endsAt.slice(0,16):'' }); setCouponDrawerOpen(true); }}
                                onToggleStatus={()=> toggleCouponStatus(c, c.status==='ACTIVE'? 'INACTIVE':'ACTIVE')}
                                onDelete={async ()=> { try { await ensureApiBase().catch(()=>{}); const r= await fetchApi(`/api/coupons/${c.id}`, { method:'DELETE' }); if(r.ok){ setCoupons(cs=> cs.filter(x=> x.id!==c.id)); pushToast('Cupom excluído'); } else pushToast('Falha ao excluir','error'); } catch { pushToast('Erro ao excluir','error'); } }}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {toasts.length>0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 w-[340px]">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-3 rounded-md text-[13px] shadow border flex items-start gap-3 ${t.type==='error'? 'bg-red-50 border-red-300 text-red-700':'bg-emerald-50 border-emerald-300 text-emerald-800'}`}>
              <span className="mt-0.5 select-none">{t.type==='error'? '⚠':'✓'}</span>
              <div className="flex-1 leading-snug">{t.message}</div>
              <button onClick={()=> setToasts(ts=> ts.filter(x=> x.id!==t.id))} className="text-zinc-400 hover:text-zinc-600" aria-label="Fechar">✕</button>
            </div>
          ))}
        </div>
      )}
      {/* Full-page campaign editor modal (after naming) */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-40 bg-black/40">
          <div className="absolute inset-0 flex items-start justify-center">
            <div className="w-full max-w-[1200px] bg-white mt-8 mb-8 rounded-xl shadow-xl overflow-hidden flex flex-col h-[calc(100vh-64px)]">
              <div className="flex-1 overflow-hidden flex">
                {/* Left panel (form) */}
                  <aside className="w-96 border-r border-zinc-100 overflow-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button onClick={()=> setEditorTab('info')} className={`text-sm font-medium ${editorTab==='info'? 'text-indigo-600 border-b-2 border-indigo-600 pb-2':''}`}>Informações básicas</button>
                      <button onClick={()=> setEditorTab('conteudo')} className={`text-sm font-medium ${editorTab==='conteudo'? 'text-indigo-600 border-b-2 border-indigo-600 pb-2':''}`}>Conteúdo</button>
                      <button onClick={()=> setEditorTab('estilo')} className={`text-sm font-medium ${editorTab==='estilo'? 'text-indigo-600 border-b-2 border-indigo-600 pb-2':''}`}>Estilo</button>
                    </div>
                    <div />
                  </div>
                  <div className="space-y-4">
                    {editorTab==='info' && (<>
                    <div>
                      <Label className="text-sm">Nome da campanha *</Label>
                      <Input value={campaignSubject} onChange={e=> setCampaignSubject(e.target.value)} className="mt-2" />
                    </div>
                    <div>
                      <Label className="text-sm">De *</Label>
                      <Input value={fromName} onChange={e=> setFromName(e.target.value)} className="mt-2" />
                    </div>
                    <div>
                      <Label className="text-sm">Endereço de e-mail de resposta *</Label>
                      <Input value={replyTo} onChange={e=> setReplyTo(e.target.value)} className="mt-2" />
                    </div>
                    <hr className="my-3" />
                    <h4 className="text-base font-semibold">Rodapé</h4>
                    <div>
                      <Label className="text-sm">Nome do organizador</Label>
                      <Input value={organizerName} onChange={e=> setOrganizerName(e.target.value)} className="mt-2" />
                    </div>
                    <div>
                      <Label className="text-sm">Endereço</Label>
                      <Input value={organizerAddress} onChange={e=> setOrganizerAddress(e.target.value)} className="mt-2" />
                    </div>
                    <div>
                      <Label className="text-sm">Complemento</Label>
                      <Input value={organizerComplement} onChange={e=> setOrganizerComplement(e.target.value)} className="mt-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Cidade</Label>
                        <Input value={organizerCity} onChange={e=> setOrganizerCity(e.target.value)} className="mt-2" />
                      </div>
                      <div>
                        <Label className="text-sm">Estado/CEP</Label>
                        <div className="flex gap-2">
                          <Input value={organizerState} onChange={e=> setOrganizerState(e.target.value)} className="mt-2" />
                          <Input value={organizerPostalCode} onChange={e=> setOrganizerPostalCode(e.target.value)} className="mt-2 w-32" placeholder="CEP" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">País</Label>
                      <select value={organizerCountry} onChange={e=> setOrganizerCountry(e.target.value)} className="w-full h-10 rounded-md border px-2 mt-2"><option>Brasil</option><option>Portugal</option><option>Estados Unidos</option></select>
                    </div>
                    <div className="mt-3">
                      <Label className="text-sm">Links sociais</Label>
                      <Input value={facebookLink} onChange={e=> setFacebookLink(e.target.value)} placeholder="Link do Facebook" className="mt-2" />
                      <Input value={instagramLink} onChange={e=> setInstagramLink(e.target.value)} placeholder="Link do Instagram" className="mt-2" />
                      <Input value={twitterLink} onChange={e=> setTwitterLink(e.target.value)} placeholder="Link do Twitter" className="mt-2" />
                    </div>
                    <div className="mt-3">
                      <Label className="text-sm">Logotipo do organizador</Label>
                      <div className="mt-2 flex items-center gap-3">
                        <input type="file" accept="image/*" onChange={e=> { const f = e.target.files?.[0] || null; setLogoFile(f); }} />
                        {logoPreview && <img src={logoPreview} alt="logo preview" className="w-20 h-12 object-contain rounded" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Recomendado 150x75 px, &lt;1MB</div>
                    </div>
                    </>)}
                    {/* Conteúdo tab */}
                    {editorTab==='conteudo' && (
                      <div>
                        <h4 className="text-base font-semibold mb-2">Escolher seus eventos</h4>
                        <div className="mb-2">
                          <input value={eventsSearch} onChange={e=> setEventsSearch(e.target.value)} placeholder="Pesquisar eventos" className="w-full h-10 rounded-md border px-3" />
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showOnlySelected} onChange={e=> setShowOnlySelected(e.target.checked)} /> Mostrar somente selecionados</label>
                          <div className="ml-auto text-sm text-indigo-600 cursor-pointer" onClick={()=> setSelectedEventIds([])}>Limpar selecionados</div>
                        </div>
                        <div className="bg-[#F6F7FB] rounded-md p-2 mb-3">Eventos</div>
                        <ul className="divide-y max-h-48 overflow-auto">
                          {visibleEvents.filter(ev => {
                            if(eventsSearch && !ev.name.toLowerCase().includes(eventsSearch.toLowerCase())) return false;
                            if(showOnlySelected && !selectedEventIds.includes(ev.id)) return false;
                            return true;
                          }).map(ev => (
                            <li key={ev.id} className="flex items-center gap-3 p-3">
                              <input type="checkbox" checked={selectedEventIds.includes(ev.id)} onChange={e=> { const next = new Set(selectedEventIds); if(e.target.checked) next.add(ev.id); else next.delete(ev.id); setSelectedEventIds(Array.from(next)); }} />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{ev.name}</div>
                                <div className="text-xs text-slate-500">{ev.startDate? new Date(ev.startDate).toLocaleString() : ''}</div>
                              </div>
                              <div className="text-sm text-indigo-600">⋮</div>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-4">
                          <Label className="text-sm">Assunto</Label>
                          <Input value={campaignSubject} onChange={e=> setCampaignSubject(e.target.value)} className="mt-2" />
                        </div>

                        <div className="mt-4">
                          <Label className="text-sm">Corpo</Label>
                          <div className="mt-2 border rounded-md">
                            <div className="flex gap-2 p-2 border-b bg-white">
                              <button onClick={(e)=>{ e.preventDefault(); document.execCommand('bold'); }} className="px-2 py-1 text-sm">B</button>
                              <button onClick={(e)=>{ e.preventDefault(); document.execCommand('italic'); }} className="px-2 py-1 text-sm">I</button>
                              <button onClick={(e)=>{ e.preventDefault(); document.execCommand('insertUnorderedList'); }} className="px-2 py-1 text-sm">• List</button>
                            </div>
                            <div ref={editorRef} contentEditable className="p-4 min-h-[160px] bg-white text-sm" onInput={e=> setCampaignBody((e.target as HTMLDivElement).innerHTML)} dangerouslySetInnerHTML={{ __html: campaignBody || '<h2 style="text-align:center">Let\'s get together</h2><p style="text-align:center">Escreva seu e-mail aqui...</p>' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    {editorTab==='estilo' && (
                      <div>
                        <div className="text-sm text-slate-500">Opções de estilo (placeholder)</div>
                      </div>
                    )}
                  </div>
                </aside>
                {/* Right panel (preview) */}
                <div className="flex-1 overflow-auto p-6 bg-[#fafafa]">
                  <div className="flex items-start justify-between">
                    <div className="text-lg font-semibold">{campaignSubject || 'preview'}</div>
                    <div>
                      <Button variant="outline" onClick={()=> pushToast('E-mail de teste enviado (simulado)')}>Enviar e-mail de teste</Button>
                    </div>
                  </div>
                  <div className="mt-4 bg-white rounded-md shadow-inner p-6 max-h-[70vh] overflow-auto">
                    <div className="text-sm text-slate-500">Assunto: {campaignSubject}</div>
                    <div className="text-sm text-slate-500">De: {(window as any).userName || ''}</div>
                    <div className="mt-6 text-base text-slate-700" dangerouslySetInnerHTML={{ __html: campaignBody || '<p>Preview do e-mail...</p>' }} />
                  </div>
                </div>
              </div>
              <div className="border-t p-4 flex justify-end gap-3">
                <Button variant="outline" onClick={()=> setCampaignModalOpen(false)}>Cancelar</Button>
                <Button className="bg-[#D95323] text-white" onClick={async ()=>{
                  // submit campaign (same as previous send)
                  if(!activeEventId){ pushToast('Selecione um evento para associar a campanha','error'); return; }
                  if(!campaignSubject.trim()){ pushToast('Nome / assunto obrigatório','error'); return; }
                  setCreatingCampaign(true);
                  try{
                    await ensureApiBase().catch(()=>{});
                    const payload:any = {
                      eventId: activeEventId,
                      eventIds: selectedEventIds && selectedEventIds.length ? selectedEventIds : undefined,
                      subject: campaignSubject,
                      body: campaignBody,
                      name: campaignSubject && campaignSubject.trim() ? campaignSubject.trim() : undefined,
                      fromName: fromName || undefined,
                      replyTo: replyTo || undefined,
                      footer: {
                        organizerName: organizerName || undefined,
                        organizerAddress: organizerAddress || undefined,
                        organizerComplement: organizerComplement || undefined,
                        organizerCity: organizerCity || undefined,
                        organizerState: organizerState || undefined,
                        organizerPostalCode: organizerPostalCode || undefined,
                        organizerCountry: organizerCountry || undefined,
                      },
                      socialLinks: {
                        facebook: facebookLink || undefined,
                        instagram: instagramLink || undefined,
                        twitter: twitterLink || undefined,
                      },
                      logo: logoPreview || undefined,
                    };
                    if(selectedListId) payload.listId = selectedListId;
                    else {
                      const recipients = manualRecipients.split(',').map(s=> s.trim()).filter(Boolean);
                      if(recipients.length===0){ pushToast('Informe lista ou destinatários','error'); return; }
                      payload.recipients = recipients;
                    }
                    const r = await fetch(apiUrl(`/api/organization/${selectedOrg?.id}/campaigns/email`), { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
                    const j = await r.json().catch(()=> ({}));
                    if(!r.ok){ pushToast(j?.message||'Falha ao criar campanha','error'); return; }
                    pushToast('Campanha agendada — e-mails enfileirados');
                    try{ (window as any).marketingTools?.markTaskForEvent?.(activeEventId, 'announce'); } catch {}
                    setCampaignModalOpen(false);
                  }catch(e:any){ pushToast(e?.message||'Erro ao criar','error'); }
                  finally{ setCreatingCampaign(false); }
                }}>Continuar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Initial 'Nova campanha' modal (name-only) */}
      {campaignStartOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-[540px] bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-center">Nova campanha</h3>
              </div>
              <button onClick={()=> setCampaignStartOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="mt-6 text-center">
              <div className="mx-auto w-24 h-24 bg-orange-50 rounded-md flex items-center justify-center">📧</div>
              <p className="mt-4 text-slate-700 font-medium">Criar uma nova campanha de e-mail</p>
              <div className="mt-4 text-sm text-slate-400">Nome da campanha (somente você verá)</div>
              <div className="mt-4">
                <Input value={campaignName} onChange={e=> setCampaignName(e.target.value)} placeholder="Nome da campanha" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={()=> setCampaignStartOpen(false)}>Cancelar</Button>
              <Button onClick={()=> { if(!campaignName.trim()){ pushToast('Nome obrigatório','error'); return; } setCampaignStartOpen(false); setCampaignModalOpen(true); setCampaignSubject(campaignName); }} className="bg-[#D95323] text-white">Comece agora</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Coupon actions dropdown component
const CouponActionsDropdown: React.FC<{ coupon:any; onEdit:()=>void; onToggleStatus:()=>void; onDelete:()=>void; }> = ({ coupon, onEdit, onToggleStatus, onDelete }) => {
  const [open,setOpen] = useState(false);
  useEffect(()=> { const h=(e:MouseEvent)=> { if(!(e.target instanceof HTMLElement)) return; if(!e.target.closest?.('[data-coupon-actions]')) setOpen(false); }; if(open) window.addEventListener('click',h); return ()=> window.removeEventListener('click',h); }, [open]);
  return (
    <div className="relative" data-coupon-actions>
      <button onClick={()=> setOpen(o=> !o)} className="w-8 h-8 rounded-md hover:bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200"><span className="text-lg leading-none">⋮</span></button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-zinc-200 rounded-md shadow-sm py-1 z-10 text-[12px]">
          <button onClick={()=> { setOpen(false); onEdit(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50">Editar</button>
          <button onClick={()=> { setOpen(false); onToggleStatus(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50">{coupon.status==='ACTIVE'? 'Inativar':'Ativar'}</button>
          <button onClick={()=> { setOpen(false); onDelete(); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50">Excluir</button>
        </div>
      )}
    </div>
  );
};

// Campaign actions dropdown
const CampaignActionsDropdown: React.FC<{ orgId?: string; campaign:any; onDeleted:()=>void }> = ({ orgId, campaign, onDeleted }) => {
  const [open,setOpen] = useState(false);
  useEffect(()=> { const h=(e:MouseEvent)=> { if(!(e.target instanceof HTMLElement)) return; if(!e.target.closest?.('[data-campaign-actions]')) setOpen(false); }; if(open) window.addEventListener('click',h); return ()=> window.removeEventListener('click',h); }, [open]);
  const doDelete = async ()=> {
    if(!confirm('Deseja excluir esta campanha?')) return;
    try{
      await ensureApiBase().catch(()=>{});
      const id = orgId || (window as any).selectedOrgId || '';
      const r = await fetch(apiUrl(`/api/organization/${id}/campaigns/email/${campaign.id}`), { method:'DELETE' });
      if(!r.ok) throw new Error('Falha ao excluir');
      onDeleted();
    }catch(e:any){ alert(e?.message||'Erro ao excluir'); }
  };
  return (
    <div className="relative" data-campaign-actions>
      <button onClick={()=> setOpen(o=> !o)} className="w-8 h-8 rounded-md hover:bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200"><span className="text-lg leading-none">⋮</span></button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-zinc-200 rounded-md shadow-sm py-1 z-10 text-[12px]">
          <button onClick={()=> { setOpen(false); /* TODO: editar */ }} className="w-full text-left px-3 py-2 hover:bg-zinc-50">Editar</button>
          <button onClick={()=> { setOpen(false); doDelete(); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50">Excluir</button>
        </div>
      )}
    </div>
  );
};

export default MarketingTools;
