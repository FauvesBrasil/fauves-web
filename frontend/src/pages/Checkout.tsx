import React, { useState as useStateReact, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, HelpCircle, ArrowRight, X, Check } from 'lucide-react';
import { loadCheckoutSelection, clearCheckoutSelection } from '@/lib/checkoutSelection';
import { useAuth } from '@/context/AuthContext';
import { fetchApi, apiUrl } from '@/lib/apiBase';
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
  const [selection, setSelection] = useStateReact<any>(null);
  const { user, refreshUser } = useAuth();
  const userId = user?.id || null;

  // Buyer data
  const [buyerEmail, setBuyerEmail] = useStateReact('');
  const [buyerName, setBuyerName] = useStateReact('');
  const [buyerSurname, setBuyerSurname] = useStateReact('');
  const [cpf, setCpf] = useStateReact('');
  const [phone, setPhone] = useStateReact('');
  const [prefilled, setPrefilled] = useStateReact<{[k:string]:boolean}>({});
  const [loadingProfile, setLoadingProfile] = useStateReact(true);

  // Participants
  const [participants, setParticipants] = useStateReact<string[]>([]);
  const [participantsTouched, setParticipantsTouched] = useStateReact(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useStateReact<'card' | 'pix'>('card');
  const [cardNumber, setCardNumber] = useStateReact('');
  const [cardName, setCardName] = useStateReact('');
  const [cardExpiryMonth, setCardExpiryMonth] = useStateReact('');
  const [cardExpiryYear, setCardExpiryYear] = useStateReact('');
  const [cardCvv, setCardCvv] = useStateReact('');

  const [submitting, setSubmitting] = useStateReact(false);
  const [error, setError] = useStateReact<string|null>(null);
  const [success, setSuccess] = useStateReact<any>(null);
  const [cpfError, setCpfError] = useStateReact<string|null>(null);

  // Minimal coupon support kept
  const [couponApplied, setCouponApplied] = useStateReact<string|null>(null);

  // Birthdate (new field for design) and countdown (10 minutes = 600s)
  const [birthDate, setBirthDate] = useStateReact('');
  const [secondsLeft, setSecondsLeft] = useStateReact(600);

  // Phone handling: we simplify to a single celular field with Brazilian mask

  useEffect(()=>{
    // use session-backed timer so it persists across pages
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const t = require('@/lib/checkoutTimer');
      t.ensureTimerStarted();
      setSecondsLeft(t.getSecondsLeft());
      const id = setInterval(()=> setSecondsLeft(t.getSecondsLeft()), 1000);
      return ()=> clearInterval(id);
    } catch(e) {
      const id = setInterval(()=>{
        setSecondsLeft(s => Math.max(0, s-1));
      }, 1000);
      return ()=>clearInterval(id);
    }
  },[]);

  useEffect(()=>{ setSelection(loadCheckoutSelection()); }, []);

  const loadProfile = useCallback(async()=>{
    try {
      if (!user) { setLoadingProfile(false); return; }
      try {
        // Prefer usar o token Authorization (fetchApi já anexa o token se existir)
        const res = await fetchApi('/account-settings');
        if (res && res.ok) {
          const data = await res.json();
          if (data.email) setBuyerEmail(data.email);
          if (data.name) setBuyerName(data.name);
          if (data.surname) setBuyerSurname(data.surname);
          if (data.cpf) setCpf(data.cpf);
          if (data.phone) setPhone(data.phone);
          setPrefilled({
            email: !!data.email,
            name: !!data.name,
            surname: !!data.surname,
            cpf: !!data.cpf,
            phone: !!data.phone,
          });
          return;
        }
      } catch (err) {
        // se falhar a requisição com token, tentamos fallback para dados mínimos do token
      }
      // fallback to minimal user info
      if (user.email) setBuyerEmail(user.email);
      if (user.name) {
        const parts = user.name.split(' ');
        setBuyerName(parts[0]);
        setBuyerSurname(parts.slice(1).join(' '));
      }
      setPrefilled(p=>({ ...p, email: !!user.email, name: !!user.name }));
    } finally { setLoadingProfile(false); }
  }, [user]);

  useEffect(()=>{ loadProfile(); }, [loadProfile]);

  // If profile already has all required fields, skip this page and go to review
  useEffect(()=>{
    if (!loadingProfile && prefilled && prefilled.email && prefilled.name && prefilled.cpf && prefilled.phone) {
      try { navigate('/checkout/review'); } catch(e){}
    }
  }, [loadingProfile, prefilled, navigate]);

  function saveBuyerToSession(){
    try {
      const buyer = { buyerEmail, buyerName, buyerSurname, cpf, phone, birthDate };
      sessionStorage.setItem('checkoutBuyer:v1', JSON.stringify(buyer));
    } catch(e) { /* ignore */ }
  }

  // CPF validation (returns true if CPF is structurally valid)
  function isValidCPF(str: string) {
    const s = (str || '').replace(/\D+/g, '');
    if (!s || s.length !== 11) return false;
    // Reject sequences
    if (/^(\d)\1+$/.test(s)) return false;
    const digits = s.split('').map(d=>+d);
    // first verifier
    let sum = 0;
    for(let i=0;i<9;i++) sum += digits[i] * (10 - i);
    let r = (sum * 10) % 11; if (r === 10) r = 0;
    if (r !== digits[9]) return false;
    // second
    sum = 0;
    for(let i=0;i<10;i++) sum += digits[i] * (11 - i);
    r = (sum * 10) % 11; if (r === 10) r = 0;
    return r === digits[10];
  }

  // Format phone based on selected country (basic)
  function formatPhoneForCountry(dialCode: string, raw: string) {
    const d = onlyDigits(raw);
    if (dialCode === '+55') {
      // Brazilian: (DD) 9XXXX-XXXX or (DD) XXXX-XXXX
      if (d.length <= 2) return d;
      const cep = d.slice(0,2);
      const rest = d.slice(2);
      if (rest.length <= 4) return `(${cep}) ${rest}`;
      if (rest.length <= 9) return `(${cep}) ${rest.slice(0, rest.length-4)}-${rest.slice(-4)}`;
      return `(${cep}) ${rest.slice(0, rest.length-4)}-${rest.slice(-4)}`;
    }
    if (dialCode === '+1') {
      // US: (XXX) XXX-XXXX
      if (d.length <= 3) return d;
      if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
      return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
    }
    // fallback: group by 3/4
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0,d.length-4)}-${d.slice(-4)}`;
    return `${d.slice(0,d.length-4)}-${d.slice(-4)}`;
  }

  // ticket entries
  const ticketEntries = React.useMemo(()=>{
    if(!selection?.items) return [] as { ticketTypeId:string; name:string; index:number }[];
    const out: { ticketTypeId:string; name:string; index:number }[] = [];
    let idx = 0;
    for(const it of selection.items) {
      for(let i=0;i<it.quantity;i++) out.push({ ticketTypeId: it.ticketTypeId, name: it.name, index: idx++ });
    }
    return out;
  }, [selection]);

  useEffect(()=>{
    setParticipants(prev=>{
      if (ticketEntries.length === prev.length) return prev;
      const next = [...prev];
      for(let i=next.length;i<ticketEntries.length;i++) next[i] = (i===0 ? buyerEmail : '');
      return next.slice(0, ticketEntries.length);
    });
  }, [ticketEntries, buyerEmail]);

  const items = selection?.items || [];
  const total = items.reduce((acc:any,it:any)=>acc + it.price * it.quantity, 0);
  const discountAmount = couponApplied === 'TESTE10' ? total * 0.10 : 0;
  const finalTotal = total - discountAmount;
  const formatPrice = (n:number) => `R$${n.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

  const participantsValid = participants.length === ticketEntries.length && participants.every(e=>!!e && /.+@.+\..+/.test(e));

  // Determine missing buyer fields (only show inputs for these)
  const missingBuyerFields = {
    email: !buyerEmail,
    name: !buyerName,
    surname: !buyerSurname,
    cpf: !cpf,
    phone: !phone,
  };

  const baseValid = !!items.length && buyerEmail && buyerName && isValidCPF(cpf) && phone && participantsValid && !submitting && !success;

  async function handleSubmit(){
    if(!selection) return;
    setSubmitting(true); setError(null);
    try {
      // autosave missing profile fields (fire and forget)
      if (userId) {
        const upd:any = {};
        if (!prefilled.name && buyerName) upd.name = buyerName;
        if (!prefilled.surname && buyerSurname) upd.surname = buyerSurname;
  if (!prefilled.cpf && cpf) upd.cpf = cpf.replace(/\D+/g,'');
  if (!prefilled.phone && phone) upd.phone = onlyDigits(phone);
        if (Object.keys(upd).length) {
          fetchApi('/account-settings', { method: 'PUT', headers: { 'Content-Type':'application/json', ...(userId?{ 'x-user-id': userId }:{}) }, body: JSON.stringify(upd) }).catch(()=>{});
        }
      }

      const body = {
        eventId: selection.eventId && selection.eventId !== 'unknown' ? selection.eventId : undefined,
        eventSlug: selection.eventSlug,
        purchaserName: buyerName + (buyerSurname ? ' ' + buyerSurname : ''),
        purchaserEmail: buyerEmail,
        paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'CARD',
        items: items.map((it:any)=>({ ticketTypeId: it.ticketTypeId, quantity: it.quantity })),
        participants: ticketEntries.map((te,i)=>({ email: participants[i], ticketTypeId: te.ticketTypeId })),
        couponCode: couponApplied || undefined
      };

      const res = await fetchApi('/api/orders', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(()=>null);
      if (!res.ok || json?.error) {
        setError(json?.error ? `Erro: ${json.error}` : `HTTP ${res.status}`);
      } else {
        clearCheckoutSelection();
        if (paymentMethod === 'pix') {
          const exp = json.reservationExpiresAt ? `&exp=${encodeURIComponent(json.reservationExpiresAt)}` : '';
          navigate(`/checkout/pix?orderId=${encodeURIComponent(json.id)}${exp}`);
        } else {
          setSuccess(json);
        }
      }
    } catch(e:any){ setError(e?.message || 'Falha inesperada'); }
    finally { setSubmitting(false); }
  }

  const canSubmit = baseValid && (paymentMethod === 'pix' || (paymentMethod==='card' ? (cardNumber.replace(/\D+/g,'').length === 16 && cardName && cardExpiryMonth.length===2 && cardExpiryYear.length===4 && cardCvv.replace(/\D+/g,'').length >= 3) : true));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white flex-col">
      {/* Header */}
      <header className="w-full">
        <div className="flex items-center justify-between px-8 py-2">
          <div className="flex items-center">
            <LogoFauves width={80} />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[16px] font-semibold text-indigo-900">{Math.floor(secondsLeft/60).toString().padStart(2,'0')}:{(secondsLeft%60).toString().padStart(2,'0')}</div>
            <a href="https://support.fauves.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-indigo-900 hover:bg-indigo-50">
              <HelpCircle className="w-4 h-4" />
              Ajuda
            </a>
          </div>
        </div>
        <div style={{ height: 2, background: 'linear-gradient(90deg, #0205D3 0%, #EF4118 100%)' }} />
      </header>

      {/* Centered form */}
      <main className="flex-1 flex items-start justify-center bg-white">
        <div className="w-full max-w-2xl mt-12 px-8">
          <div className="bg-white p-10 rounded-lg">
            <h1 className="text-3xl font-bold text-indigo-950 mb-2"><span role="img" aria-label="acenar" className="wave-emoji">👋</span> Vamos nos conhecer antes de finalizar o pedido</h1>
            <p className="text-indigo-800/80 mb-6">Alguns detalhes a mais e estamos prontos:</p>

            <div className="space-y-4">
              <Input placeholder="Nome" value={buyerName} onChange={e=>setBuyerName(e.target.value)} className="h-12" />
              <Input placeholder="Sobrenome" value={buyerSurname} onChange={e=>setBuyerSurname(e.target.value)} className="h-12" />
              <Input placeholder="E-mail" value={buyerEmail} onChange={e=>setBuyerEmail(e.target.value)} className="h-12" />
              <Input placeholder="Celular" value={phone} onChange={e=>setPhone(formatPhoneBR(e.target.value))} className="h-12" />
              <div>
                <label className="block text-sm text-indigo-800/80 mb-1">Data de Nascimento</label>
                <Input type="date" placeholder="Data de Nascimento" value={birthDate} onChange={e=>setBirthDate(e.target.value)} className="h-12" />
              </div>
              <div className="relative">
                <Input placeholder="CPF" value={cpf} onChange={e=>{
                  const formatted = formatCPF(e.target.value);
                  setCpf(formatted);
                  const digits = onlyDigits(formatted);
                  if (digits.length === 11) setCpfError(isValidCPF(formatted) ? null : 'CPF inválido');
                  else setCpfError(null);
                }} className="h-12 pr-10" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cpf ? (cpfError ? <X className="w-4 h-4 text-red-600" /> : <Check className="w-4 h-4 text-emerald-500" />) : null}
                </div>
                {/* inline icon indicates validity; no separate text message */}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-indigo-800/70 mb-4">Quer fazer a compra com outra conta? <a className="text-indigo-700 underline" href="#">Faça o logout</a></p>
              <p className="text-xs text-indigo-700/60 mb-4">Ao continuar você concorda com os <a className="underline" href="#">termos de uso</a> e <a className="underline" href="#">política de privacidade</a> da Fauves.</p>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    setSubmitting(true);
                    setError(null);
                    try {
                      // if logged in, persist missing profile fields to server
                      if (userId) {
                        const upd:any = {};
                        if (!prefilled.name && buyerName) upd.name = buyerName;
                        if (!prefilled.surname && buyerSurname) upd.surname = buyerSurname;
                        if (!prefilled.cpf && cpf) upd.cpf = onlyDigits(cpf);
                        if (!prefilled.phone && phone) upd.phone = onlyDigits(phone);
                        if (!prefilled.email && buyerEmail) upd.email = buyerEmail;
                        if (Object.keys(upd).length) {
                            // await to ensure server has values for next page
                            try {
                              console.log('[Checkout] PUT /account-settings payload', upd);
                            } catch {}
                            const res = await fetchApi('/account-settings', {
                              method: 'PUT',
                              headers: { 'Content-Type':'application/json', ...(userId?{ 'x-user-id': userId }:{}) },
                              body: JSON.stringify(upd)
                            }).catch((err)=>{ return { ok: false, __err: err }; });

                            let respBody: any = null;
                            try {
                              if (res && (res as any).ok && typeof (res as any).clone === 'function') {
                                respBody = await (res as Response).clone().json().catch(()=>null);
                              } else if (res && typeof (res as any).json === 'function') {
                                // try to read body even if not ok (may consume stream)
                                respBody = await (res as Response).json().catch(()=>null);
                              }
                            } catch {}
                            try { console.log('[Checkout] PUT /account-settings response', (res && (res as any).status) || null, respBody); } catch {}

                            if (res && res.ok) {
                              // mark fields as saved locally so the redirect logic can pick it up
                              const newPrefilled = { ...prefilled };
                              if (upd.name) newPrefilled.name = true;
                              if (upd.surname) newPrefilled.surname = true;
                              if (upd.cpf) newPrefilled.cpf = true;
                              if (upd.phone) newPrefilled.phone = true;
                              if (upd.email) newPrefilled.email = true;
                              try { setPrefilled(newPrefilled); } catch(e){}
                              // refresh auth/user data so future pages read authoritative values
                              try { await refreshUser?.(); } catch(e){}
                              try { window.dispatchEvent(new Event('profile-updated')); } catch(e){}
                              try {
                                const to = require('@/hooks/use-toast');
                                to.toast({ title: 'Dados salvos', description: 'Seus dados foram salvos com sucesso.', variant: 'success' });
                              } catch(e){}
                            } else {
                              // show a toast and DO NOT navigate so user can retry
                              try {
                                const to = require('@/hooks/use-toast');
                                const msg = (respBody && respBody.error) ? String(respBody.error) : 'Não foi possível salvar seus dados no momento.';
                                to.toast({ title: 'Erro ao salvar perfil', description: msg, variant: 'destructive' });
                              } catch (e) { /* ignore toast errors */ }
                              // stop here, don't navigate to review because data wasn't persisted
                              setSubmitting(false);
                              return;
                            }
                          }
                      }
                      // persist to session and navigate
                      saveBuyerToSession();
                      navigate('/checkout/review');
                    } catch(e:any){
                      // still navigate, but show error if needed
                      setError(e?.message || 'Falha ao salvar perfil');
                      try {
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const to = require('@/hooks/use-toast');
                        to.toast({ title: 'Erro ao salvar perfil', description: String(e?.message || 'Falha ao salvar perfil'), variant: 'destructive' });
                      } catch (e) { /* ignore */ }
                      saveBuyerToSession();
                      navigate('/checkout/review');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="w-full h-14 rounded-xl bg-[#2A2AD7] hover:opacity-95 text-white text-lg font-semibold flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
