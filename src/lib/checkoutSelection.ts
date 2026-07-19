// Util para persistir seleção de ingressos entre modal e página de checkout
// Estrutura salva em sessionStorage para expirar naturalmente ao fechar a aba.

export interface CheckoutItem {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CheckoutSelection {
  eventId: string;
  eventSlug?: string;
  eventName?: string;
  eventDate?: string;
  eventImage?: string;
  items: CheckoutItem[];
  createdAt: number; // epoch ms
}

const KEY = 'checkoutSelection:v1';

export function saveCheckoutSelection(sel: CheckoutSelection) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(sel));
  } catch (e) {
    // no-op
  }
}

export function loadCheckoutSelection(): CheckoutSelection | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutSelection;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch (e) {
    // no-op
    return null;
  }
}

export function clearCheckoutSelection() {
  try { sessionStorage.removeItem(KEY); } catch {}
}
