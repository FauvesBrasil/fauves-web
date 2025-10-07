// MarketingTools (clean production baseline) - all debug & test artifacts removed
import React, { useEffect, useRef, useState } from 'react';
import { fetchApi, ensureApiBase } from '@/lib/apiBase';
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
  const { selectedOrg } = useOrganization();

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

  // Fetch events (basic source; can be evolved later)
  useEffect(()=> { (async ()=> {
    setLoadingEvents(true);
    try {
      await ensureApiBase().catch(()=>{});
      const res = await fetchApi('/api/events/by-user');
      const data = await res.json().catch(()=>({items:[]}));
      const list: any[] = Array.isArray(data)? data : (Array.isArray(data.items)? data.items: []);
      const mapped: EventLite[] = list.map(e=> ({ id:e.id, name:e.name, startDate:e.startDate||e.startDateUtc||null }));
      setEvents(mapped);
      setActiveEventId(prev => mapped.some(m=> m.id===prev)? prev : (mapped[0]?.id || null));
    } catch {
      pushToast('Erro ao carregar eventos','error');
      setEvents([]);
    } finally { setLoadingEvents(false); }
  })(); }, [selectedOrg?.id]);

  const visibleEvents = React.useMemo(()=> {
    if(!selectedOrg?.id) return events;
    // For now no server-side scoping fields guaranteed; allow all events.
    return events;
  }, [events, selectedOrg?.id]);

  // Mock campaigns list
  useEffect(()=> { if(tab!=='campanhas') return; setCampaignsLoading(true); const t=setTimeout(()=> { setCampaigns([
    {id:'c1', name:'Campanha exemplo', status:'rascunho'},
    {id:'c2', name:'Pré-venda VIP', status:'agendado'},
    {id:'c3', name:'Último Lote', status:'enviado', openRate:0.42, clickRate:0.11}
  ]); setCampaignsLoading(false); }, 400); return ()=> clearTimeout(t); }, [tab]);

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
    <div className="relative min-h-screen w-full bg-white flex justify-center items-start">
      <SidebarMenu activeKeyOverride="marketing" />
      <div className="rounded-3xl w-[1352px] bg-white max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4 pb-32">
          <div className="flex flex-col gap-1">
            <span className="text-[18px] font-semibold text-[#0205D3]">FauvesBoost</span>
            <h1 className="text-4xl font-bold text-slate-900">Ferramentas de marketing</h1>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium mb-5">
            {['painel','campanhas','promocoes'].map(k => (
              <button key={k} onClick={()=> setTab(k as any)} className={`pb-2 relative transition ${tab===k? 'text-slate-900':'text-zinc-500 hover:text-zinc-700'}`}>
                {k==='painel'? 'Painel': k==='campanhas'? 'Campanhas de e-mail':'Promoções'}
                {tab===k && <span className="absolute left-0 right-0 -bottom-[9px] h-[2px] bg-indigo-600 rounded-full" />}
              </button>
            ))}
          </div>
          {tab==='painel' && (
            <div className="bg-[#F6F7FB] rounded-xl border border-zinc-200 px-8 pt-8 pb-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                {loadingEvents ? (
                  <div className="animate-pulse space-y-2"><div className="h-4 w-72 bg-zinc-200 rounded" /><div className="h-3 w-96 bg-zinc-200 rounded" /></div>
                ) : (
                  <>
                    {daysUntil!==null && <p className="text-[15px] font-medium text-slate-900">Seu próximo evento acontecerá em <span className="text-indigo-700 font-semibold underline decoration-2 underline-offset-[3px]">{daysUntil} {daysUntil===1?'dia':'dias'}</span></p>}
                    <p className="text-[13px] text-slate-500">Use essas ferramentas para promover seu evento e vender mais ingressos.</p>
                  </>
                )}
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg p-5 relative" ref={selectorRef}>
                {loadingEvents ? (
                  <div className="animate-pulse flex items-center gap-4"><div className="w-12 h-12 rounded-md bg-zinc-200" /><div className="flex-1 space-y-2"><div className="h-4 w-56 bg-zinc-200 rounded" /><div className="h-3 w-40 bg-zinc-200 rounded" /></div></div>
                ) : (
                  <button onClick={()=> setSelectorOpen(o=> !o)} className="flex items-center gap-4 w-full text-left">
                    <div className="w-14 h-14 rounded-md bg-zinc-300" />
                    <div className="flex flex-col">
                      <div className="text-[13px] font-medium text-slate-900">{activeEvent?.name || 'Evento'}</div>
                      <div className="text-[11px] text-orange-600 mt-0.5">Inicia {formatDate(activeEvent?.startDate)}</div>
                    </div>
                    <span className={`ml-auto text-slate-700 text-sm transition-transform ${selectorOpen? 'rotate-180':''}`}>▾</span>
                  </button>
                )}
                {!loadingEvents && selectorOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-20">
                    <ul className="max-h-64 overflow-auto divide-y divide-zinc-100 text-sm">
                      {visibleEvents.map(ev => (
                        <li key={ev.id}><button onClick={()=> { setActiveEventId(ev.id); setSelectorOpen(false); }} className={`w-full text-left px-4 py-3 hover:bg-indigo-50 ${ev.id===activeEventId? 'bg-indigo-50/60 font-medium text-indigo-800':'text-slate-700'}`}>{ev.name}</button></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {tasks.map(t => (
                  <div key={t.key} className="p-5 border border-zinc-200 rounded-xl bg-white flex flex-col gap-2 hover:shadow-sm transition">
                    <div className="text-[14px] font-semibold text-slate-900">{t.title}</div>
                    <div className="text-[12px] text-slate-600 leading-relaxed">{t.desc}</div>
                    <button className="mt-auto self-start text-[12px] text-indigo-700 font-medium hover:underline">Abrir</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==='campanhas' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <input value={campaignSearch} onChange={e=> setCampaignSearch(e.target.value)} placeholder="Pesquisar campanhas" className="flex-1 h-12 rounded-xl border border-[#E5E7EB] px-5 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#F6F7FB] text-slate-600 text-xs font-medium"><tr><th className="py-4 px-6">Campanha</th><th className="py-4 px-6">Status</th><th className="py-4 px-6">Abertura</th><th className="py-4 px-6">Cliques</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100 text-[13px]">
                    {campaignsLoading ? (
                      Array.from({length:3}).map((_,i)=>(<tr key={i} className="animate-pulse"><td className="py-4 px-6"><div className="h-4 w-56 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-20 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-14 bg-zinc-200 rounded" /></td><td className="py-4 px-6"><div className="h-4 w-14 bg-zinc-200 rounded" /></td></tr>))
                    ) : (
                      campaigns.filter(c => campaignSearch==='' || c.name.toLowerCase().includes(campaignSearch.toLowerCase())).map(c => (
                        <tr key={c.id} className="hover:bg-[#F8F9FC]">
                          <td className="py-4 px-6 text-slate-900 font-medium">{c.name}</td>
                          <td className="py-4 px-6 text-slate-700 capitalize">{c.status}</td>
                          <td className="py-4 px-6 text-slate-700">{c.openRate!=null? (c.openRate*100).toFixed(0)+'%':'—'}</td>
                          <td className="py-4 px-6 text-slate-700">{c.clickRate!=null? (c.clickRate*100).toFixed(0)+'%':'—'}</td>
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
                  <DrawerContent className="max-w-lg">
                    <DrawerHeader className="p-6 pb-2 text-left border-b border-gray-100">
                      <DrawerTitle className="text-xl font-bold text-indigo-950">{editingCouponId? 'Editar cupom':'Criar cupom'}</DrawerTitle>
                      <DrawerDescription className="text-[13px] text-slate-500">Configure código, desconto e validade.</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-6 pb-4 pt-4 overflow-y-auto flex-1 flex flex-col gap-4">
                      <form id="couponForm" onSubmit={submitCoupon} className="flex flex-col gap-5 text-[13px]">
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-medium text-slate-600">Código</Label>
                          <Input value={couponForm.code} onChange={e=> setCouponForm(f=> ({...f,code:e.target.value.toUpperCase()}))} placeholder="EXEMPLO10" className="h-11 rounded-xl text-sm" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-medium text-slate-600">Desconto</Label>
                          <div className="rounded-xl overflow-hidden border border-zinc-300">
                            <div className="flex items-stretch">
                              <div className="flex items-center px-3 text-[12px] text-slate-500 select-none">{couponForm.type==='PERCENT'? '%':'R$'}</div>
                              <Input value={couponForm.value} onChange={e=> setCouponForm(f=> ({...f,value:e.target.value.replace(/[^0-9.,]/g,'')}))} placeholder={couponForm.type==='PERCENT'? '10':'0'} className="h-11 border-0 focus-visible:ring-0 text-sm" />
                            </div>
                            <div className="grid grid-cols-2">
                              <button type="button" onClick={()=> setCouponForm(f=> ({...f,type:'FIXED'}))} className={`h-9 text-[12px] font-medium ${couponForm.type==='FIXED'? 'bg-indigo-600 text-white':'text-slate-700 hover:bg-indigo-50'}`}>Valor</button>
                              <button type="button" onClick={()=> setCouponForm(f=> ({...f,type:'PERCENT'}))} className={`h-9 text-[12px] font-medium border-l border-zinc-300 ${couponForm.type==='PERCENT'? 'bg-indigo-600 text-white':'text-slate-700 hover:bg-indigo-50'}`}>Percentual</button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500">Ex: 10 (para {couponForm.type==='PERCENT'? '10%':'R$10'})</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-medium text-slate-600">Início</Label>
                          <Input type="datetime-local" value={couponForm.startsAt} onChange={e=> setCouponForm(f=> ({...f,startsAt:e.target.value}))} className="h-11 rounded-xl text-sm" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-medium text-slate-600">Fim</Label>
                          <Input type="datetime-local" value={couponForm.endsAt} onChange={e=> setCouponForm(f=> ({...f,endsAt:e.target.value}))} className="h-11 rounded-xl text-sm" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[12px] font-medium text-slate-600">Quantidade máxima</Label>
                          <Input value={couponForm.maxUses} onChange={e=> setCouponForm(f=> ({...f,maxUses:e.target.value.replace(/[^0-9]/g,'')}))} placeholder="100" className="h-11 rounded-xl text-sm" />
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
                    <DrawerFooter className="p-6 pt-0 flex-row gap-4 justify-between border-t border-gray-100">
                      <DrawerClose asChild>
                        <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl text-sm">Cancelar</Button>
                      </DrawerClose>
                      <Button form="couponForm" disabled={savingCoupon} className="flex-1 h-11 rounded-xl bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white text-sm font-bold shadow-sm disabled:opacity-60">{savingCoupon? 'Salvando...': (editingCouponId? 'Salvar':'Criar')}</Button>
                      <button type="button" onClick={()=> setCouponDrawerOpen(false)} className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
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

export default MarketingTools;
