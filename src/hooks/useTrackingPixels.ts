import { useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '@/lib/apiBase';

// Types for pixel configuration
interface PixelConfig {
    id: string;
    type: 'meta' | 'google_ads' | 'ga' | 'x' | 'img';
    scope: 'this' | 'all';
    pixelId: string;
    config?: {
        positions?: Array<{ action: string; conversionId: string }>;
        defaultEvents?: Array<{ action: string; eventName?: string; conversionId?: string }>;
        events?: Array<{ action: string; url: string }>;
    };
}

// Standard event types
export type TrackingEventType =
    | 'page_view'      // User views event page
    | 'add_to_cart'    // User selects tickets
    | 'begin_checkout' // User starts checkout
    | 'purchase';      // User completes purchase

// Event data for tracking
export interface TrackingEventData {
    eventId?: string;
    eventName?: string;
    category?: string;
    currency?: 'BRL';
    value?: number;
    items?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    orderId?: string;
    transactionId?: string;
}

// Declare global types for tracking SDKs
declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
        gtag?: (...args: any[]) => void;
        twq?: (...args: any[]) => void;
    }
}

/**
 * Hook to manage tracking pixels for an event
 * Loads configured pixels and provides methods to fire events
 */
export function useTrackingPixels(eventId: string | undefined) {
    const pixelsRef = useRef<PixelConfig[]>([]);
    const initializedRef = useRef<Set<string>>(new Set());

    // Load pixels for this event
    useEffect(() => {
        if (!eventId) return;

        let mounted = true;
        async function loadPixels() {
            try {
                const res = await fetchApi(`/api/event/${eventId}/pixels`);
                if (res.ok && mounted) {
                    const data = await res.json();
                    pixelsRef.current = Array.isArray(data) ? data : [];

                    // Initialize pixel scripts
                    pixelsRef.current.forEach(pixel => {
                        if (!initializedRef.current.has(pixel.id)) {
                            initializePixel(pixel);
                            initializedRef.current.add(pixel.id);
                        }
                    });
                }
            } catch (e) {
                // no-op
            }
        }

        loadPixels();
        return () => { mounted = false; };
    }, [eventId]);

    // Initialize a pixel script in the page
    const initializePixel = useCallback((pixel: PixelConfig) => {
        switch (pixel.type) {
            case 'meta':
                initMetaPixel(pixel.pixelId);
                break;
            case 'ga':
                initGoogleAnalytics(pixel.pixelId);
                break;
            case 'google_ads':
                initGoogleAds(pixel.pixelId);
                break;
            case 'x':
                initXPixel(pixel.pixelId);
                break;
            // 'img' pixels don't need initialization
        }
    }, []);

    // Fire a tracking event
    const trackEvent = useCallback((
        eventType: TrackingEventType,
        data?: TrackingEventData
    ) => {
        pixelsRef.current.forEach(pixel => {
            try {
                firePixelEvent(pixel, eventType, data);
            } catch (e) {
                // no-op
            }
        });
    }, []);

    // Convenience methods
    const trackPageView = useCallback((data?: TrackingEventData) => {
        trackEvent('page_view', data);
    }, [trackEvent]);

    const trackAddToCart = useCallback((data: TrackingEventData) => {
        trackEvent('add_to_cart', data);
    }, [trackEvent]);

    const trackBeginCheckout = useCallback((data: TrackingEventData) => {
        trackEvent('begin_checkout', data);
    }, [trackEvent]);

    const trackPurchase = useCallback((data: TrackingEventData) => {
        trackEvent('purchase', data);
    }, [trackEvent]);

    return {
        trackEvent,
        trackPageView,
        trackAddToCart,
        trackBeginCheckout,
        trackPurchase,
        pixels: pixelsRef.current,
    };
}

// ============================================================
// Pixel Initialization Functions
// ============================================================

