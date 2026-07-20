import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Loader2,
  Minus,
  Pencil,
  Plus,
  QrCode,
  X,
} from 'lucide-react';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useTheme } from '@/context/ThemeContext';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';

declare global {
  interface Window {
    EfiPay?: any;
  }
}

const EFI_PAYEE_CODE = import.meta.env.VITE_EFI_PAYEE_CODE || '';
const EFI_ENVIRONMENT = (import.meta.env.VITE_EFI_ENVIRONMENT || 'production') as 'production' | 'sandbox';

async function loadEfiSdk(): Promise<any> {
  if (window.EfiPay) return window.EfiPay;
  try {
    const module = await import('payment-token-efi');
    const EfiPay = (module as any).default || module;
    window.EfiPay = EfiPay;
    return EfiPay;
  } catch {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-efi-payment-sdk]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.EfiPay), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.dataset.efiPaymentSdk = 'true';
      script.src = 'https://cdn.jsdelivr.net/npm/payment-token-efi/dist/payment-token-efi-umd.min.js';
      script.onload = () => resolve(window.EfiPay);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

const detectCardBrand = (digits: string) => {
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2(?:2[2-9]|[3-6]\d|7[01])/.test(digits)) return 'mastercard';
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(digits)) return 'elo';
  if (/^(606282|3841)/.test(digits)) return 'hipercard';
  return '';
};

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  if (/^3[47]/.test(digits)) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(' ');
  }
  return digits.match(/.{1,4}/g)?.join(' ') || digits;
};

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
};

const hasAnswer = (value: string | undefined) => Boolean(value && value !== 'Não' && value.trim());

type TicketCounts = Record<string, number>;

interface TicketCheckoutModalProps {
  event: any;
  user: any;
  ticketCounts: TicketCounts;
  setTicketCounts: React.Dispatch<React.SetStateAction<TicketCounts>>;
  initialCouponCode?: string;
  onClose: () => void;
}

