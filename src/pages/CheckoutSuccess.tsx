import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CheckoutHeader from '@/components/CheckoutHeader';
import { Button } from '@/components/ui/button';
import { useTrackingPixels } from '@/hooks/useTrackingPixels';
import { fetchApi } from '@/lib/apiBase';
import { AnimatePresence, motion } from 'framer-motion';
import PaymentStatusAnimation from '@/components/PaymentStatusAnimation';

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

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-white dark:bg-[#0b0b0b] flex-col">
      <CheckoutHeader />

      <main className="flex flex-1 items-center justify-center bg-white px-4 py-10 dark:bg-[#0b0b0b]">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl bg-white p-10 text-center dark:bg-[#0b0b0b] max-md:p-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={loading ? 'loading' : error ? 'error' : isPaid ? 'paid' : 'pending'}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                {loading ? (
                  <PaymentStatusAnimation
                    status="processing"
                    title="Confirmando pagamento"
                    description="Aguarde enquanto verificamos seu pedido."
                  />
                ) : error ? (
                  <PaymentStatusAnimation
                    status="declined"
                    title="Não foi possível carregar o pedido"
                    description={error}
                  />
                ) : isPaid ? (
                  <PaymentStatusAnimation
                    status="success"
                    title="Pagamento aprovado!"
                    description={`Seus ingressos foram liberados${order?.purchaserEmail ? ` e serão enviados para ${order.purchaserEmail}` : ''}.`}
                  />
                ) : (
                  <PaymentStatusAnimation
                    status="processing"
                    title="Pagamento em processamento"
                    description="A confirmação ainda está a caminho. Você pode acompanhar os ingressos pela sua conta."
                  />
                )}
              </motion.div>
            </AnimatePresence>

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
