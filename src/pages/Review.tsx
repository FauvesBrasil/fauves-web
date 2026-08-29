import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutHeader from '@/components/CheckoutHeader';
import LoadingOverlay from '@/components/LoadingOverlay';
import { clearCheckoutSelection } from '@/lib/checkoutSelection';
import { fetchApi } from '@/lib/apiBase';
import { Input } from '@/components/ui/input';
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';
import VisaIcon from '../assets/visa.svg';
import MastercardIcon from '../assets/mastercard.svg';
import AmexIcon from '../assets/Amex Card.svg';
import DiscoverIcon from '../assets/discover.svg';
import PixIcon from '../assets/pix.svg';
import CardIcon from '../assets/card.svg';
import { ArrowRight, ChevronDown, ChevronUp, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ── Constantes Efí Bank ────────────────────────────────────────────────
const EFI_PAYEE_CODE = import.meta.env.VITE_EFI_PAYEE_CODE || '';
const EFI_ENVIRONMENT = (import.meta.env.VITE_EFI_ENVIRONMENT || 'production') as 'production' | 'sandbox';

// Taxas de juros aproximadas por parcela (quando o organizer não absorve)
// A Efí retorna via getInstallments() — usamos fallback se a API falhar
const FALLBACK_INSTALLMENT_RATES: Record<number, number> = {
  1: 0, 2: 1.99, 3: 1.99, 4: 1.99, 5: 1.99, 6: 1.99,
  7: 2.99, 8: 2.99, 9: 2.99, 10: 2.99, 11: 2.99, 12: 2.99,
};

interface InstallmentOption {
  installment: number;
  has_interest: boolean;
  value: number;       // valor da parcela em centavos
  currency: string;    // ex: "15,23"
  interest_percentage: number;
}

declare global {
  interface Window {
    EfiPay?: any;
  }
}

// Carrega o SDK Efí de forma dinâmica (só no browser)
async function loadEfiSdk(): Promise<any> {
  if (window.EfiPay) return window.EfiPay;

  // Tenta importar via npm primeiro
  try {
    const mod = await import('payment-token-efi');
    const EfiPay = (mod as any).default || mod;
    window.EfiPay = EfiPay;
    return EfiPay;
  } catch {
    // Fallback: CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/payment-token-efi/dist/payment-token-efi-umd.min.js';
      script.onload = () => resolve((window as any).EfiPay);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

function Review() {
  const navigate = useNavigate();
  const [selection, setSelection] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [buyer, setBuyer] = useState<any>(null);
  const { user } = useAuth();

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer countdown
  const [secondsLeft, setSecondsLeft] = useState<number>(600);

  // Expandir detalhes do pedido
  const [expanded, setExpanded] = useState<boolean>(false);

  // Dados do cartão
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [cardHolderName, setCardHolderName] = useState<string>('');
  const [saveCard, setSaveCard] = useState<boolean>(false);
  const [cardBrand, setCardBrand] = useState<string>('');

  // Parcelamento
  const [installments, setInstallments] = useState<InstallmentOption[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<number>(1);
  const [loadingInstallments, setLoadingInstallments] = useState<boolean>(false);
  const [installmentTotal, setInstallmentTotal] = useState<number | null>(null);

  // Titular diferente
  const [isDifferentHolder, setIsDifferentHolder] = useState<boolean>(false);
  const [holderCPF, setHolderCPF] = useState<string>('');

  // Tokenização
  const [tokenizing, setTokenizing] = useState<boolean>(false);
  const efiSdkRef = useRef<any>(null);

  // ── Carrega SDK Efí ───────────────────────────────────────────────────
  useEffect(() => {
    loadEfiSdk()
      .then(sdk => { efiSdkRef.current = sdk; })
      .catch(err => console.warn('[EfiSdk] falha ao carregar:', err));
  }, []);

  // ── Detecta bandeira ──────────────────────────────────────────────────
  function detectCardBrand(digits: string): string {
    if (!digits) return '';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^4/.test(digits)) return 'visa';
    if (/^5[1-5]/.test(digits) || /^2(?:2[2-9]|[3-6]\d|7[01])/.test(digits)) return 'mastercard';
    if (/^6(?:011|5)/.test(digits)) return 'discover';
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(digits)) return 'elo';
    if (/^(606282|3841)/.test(digits)) return 'hipercard';
    return '';
  }

  // ── Formata número do cartão ──────────────────────────────────────────
  function formatCardNumber(digits: string, brand: string): string {
    if (!digits) return '';
    if (brand === 'amex') {
      const p1 = digits.slice(0, 4);
      const p2 = digits.slice(4, 10);
      const p3 = digits.slice(10, 15);
      return [p1, p2, p3].filter(Boolean).join(' ');
    }
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  }

  function handleCardNumberChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 19);
    const brand = detectCardBrand(digits);
    if (brand !== cardBrand) {
      setCardBrand(brand);
      setInstallments([]);
      setSelectedInstallment(1);
      setInstallmentTotal(null);
    }
    setCardNumber(formatCardNumber(digits, brand));
  }

  function handleExpiryChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) setCardExpiry(digits);
    else setCardExpiry(digits.slice(0, 2) + '/' + digits.slice(2));
  }

  const cvcMax = cardBrand === 'amex' ? 4 : 3;

  // ── Busca parcelas na Efí ─────────────────────────────────────────────
  const fetchInstallments = useCallback(async (brand: string, totalCents: number) => {
    if (!brand || !totalCents) return;
    const efiBrands = ['visa', 'mastercard', 'amex', 'elo', 'hipercard'];
    const normalizedBrand = efiBrands.includes(brand) ? brand : null;

    setLoadingInstallments(true);
    try {
      if (!normalizedBrand || !EFI_PAYEE_CODE) {
        throw new Error('Configuração ou bandeira ausente');
      }

      const sdk = efiSdkRef.current || await loadEfiSdk();
      if (!sdk?.CreditCard) throw new Error('SDK não disponível');

      const result = await sdk.CreditCard
        .setAccount(EFI_PAYEE_CODE)
        .setEnvironment(EFI_ENVIRONMENT)
        .setBrand(normalizedBrand)
        .setTotal(totalCents)
        .getInstallments();

      const opts: InstallmentOption[] = result?.installments || [];
      setInstallments(opts);
      if (opts.length > 0) {
        setSelectedInstallment(opts[0].installment);
        setInstallmentTotal(opts[0].value * opts[0].installment / 100);
      }
    } catch (err) {
      // Fallback: calcular localmente
      console.warn('[Parcelas] Efí API falhou, usando fallback:', err);
      const totalReais = totalCents / 100;
      const fallback: InstallmentOption[] = Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const rate = FALLBACK_INSTALLMENT_RATES[n] ?? 2.99;
        const haInt = rate > 0;
        const total = haInt ? totalReais * (1 + rate / 100) : totalReais;
        const perParcel = total / n;
        return {
          installment: n,
          has_interest: haInt,
          value: Math.round(perParcel * 100),
          currency: perParcel.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          interest_percentage: rate,
        };
      });
      setInstallments(fallback);
      setSelectedInstallment(1);
      setInstallmentTotal(totalReais);
    } finally {
      setLoadingInstallments(false);
    }
  }, []);

  // Busca parcelas quando bandeira + total ficam disponíveis
  useEffect(() => {
    if (paymentMethod !== 'card' || !cardBrand || !selection) return;
    const totalCents = Math.round((selection.finalAmount ?? (selection.totalAmount - (selection.discountAmount ?? 0))) * 100);
    if (totalCents > 0) fetchInstallments(cardBrand, totalCents);
  }, [cardBrand, paymentMethod, selection, fetchInstallments]);

  // Atualiza total ao mudar parcela selecionada
  useEffect(() => {
    const opt = installments.find(i => i.installment === selectedInstallment);
    if (opt) setInstallmentTotal((opt.value * opt.installment) / 100);
  }, [selectedInstallment, installments]);

  // ── Carrega sessão e buyer ────────────────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      try {
        const restoreRaw = sessionStorage.getItem('checkoutSelectionRestore');
        if (restoreRaw) {
          const parsed = JSON.parse(restoreRaw);
          setSelection(parsed);
          sessionStorage.removeItem('checkoutSelectionRestore');
          setLoadingData(false);
          return;
        }
      } catch { }

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
              couponCode: sessionData.couponCode,
            });
          } else {
            setSelection(null);
          }
        } catch {
          setSelection(null);
        }
      } else {
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
        // Preenche CPF do titular com o CPF do comprador se estiver vazio
        if (parsed.cpf && !holderCPF) setHolderCPF(parsed.cpf);
        // Preenche Nome do titular se estiver vazio
        if ((parsed.buyerName || parsed.buyerSurname) && !cardHolderName) {
          setCardHolderName(`${parsed.buyerName || ''} ${parsed.buyerSurname || ''}`.trim().toUpperCase());
        }
      }
    } catch { }

    // Fallback para dados do usuário logado
    if (!holderCPF && (user as any)?.cpf) {
      setHolderCPF((user as any).cpf);
    }
    if (!cardHolderName && user?.name) {
      setCardHolderName(user.name.toUpperCase());
    }

    try {
      const t = require('@/lib/checkoutTimer');
      t.ensureTimerStarted();
      setSecondsLeft(t.getSecondsLeft());
      const id = setInterval(() => setSecondsLeft(t.getSecondsLeft()), 1000);
      return () => clearInterval(id);
    } catch { }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────
  const formatPrice = (n: number) => `R$\u00a0${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loadingData) {
    return (
      <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-white dark:bg-[#0b0b0b] flex-col">
        <CheckoutHeader />
        <LoadingOverlay title="Carregando resumo" subtitle="Aguarde um momento..." />
      </div>
    );
  }

  if (!selection) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center overflow-x-hidden bg-white dark:bg-[#0b0b0b] flex-col gap-4 p-6 text-center">
        <p className="text-indigo-950 dark:text-white text-lg font-semibold">Nenhuma seleção encontrada.</p>
        <p className="text-slate-500 text-sm">Volte para a página do evento e escolha seus ingressos.</p>
        <button onClick={() => navigate('/discover')} className="mt-2 min-h-11 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Encontrar eventos</button>
      </div>
    );
  }

  const items = selection.items || [];
  const subtotal: number = selection.totalAmount ?? items.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0);
  const discount: number = selection.discountAmount ?? 0;
  const baseTotal: number = selection.finalAmount ?? (subtotal - discount);

  // Total com parcelamento (se cartão e parcela selecionada com juros)
  const totalDisplay = paymentMethod === 'card' && installmentTotal !== null ? installmentTotal : baseTotal;
  const selectedOpt = installments.find(i => i.installment === selectedInstallment);
  const hasInterest = selectedOpt?.has_interest ?? false;

  // ── handlePay ─────────────────────────────────────────────────────────
  async function handlePay() {
    setSubmitting(true);
    setError(null);

    try {
      if (paymentMethod === 'pix' && !(buyer?.buyerEmail || user?.email)) {
        setError('Por favor informe um e-mail para prosseguir com o pagamento por PIX');
        setSubmitting(false);
        return;
      }

      if (paymentMethod === 'card') {
        if (!cardNumber || !cardExpiry || !cardCvc || !cardHolderName || !holderCPF) {
          setError('Preencha todos os dados do cartão e o CPF do titular');
          setSubmitting(false);
          return;
        }
      }

      // 1. Cria pedido
      const body: any = {
        eventId: selection.eventId && selection.eventId !== 'unknown' ? selection.eventId : undefined,
        eventSlug: selection.eventSlug,
        purchaserName: (buyer?.buyerName || '') + (buyer?.buyerSurname ? ' ' + buyer.buyerSurname : ''),
        purchaserEmail: buyer?.buyerEmail || user?.email,
        paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'CARD',
        couponCode: selection.couponCode,
        items: items.map((it: any) => ({ ticketTypeId: it.ticketTypeId, quantity: it.quantity })),
        participants: items.flatMap((it: any) => new Array(it.quantity).fill(buyer?.buyerEmail || user?.email || '')),
      };

      const orderRes = await fetchApi('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const orderJson = await orderRes.json().catch(() => null);

      if (!orderRes.ok || orderJson?.error) {
        setError(orderJson?.error || `Falha ao criar pedido (HTTP ${orderRes.status})`);
        setSubmitting(false);
        return;
      }

      const orderId = orderJson.id;

      // ── PIX ──────────────────────────────────────────────────────────
      if (paymentMethod === 'pix') {
        clearCheckoutSelection();
        sessionStorage.removeItem('checkoutBuyer:v1');
        sessionStorage.removeItem('checkoutSessionId');
        const exp = orderJson.reservationExpiresAt ? `&exp=${encodeURIComponent(orderJson.reservationExpiresAt)}` : '';
        navigate(`/checkout/pix?orderId=${encodeURIComponent(orderId)}${exp}`);
        return;
      }

      // ── CARTÃO ───────────────────────────────────────────────────────
      // 2. Tokeniza dados do cartão com SDK Efí
      setTokenizing(true);
      let paymentToken: string;
      const hCPF = holderCPF.replace(/\D/g, '');

      try {
        if (!hCPF || hCPF.length !== 11) {
          throw new Error('CPF do titular inválido ou incompleto');
        }
        if (!cardHolderName || cardHolderName.trim().length < 3) {
          throw new Error('Informe o nome impresso no cartão');
        }

        const sdk = efiSdkRef.current || await loadEfiSdk();
        if (!sdk?.CreditCard) throw new Error('SDK Efí não carregado');

        const digits = cardNumber.replace(/\D/g, '');
        const [expMonth, expYear] = cardExpiry.split('/');
        const efiBrands = ['visa', 'mastercard', 'amex', 'elo', 'hipercard'];
        const brand = efiBrands.includes(cardBrand) ? cardBrand : 'visa';

        const tokenResult = await sdk.CreditCard
          .setAccount(EFI_PAYEE_CODE)
          .setEnvironment(EFI_ENVIRONMENT)
          .setCreditCardData({
            brand,
            number: digits,
            cvv: cardCvc,
            expirationMonth: expMonth?.padStart(2, '0'),
            expirationYear: expYear?.length === 2 ? `20${expYear}` : expYear,
            holderName: cardHolderName,
            holderDocument: hCPF,
            reuse: saveCard,
          })
          .getPaymentToken();

        paymentToken = tokenResult.payment_token;
        if (!paymentToken) throw new Error('Token não gerado pela Efí');
      } catch (tokenErr: any) {
        console.error('[Tokenização] erro:', tokenErr);
        const msg = tokenErr?.error_description || tokenErr?.message || 'verifique os dados e tente novamente';
        setError(`Erro ao processar dados do cartão: ${msg}`);
        return;
      } finally {
        setTokenizing(false);
      }

      // 3. Cobra via endpoint dedicado de cartão
      const cardCustomer = {
        name: cardHolderName.trim(), // Na Efí de cartão, o customer deve ser o titular
        email: body.purchaserEmail || user?.email || '',
        cpf: hCPF,
        phone: buyer?.phone?.replace(/\D/g, '') || '',
        birth: buyer?.birthDate || '',
      };

      console.log('[Pagamento] Iniciando cobrança via API:', { orderId, parcelas: selectedInstallment });
      const chargeRes = await fetchApi('/api/payments/efi/card/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          payment_token: paymentToken,
          parcelas: selectedInstallment,
          customer: cardCustomer,
        }),
      });
      const chargeJson = await chargeRes.json().catch(() => null);

      if (chargeJson?.status === 'paid' || chargeJson?.status === 'already_paid') {
        clearCheckoutSelection();
        sessionStorage.removeItem('checkoutBuyer:v1');
        sessionStorage.removeItem('checkoutSessionId');
        navigate(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
        return;
      }

      if (chargeJson?.status === 'failed') {
        setError(chargeJson.message || 'Cartão recusado. Verifique o limite ou dados digitados.');
        return;
      }

      setError(chargeJson?.error || `Falha no pagamento (HTTP ${chargeRes.status}). Tente novamente.`);

    } catch (e: any) {
      console.error('[handlePay] Erro inesperado:', e);
      setError(e?.message || 'Falha inesperada ao processar pagamento');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <form 
      onSubmit={e => { e.preventDefault(); handlePay(); }}
      className="flex min-h-[100dvh] w-full overflow-x-hidden bg-white dark:bg-[#0b0b0b] flex-col"
    >
      <CheckoutHeader />

      <main className="flex-1 flex items-start justify-center bg-white dark:bg-[#0b0b0b]">
        <div className="w-full max-w-2xl mt-0 px-8 max-md:px-4">
          <div className="bg-white dark:bg-[#0b0b0b] p-10 max-md:p-4 rounded-lg max-md:pt-4">
            <h2 className="text-2xl max-md:text-xl font-bold mb-4 max-md:mb-3 text-indigo-950 dark:text-white">Revisar e pagar</h2>

            {/* ─── Resumo do pedido ─────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-[#242424] dark:to-[#1a1a1a] border border-gray-200 dark:border-[#1F1F1F] rounded-2xl p-4 max-md:p-3 mb-6 max-md:mb-4 relative shadow-sm">
              <div className="flex items-center gap-4 max-md:gap-3">
                {(selection.eventImage || selection.image) ? (
                  <img src={selection.eventImage || selection.image} alt="evento" className="w-16 h-16 max-md:w-14 max-md:h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 max-md:w-14 max-md:h-14 bg-slate-100 dark:bg-[#1a1a1a] rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-indigo-950 dark:text-white max-md:text-sm truncate">{selection.eventName || selection.eventSlug}</div>
                  <div className="text-sm max-md:text-xs text-slate-500 dark:text-slate-400">{items.reduce((acc: number, it: any) => acc + it.quantity, 0)} ingressos</div>
                </div>
                <button type="button" onClick={() => setExpanded(e => !e)} aria-label={expanded ? 'Ocultar detalhes do pedido' : 'Mostrar detalhes do pedido'} className="grid h-11 w-11 place-items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
                  {expanded ? <ChevronUp className="w-5 h-5 max-md:w-4 max-md:h-4" /> : <ChevronDown className="w-5 h-5 max-md:w-4 max-md:h-4" />}
                </button>
              </div>
              {expanded && (
                <div className="mt-4 max-md:mt-3 border-t border-gray-200 dark:border-[#1F1F1F] pt-3 max-md:pt-2 space-y-2 max-md:space-y-1.5">
                  {items.map((it: any, idx: number) => (
                    <div key={idx} className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-4 max-md:gap-2">
                        <div className="font-semibold text-indigo-600 dark:text-indigo-400 max-md:text-sm">{it.quantity}×</div>
                        <div className="min-w-0 break-words text-indigo-950 dark:text-white max-md:text-sm">{it.name}</div>
                      </div>
                      <div className="flex-shrink-0 font-medium text-indigo-950 dark:text-white max-md:text-sm">{formatPrice(it.price)}</div>
                    </div>
                  ))}
                  <div className="mt-3 max-md:mt-2 text-[11px] max-md:text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1a1a1a] p-2 rounded-lg">
                    O comprovante e ingressos serão enviados para{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">{user?.email || buyer?.buyerEmail || ''}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Forma de Pagamento ───────────────────────────────────── */}
            <h3 className="text-lg max-md:text-base font-semibold mb-2 text-indigo-950 dark:text-white">Forma de pagamento</h3>
            
            <div className="flex gap-4 max-md:gap-2 mb-4 max-md:mb-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex-1 p-4 max-md:p-3 border-2 rounded-xl transition-all ${paymentMethod === 'pix'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'border-gray-200 dark:border-[#1F1F1F] hover:border-gray-300 dark:hover:border-gray-700'}`}
                >
                  <div className="flex items-center gap-3 max-md:gap-2">
                    <img src={PixIcon} alt="pix" className="w-6 h-6 max-md:w-5 max-md:h-5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-indigo-950 dark:text-white max-md:text-sm">Pix</div>
                      <span className="text-sm max-md:text-xs text-slate-500 dark:text-slate-400">Aprovação instantânea</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 p-4 max-md:p-3 border-2 rounded-xl transition-all ${paymentMethod === 'card'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'border-gray-200 dark:border-[#1F1F1F] hover:border-gray-300 dark:hover:border-gray-700'}`}
                >
                  <div className="flex items-center gap-3 max-md:gap-2">
                    <img src={CardIcon} alt="cartao" className="w-6 h-6 max-md:w-5 max-md:h-5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-indigo-950 dark:text-white max-md:text-sm">Cartão</div>
                      <span className="text-sm max-md:text-xs text-slate-500 dark:text-slate-400">em até 12×</span>
                    </div>
                  </div>
                </button>
              </div>

            {/* ─── Formulário de Cartão ─────────────────────────────────── */}
            {paymentMethod === 'card' && (
              <div className="space-y-3 max-md:space-y-2 mb-4 max-md:mb-3">
                {/* Número do cartão */}
                <div className="relative">
                  <Input
                    id="card-number"
                    placeholder="Número do cartão"
                    value={cardNumber}
                    onChange={e => handleCardNumberChange(e.target.value)}
                    className="w-full pr-20 h-12 max-md:h-11 rounded-xl max-md:text-sm"
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {cardBrand === 'amex' && <img src={AmexIcon} alt="amex" className="w-18 h-10 max-md:w-14 max-md:h-8 object-contain" />}
                    {cardBrand === 'visa' && <img src={VisaIcon} alt="visa" className="w-13 h-8 max-md:w-10 max-md:h-6 object-contain" />}
                    {cardBrand === 'mastercard' && <img src={MastercardIcon} alt="mastercard" className="w-10 h-5 max-md:w-8 max-md:h-4 object-contain" />}
                    {cardBrand === 'discover' && <img src={DiscoverIcon} alt="discover" className="w-13 h-8 max-md:w-10 max-md:h-6 object-contain" />}
                  </div>
                </div>

                {/* Nome no cartão */}
                <Input
                  id="card-name"
                  placeholder="Nome como está no cartão"
                  value={cardHolderName}
                  onChange={e => setCardHolderName(e.target.value.toUpperCase())}
                  className="h-12 max-md:h-11 rounded-xl max-md:text-sm uppercase"
                  autoComplete="cc-name"
                />

                {/* Validade e CVV */}
                <div className="flex gap-3 max-md:gap-2">
                  <Input
                    id="card-expiry"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={e => handleExpiryChange(e.target.value)}
                    className="flex-1 h-12 max-md:h-11 rounded-xl max-md:text-sm"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="cc-exp"
                  />
                  <Input
                    id="card-cvc"
                    placeholder={cardBrand === 'amex' ? 'CVV (4)' : 'CVV'}
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, cvcMax))}
                    className="w-40 max-md:w-28 h-12 max-md:h-11 rounded-xl max-md:text-sm"
                    inputMode="numeric"
                    maxLength={cvcMax}
                    autoComplete="cc-csc"
                    type="password"
                  />
                </div>

                {/* Dados do Titular (Sempre visível para conferência) */}
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs text-slate-500 mb-1 ml-1 font-medium">CPF do Titular</label>
                      <Input
                        placeholder="CPF do titular"
                        value={holderCPF}
                        onChange={e => {
                          const d = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setHolderCPF(d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"));
                        }}
                        className="h-11 rounded-xl text-sm"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs text-slate-500 mb-1 ml-1 font-medium">Nome no Cartão</label>
                      <Input
                        placeholder="Nome como no cartão"
                        value={cardHolderName}
                        className="h-11 rounded-xl text-sm uppercase"
                        onChange={e => setCardHolderName(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </div>

                {/* Parcelamento */}
                <div>
                  <label className="block text-sm max-md:text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
                    Parcelas
                  </label>
                  {loadingInstallments ? (
                    <div className="flex items-center gap-2 h-12 max-md:h-11 px-4 border border-gray-200 dark:border-[#1F1F1F] rounded-xl text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Buscando opções...</span>
                    </div>
                  ) : installments.length > 0 ? (
                    <select
                      id="installments-select"
                      value={selectedInstallment}
                      onChange={e => setSelectedInstallment(Number(e.target.value))}
                      className="w-full h-12 max-md:h-11 px-4 border border-gray-200 dark:border-[#1F1F1F] rounded-xl text-sm text-indigo-950 dark:text-white bg-white dark:bg-[#1a1a1a] focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
                    >
                      {installments.map(opt => (
                        <option key={opt.installment} value={opt.installment}>
                          {opt.installment}× de {opt.has_interest
                            ? `R$\u00a0${opt.currency} (com juros${opt.interest_percentage > 0 ? ` ${opt.interest_percentage}% a.m.` : ''})`
                            : `R$\u00a0${opt.currency} (sem juros)`
                          }
                        </option>
                      ))}
                    </select>
                  ) : cardBrand ? (
                    // Bandeira detectada mas parcelas ainda não carregadas
                    <div className="h-12 max-md:h-11 px-4 border border-gray-200 dark:border-[#1F1F1F] rounded-xl flex items-center text-sm text-slate-500 dark:text-slate-400">
                      Informe o número completo para ver as parcelas
                    </div>
                  ) : (
                    <div className="h-12 max-md:h-11 px-4 border border-gray-200 dark:border-[#1F1F1F] rounded-xl flex items-center text-sm text-slate-500 dark:text-slate-400">
                      Informe o número do cartão para ver as parcelas
                    </div>
                  )}
                </div>

                {/* Salvar cartão */}
                <AnimatedCheckbox
                  checked={saveCard}
                  onCheckedChange={setSaveCard}
                  label="Salvar dados de pagamento para compras futuras"
                  className="text-sm max-md:text-xs"
                />

                {/* Badge de segurança */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Seus dados são criptografados e nunca armazenados em nossos servidores.</span>
                </div>
              </div>
            )}

            {/* ─── Resumo de Valores ────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4 max-md:mb-3 p-4 max-md:p-3 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-xl border border-indigo-200 dark:border-indigo-900/50 max-md:hidden">
              <div className="w-full space-y-1">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-indigo-800/70 dark:text-indigo-300/70">Subtotal</div>
                  <div className="font-medium text-indigo-900 dark:text-indigo-200">{formatPrice(subtotal)}</div>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <span className="text-[10px] bg-green-100 dark:bg-green-900 px-1.5 rounded uppercase tracking-wide">{selection.couponCode}</span>
                      Desconto
                    </div>
                    <div className="font-medium text-green-600 dark:text-green-400">-{formatPrice(discount)}</div>
                  </div>
                )}
                {paymentMethod === 'card' && selectedOpt && selectedInstallment > 1 && (
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedInstallment}× de R$&nbsp;{selectedOpt.currency}
                      {hasInterest ? <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">(com juros)</span>
                        : <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">(sem juros)</span>}
                    </div>
                    <div className="font-medium text-slate-700 dark:text-slate-300">{formatPrice(totalDisplay)}</div>
                  </div>
                )}
                <div className="h-px bg-indigo-200 dark:bg-indigo-800/50 my-1" />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-indigo-800 dark:text-indigo-300 font-bold">Total</div>
                  <div className="font-bold text-xl max-md:text-lg text-indigo-950 dark:text-white">{formatPrice(totalDisplay)}</div>
                </div>
                {paymentMethod === 'card' && hasInterest && installmentTotal !== null && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                    Valor original: {formatPrice(baseTotal)} · Total com juros: {formatPrice(installmentTotal)}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Botão Pagar (desktop) ────────────────────────────────── */}
            <div className="max-md:hidden">
              <button
                id="btn-pay"
                type="submit"
                disabled={submitting}
                className="w-full h-14 max-md:h-12 rounded-xl bg-gradient-to-r from-[#2A2AD7] to-indigo-700 hover:from-[#2020c0] hover:to-indigo-800 text-white font-semibold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed max-md:text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    <span>{tokenizing ? 'Criptografando...' : 'Processando…'}</span>
                  </>
                ) : (
                  <>
                    <span>{paymentMethod === 'pix'
                      ? `Gerar Pix · ${formatPrice(baseTotal)}`
                      : `Pagar ${formatPrice(totalDisplay)}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              {error && (
                <div className="text-red-600 dark:text-red-400 mt-3 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg font-medium">
                  {error}
                  {error.toLowerCase().includes('cartão') || error.toLowerCase().includes('recusado') ? (
                    <button
                      className="block mt-2 text-indigo-600 dark:text-indigo-400 underline text-xs font-semibold"
                      onClick={() => setPaymentMethod('pix')}
                    >
                      Tentar pagar com Pix
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Spacer for mobile bottom bar */}
            <div className="h-[140px] md:hidden" />
          </div>
        </div>
      </main>

      {/* ─── Mobile Bottom Bar ──────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#242424] border-t border-gray-200 dark:border-[#1F1F1F] pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] px-4 shadow-2xl z-50">
        <div className="space-y-1 mb-2">
          {discount > 0 && (
            <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1">
                <span className="bg-green-100 dark:bg-green-900 px-1 rounded uppercase">{selection.couponCode}</span>
                Desconto
              </span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          {paymentMethod === 'card' && selectedOpt && selectedInstallment > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{selectedInstallment}× de R$&nbsp;{selectedOpt.currency}{hasInterest ? ' c/ juros' : ' s/ juros'}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total</div>
            <div className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatPrice(totalDisplay)}</div>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2A2AD7] to-indigo-700 hover:from-[#2020c0] hover:to-indigo-800 text-white font-semibold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 text-white" />
              <span>{tokenizing ? 'Criptografando...' : 'Processando…'}</span>
            </>
          ) : (
            <>
              <span>{paymentMethod === 'pix'
                ? `Gerar Pix · ${formatPrice(baseTotal)}`
                : `Pagar ${formatPrice(totalDisplay)} com Cartão`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        {error && (
          <div className="text-red-600 dark:text-red-400 mt-2 text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded-lg font-medium">
            {error}
            <div className="text-[10px] opacity-60 mt-1 font-mono">Dica: Confira o nome e CPF do titular.</div>
          </div>
        )}
      </div>
    </form>
  );
}

export default Review;
