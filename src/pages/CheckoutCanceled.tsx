import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CheckoutHeader from '@/components/CheckoutHeader';
import { Button } from '@/components/ui/button';
import { clearCheckoutSelection } from '@/lib/checkoutSelection';
import PaymentStatusAnimation from '@/components/PaymentStatusAnimation';

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
      sessionStorage.removeItem('checkoutSessionId');
      sessionStorage.removeItem('checkoutBuyer:v1');
      sessionStorage.removeItem('checkoutOrder');
      clearCheckoutSelection();
      try {
        // clear the session-backed checkout timer so it stops counting elsewhere
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const t = require('@/lib/checkoutTimer');
        t.clearTimer();
      } catch (e) { }
    } catch (e) { }
  }, []);

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden flex flex-col bg-white dark:bg-[#0b0b0b]">
      <CheckoutHeader />
      <main className="flex flex-1 items-center justify-center bg-white px-4 py-10 dark:bg-[#0b0b0b]">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl bg-white p-10 text-center dark:bg-[#0b0b0b] max-md:p-5">
            {(expired || reason === 'timeout') ? (
              <>
                <PaymentStatusAnimation
                  status="declined"
                  title="Sessão expirada"
                  description="A reserva ultrapassou o limite de tempo e os ingressos voltaram a ficar disponíveis."
                />
                <div className="mt-6 flex justify-center">
                  <Button className="min-h-11" onClick={() => {
                    try { localStorage.removeItem('checkoutSessionId'); } catch (e) { }
                    if (eventId) {
                      navigate(`/select-tickets/${encodeURIComponent(eventId)}`);
                    } else {
                      navigate('/discover');
                    }
                  }}>
                    Voltar aos ingressos
                  </Button>
                </div>
              </>
            ) : (
              <>
                <PaymentStatusAnimation
                  status="declined"
                  title={reason === 'payment_failed' ? 'Pagamento não aprovado' : 'Pedido cancelado'}
                  description={reason === 'payment_failed'
                    ? 'Nada foi cobrado. Confira os dados ou escolha outra forma de pagamento.'
                    : 'Seu pedido foi cancelado. Você pode tentar comprar novamente quando quiser.'}
                />

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button className="min-h-11" onClick={() => {
                    try { localStorage.removeItem('checkoutSessionId'); } catch (e) { }
                    if (eventId) {
                      navigate(`/select-tickets/${encodeURIComponent(eventId)}`);
                    }
                    else navigate('/discover');
                  }}>
                    Comprar novamente
                  </Button>

                  <Button className="min-h-11" variant="outline" onClick={() => { try { localStorage.removeItem('checkoutSessionId'); } catch (e) { }; navigate('/discover'); }}>Encontrar outros eventos</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
