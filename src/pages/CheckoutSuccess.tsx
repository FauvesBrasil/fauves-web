import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CheckoutHeader from '@/components/CheckoutHeader';
import { Button } from '@/components/ui/button';
import { useTrackingPixels } from '@/hooks/useTrackingPixels';

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
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white flex-col">
      <CheckoutHeader />

      <main className="flex-1 flex items-start justify-center bg-white">
        <div className="w-full max-w-2xl mt-12 px-8">
          <div className="bg-white p-10 rounded-lg text-center">
            {/* Inline small CSS for emoji animation (simple, no external assets) */}
            <style>{`
              @keyframes noto-pop { 0% { transform: translateY(0) scale(0.9) rotate(0deg); opacity: 0; }
                                  40% { transform: translateY(-6px) scale(1.16) rotate(-8deg); opacity: 1; }
                                  70% { transform: translateY(0) scale(1.05) rotate(4deg); }
                                  100% { transform: translateY(0) scale(1) rotate(0deg); }
              }
              .noto-emoji-anim { animation: noto-pop 1100ms ease-in-out both infinite; display:inline-block; }
            `}</style>

            <div className="mb-6">
              <div className="inline-flex items-center justify-center rounded-full bg-transparent">
                <div style={{ fontSize: 72, lineHeight: 1 }} className="noto-emoji-anim" aria-hidden>
                  🎉
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-indigo-900 mb-4">Pagamento concluído</h1>

            <p className="text-sm text-gray-600 mb-8">
              Seus ingressos foram liberados e em breve você receberá uma confirmação por e-mail.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => navigate('/')} variant="outline">Voltar ao início</Button>
              <Button onClick={() => navigate('/profile')}>Ir para meus pedidos</Button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
