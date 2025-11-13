import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import { loadCheckoutSelection, clearCheckoutSelection } from '@/lib/checkoutSelection';
import { fetchApi } from '@/lib/apiBase';
import { Input } from '@/components/ui/input';
import PixQrModal from '@/components/PixQrModal';
import VisaIcon from '../assets/visa.svg';
import MastercardIcon from '../assets/mastercard.svg';
import AmexIcon from '../assets/Amex Card.svg';
import DiscoverIcon from '../assets/discover.svg';
import PixIcon from '../assets/pix.svg';
import CardIcon from '../assets/card.svg';
import { ArrowRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function Review() {
  const navigate = useNavigate();
  const [selection, setSelection] = useState<any>(null);
  const [buyer, setBuyer] = useState<any>(null);
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'pix'|'card'>('pix');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixPayload, setPixPayload] = useState<{ copyPaste?: string; qrBase64?: string; expiresAt?: string; amount?: number; orderId?: string; intentId?: string } | null>(null);
  const [pixFallbackUrl, setPixFallbackUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [cardCountry, setCardCountry] = useState<string>('Brasil');
  const [saveCard, setSaveCard] = useState<boolean>(false);
  const [cardBrand, setCardBrand] = useState<string>('');
  // buyer contact is taken from logged-in `user` when available

  // detect simple card brand from digits
  function detectCardBrand(digits:string){
    if (!digits) return '';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^4/.test(digits)) return 'visa';
    if (/^5[1-5]/.test(digits) || /^2(?:2[2-9]|[3-6]\d|7[01])/.test(digits)) return 'mastercard';
    // fallback common patterns
    if (/^6(?:011|5)/.test(digits)) return 'discover';
    return 'unknown';
  }

  function formatCardNumberForBrand(digits:string, brand:string){
    if (!digits) return '';
    if (brand === 'amex'){
      // 4-6-5
      const part1 = digits.slice(0,4);
      const part2 = digits.slice(4,10);
      const part3 = digits.slice(10,15);
      return [part1, part2, part3].filter(Boolean).join(' ');
    }
    // default 4-4-4-4
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  }

  function handleCardNumberChange(raw:string){
    const digits = raw.replace(/\D/g,'').slice(0,19); // allow up to 19 digits
    const brand = detectCardBrand(digits);
    setCardBrand(brand);
    const formatted = formatCardNumberForBrand(digits, brand);
    setCardNumber(formatted);
  }

  function handleExpiryChange(raw:string){
    const digits = raw.replace(/\D/g,'').slice(0,4);
    if (digits.length <= 2) {
      setCardExpiry(digits);
    } else {
      setCardExpiry(digits.slice(0,2) + '/' + digits.slice(2));
    }
  }

  const cvcMax = cardBrand === 'amex' ? 4 : 3;

  useEffect(()=>{
    setSelection(loadCheckoutSelection());
    try {
      const raw = sessionStorage.getItem('checkoutBuyer:v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        setBuyer(parsed);
      }
    } catch(e){}
    // start shared timer
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const t = require('@/lib/checkoutTimer');
      t.ensureTimerStarted();
      setSecondsLeft(t.getSecondsLeft());
      const id = setInterval(()=> setSecondsLeft(t.getSecondsLeft()), 1000);
      return ()=> clearInterval(id);
    } catch(e) {}
  },[]);

  // persist buyer meta (only buyer object) locally for smoother UX
  useEffect(()=>{
    try {
      const b = { ...(buyer || {}) };
      sessionStorage.setItem('checkoutBuyer:v1', JSON.stringify(b));
    } catch(e) {}
  }, [buyer]);

  if (!selection) {
    return <div className="p-8">Nenhuma seleção encontrada. Volte para a página do evento para escolher ingressos.</div>;
  }

  const items = selection.items || [];
  const total = items.reduce((acc:any,it:any)=>acc + it.price * it.quantity, 0);

  async function handlePay(){
    setSubmitting(true); setError(null);
    try {
      const body:any = {
        eventId: selection.eventId && selection.eventId !== 'unknown' ? selection.eventId : undefined,
        eventSlug: selection.eventSlug,
        purchaserName: (buyer?.buyerName || '') + (buyer?.buyerSurname ? ' ' + buyer.buyerSurname : ''),
        purchaserEmail: buyer?.buyerEmail,
  // purchaser contact info will be resolved server-side from the logged-in user profile
        paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'CARD',
        items: items.map((it:any)=>({ ticketTypeId: it.ticketTypeId, quantity: it.quantity })),
        participants: items.flatMap((it:any)=>new Array(it.quantity).fill(buyer?.buyerEmail || '')),
        card: paymentMethod === 'card' ? {
          number: cardNumber,
          expiry: cardExpiry,
          cvc: cardCvc,
          country: cardCountry,
          save: saveCard,
        } : undefined,
      };
      // basic client-side validation for card when selected
      if (paymentMethod === 'card') {
        if (!cardNumber || !cardExpiry || !cardCvc) {
          setError('Por favor preencha os dados do cartão');
          setSubmitting(false);
          return;
        }
      }
      // no client-side PIX-specific validation here; server will resolve user profile values
      const res = await fetchApi('/api/orders', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(()=>null);
      if (!res.ok || json?.error) {
        setError(json?.error || `HTTP ${res.status}`);
      } else {
            if (paymentMethod === 'pix') {
            // Open inline Pix modal by creating/fetching the PIX intent
            try {
              const r = await fetchApi(`/api/orders/${json.id}/pix-intent`, { method: 'POST' });
              const intent = await r.json().catch(() => null);
                if (r.ok && intent) {
                // intent.code is the copia-e-cola payload
                setPixPayload({ copyPaste: intent.code, expiresAt: intent.expiresAt || intent.expiresAt, amount: total, orderId: json.id, intentId: intent.id });
                setPixFallbackUrl(null);
                setPixModalOpen(true);
              } else {
                // fallback: open modal anyway and provide link to legacy pix page
                const exp = json.reservationExpiresAt ? `&exp=${encodeURIComponent(json.reservationExpiresAt)}` : '';
                const fallback = `/checkout/pix?orderId=${encodeURIComponent(json.id)}${exp}`;
                setPixPayload({ copyPaste: intent?.code ?? '', expiresAt: intent?.expiresAt, amount: total, orderId: json.id, intentId: intent?.id });
                setPixFallbackUrl(fallback);
                setPixModalOpen(true);
              }
            } catch (e) {
              const exp = json.reservationExpiresAt ? `&exp=${encodeURIComponent(json.reservationExpiresAt)}` : '';
              const fallback = `/checkout/pix?orderId=${encodeURIComponent(json.id)}${exp}`;
              setPixPayload({ copyPaste: '', expiresAt: undefined, amount: total, orderId: json.id });
              setPixFallbackUrl(fallback);
              setPixModalOpen(true);
            }
          } else {
          // for card we navigate to a success/receipt page; reuse success state or go to root
          navigate(`/`);
        }
      }
    } catch(e:any){ setError(e?.message || 'Falha inesperada'); }
    finally { setSubmitting(false); }
  }

  // CPF validation (basic for CPF 11 digits). Accepts string with punctuation or digits only.
  function isValidCPF(raw: string) {
    if (!raw) return false;
    const s = raw.replace(/\D/g,'');
    if (s.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(s)) return false;
    const calc = (t:number) => {
      let sum = 0;
      for (let i = 0; i < t - 1; i++) sum += parseInt(s.charAt(i)) * (t - i);
      const r = (sum * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(10) === parseInt(s.charAt(9)) && calc(11) === parseInt(s.charAt(10));
  }

  

  const formatPrice = (n:number) => `R$${n.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white flex-col">
      <header className="w-full">
        <div className="flex items-center justify-between px-8 py-2">
          <div className="flex items-center"><LogoFauves width={80} /></div>
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

      <main className="flex-1 flex items-start justify-center bg-white">
        <div className="w-full max-w-2xl mt-12 px-8">
          <div className="bg-white p-10 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Revisar e pagar</h2>
            <div className="bg-white border rounded p-4 mb-6 relative">
              <div className="flex items-center gap-4">
                {/* event image */}
                { (selection.eventImage || selection.image) ? (
                  <img src={selection.eventImage || selection.image} alt="evento" className="w-16 h-16 rounded object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{selection.eventName || selection.eventSlug}</div>
                  <div className="text-sm text-slate-500">{items.reduce((acc:any,it:any)=>acc + it.quantity,0)} ingressos</div>
                </div>
                {/* expand toggle placed where the value used to be; unit prices shown inside details */}
                <button onClick={()=>setExpanded(e=>!e)} className="text-slate-400">
                  {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              {expanded && (
                <div className="mt-4 border-t pt-3 space-y-2">
                  {items.map((it:any, idx:number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="font-semibold">{it.quantity}×</div>
                        <div>{it.name}</div>
                      </div>
                      <div className="font-medium">{formatPrice(it.price)}</div>
                    </div>
                  ))}

                  {/* Receipt/confirmation email shown right below expanded items */}
                  <div className="mt-3 text-[11px] text-slate-500">O comprovante e ingressos serão enviados para <strong>{user?.email || buyer?.buyerEmail || 'levycamara@hotmail.com'}</strong></div>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-2">Forma de pagamento</h3>
            <div className="flex gap-4 mb-4">
              <button onClick={()=>setPaymentMethod('pix')} className={`flex-1 p-4 border rounded flex items-center gap-3 ${paymentMethod==='pix' ? 'border-rose-500' : 'border-gray-200'}`}>
                <img src={PixIcon} alt="pix" className="w-6 h-6" />
                <div className="text-left">
                  Pix<br/>
                  <span className="text-sm text-slate-500">à vista</span>
                </div>
              </button>

              <button onClick={()=>setPaymentMethod('card')} className={`flex-1 p-4 border rounded flex items-center gap-3 ${paymentMethod==='card' ? 'border-rose-500' : 'border-gray-200'}`}>
                <img src={CardIcon} alt="cartao" className="w-6 h-6" />
                <div className="text-left">
                  Cartão<br/>
                  <span className="text-sm text-slate-500">em até 12x</span>
                </div>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Input
                    placeholder="Número do cartão"
                    value={cardNumber}
                    onChange={e=>handleCardNumberChange(e.target.value)}
                    className="w-full pr-20"
                    inputMode="numeric"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-600">
                    {cardBrand === 'amex' && <img src={AmexIcon} alt="amex" className="w-18 h-10 object-contain" />}
                    {cardBrand === 'visa' && <img src={VisaIcon} alt="visa" className="w-13 h-8 object-contain" />}
                    {cardBrand === 'mastercard' && <img src={MastercardIcon} alt="mastercard" className="w-10 h-5 object-contain" />}
                    {cardBrand === 'discover' && <img src={DiscoverIcon} alt="discover" className="w-13 h-8 object-contain" />}
                    {!['amex','visa','mastercard','discover'].includes(cardBrand) && cardBrand && <div className="text-xs uppercase">{cardBrand}</div>}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Input placeholder="Data de validade" value={cardExpiry} onChange={e=>handleExpiryChange(e.target.value)} className="flex-1" inputMode="numeric" maxLength={5} />
                  <Input placeholder="Código de segurança" value={cardCvc} onChange={e=>setCardCvc(e.target.value.replace(/\D/g,'').slice(0,cvcMax))} className="w-48" inputMode="numeric" maxLength={cvcMax} />
                </div>

                <div>
                  <div className="border rounded p-3 flex items-center justify-between text-slate-600">{cardCountry} <span className="text-slate-400">▾</span></div>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={saveCard} onChange={e=>setSaveCard(e.target.checked)} />
                  Salvar dados de pagamento para compras futuras
                </label>
              </div>
            )}

            <Input placeholder="E-mail" value={buyer?.buyerEmail || ''} onChange={e=>setBuyer({...buyer, buyerEmail: e.target.value})} className="mb-4" />

            {/* buyer phone / cpf come from logged-in user profile; no inline inputs needed */}

            {/* Persist buyer meta locally for smoother UX */}
            {
              // small utility functions
            }


            <div className="flex items-center justify-between mb-4">
              <div className="text-sm">Total</div>
              <div className="font-semibold">{`R$ ${total.toFixed(2)}`}</div>
            </div>

            <div>
              <button disabled={submitting} onClick={handlePay} className="w-full h-12 rounded-xl bg-[#2A2AD7] text-white font-semibold flex items-center justify-center gap-3">
                <span>{`Pagar R$ ${total.toFixed(2)}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {error ? <div className="text-red-600 mt-2">{error}</div> : null}
            </div>
          </div>
        </div>
      </main>
      {/* Pix QR Modal */}
      <PixQrModal
        open={pixModalOpen}
        payload={pixPayload}
        fallbackUrl={pixFallbackUrl}
        onClose={() => setPixModalOpen(false)}
        onPaid={() => {
          // when payment is detected, close modal and finalize checkout
          setPixModalOpen(false);
          try { clearCheckoutSelection(); } catch (e) {}
          try { sessionStorage.removeItem('checkoutBuyer:v1'); } catch (e) {}
          if (pixPayload?.orderId) navigate(`/orders/${encodeURIComponent(pixPayload.orderId)}`);
          setPixFallbackUrl(null);
        }}
        onCancel={async () => {
          // optional: cancel the order reservation if backend supports endpoint; fallback: just close
          if (!pixPayload) return;
          // try to call cancel endpoint if order id known in pixPayload.metadata (not currently set)
          setPixModalOpen(false);
        }}
      />
    </div>
  );
}

export default Review;
