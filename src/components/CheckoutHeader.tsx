import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import { HelpCircle } from 'lucide-react';

export default function CheckoutHeader() {
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [, setTick] = useState(0); // Force re-render

  const location = useLocation();
  const hideTimer = location.pathname.startsWith('/checkout/canceled') || location.pathname.startsWith('/checkout/success');

  useEffect(() => {
    if (hideTimer) return;

    try {
      const t = require('@/lib/checkoutTimer');
      t.ensureTimerStarted();

      // Use requestAnimationFrame for accurate timing even when tab is inactive
      let rafId: number;

      const updateTimer = () => {
        const remaining = t.getSecondsLeft();
        setSecondsLeft(remaining);

        if (remaining > 0) {
          rafId = requestAnimationFrame(updateTimer);
        }
      };

      updateTimer();

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    } catch (e) {
      // Fallback: decrement from 600
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

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [hideTimer]);

  // Cancel order when timer reaches 0
  useEffect(() => {
    if (hideTimer || secondsLeft > 0) return;

    // Timer reached 0 - cancel the order
    const cancelExpiredOrder = async () => {
      try {
        // Get orderId from sessionStorage
        const draftStr = sessionStorage.getItem('checkoutDraft:v1');
        if (!draftStr) return;

        const draft = JSON.parse(draftStr);
        if (!draft.orderId) return;

        console.log('[CheckoutHeader] Timer expired, canceling order:', draft.orderId);

        // Call cancel API
        const res = await fetch(`/api/orders/${draft.orderId}/cancel?userId=${draft.userId || 'guest'}&userEmail=${draft.buyerEmail || ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'TIMEOUT_EXPIRED' }),
        });

        if (res.ok) {
          console.log('[CheckoutHeader] Order canceled successfully');
        }

        // Clear checkout data
        sessionStorage.removeItem('checkoutDraft:v1');
        sessionStorage.removeItem('checkoutBuyer:v1');
        sessionStorage.removeItem('checkoutTimerStart:v1');

        // Redirect to canceled page
        window.location.href = '/checkout/canceled?reason=timeout';
      } catch (e) {
        console.error('[CheckoutHeader] Failed to cancel order:', e);
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
    <header className="w-full sticky top-0 z-50 bg-white dark:bg-[#0b0b0b]">
      <div className="w-full">
        <div className="mx-auto w-full max-w-[800px] px-8 max-md:px-4">
          <div className="flex items-center justify-between py-2 max-md:py-1.5">
            <div className="flex items-center"><LogoFauves width={80} className="max-md:w-16" /></div>
            <div className="flex items-center gap-4 max-md:gap-2">
              {!hideTimer && (
                <div className="flex items-center gap-1 max-md:bg-indigo-50 dark:max-md:bg-indigo-950/20 max-md:px-2 max-md:py-1 max-md:rounded-full">
                  <span className="text-[16px] max-md:text-xs font-semibold text-indigo-900 dark:text-indigo-400">{mm}:{ss}</span>
                </div>
              )}
              <button
                onClick={() => (window as any).openChatHelp?.()}
                className="inline-flex items-center gap-2 px-3 py-2 max-md:px-2 max-md:py-1.5 rounded-md max-md:rounded-full text-sm max-md:text-xs text-indigo-900 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 max-md:border max-md:border-indigo-200 dark:max-md:border-indigo-900/50"
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
