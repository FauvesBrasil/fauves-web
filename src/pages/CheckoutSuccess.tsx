import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CheckoutHeader from '@/components/CheckoutHeader';
import { Button } from '@/components/ui/button';
import { useTrackingPixels } from '@/hooks/useTrackingPixels';
import { fetchApi } from '@/lib/apiBase';

interface OrderSummary {
  id: string;
  code?: string | null;
  totalAmount: number;
  purchaserEmail?: string | null;
  paymentStatus: string;
  eventId?: string | null;
}

const formatBRL = (n: number) => `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId') || '';
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`/api/orders/${encodeURIComponent(orderId)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || `HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      setOrder({
        id: json.id,
        code: json.code,
        totalAmount: json.totalAmount || 0,
        purchaserEmail: json.purchaserEmail,
        paymentStatus: json.paymentStatus,
        eventId: json.eventId || null,
      });
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar pedido');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    fetchOrder();
  }, [orderId, fetchOrder, navigate]);

  // Tracking pixels integration
  const { trackPurchase } = useTrackingPixels(order?.eventId || undefined);
  const purchaseTrackedRef = useRef(false);

  // Fire purchase event when order is successfully loaded
  useEffect(() => {
    if (order && order.paymentStatus === 'PAID' && !purchaseTrackedRef.current) {
      purchaseTrackedRef.current = true;
      trackPurchase({
        eventId: order.eventId || orderId,
        transactionId: order.code || order.id,
        orderId: order.id,
        currency: 'BRL',
        value: order.totalAmount,
      });
    }
  }, [order, orderId, trackPurchase]);

  // No need to poll - payment is already confirmed when user reaches this page

  const isPaid = order?.paymentStatus === 'PAID';
  const statusIcon = loading ? '⏳' : error ? '⚠️' : isPaid ? '🎉' : '⏳';

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-white dark:bg-[#0b0b0b] flex-col">
      <CheckoutHeader />

      <main className="flex flex-1 items-center justify-center bg-white px-4 py-10 dark:bg-[#0b0b0b]">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl bg-white p-10 text-center dark:bg-[#0b0b0b] max-md:p-5">
            {/* Inline small CSS for emoji animation (simple, no external assets) */}
            <style>{`
              @keyframes noto-pop { 0% { transform: translateY(0) scale(0.9) rotate(0deg); opacity: 0; }
                                  40% { transform: translateY(-6px) scale(1.16) rotate(-8deg); opacity: 1; }
                                  70% { transform: translateY(0) scale(1.05) rotate(4deg); }
                                  100% { transform: translateY(0) scale(1) rotate(0deg); }
              }
              .noto-emoji-anim { animation: noto-pop 1100ms ease-in-out both infinite; display:inline-block; }
            `}</style>

            <div className="mb-6" aria-hidden>
              <div className="inline-flex items-center justify-center rounded-full bg-transparent">
                <div
                  style={{ fontSize: 72, lineHeight: 1 }}
                  className={isPaid ? 'noto-emoji-anim' : 'inline-block'}
                  aria-hidden
                >
                  {statusIcon}
                </div>
              </div>
            </div>

            {loading ? (
              <>
                <h1 className="mb-3 text-2xl font-bold text-indigo-900 dark:text-white">Confirmando pagamento</h1>
                <p className="text-sm text-gray-600 dark:text-slate-300" aria-live="polite">Aguarde enquanto verificamos seu pedido.</p>
              </>
            ) : error ? (
              <>
                <h1 className="mb-3 text-2xl font-bold text-indigo-900 dark:text-white">Não foi possível carregar o pedido</h1>
                <p className="break-words text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
              </>
            ) : (
              <>
                <h1 className="mb-4 text-2xl font-bold text-indigo-900 dark:text-white">{isPaid ? 'Pagamento concluído' : 'Pagamento em processamento'}</h1>

                <p className="mb-8 text-sm text-gray-600 dark:text-slate-300">
                  {isPaid
                    ? `Seus ingressos foram liberados${order?.purchaserEmail ? ` e serão enviados para ${order.purchaserEmail}` : ''}.`
                    : 'Seu pagamento ainda está sendo confirmado. Você pode acompanhar seus ingressos pela sua conta.'}
                </p>
              </>
            )}

            {!loading && (
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {error && <Button className="min-h-11" onClick={() => void fetchOrder()}>Tentar novamente</Button>}
                <Button className="min-h-11" onClick={() => navigate('/')} variant="outline">Voltar ao início</Button>
                <Button className="min-h-11" onClick={() => navigate('/events')}>Ver meus ingressos</Button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
