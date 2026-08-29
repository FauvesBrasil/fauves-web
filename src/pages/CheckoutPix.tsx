import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CheckoutHeader from '@/components/CheckoutHeader';
import { useAuth } from '@/context/AuthContext';
import { WarpDialog } from '@/components/WarpDialog';
import SmartphoneIcon from '../assets/smartphone.svg';
import QrCodeIcon from '../assets/qr-code.svg';
import DoubleCheckIcon from '../assets/double-check.svg';
import { fetchApi } from '@/lib/apiBase';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatePresence, motion } from 'framer-motion';
import PaymentStatusAnimation from '@/components/PaymentStatusAnimation';

interface PixIntent {
  id: string;
  orderId: string;
  provider: string;
  code: string;
  status: string;
  expiresAt: string;
  amount?: number;
}

interface OrderSummary {
  id: string;
  code: string;
  eventId: string;
  eventName?: string | null;
  eventStartDate?: string | null;
  totalAmount: number;
  purchaserEmail?: string | null;
  paymentStatus: string;
}

const formatBRL = (n: number) => `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function CheckoutPix() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId') || '';
  const expParam = params.get('exp');
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const { user } = useAuth();
  const [orderLoading, setOrderLoading] = useState<boolean>(true);
  const [intent, setIntent] = useState<PixIntent | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [expired, setExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(expParam || null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const fetchOrder = useCallback(async (opts?: { suppressLoading?: boolean }) => {
    if (!orderId) return;
    if (!opts?.suppressLoading) setOrderLoading(true);
    try {
      const res = await fetchApi(`/api/orders/${orderId}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setOrderLoading(false);
        return;
      }
      setOrder({
        id: json.id,
        code: json.code,
        eventId: json.eventId,
        eventName: json.eventName,
        eventStartDate: json.eventStartDate,
        totalAmount: json.totalAmount,
        paymentStatus: json.paymentStatus,
      });
      if (json.paymentStatus === 'PAID') {
        setPolling(false);
        setPaymentConfirmed(true);
        try {
          // navigate to success page when order is paid
          navigate(`/checkout/success?orderId=${encodeURIComponent(json.id)}`);
        } catch(e) {}
      }
      // Fallback expiration: if no exp param and we still don't have it, derive from createdAt + window (15m default)
      if (!expParam && !expiresAt && json.createdAt) {
        const windowMinutes = parseInt(import.meta.env.VITE_RESERVATION_MINUTES || '15', 10);
        const derived = new Date(new Date(json.createdAt).getTime() + windowMinutes * 60_000).toISOString();
        setExpiresAt(derived);
      }
    } catch (e:any) {
      setError(e.message);
    }
    finally {
      if (!opts?.suppressLoading) setOrderLoading(false);
    }
  }, [orderId, expParam]);

  const fetchIntent = useCallback(async () => {
    if (!orderId) {
      return;
    }
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (user && (user as any).id) headers['x-user-id'] = (user as any).id;
      const res = await fetchApi(`/api/orders/${orderId}/pix-intent`, { method: 'POST', headers });
      if (!res.ok) {
        // try to parse error body for more helpful message
        let errBody: any = null;
        try { errBody = await res.json(); } catch(_) { errBody = null; }
        const msg = errBody?.detail || errBody?.error || `Falha intent PIX HTTP ${res.status}`;
        setError(String(msg));
        return;
      }
      const json: PixIntent = await res.json();
      console.log('[CheckoutPix] Intent received:', json);
      if (json.code && json.code.length > 0) {
        setIntent(json);
        // We have a valid code now; start payment status polling.
        setPolling(true);
      } else {
        // No code yet: keep polling enabled so the GET poll can pick up updates.
        setIntent(null);
        setPolling(true);
      }
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, expParam]);

  // Initial load
  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    fetchOrder();
    fetchIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Polling payment status: poll both order status and pix-intent status
  useEffect(() => {
    if (!polling || !orderId || expired) return;
    const intervalMs = 5000; // Poll every 5 seconds
    let stopped = false;
    
    const pollStatus = async () => {
      if (stopped) return;
      try {
        // Poll order status to check if payment was confirmed by webhook
        const orderRes = await fetchApi(`/api/orders/${orderId}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
            if (orderData.paymentStatus === 'PAID') {
              stopped = true;
              setPolling(false);
              setPaymentConfirmed(true);
              navigate(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
              return;
            }
        }

        // Also poll pix-intent for status updates
        const intentRes = await fetchApi(`/api/orders/${orderId}/pix-intent`);
        if (intentRes.ok) {
          const intentData = await intentRes.json().catch(() => null);
          if (intentData?.intent) {
            const newStatus = (intentData.intent.providerStatus || intentData.intent.status || '').toUpperCase();
            if (newStatus === 'PAID') {
              stopped = true;
              setPolling(false);
              setPaymentConfirmed(true);
              navigate(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
              return;
            }
            
            // Update intent state if changed
            if (intent?.status?.toUpperCase() !== newStatus || intent?.code !== intentData.intent.code) {
              setIntent(intentData.intent);
            }
          }
        }
      } catch (e) {
        // Ignore individual polling errors
      }
    };
    
    // Start polling immediately and then at intervals
    pollStatus();
    const id = setInterval(pollStatus, intervalMs);
    
    return () => {
      stopped = true;
      clearInterval(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling, orderId, expired]);

  const cancelOrderAndRedirect = useCallback(async (reason: 'expired' | 'manual' = 'manual') => {
    if (!orderId) return;
    if (actionBusy) return;
    setActionBusy(true);
    setError(null);
    try {
      // Attempt to cancel provider pix intent first (best-effort)
      try {
        const ue = user?.email || (order?.purchaserEmail as string | undefined) || '';
        const qpix = ue ? `?userEmail=${encodeURIComponent(ue)}` : '';
        await fetchApi(`/api/orders/${encodeURIComponent(orderId)}/pix-intent/cancel${qpix}`, { method: 'POST' }).catch(()=>{});
      } catch {}

      const userEmail = user?.email || (order?.purchaserEmail as string | undefined) || '';
      const q = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
      const res = await fetchApi(`/api/orders/${encodeURIComponent(orderId)}/cancel${q}`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(j?.error || `Falha ao cancelar pedido (HTTP ${res.status})`);
      } else {
        const ev = order?.eventId || '';
        const qs = [] as string[];
        if (reason === 'expired') qs.push('expired=1');
        if (ev) qs.push(`eventId=${encodeURIComponent(ev)}`);
        navigate(`/checkout/canceled${qs.length ? `?${qs.join('&')}` : ''}`);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro inesperado ao cancelar pedido');
    } finally {
      setActionBusy(false);
      setShowCancelConfirm(false);
    }
  }, [actionBusy, navigate, order, orderId, user]);

  const onExpire = useCallback(() => {
    // Don't cancel if payment was already confirmed
    if (paymentConfirmed) return;
    
    // When timer expires, mark expired, stop polling and attempt to cancel the order
    setExpired(true);
    setPolling(false);
    // best-effort cancel and redirect
    (async () => {
      try {
        await cancelOrderAndRedirect('expired');
      } catch (e) {
        // ignore: user will see expired UI below
      }
    })();
  }, [paymentConfirmed, cancelOrderAndRedirect]);

  const paid = order?.paymentStatus === 'PAID';

  if (!orderLoading && !loading && error && !order) {
    return (
      <div className="flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-white dark:bg-[#0b0b0b]">
        <CheckoutHeader expiresAt={expiresAt || undefined} onExpire={onExpire} />
        <main className="flex flex-1 items-center justify-center px-4 py-10 text-center">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Não foi possível carregar o Pix</h1>
            <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300" role="alert">{error}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button className="min-h-11" onClick={() => { setError(null); void fetchOrder(); void fetchIntent(); }}>Tentar novamente</Button>
              <Button className="min-h-11" variant="outline" onClick={() => navigate('/events')}>Meus eventos</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // New layout: keep the same header (logo, timer, help, gradient) used in `Review` and render the Pix modal
  // content inline so the page visually matches the checkout shell while showing the exact modal UI.
  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-white dark:bg-[#0b0b0b] flex-col">
      <CheckoutHeader expiresAt={expiresAt || undefined} onExpire={onExpire} />

      <AnimatePresence mode="wait" initial={false}>
      {(orderLoading || loading) && !expired ? (
        <motion.main
          key="pix-processing"
          className="flex flex-1 items-center justify-center px-4 py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -24, filter: 'blur(4px)' }}
          transition={{ duration: 0.32 }}
        >
          <PaymentStatusAnimation
            status="processing"
            method="pix"
            title="Gerando seu QR Code"
            description="Estamos reservando os ingressos e preparando os dados do Pix."
          />
        </motion.main>
      ) : (
      <motion.div
        key="pix-ready"
        className="flex flex-1 flex-col"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
      <main className="flex-1 flex items-start justify-center bg-white dark:bg-[#0b0b0b]">
        <div className="w-full max-w-2xl mt-0 px-8 max-md:px-4">
          <div className="bg-white dark:bg-[#0b0b0b] p-10 max-md:p-4 rounded-lg max-md:pt-4">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300" role="alert">
                <p className="break-words">{error}</p>
                <button
                  type="button"
                  className="mt-2 min-h-11 rounded-lg px-3 font-semibold underline underline-offset-2"
                  onClick={() => { setError(null); void fetchOrder(); void fetchIntent(); }}
                >
                  Tentar gerar o Pix novamente
                </button>
              </div>
            )}
            <div className="mb-8 max-md:mb-4">
              <PaymentStatusAnimation
                status="pix-waiting"
                method="pix"
                compact
                className="mb-4"
              />
              <h3 className="text-[26px] max-md:text-lg max-md:leading-snug">
                <span className="text-[#EF4118] font-semibold">Falta só mais um pouco.</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-white">Realize o pagamento de {order && order.totalAmount != null ? formatBRL(order.totalAmount) : intent && intent.amount != null ? formatBRL(intent.amount) : (orderLoading ? 'calculando...' : '—')} para finalizar sua compra e receber seus ingressos.</span>
              </h3>
              <p className="mt-2 max-md:mt-1.5 text-sm max-md:text-xs text-gray-500 dark:text-slate-400">Após o pagamento, os ingressos serão enviados para o e-mail de cada participante inserido na etapa anterior.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-md:gap-3">
              {/* O QR permanece visível também no mobile para permitir pagamento por outra pessoa. */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-[#1F1F1F]">
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-xl bg-white p-2 md:h-48 md:w-48">
                    {intent?.code ? (
                      <QRCodeSVG
                        value={intent.code}
                        size={176}
                        level="M"
                        marginSize={1}
                        bgColor="#ffffff"
                        fgColor="#111827"
                        title="QR Code para pagamento via Pix"
                        className="h-full w-full"
                      />
                    ) : (
                      <div className="text-center text-sm text-gray-400">Gerando QR Code...</div>
                    )}
                  </div>
                </div>
                <p className="text-center text-[11px] leading-4 text-slate-500 dark:text-slate-400 md:hidden">
                  Outra pessoa pode escanear este código para pagar.
                </p>
              </div>

              {/* Code section - Full width on mobile */}
              <div className="flex flex-col justify-between gap-4 max-md:gap-3 md:col-span-1 max-md:col-span-1">
                <div>
                  <div className="rounded-xl border border-gray-200 dark:border-[#1F1F1F] bg-gradient-to-br from-white to-gray-50/50 dark:from-[#242424] dark:to-[#1a1a1a] p-4 max-md:p-3 text-sm text-gray-700 dark:text-slate-300 shadow-sm">
                    <textarea
                      readOnly
                      value={intent?.code ?? ''}
                      aria-label="Código Pix copia e cola"
                      className="w-full resize-none break-all bg-transparent text-sm max-md:text-xs outline-none font-mono"
                      rows={6}
                    />
                    {intent && !intent.code && (
                      <div className="mt-2 text-sm max-md:text-xs text-slate-500 dark:text-slate-400">Aguardando geração do código pelo provedor...</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3">
                  <button
                    onClick={async () => {
                      if (!intent?.code) return;
                      try {
                        await navigator.clipboard.writeText(intent.code);
                        setCopyOk(true);
                        setTimeout(()=>setCopyOk(false),2000);
                      } catch {}
                    }}
                    disabled={!intent?.code}
                    className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {copyOk ? '✓ Copiado!' : 'Copiar código Pix'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 max-md:mt-4 rounded-xl border border-gray-200 dark:border-[#1F1F1F] bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-[#1F1F1F] dark:to-[#1a1a1a] p-4 max-md:p-3 shadow-sm">
              <div className="grid gap-4 max-md:gap-3">
                <div className="flex items-start gap-3 max-md:gap-2">
                  <div className="pt-0.5">
                    <img src={SmartphoneIcon} alt="smartphone" className="w-5 h-5 max-md:w-4 max-md:h-4" />
                  </div>
                  <div>
                    <p className="text-sm max-md:text-xs font-medium text-gray-800 dark:text-white">Abra o app do seu banco e entre na Área PIX.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 max-md:gap-2">
                  <div className="pt-0.5">
                    <img src={QrCodeIcon} alt="qr code" className="w-5 h-5 max-md:w-4 max-md:h-4" />
                  </div>
                  <div>
                    <p className="text-sm max-md:text-xs font-medium text-gray-800 dark:text-white">Escolha <span className="hidden md:inline">a opção pagar com QR Code e escaneie o código acima, ou</span> Pix Copia e Cola e cole o código copiado.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 max-md:gap-2">
                  <div className="pt-0.5">
                    <img src={DoubleCheckIcon} alt="double check" className="w-5 h-5 max-md:w-4 max-md:h-4" />
                  </div>
                  <div>
                    <p className="text-sm max-md:text-xs font-medium text-gray-800 dark:text-white">Confirme as informações do pagamento e finalize a compra.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 max-md:mt-4 flex gap-3">
              <div className="flex-1">
                <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} disabled={actionBusy || paid} className="w-full h-12 max-md:h-11 rounded-xl max-md:text-sm">
                  Cancelar pedido
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      </motion.div>
      )}
      </AnimatePresence>

      <WarpDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Cancelar pedido"
        description="Cancelar este pedido liberará os ingressos para outras pessoas. Deseja continuar?"
        confirmText="Sim, cancelar"
        cancelText="Não"
        loading={actionBusy}
            onConfirm={async () => { await cancelOrderAndRedirect(); }}
      />
    </div>
  );
}