function initMetaPixel(pixelId: string) {
    if (window.fbq) return; // Already initialized

    // Meta Pixel base code
    (function (f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode?.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq?.('init', pixelId);
    window.fbq?.('track', 'PageView');
}

function initGoogleAnalytics(measurementId: string) {
    if (document.querySelector(`script[src*="${measurementId}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
        window.dataLayer.push(args);
    }
    window.gtag = gtag as any;
    gtag('js', new Date());
    gtag('config', measurementId);
}

function initGoogleAds(conversionId: string) {
    // Google Ads uses the same gtag as GA
    if (!window.gtag) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=AW-${conversionId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
            window.dataLayer.push(args);
        }
        window.gtag = gtag as any;
        gtag('js', new Date());
    }
    window.gtag?.('config', `AW-${conversionId}`);
}

function initXPixel(pixelId: string) {
    if (window.twq) return;

    // X (Twitter) Pixel base code
    (function (e: any, t: Document, n: string, s: string, a?: any, c?: any, i?: any) {
        e.twq || (a = e.twq = function () {
            a.exe ? a.exe.apply(a, arguments) : a.queue.push(arguments);
        },
            a.version = '1.1',
            a.queue = [],
            c = t.createElement(n),
            c.async = true,
            c.src = s,
            i = t.getElementsByTagName(n)[0],
            i.parentNode?.insertBefore(c, i));
    })(window, document, 'script', 'https://static.ads-twitter.com/uwt.js');

    window.twq?.('config', pixelId);
}

// ============================================================
// Event Firing Functions
// ============================================================

function firePixelEvent(
    pixel: PixelConfig,
    eventType: TrackingEventType,
    data?: TrackingEventData
) {
    switch (pixel.type) {
        case 'meta':
            fireMetaEvent(eventType, data);
            break;
        case 'ga':
            fireGAEvent(eventType, data);
            break;
        case 'google_ads':
            fireGoogleAdsEvent(pixel, eventType, data);
            break;
        case 'x':
            fireXEvent(pixel, eventType, data);
            break;
        case 'img':
            fireImagePixel(pixel, eventType, data);
            break;
    }
}

function fireMetaEvent(eventType: TrackingEventType, data?: TrackingEventData) {
    if (!window.fbq) return;

    const eventMap: Record<TrackingEventType, string> = {
        'page_view': 'PageView',
        'add_to_cart': 'AddToCart',
        'begin_checkout': 'InitiateCheckout',
        'purchase': 'Purchase',
    };

    const fbData: any = {};
    if (data?.currency || data?.value) fbData.currency = 'BRL';
    if (data?.value) fbData.value = data.value;
    if (data?.items) {
        fbData.contents = data.items.map(i => ({
            id: i.id,
            quantity: i.quantity,
        }));
        fbData.content_type = 'product';
    }

    window.fbq('track', eventMap[eventType], fbData);
}

function fireGAEvent(eventType: TrackingEventType, data?: TrackingEventData) {
    if (!window.gtag) return;

    const eventMap: Record<TrackingEventType, string> = {
        'page_view': 'page_view',
        'add_to_cart': 'add_to_cart',
        'begin_checkout': 'begin_checkout',
        'purchase': 'purchase',
    };

    const gaData: any = {};
    if (data?.currency || data?.value) gaData.currency = 'BRL';
    if (data?.value) gaData.value = data.value;
    if (data?.transactionId) gaData.transaction_id = data.transactionId;
    if (data?.items) {
        gaData.items = data.items.map(i => ({
            item_id: i.id,
            item_name: i.name,
            price: i.price,
            quantity: i.quantity,
        }));
    }

    window.gtag('event', eventMap[eventType], gaData);
}

function fireGoogleAdsEvent(
    pixel: PixelConfig,
    eventType: TrackingEventType,
    data?: TrackingEventData
) {
    if (!window.gtag) return;

    // Check if this event type is configured for this pixel
    const actions = pixel.config?.defaultEvents || [];
    const actionConfig = actions.find(a => a.action === getActionKey(eventType));

    if (!actionConfig?.conversionId) return;

    window.gtag('event', 'conversion', {
        send_to: `AW-${pixel.pixelId}/${actionConfig.conversionId}`,
        value: data?.value || 0,
        currency: 'BRL',
        transaction_id: data?.transactionId,
    });
}

function fireXEvent(
    pixel: PixelConfig,
    eventType: TrackingEventType,
    data?: TrackingEventData
) {
    if (!window.twq) return;

    const positions = pixel.config?.positions || [];
    const posConfig = positions.find(p => p.action === getActionKey(eventType));

    if (!posConfig?.conversionId) return;

    window.twq('event', posConfig.conversionId, {
        value: data?.value?.toString() || '0',
        currency: 'BRL',
        conversion_id: data?.transactionId,
    });
}

function fireImagePixel(
    pixel: PixelConfig,
    eventType: TrackingEventType,
    data?: TrackingEventData
) {
    const events = pixel.config?.events || [];
    const eventConfig = events.find(e => e.action === getActionKey(eventType));

    if (!eventConfig?.url) return;

    // Build URL with query params
    const url = new URL(eventConfig.url);
    if (data?.eventId) url.searchParams.set('event_id', data.eventId);
    if (data?.value) url.searchParams.set('value', data.value.toString());
    if (data?.orderId) url.searchParams.set('order_id', data.orderId);
    if (data?.transactionId) url.searchParams.set('txn_id', data.transactionId);

    // Fire pixel via image
    const img = new Image(1, 1);
    img.src = url.toString();
}

// Helper to map our event types to the action keys used in config
function getActionKey(eventType: TrackingEventType): string {
    const map: Record<TrackingEventType, string> = {
        'page_view': 'event_page',
        'add_to_cart': 'ticket',
        'begin_checkout': 'checkout',
        'purchase': 'purchase',
    };
    return map[eventType];
}

// Type for dataLayer
declare global {
    interface Window {
        dataLayer: any[];
    }
}

export default useTrackingPixels;
