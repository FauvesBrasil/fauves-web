import React, { useState as useStateReact, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Lock } from 'lucide-react';
import { loadCheckoutSelection, clearCheckoutSelection } from '@/lib/checkoutSelection';
import { useAuth } from '@/context/AuthContext';
import { fetchApi, apiUrl, getApiDiagnostics } from '@/lib/apiBase';
import { fetchCep } from '@/lib/cep';
import LogoFauves from '@/components/LogoFauves';

// --- Mask helpers ---------------------------------------------------------
function onlyDigits(v: string, max?: number) {
  const d = v.replace(/\D+/g, '');
  return max ? d.slice(0, max) : d;
}

function formatCPF(raw: string) {
  const d = onlyDigits(raw, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhoneBR(raw: string) {
  const d = onlyDigits(raw, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCard(raw: string) {
  const d = onlyDigits(raw, 16);
  return d.replace(/(.{4})/g, '$1 ').trim();
}

function formatCEP(raw: string) {
  const d = onlyDigits(raw, 8);
  return d.replace(/(\d{5})(\d)/, '$1-$2');
}

// Validation helpers to ensure underlying digits length
function digitsLen(v: string) { return v.replace(/\D+/g, '').length; }

function Checkout() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useStateReact<'card' | 'pix'>('card');
  const [selection, setSelection] = useStateReact<any>(null);
  const [buyerEmail, setBuyerEmail] = useStateReact('');
  const [buyerName, setBuyerName] = useStateReact('');
  const [buyerSurname, setBuyerSurname] = useStateReact('');
  const [cpf, setCpf] = useStateReact('');
  const [phone, setPhone] = useStateReact('');
  const [cep, setCep] = useStateReact('');
  const [address, setAddress] = useStateReact('');
  const [city, setCity] = useStateReact('');
  const [stateUf, setStateUf] = useStateReact('');
  const [addressComplement, setAddressComplement] = useStateReact('');
  const [cepStatus, setCepStatus] = useStateReact<'idle'|'loading'|'error'|'filled'>('idle');
  const [cardNumber, setCardNumber] = useStateReact('');
  const [cardName, setCardName] = useStateReact('');
  const [cardExpiryMonth, setCardExpiryMonth] = useStateReact('');
  const [cardExpiryYear, setCardExpiryYear] = useStateReact('');
  const [cardCvv, setCardCvv] = useStateReact('');
  const [cardOwnerIsBuyer, setCardOwnerIsBuyer] = useStateReact(true);
  const [cardHolderName, setCardHolderName] = useStateReact('');
  const [cardHolderCpf, setCardHolderCpf] = useStateReact('');
  const [submitting, setSubmitting] = useStateReact(false);
  const [error, setError] = useStateReact<string | null>(null);
  const [success, setSuccess] = useStateReact<any>(null);
  // Debug / Dev helpers
  const [debugOpen, setDebugOpen] = useStateReact(false);
  const [dbgEventId, setDbgEventId] = useStateReact('');
  const [dbgTicketTypeId, setDbgTicketTypeId] = useStateReact('');
  const [dbgQuantity, setDbgQuantity] = useStateReact(1);
  const [dbgResult, setDbgResult] = useStateReact<any>(null);
  const [dbgPix, setDbgPix] = useStateReact<any>(null);
  const [dbgLoading, setDbgLoading] = useStateReact(false);
  const [dbgError, setDbgError] = useStateReact<string|null>(null);
  const [dbgStatus, setDbgStatus] = useStateReact<any>(null);
  const isDev = (import.meta.env.MODE !== 'production') || (typeof window !== 'undefined' && window.location.search.includes('debugCheckout=1'));
  useEffect(()=>{
    if(!isDev) return;
    const id = setInterval(()=>{
      try { setDbgStatus(getApiDiagnostics()); } catch {}
    }, 1500);
    return ()=>clearInterval(id);
  },[isDev]);
  const [prefilled, setPrefilled] = useStateReact<{email?: boolean; name?: boolean; surname?: boolean; cpf?: boolean; phone?: boolean; cep?: boolean}>({});
  const [loadingProfile, setLoadingProfile] = useStateReact(true);
  const { user } = useAuth();
  const userId = user?.id || null;
  const [participants, setParticipants] = useStateReact<string[]>([]);
  const [participantsTouched, setParticipantsTouched] = useStateReact(false);
  // Coupon (UI básica)
  const [showCoupon, setShowCoupon] = useStateReact(false);
  const [couponInput, setCouponInput] = useStateReact('');
  const [couponApplied, setCouponApplied] = useStateReact<string | null>(null);
  const [couponStatus, setCouponStatus] = useStateReact<'idle'|'applying'|'applied'|'invalid'>('idle');

  // Load local selection + user profile from Supabase
  useEffect(() => {
    setSelection(loadCheckoutSelection());
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      if (!user) { setLoadingProfile(false); return; }
      // Prefer backend account-settings (single source of truth for locked fields)
      try {
        const res = await fetchApi('/account-settings', { headers: { 'x-user-id': user.id } });
        if (res.ok) {
          const data = await res.json();
          if (data.email) setBuyerEmail(data.email);
          if (data.name) setBuyerName(data.name);
          if (data.surname) setBuyerSurname(data.surname);
          if (data.cpf) setCpf(formatCPF(data.cpf));
          if (data.phone) setPhone(formatPhoneBR(data.phone));
          if (data.cep) setCep(formatCEP(data.cep));
          setPrefilled({
            email: !!data.email,
            name: !!data.name,
            surname: !!data.surname,
            cpf: !!data.cpf,
            phone: !!data.phone,
            cep: !!data.cep,
          });
          return; // done
        }
      } catch {}
      // Fallback to basic user info if backend call fails
      if (user.email) setBuyerEmail(user.email);
      if (user.name) {
        const parts = user.name.split(' ');
        setBuyerName(parts[0]);
        setBuyerSurname(parts.slice(1).join(' '));
      }
      setPrefilled(p=>({ ...p, email: !!user.email, name: !!user.name, surname: !!(user.name && user.name.split(' ').slice(1).length) }));
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Derive flat list of ticket entries for participant assignment
  const ticketEntries = React.useMemo(()=>{
    if(!selection?.items) return [] as { ticketTypeId: string; name: string; index: number }[];
    const out: { ticketTypeId: string; name: string; index: number }[] = [];
    let idx = 0;
    for (const it of selection.items) {
      for (let i=0;i<it.quantity;i++) {
        out.push({ ticketTypeId: it.ticketTypeId, name: it.name, index: idx++ });
      }
    }
    return out;
  }, [selection]);

  // Initialize participants list length when ticketEntries changes
  useEffect(()=>{
    setParticipants(prev=>{
      if (ticketEntries.length === prev.length) return prev;
      const next = [...prev];
      for (let i=next.length; i<ticketEntries.length; i++) next[i] = (i===0 ? buyerEmail : '');
      return next.slice(0, ticketEntries.length);
    });
  }, [ticketEntries, buyerEmail]);

  const items = selection?.items || [];
  const total = items.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0);
  const discountAmount = couponApplied && couponApplied.toUpperCase() === 'TESTE10' ? total * 0.10 : 0;
  const finalTotal = total - discountAmount;
  const formatPrice = (n: number) => `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const participantsValid = participants.length === ticketEntries.length && participants.every(e=>!!e && /.+@.+\..+/.test(e));
  const baseValid = !!items.length && buyerEmail && buyerName && cpf && phone && participantsValid && !submitting && !success;
  const cardHolderCpfDigits = cardHolderCpf.replace(/\D+/g,'');
  const cardValid = paymentMethod === 'card'
    ? (
      digitsLen(cardNumber) === 16 &&
      cardName &&
      cardExpiryMonth.length === 2 &&
      cardExpiryYear.length === 4 &&
      digitsLen(cardCvv) >= 3 &&
      (
        cardOwnerIsBuyer || (
          cardHolderName.trim().length > 1 && cardHolderCpfDigits.length === 11
        )
      )
    )
    : true;
  const canSubmit = baseValid && cardValid;

  async function handleSubmit() {
    if (!selection) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1) Autosave missing profile fields (name, surname, cpf, phone, cep) BEFORE order creation
      //    Only send fields that were not originally prefilled so we don't attempt to modify locked fields later.
      if (userId) {
        const bodyUpdate: any = {};
        if (!prefilled.name && buyerName) bodyUpdate.name = buyerName;
        if (!prefilled.surname && buyerSurname) bodyUpdate.surname = buyerSurname;
        if (!prefilled.cpf && cpf) {
          const digitsCpf = cpf.replace(/\D+/g,'');
          if (digitsCpf.length === 11) bodyUpdate.cpf = digitsCpf; // backend will validate/ignore if already exists
        }
        if (!prefilled.phone && phone) {
          const digitsPhone = phone.replace(/\D+/g,'');
          if (digitsPhone.length >= 10 && digitsPhone.length <= 11) bodyUpdate.phone = digitsPhone;
        }
        if (!prefilled.cep && cep) {
          const digitsCep = cep.replace(/\D+/g,'');
          if (digitsCep.length === 8) bodyUpdate.cep = digitsCep;
        }
        if (Object.keys(bodyUpdate).length) {
          // Fire-and-forget; failure should not block checkout flow
            fetchApi('/account-settings', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(userId ? { 'x-user-id': userId } : {})
              },
              body: JSON.stringify(bodyUpdate)
            }).catch(()=>{});
        }
      }

      const body = {
        eventId: selection.eventId && selection.eventId !== 'unknown' ? selection.eventId : undefined,
        eventSlug: selection.eventSlug,
        purchaserName: buyerName + (buyerSurname ? ' ' + buyerSurname : ''),
        purchaserEmail: buyerEmail,
        paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'CARD',
        items: items.map((it: any) => ({ ticketTypeId: it.ticketTypeId, quantity: it.quantity })),
        participants: ticketEntries.map((te, i) => ({ email: participants[i], ticketTypeId: te.ticketTypeId })),
        couponCode: couponApplied || undefined
      };
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(()=>null);
      if (!res.ok || json?.error) {
        setError(json?.error ? `Erro: ${json.error}` : `HTTP ${res.status}`);
      } else {
        // Store success for card flow; for PIX redirect to dedicated page.
        clearCheckoutSelection();
        if (paymentMethod === 'pix') {
          const exp = json.reservationExpiresAt ? `&exp=${encodeURIComponent(json.reservationExpiresAt)}` : '';
          navigate(`/checkout/pix?orderId=${encodeURIComponent(json.id)}${exp}`);
        } else {
          setSuccess(json);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Falha inesperada');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans">
      {isDev && (
        <div className="fixed z-50 bottom-4 right-4 w-80 text-[11px] font-mono">
          <button
            onClick={()=>setDebugOpen(o=>!o)}
            className="px-3 py-1.5 rounded-t-md bg-indigo-900 text-white text-xs font-semibold shadow hover:bg-indigo-800"
          >{debugOpen ? 'Fechar painel DEV' : 'Abrir painel DEV'}</button>
          {debugOpen && (
            <div className="bg-white border border-indigo-200 rounded-b-md shadow-lg p-3 space-y-2 max-h-[70vh] overflow-auto">
              <div className="font-semibold text-indigo-900">Simular pedido + PIX</div>
              <label className="block">Evento
                <input value={dbgEventId} onChange={e=>setDbgEventId(e.target.value)} placeholder="eventId" className="mt-0.5 w-full border border-indigo-200 rounded px-2 py-1" />
              </label>
              <label className="block">Ticket Type
                <input value={dbgTicketTypeId} onChange={e=>setDbgTicketTypeId(e.target.value)} placeholder="ticketTypeId" className="mt-0.5 w-full border border-indigo-200 rounded px-2 py-1" />
              </label>
              <label className="block">Qtd
                <input type="number" min={1} value={dbgQuantity} onChange={e=>setDbgQuantity(parseInt(e.target.value||'1',10))} className="mt-0.5 w-24 border border-indigo-200 rounded px-2 py-1" />
              </label>
              <button
                disabled={!dbgEventId || !dbgTicketTypeId || dbgLoading}
                onClick={async ()=>{
                  setDbgError(null); setDbgResult(null); setDbgPix(null); setDbgLoading(true);
                  try {
                    const body = {
                      eventId: dbgEventId,
                      purchaserName: buyerName || 'Dev Tester',
                      purchaserEmail: buyerEmail || 'dev+tester@example.com',
                      paymentMethod: 'PIX',
                      items: [{ ticketTypeId: dbgTicketTypeId, quantity: dbgQuantity || 1 }]
                    };
                    const r = await fetchApi('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
                    const j = await r.json().catch(()=>null);
                    if(!r.ok || j?.error){ setDbgError(j?.error || ('status '+r.status)); setDbgLoading(false); return; }
                    setDbgResult(j);
                    // PIX intent
                    const rp = await fetchApi(`/api/orders/${j.id}/pix-intent`, { method:'POST' });
                    const jp = await rp.json().catch(()=>null);
                    if(!rp.ok || jp?.error){ setDbgError(jp?.error || ('pix status '+rp.status)); setDbgLoading(false); return; }
                    setDbgPix(jp);
                  } catch(e:any){ setDbgError(e.message || 'erro desconhecido'); }
                  finally { setDbgLoading(false); }
                }}
                className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded px-3 py-1.5 text-xs font-semibold"
              >{dbgLoading ? 'Criando...' : 'Criar pedido + PIX'}</button>
              {dbgError && <div className="text-red-600 whitespace-pre-wrap">Erro: {dbgError}</div>}
              {dbgStatus && (
                <div className="border border-yellow-200 rounded p-2 bg-yellow-50/60 mt-1">
                  <div className="font-semibold mb-1">API Status</div>
                  <pre className="text-[10px] overflow-auto max-h-32">{JSON.stringify({
                    base: dbgStatus.resolvedBase,
                    backoffMs: dbgStatus.backoffRemainingMs,
                    failures: dbgStatus.failureCount,
                  }, null, 2)}</pre>
                </div>
              )}
              {dbgResult && (
                <div className="border border-indigo-100 rounded p-2 bg-indigo-50/40"><div className="font-semibold mb-1">Order</div><pre className="text-[10px] overflow-auto max-h-40">{JSON.stringify(dbgResult,null,2)}</pre></div>
              )}
              {dbgPix && (
                <div className="border border-green-200 rounded p-2 bg-green-50/60 mt-1"><div className="font-semibold mb-1">PIX</div><pre className="text-[10px] overflow-auto max-h-40">{JSON.stringify(dbgPix,null,2)}</pre></div>
              )}
              <div className="text-[10px] text-indigo-900/60">Painel DEV não aparece em produção. Use ?debugCheckout=1 para forçar exibição.</div>
            </div>
          )}
        </div>
      )}
      {/* Left column (original behavior) */}
      <div className="w-1/2 h-full overflow-y-auto bg-[#2A2AD7] px-12 py-10 text-white flex flex-col items-end">
        <LogoFauves variant="white" width={140} className="self-end" />
        <div className="mt-10 bg-white text-indigo-950 rounded-2xl shadow-sm p-6 w-full max-w-md text-left">
          <div className="h-40 bg-zinc-300 rounded-xl mb-4" />
          <div className="space-y-1">
            <div className="font-semibold truncate" title={selection?.eventName}>{selection?.eventName || 'Evento'}</div>
            <div className="text-sm opacity-90">{selection?.eventDate || 'Data não definida'}</div>
          </div>
          <div className="border-t border-zinc-200 my-5" />
          <div>
            <div className="text-[10px] tracking-wider font-medium text-indigo-950/70">INGRESSOS</div>
            <div className="mt-2 space-y-2 text-sm">
              {!items.length && <div className="text-gray-500">Nenhum item carregado</div>}
              {items.map((it: any) => (
                <div key={it.ticketTypeId} className="flex justify-between">
                  <span className="mr-4 flex-1 text-left text-[14px]">{it.quantity} × {it.name}</span>
                  <span className="min-w-20 text-right text-[14px]">{formatPrice(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-zinc-200 my-5" />
          <div className="flex justify-between items-center text-base font-bold">
            <span className="mr-4 flex-1 text-left text-[18px]">Total</span>
            <span data-total={finalTotal} className="min-w-20 text-right text-[18px]">{formatPrice(finalTotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="mt-2 flex justify-between items-center text-[11px] font-medium text-green-600 bg-green-50 rounded-md px-3 py-2">
              <span className="mr-4 flex-1 text-left">Desconto ({couponApplied})</span>
              <span className="min-w-20 text-right">- {formatPrice(discountAmount)}</span>
            </div>
          )}
        </div>
        <div className="mt-auto pt-10 pb-4 text-xs opacity-70 text-right w-full">&copy; Fauves</div>
      </div>
      {/* Right column (scrollable) */}
      <div className="w-1/2 h-full overflow-y-auto bg-white flex flex-col items-start">
        {/* pb-40 = 10rem bottom padding to afastar conteúdo do final do scroll */}
        <div className="w-full max-w-xl ml-0 py-10 pl-12 pr-16 flex flex-col min-h-full pb-40">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-indigo-950">Finalizar compra</h1>
            {loadingProfile && <span className="text-xs text-indigo-900/60 animate-pulse">Carregando perfil...</span>}
          </div>
          {/* Buyer Data */}
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-indigo-900 tracking-wide">DADOS DO COMPRADOR</h2>
            <div className="mt-4 space-y-3 text-xs">
              <Input placeholder="E-mail" value={buyerEmail} disabled={prefilled.email} onChange={e=>setBuyerEmail(e.target.value)} className="h-11 text-indigo-950" />
              <div className="flex gap-3">
                <Input placeholder="Nome" value={buyerName} disabled={prefilled.name} onChange={e=>setBuyerName(e.target.value)} className="h-11 text-indigo-950" />
                <Input placeholder="Sobrenome" value={buyerSurname} disabled={prefilled.surname} onChange={e=>setBuyerSurname(e.target.value)} className="h-11 text-indigo-950" />
              </div>
              <div className="flex gap-3">
                <Input placeholder="CPF" value={cpf} disabled={prefilled.cpf} onChange={e=>setCpf(formatCPF(e.target.value))} className="h-11 text-indigo-950" />
                <Input placeholder="Celular" value={phone} disabled={prefilled.phone} onChange={e=>setPhone(formatPhoneBR(e.target.value))} className="h-11 text-indigo-950" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Input placeholder="CEP" value={cep} disabled={prefilled.cep} onChange={async e=>{
                    const masked = formatCEP(e.target.value);
                    setCep(masked);
                    if (!prefilled.cep) {
                      const digits = masked.replace(/\D+/g,'');
                      if (digits.length === 8) {
                        setCepStatus('loading');
                        try {
                          const r = await fetchCep(digits);
                          setAddress(r.address);
                          setCity(r.city);
                          setStateUf(r.state);
                          setCepStatus('filled');
                        } catch {
                          setCepStatus('error');
                        }
                      } else {
                        setCepStatus('idle');
                      }
                    }
                  }} className="h-11 text-indigo-950 w-40" />
                  {cepStatus==='loading' && <span className="text-[10px] text-indigo-600">Buscando...</span>}
                  {cepStatus==='error' && <span className="text-[10px] text-red-600">Erro CEP</span>}
                  {cepStatus==='filled' && <span className="text-[10px] text-green-600">OK</span>}
                </div>
                {(address || city || stateUf) && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <Input placeholder="Endereço" value={address} onChange={e=>setAddress(e.target.value)} disabled={!!prefilled.cep} className="h-10 text-indigo-950 col-span-2" />
                    <Input placeholder="Cidade" value={city} onChange={e=>setCity(e.target.value)} disabled={!!prefilled.cep} className="h-10 text-indigo-950" />
                    <Input placeholder="Estado" value={stateUf} onChange={e=>setStateUf(e.target.value)} disabled={!!prefilled.cep} className="h-10 text-indigo-950" />
                    <Input placeholder="Complemento" value={addressComplement} onChange={e=>setAddressComplement(e.target.value)} className="h-10 text-indigo-950 col-span-2" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-indigo-900/70 leading-relaxed mt-1">Todos os campos são obrigatórios. Caso algum dado já esteja salvo no seu perfil ele permanece bloqueado.</p>
          </div>
          </section>
          {/* Participants Section */}
          {ticketEntries.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-2 gap-4">
                <h2 className="text-sm font-semibold text-indigo-900 tracking-wide flex-1">INFORMAÇÕES POR INGRESSO</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={()=>{
                      if(!buyerEmail) return;
                      setParticipants(ticketEntries.map(()=>buyerEmail));
                      setParticipantsTouched(true);
                    }}
                    className="text-[10px] font-semibold px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!buyerEmail || !ticketEntries.length}
                  >Usar meu e-mail em todos</button>
                  <div className="text-[10px] font-medium text-indigo-900/60 whitespace-nowrap">
                    {participants.filter(e=>/.+@.+\..+/.test(e||'')).length}/{ticketEntries.length} preenchidos
                  </div>
                </div>
              </div>
              <div className="h-1 w-full rounded-full bg-indigo-100 overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all" style={{width: `${(participants.filter(e=>/.+@.+\..+/.test(e||'')).length / ticketEntries.length)*100}%`}} />
              </div>
              <p className="mt-3 text-[11px] text-indigo-900/70 leading-relaxed">Defina quem vai usar cada ingresso. Você pode usar seu próprio e-mail em múltiplos se quiser transferir depois.</p>
              <div className="mt-5 grid md:grid-cols-2 gap-4">
                {ticketEntries.map((t, i) => {
                  const val = participants[i] || '';
                  const invalid = participantsTouched && (!val || !/.+@.+\..+/.test(val));
                  const complete = !!val && !invalid;
                  return (
                    <div key={i} className={`group relative rounded-xl border bg-white/60 backdrop-blur-sm px-4 pt-3 pb-4 shadow-sm transition ring-1 ring-transparent hover:shadow-md ${complete ? 'border-green-300/70' : invalid ? 'border-red-300/70' : 'border-indigo-200/70'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600 text-white tracking-wide">{i+1}</span>
                          <span className="text-[11px] font-medium text-indigo-900/70 truncate max-w-[120px]" title={t.name}>{t.name}</span>
                        </div>
                        {complete && <span className="text-[10px] text-green-600 font-medium">OK</span>}
                        {invalid && <span className="text-[10px] text-red-600 font-medium">Corrigir</span>}
                      </div>
                      <Input
                        placeholder={`E-mail do participante`}
                        value={val}
                        onBlur={()=>setParticipantsTouched(true)}
                        onChange={e=>{
                          const v = e.target.value.trim();
                          setParticipants(p=>{
                            const next = [...p];
                            next[i] = v;
                            return next;
                          });
                        }}
                        className={`h-11 text-indigo-950 text-xs ${invalid ? 'border-red-400 focus-visible:ring-red-500' : complete ? 'border-green-300 focus-visible:ring-green-500/40' : ''}`}
                      />
                      <div className="mt-1 min-h-[14px]">
                        {invalid && <span className="text-[10px] text-red-600">E-mail inválido</span>}
                        {(!invalid && !complete) && <span className="text-[10px] text-indigo-900/40">Aguardando</span>}
                      </div>
                      <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-transparent group-hover:ring-indigo-500/30" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {/* Coupon Section (above payment methods) */}
          <section className="mb-10">
            <div className="border rounded-xl p-4 bg-white/80">
              {!couponApplied && !showCoupon && (
                <button
                  type="button"
                  onClick={()=>setShowCoupon(true)}
                  className="flex items-center gap-2 text-indigo-800 text-[12px] font-medium hover:text-indigo-900"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 text-[14px]">🏷️</span>
                  <span>Você tem um cupom? Clique aqui para adicioná-lo!</span>
                </button>
              )}
              {showCoupon && !couponApplied && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-[18px] font-semibold text-indigo-900 mb-1">Cupom</h3>
                    <p className="text-[12px] text-indigo-900/70">Você possui um cupom de desconto? Insira ele aqui.</p>
                  </div>
                  <input
                    value={couponInput}
                    onChange={e=>{ setCouponInput(e.target.value.toUpperCase()); if(couponStatus==='invalid') setCouponStatus('idle'); }}
                    placeholder="Código do cupom"
                    className="w-full h-11 px-3 rounded-md border border-indigo-200 text-[12px] font-medium tracking-wider text-indigo-900 placeholder:text-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <Button
                    type="button"
                    disabled={!couponInput.trim()}
                    onClick={()=>{
                      const code = couponInput.trim().toUpperCase();
                      if(!code) return;
                      if(code === 'TESTE10') { setCouponApplied(code); setCouponStatus('applied'); setShowCoupon(false); }
                      else { setCouponStatus('invalid'); }
                    }}
                    className="w-full h-11 bg-indigo-700 hover:bg-indigo-800 text-white text-[14px] font-regular"
                  >Aplicar cupom</Button>
                  {couponStatus==='invalid' && <div className="text-[12px] text-red-600">Cupom inválido</div>}
                </div>
              )}
              {couponApplied && (
                <div className="flex items-center justify-between text-[12px]">
                  <div className="text-green-700 font-medium">Cupom {couponApplied} aplicado (-10%)</div>
                  <button type="button" onClick={()=>{ setCouponApplied(null); setCouponInput(''); setCouponStatus('idle'); setShowCoupon(false); }} className="text-[11px] text-indigo-700 underline hover:text-indigo-900">remover</button>
                </div>
              )}
            </div>
          </section>
          {/* Payment Method */}
          <section className="mb-10">
            <h2 className="text-[18px] font-semibold text-indigo-900 tracking-wide">Forma de pagamento</h2>
            <div className="flex gap-4 mt-4">
              <button type="button" onClick={()=>setPaymentMethod('card')} className={`flex-1 rounded-xl border p-4 text-[14px] text-left transition ${paymentMethod==='card' ? 'border-orange-600 bg-orange-50' : 'border-zinc-200 hover:border-indigo-300'}`}>
                <div className="font-semibold text-indigo-950">Cartão</div>
                <div className="mt-1 text-[12px] text-indigo-900/70">em até 12x</div>
              </button>
              <button type="button" onClick={()=>setPaymentMethod('pix')} className={`flex-1 rounded-xl border p-4 text-[14px] text-left transition ${paymentMethod==='pix' ? 'border-orange-600 bg-orange-50' : 'border-zinc-200 hover:border-indigo-300'}`}>
                <div className="font-semibold text-indigo-950">Pix</div>
                <div className="mt-1 text-[12px] text-indigo-900/70">à vista</div>
              </button>
            </div>
            {paymentMethod==='card' && (
              <div className="mt-6 space-y-3 text-xs">
                <Input placeholder="Número do Cartão" value={cardNumber} onChange={e=>setCardNumber(formatCard(e.target.value))} className="h-11 text-indigo-950" />
                <Input placeholder="Nome impresso no cartão" value={cardName} onChange={e=>setCardName(e.target.value)} className="h-11 text-indigo-950" />
                <div className="flex gap-3">
                  <Input placeholder="Mês" value={cardExpiryMonth} onChange={e=>setCardExpiryMonth(onlyDigits(e.target.value,2))} className="h-11 text-indigo-950 w-24" />
                  <Input placeholder="Ano" value={cardExpiryYear} onChange={e=>setCardExpiryYear(onlyDigits(e.target.value,4))} className="h-11 text-indigo-950 w-32" />
                  <Input placeholder="CVV" value={cardCvv} onChange={e=>setCardCvv(onlyDigits(e.target.value,4))} className="h-11 text-indigo-950 w-24" />
                </div>
                <Select>
                  <SelectTrigger className="h-11 text-indigo-950"><SelectValue placeholder="Parcelas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="6">6x</SelectItem>
                    <SelectItem value="12">12x</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-3">
                  <div className="inline-flex rounded-xl overflow-hidden border border-indigo-200 bg-indigo-50/40 text-[11px] font-medium">
                    <button type="button" onClick={()=>setCardOwnerIsBuyer(true)}
                      className={`px-4 py-2 transition ${cardOwnerIsBuyer ? 'bg-indigo-600 text-white' : 'text-indigo-800 hover:bg-indigo-100'}`}>Sou o titular</button>
                    <button type="button" onClick={()=>setCardOwnerIsBuyer(false)}
                      className={`px-4 py-2 transition ${!cardOwnerIsBuyer ? 'bg-indigo-600 text-white' : 'text-indigo-800 hover:bg-indigo-100'}`}>Outro titular</button>
                  </div>
                </div>
                {!cardOwnerIsBuyer && (
                  <div className="mt-4 p-4 rounded-xl border border-indigo-200/70 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-3">
                    <div className="text-[11px] font-semibold text-indigo-900 tracking-wide">DADOS DO TITULAR</div>
                    <Input placeholder="Nome completo do titular" value={cardHolderName} onChange={e=>setCardHolderName(e.target.value)} className="h-11 text-indigo-950" />
                    <div className="flex gap-3 items-start">
                      <Input placeholder="CPF do titular" value={cardHolderCpf} onChange={e=>setCardHolderCpf(formatCPF(e.target.value))} className="h-11 text-indigo-950" />
                      <div className="text-[10px] text-indigo-900/60 leading-snug pt-1">Usado apenas para verificação antifraude e não será compartilhado.</div>
                    </div>
                    {cardHolderCpf && cardHolderCpf.replace(/\D+/g,'').length !== 11 && (
                      <div className="text-[10px] text-red-600">CPF incompleto</div>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-indigo-900/60">Nunca compartilhe seus dados completos do cartão fora do fluxo seguro.</p>
              </div>
            )}
            {paymentMethod==='pix' && (
              <div className="mt-6 text-xs leading-relaxed rounded-xl border border-orange-200 bg-orange-50 text-orange-900 p-4">
                <p className="font-medium mb-1">Opção rápida para ter seus ingressos!</p>
                <p>
                  Ao finalizar a compra, será gerado um QR Code para pagamento através do aplicativo do seu banco.
                  Seus ingressos ficarão disponíveis assim que o pagamento for confirmado.
                </p>
              </div>
            )}
          </section>
          <div className="mt-auto pt-10">
            <Button disabled={!canSubmit} onClick={handleSubmit} className="w-full text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 h-12 rounded-xl flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              {submitting ? 'Processando...' : success ? 'Concluído' : 'Finalizar compra'}
            </Button>
            <div className="flex gap-2.5 items-center justify-center px-4 py-2 mt-3 w-full text-[11px] rounded-md bg-indigo-950/5 min-h-[34px] text-indigo-900">
              <Shield className="w-3 h-3" />
              <div>Os pagamentos são seguros e criptografados</div>
            </div>
            {/* Extra spacer para garantir respiro ao final */}
            <div className="h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
