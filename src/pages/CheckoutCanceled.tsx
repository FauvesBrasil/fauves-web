import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CheckoutHeader from '@/components/CheckoutHeader';
import { Button } from '@/components/ui/button';
import LottieReact from '@/components/LottieReact';
import ticketQuery from '../assets/ticket-query-on.json';

export default function CheckoutCanceled() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const eventId = params.get('eventId') || '';
  const expired = params.get('expired') === '1';
  const reason = params.get('reason'); // timeout, payment_failed, user_canceled, etc
  useEffect(() => {
    try {
      localStorage.removeItem('checkoutSessionId');
      localStorage.removeItem('checkoutBuyer:v1');
      localStorage.removeItem('checkoutOrder');
      try {
        // clear the session-backed checkout timer so it stops counting elsewhere
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const t = require('@/lib/checkoutTimer');
        t.clearTimer();
      } catch (e) { }
    } catch (e) { }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <CheckoutHeader />
      <main className="flex-1 flex items-start justify-center bg-white">
        <div className="w-full max-w-2xl mt-0 px-8">
          <div className="bg-white p-10 rounded-lg text-center">
            {/* smaller Lottie so it doesn't create excessive whitespace */}
            <div className="mx-auto w-24 h-24">
              <LottieReact animationData={ticketQuery} loop autoplay style={{ width: 96, height: 96 }} />
            </div>

            <div className="mt-2 flex justify-center" aria-hidden>
              <span className="text-5xl leading-none">{expired ? '⌛' : '❌'}</span>
            </div>

            {(expired || reason === 'timeout') ? (
              <>
                <h2 className="mt-4 text-2xl font-semibold">SESSÃO EXPIRADA</h2>
                <p className="mt-2 text-sm text-gray-600">A reserva foi cancelada porque ultrapassou o limite de 10 minutos. Infelizmente, não podemos mantê-la por mais tempo. Por favor, volte para a página de Ingressos e tente de novo.</p>
                <div className="mt-6 flex justify-center">
                  <Button onClick={() => {
                    try { localStorage.removeItem('checkoutSessionId'); } catch (e) { }
                    if (eventId) {
                      // Assume eventId could be slug or UUID - use /event/ prefix for safety
                      navigate(`/event/${encodeURIComponent(eventId)}`);
                    } else {
                      navigate('/select-tickets');
                    }
                  }}>
                    ← VOLTAR AOS INGRESSOS
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-semibold">Pedido cancelado</h2>
                <p className="mt-2 text-sm text-gray-600">Seu pedido foi cancelado. Se quiser, você pode tentar comprar novamente ou procurar outros eventos.</p>

                <div className="mt-6 flex justify-center gap-4">
                  <Button onClick={() => {
                    try { localStorage.removeItem('checkoutSessionId'); } catch (e) { }
                    if (eventId) {
                      // Assume eventId could be slug or UUID - use /event/ prefix for safety
                      navigate(`/event/${encodeURIComponent(eventId)}`);
                    }
                    else navigate('/');
                  }}>
                    Comprar novamente
                  </Button>

                  <Button variant="outline" onClick={() => { try { localStorage.removeItem('checkoutSessionId'); } catch (e) { }; navigate('/'); }}>Encontrar outros eventos</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
