import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import { HelpCircle } from 'lucide-react';

export default function CheckoutHeader({ expiresAt, onExpire }: { expiresAt?: string; onExpire?: () => void } = {}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [, setTick] = useState(0); // Force re-render

  const location = useLocation();
  const hideTimer = location.pathname.startsWith('/checkout/canceled') || location.pathname.startsWith('/checkout/success');

  useEffect(() => {
    if (hideTimer) return;

    if (expiresAt) {
      let rafId: number;
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining > 0) {
          rafId = requestAnimationFrame(updateTimer);
        } else if (onExpire) {
          onExpire();
        }
      };
      updateTimer();
      return () => { if (rafId) cancelAnimationFrame(rafId); };
    }

    try {
      const t = require('@/lib/checkoutTimer');
      t.ensureTimerStarted();

      let rafId: number;
      const updateTimerSession = () => {
        const remaining = t.getSecondsLeft();
        setSecondsLeft(remaining);
        if (remaining > 0) {
          rafId = requestAnimationFrame(updateTimerSession);
        }
      };
      updateTimerSession();
      return () => { if (rafId) cancelAnimationFrame(rafId); };
    } catch (e) {
      const startTime = Date.now();
      let rafId: number;
      const updateFallback = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, 600 - elapsed);
        setSecondsLeft(remaining);
        if (remaining > 0) {
          rafId = requestAnimationFrame(updateFallback);
        }
      };
      updateFallback();
      return () => { if (rafId) cancelAnimationFrame(rafId); };
    }
  }, [hideTimer, expiresAt, onExpire]);

  // Cancel order when session timer reaches 0
  useEffect(() => {
    if (hideTimer || expiresAt || secondsLeft > 0) return;


    // Timer reached 0 - cancel the order
    const cancelExpiredOrder = async () => {
      try {
        // Get orderId from sessionStorage
        const draftStr = sessionStorage.getItem('checkoutDraft:v1');
        if (!draftStr) return;

        const draft = JSON.parse(draftStr);
        if (!draft.orderId) return;

        // no-op

        // Call cancel API
        const res = await fetch(`/api/orders/${draft.orderId}/cancel?userId=${draft.userId || 'guest'}&userEmail=${draft.buyerEmail || ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'TIMEOUT_EXPIRED' }),
        });

        if (res.ok) {
          // no-op
        }

        // Clear checkout data
        sessionStorage.removeItem('checkoutDraft:v1');
        sessionStorage.removeItem('checkoutBuyer:v1');
        sessionStorage.removeItem('checkoutTimerStart:v1');

        // Redirect to canceled page
        window.location.href = '/checkout/canceled?reason=timeout';
      } catch (e) {
        // no-op
        // Still redirect to canceled page
        window.location.href = '/checkout/canceled?reason=timeout';
      }
    };

    // Small delay to avoid race conditions
    const timeoutId = setTimeout(cancelExpiredOrder, 1000);
    return () => clearTimeout(timeoutId);
  }, [secondsLeft, hideTimer]);

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const ss = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <header className="w-full min-h-[56px] sticky top-0 z-50 bg-white dark:bg-[#0b0b0b]" data-checkout-header>
      <div className="w-full">
        <div className="mx-auto w-full max-w-[800px] px-8 max-md:px-4">
          <div className="flex min-h-[54px] items-center justify-between py-2 max-md:py-1.5">
            <div className="flex items-center"><LogoFauves width={80} className="max-md:w-16" /></div>
            <div className="flex items-center gap-4 max-md:gap-2">
              {!hideTimer && (
                <div className="flex min-h-9 items-center gap-1 max-md:bg-indigo-50 dark:max-md:bg-indigo-950/20 max-md:px-3 max-md:py-1 max-md:rounded-full">
                  <span className="text-[16px] max-md:text-xs font-semibold text-indigo-900 dark:text-indigo-400" aria-live="polite" aria-label={`${mm} minutos e ${ss} segundos restantes`}>{mm}:{ss}</span>
                </div>
              )}
              <button
                onClick={() => (window as any).openChatHelp?.()}
                aria-label="Abrir ajuda do checkout"
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-3 py-2 max-md:p-0 rounded-md max-md:rounded-full text-sm max-md:text-xs text-indigo-900 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 max-md:border max-md:border-indigo-200 dark:max-md:border-indigo-900/50"
              >
                <HelpCircle className="w-4 h-4 max-md:w-3.5 max-md:h-3.5" />
                <span className="max-md:hidden">Ajuda</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 2, background: 'linear-gradient(90deg, #0205D3 0%, #EF4118 100%)' }} />
    </header>
  );
}
