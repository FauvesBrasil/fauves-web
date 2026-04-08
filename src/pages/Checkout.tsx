import { Check, X } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CheckoutHeader from '@/components/CheckoutHeader';
import React, { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoadingOverlay from '@/components/LoadingOverlay';
import LoginModal from '@/components/LoginModal';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '@/lib/apiBase';
import { clearCheckoutSelection } from '@/lib/checkoutSelection';

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
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const navigate = useNavigate();
  const [selection, setSelection] = React.useState<any>(null);
  const [loadingSession, setLoadingSession] = React.useState<boolean>(true);
  const { user, refreshUser, login, logout } = useAuth();
  const userId = user?.id || null;
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      window.location.reload();
    } catch (e) { }
  };
  // Login modal will be used for guest authentication (inline form removed)

  // Buyer data
  const [buyerEmail, setBuyerEmail] = React.useState('');
  const [buyerName, setBuyerName] = React.useState('');
  const [buyerSurname, setBuyerSurname] = React.useState('');
  const [cpf, setCpf] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [prefilled, setPrefilled] = React.useState<{ [k: string]: boolean }>({});
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Participants
  const [participants, setParticipants] = React.useState<string[]>([]);
  const [participantsTouched, setParticipantsTouched] = React.useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = React.useState<'card' | 'pix'>('card');
  const [cardNumber, setCardNumber] = React.useState('');
  const [cardName, setCardName] = React.useState('');
  const [cardExpiryMonth, setCardExpiryMonth] = React.useState('');
  const [cardExpiryYear, setCardExpiryYear] = React.useState('');
  const [cardCvv, setCardCvv] = React.useState('');

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<any>(null);
  const [cpfError, setCpfError] = React.useState<string | null>(null);

  // Minimal coupon support kept
  const [couponApplied, setCouponApplied] = React.useState<string | null>(null);

  // Birthdate (new field for design) and countdown (10 minutes = 600s)
  const [birthDate, setBirthDate] = React.useState('');
  const [secondsLeft, setSecondsLeft] = React.useState(600);

  // Phone handling: we simplify to a single celular field with Brazilian mask

  useEffect(() => {
    // use session-backed timer so it persists across pages
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const t = require('@/lib/checkoutTimer');
      t.ensureTimerStarted();
      setSecondsLeft(t.getSecondsLeft());
      const id = setInterval(() => setSecondsLeft(t.getSecondsLeft()), 1000);
      return () => clearInterval(id);
    } catch (e) {
      const id = setInterval(() => {
        setSecondsLeft(s => Math.max(0, s - 1));
      }, 1000);
      return () => clearInterval(id);
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const sessionId = sessionStorage.getItem('checkoutSessionId');
      if (!sessionId) {
        // Redireciona para seleção de ingressos se não houver sessionId
        try { navigate('/select-tickets'); } catch (e) { }
        setSelection(null);
        setLoadingSession(false);
        setLoadingProfile(false);
        return;
      }

      try {
        const res = await fetchApi(`/api/checkout/session/${sessionId}`);
        if (res.ok) {
          const sessionData = await res.json();
          // Convert session data to selection format
          setSelection({
            eventId: sessionData.eventId,
            eventSlug: sessionData.event?.slug,
            eventName: sessionData.event?.name,
            eventImage: sessionData.event?.image,
            items: sessionData.items,
            createdAt: new Date(sessionData.createdAt).getTime(),
            totalAmount: sessionData.totalAmount,
            discountAmount: sessionData.discountAmount,
            finalAmount: sessionData.finalAmount,
            couponCode: sessionData.couponCode
          });
        } else {
          setSelection(null);
        }
      } catch (error) {
        setSelection(null);
      }
      finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [navigate]);

  const loadProfile = useCallback(async () => {
    const PROFILE_MIN_VISIBLE_MS = 500;
    const start = Date.now();
    try {
      if (!user) {
        const elapsed = Date.now() - start;
        const wait = Math.max(0, PROFILE_MIN_VISIBLE_MS - elapsed);
        if (wait > 0) await new Promise(res => setTimeout(res, wait));
        setLoadingProfile(false);
        return;
      }
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
      setPrefilled(p => ({ ...p, email: !!user.email, name: !!user.name }));
    } finally {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, PROFILE_MIN_VISIBLE_MS - elapsed);
      if (wait > 0) await new Promise(res => setTimeout(res, wait));
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);


  // If profile already has all required fields, skip this page and go to review
  useEffect(() => {
    if (!loadingProfile && !loadingSession && prefilled && prefilled.email && prefilled.name && prefilled.cpf && prefilled.phone) {
      try { navigate('/checkout/review'); } catch (e) { }
    }
  }, [loadingProfile, loadingSession, prefilled, navigate]);



  // --- Hooks that must always run (keep above any early return) ---------
  // ticket entries
  const ticketEntries = React.useMemo(() => {
    if (!selection?.items) return [] as { ticketTypeId: string; name: string; index: number }[];
    const out: { ticketTypeId: string; name: string; index: number }[] = [];
    let idx = 0;
    for (const it of selection.items) {
      for (let i = 0; i < it.quantity; i++) out.push({ ticketTypeId: it.ticketTypeId, name: it.name, index: idx++ });
    }
    return out;
  }, [selection]);

  useEffect(() => {
    setParticipants(prev => {
      if (ticketEntries.length === prev.length) return prev;
      const next = [...prev];
      for (let i = next.length; i < ticketEntries.length; i++) next[i] = (i === 0 ? buyerEmail : '');
      return next.slice(0, ticketEntries.length);
    });
  }, [ticketEntries, buyerEmail]);

  // If user just authenticated (e.g. via OAuth popup/redirect) and a draft exists,
  // restore buyer info. If profile is complete, auto-navigate to review for payment selection.
  // This effect MUST run before any early return so the hooks order remains stable across renders.
  React.useEffect(() => {
    if (!user) return;
    try {
      const draft = sessionStorage.getItem('checkoutBuyer:v1');
      if (!draft) return;
      const obj = JSON.parse(draft || '{}');
      if (obj.buyerEmail) setBuyerEmail(obj.buyerEmail);
      if (obj.buyerName) setBuyerName(obj.buyerName);
      if (obj.buyerSurname) setBuyerSurname(obj.buyerSurname);
      if (obj.cpf) setCpf(obj.cpf);
      if (obj.phone) setPhone(obj.phone);
      setTimeout(async () => {
        try { await refreshUser?.(); } catch { }
        // Check if profile is complete - if yes, auto-navigate to review for payment selection
        // If incomplete, user stays on form to fill missing fields
        try {
          const res = await fetchApi('/account-settings');
          if (res && res.ok) {
            const data = await res.json();
            const hasCompleteProfile = data.name && data.cpf && data.phone;
            if (hasCompleteProfile) {
              // Profile complete: go directly to payment selection
              // Keep loading overlay visible until navigation completes
              navigate('/checkout/review');
            } else {
              // Profile incomplete: hide loading and show form
              setLoadingProfile(false);
            }
          }
        } catch (e) {
          setLoadingProfile(false);
        }
        try { sessionStorage.removeItem('checkoutBuyer:v1'); } catch { }
      }, 300);
    } catch (e) {
    }
  }, [user]);

  // If the page finished loading and the user is not authenticated,
  // automatically open the login modal so the user can sign in/create an account
  // before accessing the complementary checkout form.
  React.useEffect(() => {
    if (loadingProfile || loadingSession) return;
    if (!user) {
      try { saveBuyerToSession(); } catch { }
      setShowLoginModal(true);
    }
  }, [loadingProfile, loadingSession, user]);

  const items = selection?.items || [];
  const total = items.reduce((acc: any, it: any) => acc + it.price * it.quantity, 0);
  const discountAmount = couponApplied === 'TESTE10' ? total * 0.10 : 0;
  const finalTotal = total - discountAmount;
  const formatPrice = (n: number) => `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const participantsValid = participants.length === ticketEntries.length && participants.every(e => !!e && /.+@.+\..+/.test(e));

  // Determine missing buyer fields (only show inputs for these)
  const missingBuyerFields = {
    email: !buyerEmail,
    name: !buyerName,
    surname: !buyerSurname,
    cpf: !cpf,
    phone: !phone,
  };

  const baseValid = !!items.length && buyerEmail && buyerName && isValidCPF(cpf) && phone && participantsValid && !submitting && !success;

  const canSubmit = baseValid && (paymentMethod === 'pix' || (paymentMethod === 'card' ? (cardNumber.replace(/\D+/g, '').length === 16 && cardName && cardExpiryMonth.length === 2 && cardExpiryYear.length === 4 && cardCvv.replace(/\D+/g, '').length >= 3) : true));



  // While either the user profile or the checkout session is being loaded,
  // show the immersive loading overlay to avoid displaying an empty form.
  if (loadingProfile || loadingSession) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-white flex-col">
        <CheckoutHeader />
        <LoadingOverlay title="Carregando seus dados" subtitle="Aguarde enquanto preparamos o checkout" />
      </div>
    );
  }

  function saveBuyerToSession() {
    try {
      const buyer = { buyerEmail, buyerName, buyerSurname, cpf, phone, birthDate };
      sessionStorage.setItem('checkoutBuyer:v1', JSON.stringify(buyer));
    } catch (e) { /* ignore */ }
  }

  // CPF validation (returns true if CPF is structurally valid)
  function isValidCPF(str: string) {
    const s = (str || '').replace(/\D+/g, '');
    if (!s || s.length !== 11) return false;
    // Reject sequences
    if (/^(\d)\1+$/.test(s)) return false;
    const digits = s.split('').map(d => +d);
    // first verifier
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
    let r = (sum * 10) % 11; if (r === 10) r = 0;
    if (r !== digits[9]) return false;
    // second
    sum = 0;
    for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
    r = (sum * 10) % 11; if (r === 10) r = 0;
    return r === digits[10];
  }

  // Format phone based on selected country (basic)
  function formatPhoneForCountry(dialCode: string, raw: string) {
    const d = onlyDigits(raw);
    if (dialCode === '+55') {
      // Brazilian: (DD) 9XXXX-XXXX or (DD) XXXX-XXXX
      if (d.length <= 2) return d;
      const cep = d.slice(0, 2);
      const rest = d.slice(2);
      if (rest.length <= 4) return `(${cep}) ${rest}`;
      if (rest.length <= 9) return `(${cep}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
      return `(${cep}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
    }
    if (dialCode === '+1') {
      // US: (XXX) XXX-XXXX
      if (d.length <= 3) return d;
      if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
    }
    // fallback: group by 3/4
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, d.length - 4)}-${d.slice(-4)}`;
    return `${d.slice(0, d.length - 4)}-${d.slice(-4)}`;
  }

  // ticket entries

  async function handleSubmit() {
    if (!selection) return;
    setSubmitting(true); setError(null);
    try {
      // autosave missing profile fields (fire and forget)
      if (userId) {
        const upd: any = {};
        if (buyerName) upd.name = buyerName;
        if (buyerSurname) upd.surname = buyerSurname;
        if (cpf) upd.cpf = cpf.replace(/\D+/g, '');
        if (phone) upd.phone = onlyDigits(phone);
        fetchApi('/account-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(userId ? { 'x-user-id': userId } : {}) }, body: JSON.stringify(upd) }).catch(() => { });
      }

      // Captura utm_source da query string
      let utm_source = '';
      try {
        const params = new URLSearchParams(window.location.search);
        utm_source = params.get('utm_source') || '';
      } catch { }
      const body = {
        eventId: selection.eventId && selection.eventId !== 'unknown' ? selection.eventId : undefined,
        eventSlug: selection.eventSlug,
        purchaserName: buyerName + (buyerSurname ? ' ' + buyerSurname : ''),
        purchaserEmail: buyerEmail,
        paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'CARD',
        items: items.map((it: any) => ({ ticketTypeId: it.ticketTypeId, quantity: it.quantity })),
        participants: ticketEntries.map((te, i) => ({ email: participants[i], ticketTypeId: te.ticketTypeId })),
        couponCode: couponApplied || undefined,
        utm_source: utm_source || undefined
      };

      const headers: any = { 'Content-Type': 'application/json' };
      if (userId) headers['x-user-id'] = userId;
      const res = await fetchApi('/api/orders', { method: 'POST', headers, body: JSON.stringify(body) });
      let json = null;
      try {
        json = await res.json();
      } catch (err) {
        setError('Erro ao processar resposta da API.');
        return;
      }
      if (!res.ok || json?.error) {
        setError(json?.error ? `Erro: ${json.error}` : `HTTP ${res.status} - ${res.statusText}`);
      } else {
        clearCheckoutSelection();
        // Sempre redireciona para PIX (o sistema atual usa apenas PIX para pagamento)
        const exp = json.reservationExpiresAt ? `&exp=${encodeURIComponent(json.reservationExpiresAt)}` : '';
        navigate(`/checkout/pix?orderId=${encodeURIComponent(json.id)}${exp}`);
      }
    } catch (e: any) {
      setError(e?.message || 'Falha inesperada');
    }
    finally { setSubmitting(false); }
  }


  return (
    <div className="flex h-screen w-screen overflow-y-auto bg-white dark:bg-[#0b0b0b] flex-col">
      <CheckoutHeader />

      {/* Centered form com scroll */}
      <main className="flex-1 flex items-start justify-center bg-white dark:bg-[#0b0b0b]">
        <div className="w-full max-w-2xl mt-0 px-8 max-md:px-4">
          <div className="bg-white dark:bg-[#0b0b0b] p-10 max-md:p-6 rounded-lg max-md:pt-4">
            <h1 className="text-3xl max-md:text-2xl font-bold text-indigo-950 dark:text-white mb-2 max-md:mb-3"><span role="img" aria-label="acenar" className="wave-emoji">👋</span> Vamos nos conhecer antes de finalizar o pedido</h1>
            <p className="text-indigo-800/80 dark:text-slate-300 mb-6 max-md:mb-4 max-md:text-sm">Alguns detalhes a mais e estamos prontos:</p>

            {/* Guests must authenticate via the modal before accessing the complementary form. */}
            {!user ? (
              <div className="mb-6 p-6 max-md:p-4 border rounded-xl max-md:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-[#242424] dark:to-[#1a1a1a] dark:border-[#1F1F1F]">
                <div className="text-lg max-md:text-base font-semibold mb-2 text-indigo-950 dark:text-white">Faça login ou crie uma conta para continuar</div>
                <div className="text-sm max-md:text-xs text-slate-700 dark:text-slate-300">Para continuar com o checkout, faça login ou crie sua conta. Seus dados serão preservados ao abrir o modal.</div>
                <div className="mt-4 max-md:mt-3">
                  <button
                    onClick={() => { try { saveBuyerToSession(); } catch { } setShowLoginModal(true); }}
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 max-md:py-2.5 max-md:px-4 rounded-xl max-md:text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all w-full max-md:w-full"
                  >Abrir login</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-md:space-y-3">
                <Input placeholder="Nome" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="h-12 max-md:h-11 rounded-xl max-md:text-sm" />
                <Input placeholder="Sobrenome" value={buyerSurname} onChange={e => setBuyerSurname(e.target.value)} className="h-12 max-md:h-11 rounded-xl max-md:text-sm" />
                <Input placeholder="E-mail" value={buyerEmail} readOnly className="h-12 max-md:h-11 bg-gray-100 dark:bg-[#1a1a1a] cursor-not-allowed rounded-xl max-md:text-sm" />
                <Input placeholder="Celular" value={phone} onChange={e => setPhone(formatPhoneBR(e.target.value))} className="h-12 max-md:h-11 rounded-xl max-md:text-sm" />
                <div>
                  <label className="block text-sm max-md:text-xs text-indigo-800/80 dark:text-slate-300 mb-1">Data de Nascimento</label>
                  <Input type="date" placeholder="Data de Nascimento" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="h-12 max-md:h-11 rounded-xl max-md:text-sm" />
                </div>
                <div className="relative">
                  <Input placeholder="CPF" value={cpf} onChange={e => {
                    const formatted = formatCPF(e.target.value);
                    setCpf(formatted);
                    const digits = onlyDigits(formatted);
                    if (digits.length === 11) setCpfError(isValidCPF(formatted) ? null : 'CPF inválido');
                    else setCpfError(null);
                  }} className="h-12 max-md:h-11 pr-10 rounded-xl max-md:text-sm" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cpf ? (cpfError ? <X className="w-4 h-4 text-red-600" /> : <Check className="w-4 h-4 text-emerald-500" />) : null}
                  </div>
                  {cpfError && <div className="text-xs text-red-600 mt-1 max-md:hidden">{cpfError}</div>}
                </div>
              </div>
            )}

            <div className="mt-6 max-md:mt-5">
              <div className="text-sm max-md:text-xs text-indigo-800/70 dark:text-slate-400 mb-4 max-md:mb-3 flex items-center max-md:flex-wrap">Quer fazer a compra com outra conta?
                <button
                  type="button"
                  className="relative inline-flex items-center font-semibold text-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-base ml-1"
                  onClick={() => setShowLogoutModal(true)}
                >
                  <span className="relative z-10">Faça o logout</span>
                  <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                  <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                </button>
              </div>
              {/* Modal de confirmação de logout */}
              {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
                  <div className="bg-white dark:bg-[#242424] rounded-xl shadow-lg p-8 flex flex-col items-center max-w-sm w-full border border-gray-100 dark:border-[#1F1F1F]">
                    <div className="text-lg font-bold mb-2 text-[#091747] dark:text-white">Deseja realmente sair?</div>
                    <div className="text-sm text-[#091747] dark:text-slate-300 mb-6">Você será desconectado da sua conta.</div>
                    <div className="flex gap-4 w-full justify-center">
                      <button
                        className="relative inline-flex items-center font-semibold text-indigo-600 dark:text-indigo-400 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-base px-6 py-2 rounded-lg border border-indigo-600 dark:border-indigo-400 bg-white dark:bg-[#1a1a1a]"
                        onClick={() => setShowLogoutModal(false)}
                      >
                        <span className="relative z-10">Cancelar</span>
                        <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                        <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 dark:bg-indigo-900 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                      </button>
                      <button
                        className="relative inline-flex items-center font-semibold text-white bg-indigo-600 dark:bg-indigo-600 group focus:outline-none transition-transform duration-200 hover:-translate-y-0.5 text-base px-6 py-2 rounded-lg"
                        onClick={async () => { setShowLogoutModal(false); await handleLogout(); }}
                      >
                        <span className="relative z-10">Sair</span>
                        <span className="absolute left-0 bottom-0 h-0.5 w-full origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                        <span className="absolute left-0 bottom-0.5 h-2 w-full opacity-0 rounded-full bg-indigo-200 dark:bg-indigo-900 blur-md transition-opacity duration-300 group-hover:opacity-60"></span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs max-md:text-[10px] text-indigo-700/60 dark:text-slate-500 mb-4 max-md:mb-3 max-md:leading-relaxed">Ao continuar você concorda com os <a className="underline" href="#">termos de uso</a> e <a className="underline" href="#">política de privacidade</a> da Fauves.</p>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    setError(null);
                    if (!buyerName.trim()) { setError('Preencha o nome.'); return; }
                    if (!buyerSurname.trim()) { setError('Preencha o sobrenome.'); return; }
                    if (!buyerEmail.trim()) { setError('E-mail não pode ser vazio.'); return; }
                    if (!phone.trim() || digitsLen(phone) < 10) { setError('Preencha um celular válido.'); return; }
                    if (!birthDate.trim()) { setError('Preencha a data de nascimento.'); return; }
                    if (!cpf.trim() || digitsLen(cpf) !== 11 || cpfError) { setError('Preencha um CPF válido.'); return; }

                    // Save profile data (fire and forget)
                    if (userId) {
                      const upd: any = {};
                      if (buyerName) upd.name = buyerName;
                      if (buyerSurname) upd.surname = buyerSurname;
                      if (cpf) upd.cpf = cpf.replace(/\D+/g, '');
                      if (phone) upd.phone = onlyDigits(phone);
                      if (birthDate) upd.birth = birthDate;

                      fetchApi('/account-settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', ...(userId ? { 'x-user-id': userId } : {}) },
                        body: JSON.stringify(upd)
                      }).then(response => {
                        if (response.ok) {
                        }
                      }).catch(err => {
                      });
                    }

                    // Navigate to review page instead of creating order
                    navigate('/checkout/review');
                  }}
                  className="w-full h-14 max-md:h-12 rounded-xl bg-gradient-to-r from-[#2A2AD7] to-indigo-700 hover:from-[#2020c0] hover:to-indigo-800 text-white text-lg max-md:text-base font-semibold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 transition-all"
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
                {error && (
                  <div className="mt-3 max-md:mt-2 text-sm max-md:text-xs text-red-600 dark:text-red-400 text-center font-medium bg-red-50 dark:bg-red-950/20 p-3 max-md:p-2 rounded-lg">{error}</div>
                )}
                {success && (
                  <div className="mt-3 max-md:mt-2 text-sm max-md:text-xs text-green-600 dark:text-green-400 text-center font-medium bg-green-50 dark:bg-green-950/20 p-3 max-md:p-2 rounded-lg">Pedido realizado com sucesso!</div>
                )}
                <div style={{ height: '100px' }} className="max-md:h-[60px]" />
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Login modal for guests who try to continue */}
      <LoginModal open={showLoginModal} initialEmail={buyerEmail} onClose={() => setShowLoginModal(false)} onSuccess={async () => {
        // Show loading overlay immediately after login
        setLoadingProfile(true);
        // After successful login/signup, just refresh profile and close modal
        // Keep loadingProfile=true while the auto-navigate useEffect checks profile
        try {
          await refreshUser?.();
        } catch { }
        setShowLoginModal(false);
        // Don't set loadingProfile=false here - let the useEffect handle it after checking profile
      }} />

      {/* If user just authenticated (e.g. via OAuth popup/redirect) and a draft exists,
          restore buyer info and resume the submit. */}

    </div>
  );
}

export default Checkout;