export default function TicketCheckoutModal({
  event,
  user,
  ticketCounts,
  setTicketCounts,
  initialCouponCode = '',
  onClose,
}: TicketCheckoutModalProps) {
  const { isDark } = useTheme();
  const registrationForm = event?.registrationForm || {};
  const ticketTypes = useMemo(
    () => (event?.ticketTypes || []).filter((ticket: any) => !ticket.isPrivate),
    [event?.ticketTypes],
  );
  const allowGroupRegistration = registrationForm.allowGroupRegistration !== false;
  const efiSdkRef = useRef<any>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(!user);
  const [ticketMenuOpen, setTicketMenuOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(Boolean(initialCouponCode));
  const [couponCode, setCouponCode] = useState(initialCouponCode.toUpperCase());
  const [coupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState((user?.name || '').toUpperCase());
  const [holderCpf, setHolderCpf] = useState(user?.cpf || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [pixIntent, setPixIntent] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => acquireDocumentScrollLock(), []);

  useEffect(() => {
    if (initialCouponCode) void applyCoupon(initialCouponCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paymentMethod !== 'card') return;
    loadEfiSdk().then((sdk) => { efiSdkRef.current = sdk; }).catch(() => undefined);
  }, [paymentMethod]);

  useEffect(() => {
    if (!pixIntent || !order?.id) return;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetchApi(`/api/orders/${order.id}`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.paymentStatus === 'PAID') setSuccess(true);
      } catch {
        // A tela continua disponível para uma nova tentativa manual.
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pixIntent, order?.id]);

  const feePercent = Number(event?.organization?.platformFeePercent || 15);
  const pricedTickets = useMemo(() => ticketTypes.map((ticket: any) => ({
    ...ticket,
    checkoutPrice: Number(ticket.price || 0) * (ticket.absorbFee === false ? 1 + feePercent / 100 : 1),
  })), [ticketTypes, feePercent]);

  const subtotal = pricedTickets.reduce(
    (sum: number, ticket: any) => sum + ticket.checkoutPrice * (ticketCounts[ticket.id] || 0),
    0,
  );
  const eligibleIds = Array.isArray(coupon?.eligibleTicketIds) ? coupon.eligibleTicketIds : null;
  const eligibleSubtotal = pricedTickets.reduce((sum: number, ticket: any) => {
    if (eligibleIds && !eligibleIds.includes(ticket.id)) return sum;
    return sum + ticket.checkoutPrice * (ticketCounts[ticket.id] || 0);
  }, 0);
  const discount = coupon?.type === 'PERCENT'
    ? eligibleSubtotal * Number(coupon.value || 0) / 100
    : coupon?.type === 'FIXED'
      ? Math.min(eligibleSubtotal, Number(coupon.value || 0))
      : 0;
  const total = Math.max(0, subtotal - discount);
  const selectedCount = Object.values(ticketCounts).reduce((sum, quantity) => sum + quantity, 0);
  const selectedNames = pricedTickets
    .filter((ticket: any) => (ticketCounts[ticket.id] || 0) > 0)
    .map((ticket: any) => ticket.name)
    .join(', ');

  const formatMoney = (value: number) => value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  const eventDate = (() => {
    if (event?.startDate) {
      const date = new Date(event.startDate);
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
        + `, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (event?.date) return `${event.date.day} de ${event.date.month}, ${event.date.time || ''}`;
    return '';
  })();

  function changeQuantity(ticketId: string, delta: number) {
    setTicketCounts((current) => {
      const ticket = pricedTickets.find((item: any) => item.id === ticketId);
      const currentQuantity = current[ticketId] || 0;
      const limit = Math.min(Number(ticket?.perUserLimit || 25), Number(ticket?.available ?? 25));
      const nextQuantity = Math.max(0, Math.min(limit, currentQuantity + delta));
      if (!allowGroupRegistration && delta > 0) {
        return Object.fromEntries(pricedTickets.map((item: any) => [item.id, item.id === ticketId ? 1 : 0]));
      }
      return { ...current, [ticketId]: nextQuantity };
    });
  }

  async function applyCoupon(rawCode = couponCode) {
    const normalized = rawCode.trim().toUpperCase();
    if (!normalized) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const response = await fetchApi('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, eventId: event.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Cupom inválido ou expirado.');
      setCoupon(data);
      setCouponCode(data.code || normalized);
      setCouponOpen(false);
    } catch (couponFailure: any) {
      setCoupon(null);
      setCouponError(couponFailure.message || 'Não foi possível aplicar o cupom.');
    } finally {
      setCouponLoading(false);
    }
  }

  function validateForm() {
    if (!name.trim()) return 'Informe seu nome completo.';
    if (!email.trim()) return 'Informe seu endereço de e-mail.';
    if (registrationForm.phoneType === 'required' && !phone.trim()) return 'Informe seu número de celular.';
    if (registrationForm.ethType === 'required' && !answers.__eth?.trim()) return 'Informe sua carteira Ethereum.';
    if (registrationForm.solType === 'required' && !answers.__sol?.trim()) return 'Informe sua carteira Solana.';
    for (const question of registrationForm.customQuestions || []) {
      if (question.required && !hasAnswer(answers[question.id])) {
        return `Responda: “${question.text || question.label || 'Pergunta obrigatória'}”.`;
      }
    }
    if (!agreed) return 'Você precisa concordar com os termos do evento.';
    if (selectedCount < 1) return 'Selecione pelo menos um ingresso.';
    if (total > 0 && paymentMethod === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 14 || cardExpiry.replace(/\D/g, '').length !== 4 || cardCvc.length < 3) return 'Confira os dados do cartão.';
      if (cardHolder.trim().length < 3) return 'Informe o nome do titular do cartão.';
      if (holderCpf.replace(/\D/g, '').length !== 11) return 'Informe um CPF válido para o titular.';
    }
    if (total > 0 && paymentMethod === 'pix' && holderCpf.replace(/\D/g, '').length !== 11) {
      return 'Informe seu CPF para gerar o Pix.';
    }
    return '';
  }

  async function submit(eventSubmit: React.FormEvent) {
    eventSubmit.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const items = Object.entries(ticketCounts)
        .filter(([, quantity]) => quantity > 0)
        .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
      const method = total <= 0 ? 'FREE' : paymentMethod === 'card' ? 'CARD' : 'PIX';
      const orderResponse = await fetchApi('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          purchaserName: name.trim(),
          purchaserEmail: email.trim(),
          purchaserPhone: phone.trim() || undefined,
          purchaserCpf: holderCpf.replace(/\D/g, '') || undefined,
          answers,
          items,
          paymentMethod: method,
          couponCode: couponCode.trim() || undefined,
        }),
      });
      const orderData = await orderResponse.json().catch(() => ({}));
      if (!orderResponse.ok) throw new Error(orderData.message || orderData.error || 'Não foi possível criar seu pedido.');
      setOrder(orderData);

      if (Number(orderData.totalAmount) <= 0) {
        setSuccess(true);
        return;
      }

      if (paymentMethod === 'pix') {
        const pixResponse = await fetchApi(`/api/orders/${orderData.id}/pix-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaserPhone: phone.replace(/\D/g, ''),
            purchaserTaxId: holderCpf.replace(/\D/g, ''),
            purchaserEmail: email.trim(),
            purchaserName: name.trim(),
          }),
        });
        const pixData = await pixResponse.json().catch(() => ({}));
        if (!pixResponse.ok) throw new Error(pixData.message || 'Não foi possível gerar o Pix.');
        setPixIntent(pixData);
        return;
      }

      const digits = cardNumber.replace(/\D/g, '');
      const expiryDigits = cardExpiry.replace(/\D/g, '');
      const sdk = efiSdkRef.current || await loadEfiSdk();
      if (!EFI_PAYEE_CODE || !sdk?.CreditCard) throw new Error('O pagamento por cartão está temporariamente indisponível. Tente via Pix.');
      const paymentTokenResult = await sdk.CreditCard
        .setAccount(EFI_PAYEE_CODE)
        .setEnvironment(EFI_ENVIRONMENT)
        .setCreditCardData({
          brand: detectCardBrand(digits) || 'visa',
          number: digits,
          cvv: cardCvc,
          expirationMonth: expiryDigits.slice(0, 2),
          expirationYear: `20${expiryDigits.slice(2)}`,
          holderName: cardHolder.trim(),
          holderDocument: holderCpf.replace(/\D/g, ''),
          reuse: false,
        })
        .getPaymentToken();
      if (!paymentTokenResult?.payment_token) throw new Error('Não foi possível validar o cartão.');

      const chargeResponse = await fetchApi('/api/payments/efi/card/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          payment_token: paymentTokenResult.payment_token,
          parcelas: 1,
          customer: {
            name: cardHolder.trim(),
            email: email.trim(),
            cpf: holderCpf.replace(/\D/g, ''),
            phone: phone.replace(/\D/g, ''),
          },
        }),
      });
      const charge = await chargeResponse.json().catch(() => ({}));
      if (!chargeResponse.ok || !['paid', 'already_paid'].includes(charge.status)) {
        throw new Error(charge.message || 'O cartão não foi aprovado. Você pode tentar via Pix.');
      }
      setSuccess(true);
    } catch (submitFailure: any) {
      setError(submitFailure?.error_description || submitFailure?.message || 'Não foi possível concluir o pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderQuestion(question: any) {
    const label = question.text || question.label || 'Informação adicional';
    const type = question.type;
    if (type === 'checkbox' || type === 'terms') {
      return (
        <label className="tc-check-row" key={question.id}>
          <input
            type="checkbox"
            checked={answers[question.id] === 'Sim'}
            onChange={(change) => setAnswers((current) => ({ ...current, [question.id]: change.target.checked ? 'Sim' : 'Não' }))}
          />
          <span>{label}{question.required ? ' *' : ''}</span>
        </label>
      );
    }
    const isChoice = ['choice', 'select'].includes(type) || Array.isArray(question.options) && question.options.length > 0;
    return (
      <label className="tc-field" key={question.id}>
        <span>{label}{question.required ? ' *' : ''}</span>
        {isChoice ? (
          <select value={answers[question.id] || ''} onChange={(change) => setAnswers((current) => ({ ...current, [question.id]: change.target.value }))}>
            <option value="">Selecione uma opção</option>
            {(question.options || []).map((option: string) => <option value={option} key={option}>{option}</option>)}
          </select>
        ) : question.length === 'long' ? (
          <textarea value={answers[question.id] || ''} onChange={(change) => setAnswers((current) => ({ ...current, [question.id]: change.target.value }))} />
        ) : (
          <input
            type={type === 'website' ? 'url' : type === 'phone' ? 'tel' : 'text'}
            value={answers[question.id] || ''}
            onChange={(change) => setAnswers((current) => ({ ...current, [question.id]: change.target.value }))}
          />
        )}
      </label>
    );
  }

  return (
    <div className={`ticket-checkout ${isDark ? 'is-dark' : 'is-light'}`} role="dialog" aria-modal="true" aria-label="Comprar ingresso">
      <style>{styles}</style>
      <button className="tc-close" type="button" onClick={onClose} aria-label="Fechar checkout"><X size={18} /></button>
      <form className="tc-shell" onSubmit={submit}>
        {success ? (
          <section className="tc-success">
            <span className="tc-success-icon"><Check size={30} /></span>
            <h2>Inscrição confirmada</h2>
            <p>Seu ingresso para <strong>{event.name}</strong> foi emitido e enviado para <strong>{email}</strong>.</p>
            <button type="button" className="tc-primary" onClick={onClose}>Concluído</button>
          </section>
        ) : pixIntent ? (
          <section className="tc-pix-screen">
            <h2>Finalize o pagamento via Pix</h2>
            <p>Escaneie o QR Code ou copie o código. A confirmação acontece automaticamente.</p>
            {pixIntent.qrBase64 && <img src={`data:image/png;base64,${pixIntent.qrBase64}`} alt="QR Code Pix" />}
            <div className="tc-copy-row">
              <input readOnly value={pixIntent.code || ''} />
              <button type="button" onClick={async () => { await navigator.clipboard.writeText(pixIntent.code || ''); setCopied(true); }}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <span className="tc-waiting"><Loader2 size={15} /> Aguardando confirmação</span>
          </section>
        ) : (
          <>
            <main className="tc-form-column">
              <section>
                <h2>Suas informações</h2>
                {user && !editingIdentity ? (
                  <div className="tc-identity">
                    <img src={resolveImageUrl(user.avatar || user.photoUrl || user.profilePicture || '')} alt="" />
                    <div><strong>{name}</strong><span>{email}</span></div>
                    <button type="button" onClick={() => setEditingIdentity(true)} aria-label="Editar informações"><Pencil size={15} /></button>
                  </div>
                ) : (
                  <div className="tc-grid-two">
                    <label className="tc-field"><span>Nome completo *</span><input value={name} onChange={(change) => setName(change.target.value)} /></label>
                    <label className="tc-field"><span>E-mail *</span><input type="email" value={email} onChange={(change) => setEmail(change.target.value)} /></label>
                  </div>
                )}

                {registrationForm.phoneType !== 'off' && (!user?.phone || editingIdentity) && (
                  <label className="tc-field"><span>Celular{registrationForm.phoneType === 'required' ? ' *' : ''}</span><input type="tel" value={phone} onChange={(change) => setPhone(change.target.value)} placeholder="+55 85 99999-9999" /></label>
                )}
                {registrationForm.ethType && registrationForm.ethType !== 'off' && <label className="tc-field"><span>Carteira Ethereum{registrationForm.ethType === 'required' ? ' *' : ''}</span><input value={answers.__eth || ''} onChange={(change) => setAnswers((current) => ({ ...current, __eth: change.target.value }))} /></label>}
                {registrationForm.solType && registrationForm.solType !== 'off' && <label className="tc-field"><span>Carteira Solana{registrationForm.solType === 'required' ? ' *' : ''}</span><input value={answers.__sol || ''} onChange={(change) => setAnswers((current) => ({ ...current, __sol: change.target.value }))} /></label>}
                {(registrationForm.customQuestions || []).map(renderQuestion)}
                <label className="tc-check-row tc-terms">
                  <input type="checkbox" checked={agreed} onChange={(change) => setAgreed(change.target.checked)} />
                  <span>Concordo com os termos do evento e com o tratamento dos dados necessários para a inscrição. *</span>
                </label>
              </section>

              {total > 0 && (
                <section className="tc-payment">
                  <h2>Pagamento</h2>
                  <div className="tc-methods">
                    <button type="button" className={paymentMethod === 'card' ? 'active' : ''} onClick={() => setPaymentMethod('card')}><CreditCard size={16} /> Cartão</button>
                    <button type="button" className={paymentMethod === 'pix' ? 'active' : ''} onClick={() => setPaymentMethod('pix')}><QrCode size={16} /> Pix</button>
                  </div>
                  {paymentMethod === 'card' ? (
                    <div className="tc-card-fields">
                      <label className="tc-field tc-card-number"><span>Cartão de crédito ou débito *</span><div><CreditCard size={17} /><input inputMode="numeric" placeholder="Número do cartão" value={cardNumber} onChange={(change) => setCardNumber(formatCardNumber(change.target.value))} /><input className="tc-expiry" inputMode="numeric" placeholder="MM / AA" value={cardExpiry} onChange={(change) => setCardExpiry(formatExpiry(change.target.value))} /><input className="tc-cvc" inputMode="numeric" placeholder="CVC" value={cardCvc} onChange={(change) => setCardCvc(change.target.value.replace(/\D/g, '').slice(0, 4))} /></div></label>
                      <div className="tc-grid-two"><label className="tc-field"><span>Nome no cartão *</span><input value={cardHolder} onChange={(change) => setCardHolder(change.target.value.toUpperCase())} /></label><label className="tc-field"><span>CPF do titular *</span><input inputMode="numeric" value={holderCpf} onChange={(change) => setHolderCpf(change.target.value)} placeholder="000.000.000-00" /></label></div>
                    </div>
                  ) : (
                    <label className="tc-field"><span>CPF para gerar o Pix *</span><input inputMode="numeric" value={holderCpf} onChange={(change) => setHolderCpf(change.target.value)} placeholder="000.000.000-00" /></label>
                  )}
                </section>
              )}
              {error && <div className="tc-error">{error}</div>}
              <button type="submit" className="tc-primary" disabled={submitting}>
                {submitting ? <><Loader2 size={17} /> Processando…</> : total <= 0 ? 'Confirmar inscrição' : paymentMethod === 'card' ? `Pagar ${formatMoney(total)} com cartão` : `Gerar Pix de ${formatMoney(total)}`}
              </button>
            </main>

            <aside className="tc-summary">
              <div className="tc-event-head">
                <img src={resolveImageUrl(event.image || event.bannerUrl || '')} alt="" />
                <div><strong>{event.name}</strong><span>{eventDate}</span></div>
              </div>
              <button type="button" className="tc-ticket-trigger" onClick={() => setTicketMenuOpen((open) => !open)}>
                <span>{pricedTickets.length > 1 ? 'Ingresso' : 'Ingressos'}</span>
                <strong>{selectedNames || 'Selecionar'}{!allowGroupRegistration && <ChevronDown size={14} />}</strong>
              </button>
              {ticketMenuOpen && (
                <div className="tc-ticket-menu">
                  {pricedTickets.map((ticket: any) => {
                    const quantity = ticketCounts[ticket.id] || 0;
                    return <div className={quantity ? 'selected' : ''} key={ticket.id}><button type="button" onClick={() => changeQuantity(ticket.id, allowGroupRegistration ? -1 : 1)}>{quantity > 0 && !allowGroupRegistration && <Check size={15} />}<span><strong>{ticket.name}</strong><small>{formatMoney(ticket.checkoutPrice)}</small></span></button>{allowGroupRegistration && <div className="tc-stepper"><button type="button" onClick={() => changeQuantity(ticket.id, -1)} disabled={!quantity}><Minus size={14} /></button><b>{quantity}</b><button type="button" onClick={() => changeQuantity(ticket.id, 1)}><Plus size={14} /></button></div>}</div>;
                  })}
                </div>
              )}
              {allowGroupRegistration && pricedTickets.length === 1 && (
                <div className="tc-inline-quantity"><span>Quantidade</span><div className="tc-stepper"><button type="button" onClick={() => changeQuantity(pricedTickets[0].id, -1)} disabled={selectedCount <= 1}><Minus size={14} /></button><b>{selectedCount}</b><button type="button" onClick={() => changeQuantity(pricedTickets[0].id, 1)}><Plus size={14} /></button></div></div>
              )}
              {subtotal > 0 && <div className="tc-subtotal"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>}
              <div className="tc-coupon">
                {couponOpen ? <div><input autoFocus value={couponCode} onChange={(change) => { setCouponCode(change.target.value.toUpperCase()); setCouponError(''); }} placeholder="Código do cupom" /><button type="button" onClick={() => void applyCoupon()} disabled={couponLoading}>{couponLoading ? 'Validando…' : 'Aplicar'}</button></div> : <button type="button" onClick={() => setCouponOpen(true)}>{coupon ? `Cupom ${coupon.code} aplicado` : 'Adicionar cupom'}</button>}
                {couponError && <small>{couponError}</small>}
              </div>
              {discount > 0 && <div className="tc-discount"><span>Desconto</span><strong>- {formatMoney(discount)}</strong></div>}
              <div className="tc-total"><span>Total</span><strong>{total <= 0 ? 'Grátis' : formatMoney(total)}</strong></div>
            </aside>
          </>
        )}
      </form>
    </div>
  );
}

