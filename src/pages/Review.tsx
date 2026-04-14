import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import CheckoutHeader from '@/components/CheckoutHeader';
import LoadingOverlay from '@/components/LoadingOverlay';
import { loadCheckoutSelection, clearCheckoutSelection } from '@/lib/checkoutSelection';
import { fetchApi } from '@/lib/apiBase';
import { Input } from '@/components/ui/input';
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';
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
  const [params] = useSearchParams();
  const [selection, setSelection] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [buyer, setBuyer] = useState<any>(null);
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixPayload, setPixPayload] = useState<{ copyPaste?: string; qrBase64?: string; expiresAt?: string; amount?: number } | null>(null);
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
  function detectCardBrand(digits: string) {
    if (!digits) return '';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^4/.test(digits)) return 'visa';
    if (/^5[1-5]/.test(digits) || /^2(?:2[2-9]|[3-6]\d|7[01])/.test(digits)) return 'mastercard';
    // fallback common patterns
    if (/^6(?:011|5)/.test(digits)) return 'discover';
    return 'unknown';
  }

  function formatCardNumberForBrand(digits: string, brand: string) {
    if (!digits) return '';
    if (brand === 'amex') {
      // 4-6-5
      const part1 = digits.slice(0, 4);
      const part2 = digits.slice(4, 10);
      const part3 = digits.slice(10, 15);
      return [part1, part2, part3].filter(Boolean).join(' ');
    }
    // default 4-4-4-4
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  }

  function handleCardNumberChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 19); // allow up to 19 digits
    const brand = detectCardBrand(digits);
    setCardBrand(brand);
    const formatted = formatCardNumberForBrand(digits, brand);
    setCardNumber(formatted);
  }

  function handleExpiryChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) {
      setCardExpiry(digits);
    } else {
      setCardExpiry(digits.slice(0, 2) + '/' + digits.slice(2));
    }
  }

  const cvcMax = cardBrand === 'amex' ? 4 : 3;

  useEffect(() => {
    const loadSession = async () => {
      // First, check for a temporary restore payload set by other pages (e.g. CheckoutPix)
      try {
        const restoreRaw = sessionStorage.getItem('checkoutSelectionRestore');
        if (restoreRaw) {
          const parsed = JSON.parse(restoreRaw);
          setSelection(parsed);
          sessionStorage.removeItem('checkoutSelectionRestore');
          setLoadingData(false);
          return;
        }
      } catch (e) { }

      const sessionId = sessionStorage.getItem('checkoutSessionId');
      if (sessionId) {
        try {
          const res = await fetchApi(`/api/checkout/session/${sessionId}`);
          if (res.ok) {
            const sessionData = await res.json();
            setSelection({
              eventId: sessionData.eventId,
              eventSlug: sessionData.event?.slug,
              eventName: sessionData.event?.name,
              eventImage: sessionData.event?.image,
              image: sessionData.event?.image,
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
      } else {
        // Fallback logic for order restoration or null
        setSelection(null);
      }
      setLoadingData(false);
    };

    loadSession();

    try {
      const raw = sessionStorage.getItem('checkoutBuyer:v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        setBuyer(parsed);
      }
    } catch (e) { }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const t = require('@/lib/checkoutTimer');
      t.ensureTimerStarted();
      setSecondsLeft(t.getSecondsLeft());
      const id = setInterval(() => setSecondsLeft(t.getSecondsLeft()), 1000);
      return () => clearInterval(id);
    } catch (e) { }
  }, []);

  useEffect(() => {
    // Injeção do Efi Pay JS
    const scriptId = 'cbf92a887e86211ddff99c8f923cd4aa';
    (window as any).$gn = {validForm:true,processed:false,done:{},ready:function(fn: any){(window as any).$gn.done=fn;}};
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.type = 'text/javascript';
      const v = parseInt(Math.random() * 1000000 + '');
      // Usa ambiente de produção da CDN se o host for fauves.com.br, senão sandbox
      const isProd = window.location.hostname === 'fauves.com.br' || window.location.hostname === 'app.fauves.com.br';
      const cdnBase = isProd ? 'https://api.efipay.com.br' : 'https://sandbox.gerencianet.com.br';
      s.src = `${cdnBase}/v1/cdn/${scriptId}/${v}`;
      s.async = false;
      s.id = scriptId;
      document.getElementsByTagName('head')[0].appendChild(s);
    }
    return () => {
      // Limpar script apenas se necessário, o efipay mantém estado em window
    };
  }, []);

  if (!selection) {
    return <div className="p-8">Nenhuma seleção encontrada. Volte para a página do evento para escolher ingressos.</div>;
  }

  const items = selection.items || [];
  const subtotal = selection.totalAmount ?? items.reduce((acc: any, it: any) => acc + it.price * it.quantity, 0);
  const discount = selection.discountAmount ?? 0;
  const total = selection.finalAmount ?? (subtotal - discount);

  async function handlePay() {
    setSubmitting(true); setError(null);
    try {
      // require an email when paying with PIX: either local buyer email or logged-in user email
      if (paymentMethod === 'pix' && !(buyer?.buyerEmail || user?.email)) {
        setError('Por favor informe um e-mail para prosseguir com o pagamento por PIX');
        setSubmitting(false);
        return;
      }

      // Client-side validation for card when selected
      let paymentToken = '';
      if (paymentMethod === 'card') {
        if (!cardNumber || !cardExpiry || !cardCvc) {
          setError('Por favor preencha os dados do cartão');
          setSubmitting(false);
          return;
        }
        
        const [expMonth, expYearFull] = cardExpiry.split('/');
        const expYear = expYearFull?.length === 2 ? `20${expYearFull}` : expYearFull;

        const cardData = {
          brand: cardBrand && cardBrand !== 'unknown' ? cardBrand : 'visa',
          number: cardNumber.replace(/\D/g, ''),
          cvv: cardCvc,
          expiration_month: expMonth,
          expiration_year: expYear
        };

        try {
          paymentToken = await new Promise<string>((resolve, reject) => {
            if (!(window as any).$gn || !(window as any).$gn.ready) {
              return reject(new Error('Sistema de pagamento inicializando. Tente novamente em instantes.'));
            }
            (window as any).$gn.ready(function (checkout: any) {
              checkout.getPaymentToken(cardData, function (error: any, response: any) {
                if (error) {
                  console.error('Efí Card Token Error:', error);
                  reject(new Error('Cartão inválido ou não suportado. Verifique os números digitados.'));
                } else {
                  resolve(response.data.payment_token);
                }
              });
            });
          });
        } catch (err: any) {
          setError(err.message);
          setSubmitting(false);
          return;
        }
      }

      const body: any = {
        eventId: selection.eventId && selection.eventId !== 'unknown' ? selection.eventId : undefined,
        eventSlug: selection.eventSlug,
        purchaserName: (buyer?.buyerName || '') + (buyer?.buyerSurname ? ' ' + buyer.buyerSurname : ''),
        purchaserEmail: buyer?.buyerEmail || user?.email,
        paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'CARD',
        couponCode: selection.couponCode,
        items: items.map((it: any) => ({ ticketTypeId: it.ticketTypeId, quantity: it.quantity })),
        participants: items.flatMap((it: any) => new Array(it.quantity).fill(buyer?.buyerEmail || '')),
        // NUNCA enviamos dados do cartão cru pro backend no order create
      };

      const invalidItem = (body.items || []).find((it: any) => !it.ticketTypeId || typeof it.quantity !== 'number' || it.quantity <= 0);
      if (invalidItem) {
        setError('Seleção inválida: tipo de ingresso ausente ou quantidade inválida. Volte para a página do evento e escolha os ingressos novamente.');
        setSubmitting(false);
        return;
      }

      // Cria a Ordem base pendente no backend
      const res = await fetchApi('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      
      if (!res.ok || json?.error) {
        setError(json?.error || `Falha ao criar pedido (HTTP ${res.status})`);
        setSubmitting(false);
        return;
      }

      // Finaliza o pagamento de acordo com o método
      if (paymentMethod === 'card') {
        // Envia o token para a API da EfiBank criar a cobrança real
        const chargeRes = await fetchApi('/api/payments/efi/card/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: json.id,
            payment_token: paymentToken,
            parcelas: 1, // Atualmente à vista apenas
            customer: {
              name: body.purchaserName,
              email: body.purchaserEmail,
              cpf: (user as any)?.cpf || '00000000000', // Mock de fallback para CPF se não houver
              phone: (user as any)?.phone || '11999999999'
            }
          })
        });
        
        const chargeJson = await chargeRes.json().catch(() => null);
        
        if (!chargeRes.ok || chargeJson?.status === 'failed') {
          setError(chargeJson?.message || 'Pagamento recusado pela operadora do cartão.');
          // Se houver fallback do PIX disponibilizado, podemos manter avisado, mas por hora apenas lançamos o erro
        } else if (chargeJson?.status === 'paid' || chargeJson?.status === 'already_paid') {
           clearCheckoutSelection();
           sessionStorage.removeItem('checkoutBuyer:v1');
           sessionStorage.removeItem('checkoutSessionId');
           navigate(`/`); // Aqui deve ser direcionado prum Success ou Meus Ingressos
        } else {
           setError('Status de transação desconhecido.');
        }
      } else {
         // Fluxo de PIX
        clearCheckoutSelection();
        sessionStorage.removeItem('checkoutBuyer:v1');
        sessionStorage.removeItem('checkoutSessionId');
        
        const exp = json.reservationExpiresAt ? `&exp=${encodeURIComponent(json.reservationExpiresAt)}` : '';
        navigate(`/checkout/pix?orderId=${encodeURIComponent(json.id)}${exp}`);
      }
    } catch (e: any) { setError(e?.message || 'Falha inesperada'); }
    finally { setSubmitting(false); }
  }

  // CPF validation (basic for CPF 11 digits). Accepts string with punctuation or digits only.
  const isValidCPF = (raw: string) => {
    if (!raw) return false;
    const s = raw.replace(/\D/g, '');
    if (s.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(s)) return false;
    const calc = (t: number) => {
      let sum = 0;
      for (let i = 0; i < t - 1; i++) sum += parseInt(s.charAt(i)) * (t - i);
      const r = (sum * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(10) === parseInt(s.charAt(9)) && calc(11) === parseInt(s.charAt(10));
  }



  const formatPrice = (n: number) => `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex h-screen w-screen overflow-y-auto bg-white dark:bg-[#0b0b0b] flex-col">
      <CheckoutHeader />

      <main className="flex-1 flex items-start justify-center bg-white dark:bg-[#0b0b0b]">
        <div className="w-full max-w-2xl mt-0 px-8 max-md:px-4">
          <div className="bg-white dark:bg-[#0b0b0b] p-10 max-md:p-6 rounded-lg max-md:pt-4">
            <h2 className="text-2xl max-md:text-xl font-bold mb-4 max-md:mb-3 text-indigo-950 dark:text-white">Revisar e pagar</h2>
            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-[#242424] dark:to-[#1a1a1a] border border-gray-200 dark:border-[#1F1F1F] rounded-2xl p-4 max-md:p-3 mb-6 max-md:mb-4 relative shadow-sm">
              <div className="flex items-center gap-4 max-md:gap-3">
                {/* event image */}
                {(selection.eventImage || selection.image) ? (
                  <img src={selection.eventImage || selection.image} alt="evento" className="w-16 h-16 max-md:w-14 max-md:h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 max-md:w-14 max-md:h-14 bg-slate-100 dark:bg-[#1a1a1a] rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-indigo-950 dark:text-white max-md:text-sm truncate">{selection.eventName || selection.eventSlug}</div>
                  <div className="text-sm max-md:text-xs text-slate-500 dark:text-slate-400">{items.reduce((acc: any, it: any) => acc + it.quantity, 0)} ingressos</div>
                </div>
                {/* expand toggle placed where the value used to be; unit prices shown inside details */}
                <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
                  {expanded ? <ChevronUp className="w-5 h-5 max-md:w-4 max-md:h-4" /> : <ChevronDown className="w-5 h-5 max-md:w-4 max-md:h-4" />}
                </button>
              </div>
              {expanded && (
                <div className="mt-4 max-md:mt-3 border-t border-gray-200 dark:border-[#1F1F1F] pt-3 max-md:pt-2 space-y-2 max-md:space-y-1.5">
                  {items.map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-4 max-md:gap-2">
                        <div className="font-semibold text-indigo-600 dark:text-indigo-400 max-md:text-sm">{it.quantity}×</div>
                        <div className="text-indigo-950 dark:text-white max-md:text-sm">{it.name}</div>
                      </div>
                      <div className="font-medium text-indigo-950 dark:text-white max-md:text-sm">{formatPrice(it.price)}</div>
                    </div>
                  ))}

                  {/* Receipt/confirmation email shown right below expanded items */}
                  <div className="mt-3 max-md:mt-2 text-[11px] max-md:text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1a1a1a] p-2 rounded-lg">O comprovante e ingressos serão enviados para <strong className="text-indigo-600 dark:text-indigo-400">{user?.email || buyer?.buyerEmail || 'levycamara@hotmail.com'}</strong></div>
                </div>
              )}
            </div>

            <h3 className="text-lg max-md:text-base font-semibold mb-2 text-indigo-950 dark:text-white">Forma de pagamento</h3>
            <div className="flex gap-4 max-md:gap-2 mb-4 max-md:mb-3">
              <button onClick={() => setPaymentMethod('pix')} className={`flex-1 p-4 max-md:p-3 border-2 rounded-xl transition-all ${paymentMethod === 'pix'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-400 shadow-md shadow-indigo-500/20'
                : 'border-gray-200 dark:border-[#1F1F1F] hover:border-gray-300 dark:hover:border-gray-700'
                }`}>
                <div className="flex items-center gap-3 max-md:gap-2">
                  <img src={PixIcon} alt="pix" className="w-6 h-6 max-md:w-5 max-md:h-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-indigo-950 dark:text-white max-md:text-sm">Pix</div>
                    <span className="text-sm max-md:text-xs text-slate-500 dark:text-slate-400">à vista</span>
                  </div>
                </div>
              </button>

              <button onClick={() => setPaymentMethod('card')} className={`flex-1 p-4 max-md:p-3 border-2 rounded-xl transition-all ${paymentMethod === 'card'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-400 shadow-md shadow-indigo-500/20'
                : 'border-gray-200 dark:border-[#1F1F1F] hover:border-gray-300 dark:hover:border-gray-700'
                }`}>
                <div className="flex items-center gap-3 max-md:gap-2">
                  <img src={CardIcon} alt="cartao" className="w-6 h-6 max-md:w-5 max-md:h-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-indigo-950 dark:text-white max-md:text-sm">Cartão</div>
                    <span className="text-sm max-md:text-xs text-slate-500 dark:text-slate-400">em até 12x</span>
                  </div>
                </div>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-3 max-md:space-y-2 mb-4 max-md:mb-3">
                <div className="relative">
                  <Input
                    placeholder="Número do cartão"
                    value={cardNumber}
                    onChange={e => handleCardNumberChange(e.target.value)}
                    className="w-full pr-20 h-12 max-md:h-11 rounded-xl max-md:text-sm"
                    inputMode="numeric"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-600">
                    {cardBrand === 'amex' && <img src={AmexIcon} alt="amex" className="w-18 h-10 max-md:w-14 max-md:h-8 object-contain" />}
                    {cardBrand === 'visa' && <img src={VisaIcon} alt="visa" className="w-13 h-8 max-md:w-10 max-md:h-6 object-contain" />}
                    {cardBrand === 'mastercard' && <img src={MastercardIcon} alt="mastercard" className="w-10 h-5 max-md:w-8 max-md:h-4 object-contain" />}
                    {cardBrand === 'discover' && <img src={DiscoverIcon} alt="discover" className="w-13 h-8 max-md:w-10 max-md:h-6 object-contain" />}
                    {!['amex', 'visa', 'mastercard', 'discover'].includes(cardBrand) && cardBrand && <div className="text-xs uppercase">{cardBrand}</div>}
                  </div>
                </div>

                <div className="flex gap-3 max-md:gap-2">
                  <Input placeholder="Data de validade" value={cardExpiry} onChange={e => handleExpiryChange(e.target.value)} className="flex-1 h-12 max-md:h-11 rounded-xl max-md:text-sm" inputMode="numeric" maxLength={5} />
                  <Input placeholder="Código de segurança" value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, cvcMax))} className="w-48 max-md:w-32 h-12 max-md:h-11 rounded-xl max-md:text-sm" inputMode="numeric" maxLength={cvcMax} />
                </div>

                <div>
                  <div className="border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-3 max-md:p-2.5 flex items-center justify-between text-slate-600 dark:text-slate-300 max-md:text-sm h-12 max-md:h-11">{cardCountry} <span className="text-slate-400">▾</span></div>
                </div>

                <AnimatedCheckbox
                  checked={saveCard}
                  onCheckedChange={setSaveCard}
                  label="Salvar dados de pagamento para compras futuras"
                  className="text-sm max-md:text-xs"
                />
              </div>
            )}

            {/* Email input removed: backend/payment provider will use logged-in user email when available */}

            {/* buyer phone / cpf come from logged-in user profile; no inline inputs needed */}

            {/* Persist buyer meta locally for smoother UX */}
            {
              // small utility functions
            }


            <div className="flex items-center justify-between mb-4 max-md:mb-3 p-4 max-md:p-3 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-xl border border-indigo-200 dark:border-indigo-900/50 max-md:hidden">
              <div className="w-full">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm max-md:text-xs text-indigo-800/70 dark:text-indigo-300/70">Subtotal</div>
                  <div className="font-medium text-indigo-900 dark:text-indigo-200">{formatPrice(subtotal)}</div>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm max-md:text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><span className="text-[10px] bg-green-100 dark:bg-green-900 px-1.5 rounded uppercase tracking-wide">{selection.couponCode}</span> Desconto</div>
                    <div className="font-medium text-green-600 dark:text-green-400">-{formatPrice(discount)}</div>
                  </div>
                )}
                <div className="h-px bg-indigo-200 dark:bg-indigo-800/50 my-2"></div>
                <div className="flex justify-between items-center">
                  <div className="text-sm max-md:text-xs text-indigo-800 dark:text-indigo-300 font-bold">Total</div>
                  <div className="font-bold text-xl max-md:text-lg text-indigo-950 dark:text-white">{formatPrice(total)}</div>
                </div>
              </div>
            </div>

            <div className="max-md:hidden">
              <button
                disabled={submitting}
                onClick={handlePay}
                aria-busy={submitting}
                className="w-full h-14 max-md:h-12 rounded-xl bg-gradient-to-r from-[#2A2AD7] to-indigo-700 hover:from-[#2020c0] hover:to-indigo-800 text-white font-semibold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed max-md:text-sm"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>Processando…</span>
                  </>
                ) : (
                  <>
                    <span>{`Pagar R$ ${total.toFixed(2)}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              {error ? <div className="text-red-600 dark:text-red-400 mt-3 max-md:mt-2 text-sm max-md:text-xs bg-red-50 dark:bg-red-950/20 p-3 max-md:p-2 rounded-lg font-medium">{error}</div> : null}
            </div>

            {/* Spacer for mobile bottom bar */}
            <div className="h-[100px] md:hidden" />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#242424] border-t border-gray-200 dark:border-[#1F1F1F] py-3 px-4 shadow-2xl z-50">
        <div className="space-y-1 mb-2">
          {discount > 0 && (
            <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1"><span className="bg-green-100 dark:bg-green-900 px-1 rounded uppercase">{selection.couponCode}</span> Desconto</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total</div>
            <div className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatPrice(total)}</div>
          </div>
        </div>
        <button
          disabled={submitting}
          onClick={handlePay}
          aria-busy={submitting}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2A2AD7] to-indigo-700 hover:from-[#2020c0] hover:to-indigo-800 text-white font-semibold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span>Processando…</span>
            </>
          ) : (
            <>
              <span>{`Pagar ${formatPrice(total)} com ${paymentMethod === 'pix' ? 'Pix' : 'Cartão'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        {error ? <div className="text-red-600 dark:text-red-400 mt-2 text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded-lg font-medium">{error}</div> : null}
      </div>

      {/* Pix QR Modal */}
      <PixQrModal
        open={pixModalOpen}
        payload={pixPayload}
        onClose={() => setPixModalOpen(false)}
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