const styles = `
  .ticket-checkout{position:fixed;inset:0;z-index:12000;overflow-y:auto;background:rgba(19,21,23,.94);backdrop-filter:blur(24px);color:#f7f7f8;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--tc-bg:#191b1d;--tc-surface:#202224;--tc-field:#303234;--tc-border:rgba(255,255,255,.10);--tc-text:#f7f7f8;--tc-muted:#9b9da1;--tc-hover:#292b2e}
  .ticket-checkout.is-light{background:rgba(244,245,247,.94);--tc-bg:#fff;--tc-surface:#f7f7f8;--tc-field:#eff0f2;--tc-border:rgba(19,21,23,.12);--tc-text:#17181a;--tc-muted:#74777b;--tc-hover:#f0f1f3;color:var(--tc-text)}
  .tc-close{position:fixed;top:18px;right:22px;z-index:2;width:32px;height:32px;border:0;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.15);color:#d2d3d5;cursor:pointer}.is-light .tc-close{background:rgba(19,21,23,.08);color:#55585c}.tc-close:hover{transform:scale(1.04);background:rgba(255,255,255,.22)}
  .tc-shell{width:min(900px,calc(100% - 40px));min-height:100%;margin:0 auto;padding:clamp(86px,13vh,150px) 0 60px;display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:56px;align-items:start;box-sizing:border-box}
  .tc-form-column{min-width:0}.tc-form-column section+section{margin-top:30px}.tc-form-column h2,.tc-pix-screen h2,.tc-success h2{font-size:22px;line-height:1.2;margin:0 0 18px;color:var(--tc-text);font-weight:720;letter-spacing:-.02em}
  .tc-identity{display:flex;align-items:center;gap:12px;margin-bottom:22px}.tc-identity img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:var(--tc-field)}.tc-identity div{display:flex;flex-direction:column;min-width:0}.tc-identity strong{font-size:15px}.tc-identity span{font-size:13px;color:var(--tc-muted);margin-top:3px}.tc-identity button{border:0;background:transparent;color:var(--tc-muted);cursor:pointer;padding:4px}
  .tc-grid-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tc-field{display:flex;flex-direction:column;gap:7px;margin-bottom:17px;font-size:13px;font-weight:650;color:var(--tc-text)}.tc-field>input,.tc-field>select,.tc-field>textarea{width:100%;height:42px;border:1px solid transparent;border-radius:8px;background:var(--tc-field);color:var(--tc-text);padding:0 12px;font-family:inherit;font-size:14px;font-weight:500;outline:none;box-sizing:border-box}.tc-field>textarea{height:86px;padding:10px 12px;resize:vertical}.tc-field>input:focus,.tc-field>select:focus,.tc-field>textarea:focus{border-color:#2A2AD7;box-shadow:0 0 0 2px rgba(42,42,215,.18)}.tc-field input::placeholder{color:var(--tc-muted)}
  .tc-check-row{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.45;color:var(--tc-text);cursor:pointer;margin:4px 0 18px}.tc-check-row input{appearance:none;width:17px;height:17px;flex:0 0 17px;border:1px solid var(--tc-border);border-radius:5px;background:var(--tc-field);margin:1px 0 0;display:grid;place-items:center}.tc-check-row input:checked{background:#2A2AD7;border-color:#2A2AD7}.tc-check-row input:checked:after{content:'✓';font-size:12px;font-weight:800;color:#fff}.tc-terms{color:var(--tc-muted);font-size:12px}
  .tc-methods{display:flex;gap:8px;margin-bottom:16px}.tc-methods button{height:36px;border:1px solid var(--tc-border);border-radius:8px;background:var(--tc-surface);color:var(--tc-muted);padding:0 14px;display:flex;align-items:center;gap:7px;font-size:13px;font-weight:650;cursor:pointer}.tc-methods button.active{border-color:#2A2AD7;background:rgba(42,42,215,.12);color:var(--tc-text)}
  .tc-card-number>div{height:44px;border:1px solid transparent;border-radius:8px;background:var(--tc-field);display:flex;align-items:center;padding:0 12px;gap:9px}.tc-card-number>div:focus-within{border-color:#2A2AD7;box-shadow:0 0 0 2px rgba(42,42,215,.18)}.tc-card-number>div svg{color:var(--tc-muted);flex:0 0 auto}.tc-card-number>div input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--tc-text);font-family:inherit;font-size:14px;font-weight:500}.tc-card-number .tc-expiry{max-width:72px}.tc-card-number .tc-cvc{max-width:42px}.tc-error{padding:10px 12px;border-radius:8px;background:rgba(239,65,24,.12);color:#ff7554;font-size:13px;font-weight:600;margin:10px 0}
  .tc-primary{width:100%;height:44px;border:0;border-radius:8px;background:#EF4118;color:#fff;font-size:14px;font-weight:750;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;margin-top:8px}.tc-primary:hover{background:#d93612}.tc-primary:disabled{opacity:.55;cursor:not-allowed}.tc-primary svg,.tc-waiting svg{animation:tc-spin 1s linear infinite}
  .tc-summary{position:sticky;top:90px;border:1px solid var(--tc-border);border-radius:14px;background:var(--tc-bg);overflow:visible;color:var(--tc-text);box-shadow:0 18px 48px rgba(0,0,0,.12)}.tc-event-head{display:flex;gap:12px;align-items:center;padding:16px}.tc-event-head img{width:48px;height:48px;border-radius:8px;object-fit:cover;background:var(--tc-field)}.tc-event-head div{display:flex;flex-direction:column;min-width:0}.tc-event-head strong{font-size:14px;line-height:1.25}.tc-event-head span{font-size:12px;color:var(--tc-muted);margin-top:5px}.tc-ticket-trigger{width:100%;min-height:50px;padding:0 16px;border:0;border-top:1px solid var(--tc-border);border-bottom:1px solid var(--tc-border);background:transparent;color:inherit;display:flex;align-items:center;justify-content:space-between;cursor:pointer}.tc-ticket-trigger>span{font-size:13px;color:var(--tc-muted);font-weight:600}.tc-ticket-trigger>strong{font-size:13px;display:flex;align-items:center;gap:6px;max-width:65%;text-align:right}
  .tc-ticket-menu{border-bottom:1px solid var(--tc-border);background:var(--tc-surface);padding:7px}.tc-ticket-menu>div{display:flex;align-items:center;border-radius:8px;padding:2px}.tc-ticket-menu>div.selected{background:var(--tc-hover)}.tc-ticket-menu>div>button{flex:1;min-width:0;border:0;background:transparent;color:inherit;display:flex;align-items:center;gap:8px;text-align:left;padding:8px;cursor:pointer}.tc-ticket-menu span{display:flex;flex-direction:column}.tc-ticket-menu strong{font-size:13px}.tc-ticket-menu small{color:var(--tc-muted);font-size:11px;margin-top:2px}.tc-stepper{display:flex;align-items:center;gap:7px}.tc-stepper button{width:28px;height:28px;border:0;border-radius:7px;background:var(--tc-hover);color:var(--tc-text);display:grid;place-items:center;cursor:pointer}.tc-stepper button:disabled{opacity:.35}.tc-stepper b{font-size:13px;min-width:14px;text-align:center}.tc-inline-quantity,.tc-subtotal,.tc-discount,.tc-total{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;font-size:13px}.tc-inline-quantity,.tc-subtotal{border-bottom:1px solid var(--tc-border)}.tc-inline-quantity>span,.tc-subtotal>span,.tc-discount>span,.tc-total>span{color:var(--tc-muted);font-weight:600}.tc-discount strong{color:#2a9d58}.tc-total{padding-top:10px}.tc-total strong{font-size:22px;letter-spacing:-.02em}.tc-coupon{padding:14px 16px 2px}.tc-coupon>button{border:0;background:transparent;color:#ff7655;padding:0;font-size:13px;font-weight:700;cursor:pointer}.tc-coupon>div{display:flex;gap:6px}.tc-coupon input{height:34px;min-width:0;flex:1;border:1px solid var(--tc-border);border-radius:7px;background:var(--tc-field);color:var(--tc-text);padding:0 9px;outline:0;font-size:12px}.tc-coupon>div button{border:0;border-radius:7px;background:#EF4118;color:#fff;padding:0 10px;font-size:12px;font-weight:700}.tc-coupon small{display:block;color:#ff7554;margin-top:6px;font-size:11px}
  .tc-pix-screen,.tc-success{grid-column:1/-1;width:min(430px,100%);margin:0 auto;text-align:center;display:flex;flex-direction:column;align-items:center}.tc-pix-screen>p,.tc-success>p{color:var(--tc-muted);font-size:14px;line-height:1.55;margin:-8px 0 20px}.tc-pix-screen>img{width:210px;height:210px;background:white;border-radius:10px;padding:10px;object-fit:contain}.tc-copy-row{display:flex;width:100%;gap:8px;margin-top:16px}.tc-copy-row input{height:40px;min-width:0;flex:1;background:var(--tc-field);border:1px solid var(--tc-border);border-radius:8px;color:var(--tc-muted);padding:0 10px}.tc-copy-row button{border:0;border-radius:8px;background:#2A2AD7;color:#fff;padding:0 13px;font-weight:700;display:flex;align-items:center;gap:6px}.tc-waiting{display:flex;align-items:center;gap:7px;margin-top:18px;color:var(--tc-muted);font-size:12px}.tc-success-icon{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#35b653;color:white;margin-bottom:18px}.tc-success .tc-primary{max-width:280px}
  @keyframes tc-spin{to{transform:rotate(360deg)}}
  @media(max-width:760px){.tc-close{top:12px;right:12px}.tc-shell{width:100%;padding:64px 18px 34px;grid-template-columns:1fr;gap:22px}.tc-summary{position:static;grid-row:1}.tc-form-column{grid-row:2}.tc-grid-two{grid-template-columns:1fr}.tc-form-column h2{font-size:20px}.tc-card-number>div{flex-wrap:wrap;height:auto;min-height:44px;padding:9px 12px}.tc-card-number>div>input:first-of-type{flex-basis:65%}}
`;
