import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi, resolveImageUrl } from '../lib/apiBase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MapPin, ExternalLink, Share2, Tag, Plus, Minus, Ticket, Map, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CheckoutHeader from '@/components/CheckoutHeader';
import LoadingOverlay from '@/components/LoadingOverlay';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { useTrackingPixels } from '@/hooks/useTrackingPixels';

interface TicketType {
  id: string;
  name: string;
  price: number;
  description?: string;
  available: number;
  isHalf?: boolean;
  categoryId?: string | null;
  absorbFee?: boolean;
  isOnSale?: boolean;
}

interface Event {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  map?: string;
  startDate: string;
  location?: string;
  locationAddress?: string;
  locationDetails?: {
    address?: string;
  };
  organization?: {
    platformFeePercent?: number;
  };
  isExternal?: boolean;
  externalUrl?: string;
}

const SelectTickets: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [activeTab, setActiveTab] = useState<'tickets' | 'map'>('tickets');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [eligibleTicketIds, setEligibleTicketIds] = useState<string[] | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);

  // Tracking pixels integration
  const { trackAddToCart, trackBeginCheckout } = useTrackingPixels(eventId);

  // Load event and tickets
  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        // Load event
        const eventRes = await fetchApi(`/api/event/${eventId}`);
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData);

          // Redirecionamento de segurança para eventos externos
          if (eventData.isExternal && eventData.externalUrl) {
            window.location.href = eventData.externalUrl;
            return;
          }
        }

        // Load categories
        const categoriesRes = await fetchApi(`/api/ticket-category/event/${eventId}`);
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        // Load ticket types
        const ticketsRes = await fetchApi(`/api/ticket-type/event/${eventId}/with-stats`);
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();

          // Normalize tickets (include sold out ones)
          const normalizedTickets = ticketsData.map((t: any) => {
            const available = typeof t.available === 'number'
              ? t.available
              : Math.max((t.maxQuantity ?? 0) - (t.sold ?? 0), 0);
            return {
              id: t.id,
              name: t.name,
              price: Number(t.price) || 0,
              description: t.description || '',
              maxTickets: t.maxQuantity || 0,
              soldCount: t.sold || 0,
              categoryId: t.categoryId || null,
              isHalf: t.isHalf || false,
              absorbFee: t.absorbFee || false,
              available: available,
              isOnSale: t.isOnSale !== false // default true se não vier
            };
          });

          setTicketTypes(normalizedTickets);
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os ingressos',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, toast]);

  const handleQuantityChange = (ticketId: string, delta: number) => {
    setSelectedTickets(prev => {
      const current = prev[ticketId] || 0;
      const newValue = Math.max(0, current + delta);
      const ticket = ticketTypes.find(t => t.id === ticketId);

      if (ticket && newValue > ticket.available) {
        toast({
          title: 'Quantidade indisponível',
          description: `Apenas ${ticket.available} ingresso(s) disponível(is)`,
          variant: 'destructive'
        });
        return prev;
      }

      if (newValue === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [ticketId]: newValue };
    });

    // Track add_to_cart event when quantity increases
    if (delta > 0) {
      const ticket = ticketTypes.find(t => t.id === ticketId);
      if (ticket) {
        trackAddToCart({
          eventId: eventId,
          eventName: event?.name,
          currency: 'BRL',
          value: ticket.price,
          items: [{
            id: ticket.id,
            name: ticket.name,
            price: (!ticket.absorbFee)
              ? ticket.price + (ticket.price * ((event?.organization?.platformFeePercent || 15) / 100))
              : ticket.price,
            quantity: 1
          }]
        });
      }
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setEligibleTicketIds(null);
    setCouponCode('');
    toast({
      title: 'Cupom removido',
      description: 'Os preços originais foram restaurados',
    });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const res = await fetchApi(`/api/coupon/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, eventId })
      });

      if (res.ok) {
        const coupon = await res.json();
        setAppliedCoupon(coupon);
        setEligibleTicketIds(coupon.eligibleTicketIds || null);

        const desc = coupon.type === 'PERCENT'
          ? `Desconto de ${coupon.value}% aplicado`
          : `Desconto de R$ ${coupon.value} aplicado`;

        toast({
          title: 'Cupom aplicado!',
          description: desc,
        });
      } else {
        toast({
          title: 'Cupom inválido',
          description: 'Este cupom não existe ou expirou',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível validar o cupom',
        variant: 'destructive'
      });
    }
  };

  const calculateTotal = () => {
    let subtotal = 0;
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      const ticket = ticketTypes.find(t => t.id === ticketId);
      if (ticket) {
        if (ticket) {
          let unitPrice = ticket.price;
          if (ticket.absorbFee === false) {
            const feePercent = event?.organization?.platformFeePercent || 15;
            unitPrice += ticket.price * (feePercent / 100);
          }
          subtotal += unitPrice * quantity;
        }
      }
    });

    if (appliedCoupon) {
      // Calculate eligible subtotal if coupon is restricted
      let eligibleSubtotal = subtotal;
      if (eligibleTicketIds && eligibleTicketIds.length > 0) {
        eligibleSubtotal = 0;
        Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
          if (eligibleTicketIds.includes(ticketId)) {
            const ticket = ticketTypes.find(t => t.id === ticketId);
            if (ticket) {
              if (ticket) {
                let unitPrice = ticket.price;
                if (ticket.absorbFee === false) {
                  const feePercent = event?.organization?.platformFeePercent || 15;
                  unitPrice += ticket.price * (feePercent / 100);
                }
                eligibleSubtotal += unitPrice * quantity;
              }
            }
          }
        });
      }

      if (appliedCoupon.type === 'PERCENT') {
        const discount = eligibleSubtotal * (appliedCoupon.value / 100);
        return subtotal - discount;
      } else if (appliedCoupon.type === 'FIXED') {
        return Math.max(0, subtotal - appliedCoupon.value);
      }
    }

    return subtotal;
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const handleContinue = async () => {
    const totalTickets = getTotalTickets();
    if (totalTickets === 0) {
      toast({
        title: 'Selecione ingressos',
        description: 'Você precisa selecionar pelo menos um ingresso',
        variant: 'destructive'
      });
      return;
    }

    try {
      const ticketsArray = Object.entries(selectedTickets).map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity
      }));

      const requestBody = {
        eventId,
        tickets: ticketsArray,
        couponCode: appliedCoupon?.code
      };

      // Create checkout session on backend
      const response = await fetchApi('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar sessão de checkout');
      }

      const responseData = await response.json();

      const { sessionId, items, eventId: backendEventId } = responseData;

      // Salva seleção completa para o review
      const selection = {
        eventId: backendEventId || eventId,
        eventSlug: event?.slug,
        eventName: event?.name,
        eventDate: event?.startDate,
        eventImage: event?.image,
        items: items || [],
        createdAt: Date.now()
      };
      sessionStorage.setItem('checkoutSessionId', sessionId);
      try {
        const { saveCheckoutSelection } = await import('@/lib/checkoutSelection');
        saveCheckoutSelection(selection);
      } catch (e) { }
      // Navega para o checkout
      navigate('/checkout');

      // Track begin_checkout
      trackBeginCheckout({
        eventId: eventId,
        eventName: event?.name,
        currency: 'BRL',
        value: calculateTotal(),
        items: Object.entries(selectedTickets).map(([ticketId, quantity]) => {
          const ticket = ticketTypes.find(t => t.id === ticketId);
          let unitPrice = ticket?.price || 0;
          if (ticket && ticket.absorbFee === false) {
            const feePercent = event?.organization?.platformFeePercent || 15;
            unitPrice += (ticket.price || 0) * (feePercent / 100);
          }
          return {
            id: ticketId,
            name: ticket?.name || '',
            price: unitPrice,
            quantity
          };
        })
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível reservar os ingressos',
        variant: 'destructive'
      });
    }
  };

  const shareEvent = () => {
    // Use slug at root, ID under /event/
    const path = event?.slug ? `/${event.slug}` : `/event/${event?.id}`;
    const url = window.location.origin + path;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado!',
      description: 'Link do evento copiado para a área de transferência',
    });
  };

  const viewEvent = () => {
    const path = event?.slug ? `/${event.slug}` : `/event/${event?.id}`;
    window.open(path, '_blank');
  };

  // Tickets sem categoria
  const uncategorizedTickets = ticketTypes.filter(t => !t.categoryId);

  // Tickets por categoria (ordenados por sortOrder do ticket)
  const ticketsByCategory = categories.map(cat => ({
    category: cat,
    tickets: ticketTypes
      .filter(t => t.categoryId === cat.id)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
  })).filter(group => group.tickets.length > 0);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingOverlay title="Carregando ingressos" subtitle="Aguarde enquanto buscamos as melhores opções" animName="wired-outline-478-computer-display-hover-angle.json" />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0b0b0b] flex items-center justify-center">
        <div className="text-lg text-red-600">Evento não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0b0b]">
      {/* Header */}
      <CheckoutHeader />

      {/* Mobile Top Bar - Only visible on mobile */}
      <div className="md:hidden w-full bg-white dark:bg-[#242424] border-b border-gray-200 dark:border-[#1F1F1F] sticky top-[60px] z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {event.image && (
              <img
                src={resolveImageUrl(event.image) || event.image}
                alt={event.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[#091747] dark:text-white truncate">{event.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.locationAddress || event.locationDetails?.address || ((event.location && event.location !== 'Local') ? event.location : 'Local a definir')}</span>
              </div>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-full px-2 py-1 h-6 flex-shrink-0">
                <Tag className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase truncate max-w-[80px]">
                  {appliedCoupon.code}
                </span>
                <button onClick={removeCoupon} className="ml-0.5 text-green-600/70 hover:text-green-800 dark:text-green-400/70 dark:hover:text-green-200">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowCouponInput(true)}
                className="gap-1 bg-[#EF4118] hover:bg-[#d63814] text-white h-6 px-2 text-[10px] font-medium flex-shrink-0 rounded-full"
              >
                <Tag className="w-2.5 h-2.5" />
                Liberar descontos
              </Button>
            )}
          </div>
        </div>

        {/* Tabs - Mobile only - Only show if map exists */}
        {event.map && (
          <div className="flex border-t border-gray-200 dark:border-[#1F1F1F]">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'tickets'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              <Ticket className="w-4 h-4" />
              Ingressos
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'map'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              <Map className="w-4 h-4" />
              Mapa
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="w-full max-w-5xl mt-10 max-md:mt-4 px-8 max-md:px-4 mx-auto">
        <h1 className={`text-3xl max-md:text-2xl font-bold text-[#091747] dark:text-white mb-6 max-md:mb-4 max-md:hidden ${!event.map ? 'max-w-2xl mx-auto' : ''}`}>Selecione seu ingresso</h1>

        {/* Event info bar - Desktop only */}
        <div className={`bg-white dark:bg-[#242424] rounded-xl border border-gray-200 dark:border-[#1F1F1F] p-4 max-md:p-3 mb-6 max-md:mb-4 flex items-center gap-4 max-md:gap-3 max-md:hidden ${!event.map ? 'max-w-2xl mx-auto' : ''}`}>
          {event.image && (
            <img
              src={resolveImageUrl(event.image) || event.image}
              alt={event.name}
              className="w-24 h-24 max-md:w-16 max-md:h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl max-md:text-base font-bold text-[#091747] dark:text-white truncate">{event.name}</h2>
            <div className="flex items-center gap-2 text-sm max-md:text-xs text-slate-600 dark:text-slate-300 mt-1">
              <MapPin className="w-4 h-4 max-md:w-3 max-md:h-3 flex-shrink-0" />
              <span className="truncate">{event.locationAddress || event.locationDetails?.address || ((event.location && event.location !== 'Local') ? event.location : 'Local a definir')}</span>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-full px-3 py-1 mt-2 md:hidden w-full">
                <Tag className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">
                  {appliedCoupon.code} aplicado
                </span>
                <button onClick={removeCoupon} className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCouponInput(true)}
                className="gap-2 border-[#EF4118] text-[#EF4118] hover:bg-[#EF4118] hover:text-white mt-2 max-md:h-8 max-md:text-xs max-md:px-2 md:hidden w-full"
              >
                <Tag className="w-4 h-4 max-md:w-3 max-md:h-3" />
                Liberar descontos
              </Button>
            )}
          </div>
          <div className="flex gap-2 max-md:hidden">
            {appliedCoupon ? (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1.5">
                <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-green-600/80 dark:text-green-400/80 leading-none">CUPOM APLICADO</span>
                  <span className="text-sm font-bold text-green-700 dark:text-green-300 uppercase leading-tight">{appliedCoupon.code}</span>
                </div>
                <div className="h-6 w-px bg-green-200 dark:bg-green-800 mx-1"></div>
                <button
                  onClick={removeCoupon}
                  className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full text-green-600 dark:text-green-400 transition-colors"
                  title="Remover cupom"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCouponInput(true)}
                className="gap-2 border-[#EF4118] text-[#EF4118] hover:bg-[#EF4118] hover:text-white"
              >
                <Tag className="w-4 h-4" />
                Liberar descontos
              </Button>
            )}
          </div>
        </div>

        {/* Coupon modal (opened from header button) */}
        <AnimatePresence>
          {showCouponInput && (
            <motion.div
              key="coupon-modal"
              className="fixed inset-0 z-[1200] flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                className="fixed inset-0 bg-black/40"
                onClick={() => setShowCouponInput(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />

              <motion.div
                className="relative z-10 w-full max-w-md bg-white dark:bg-[#242424] rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-[#1F1F1F]"
                initial={{ y: 12, scale: 0.985, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 8, scale: 0.985, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Liberar descontos</h3>
                  <button onClick={() => setShowCouponInput(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">✕</button>
                </div>

                <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="mb-4">
                    <div className="font-semibold mb-1 text-slate-900 dark:text-white">Cupom</div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 mb-2">Cupons oferecem descontos diretamente em seu ingresso.</div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Insira seu cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="dark:bg-[#1a1a1a] dark:text-white dark:border-[#2b2b2b] dark:placeholder:text-slate-500"
                      />
                      <Button onClick={async () => { await applyCoupon(); setShowCouponInput(false); }} className="dark:bg-indigo-600 dark:hover:bg-indigo-700">Aplicar</Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two column layout - conditional based on map presence */}
        <div className={`gap-6 max-md:gap-4 pb-8 ${event.map
          ? 'grid grid-cols-1 lg:grid-cols-3'  // With map: 2 columns on desktop (lg:col-span-2 + 1)
          : 'max-w-2xl mx-auto'                 // Without map: same width as checkout/review
          }`}>
          {/* Tickets list */}
          <div className={`space-y-4 max-md:space-y-3 ${event.map ? 'lg:col-span-2' : ''} ${event.map && activeTab === 'map' ? 'max-md:hidden' : ''}`}>
            {ticketTypes.length === 0 ? (
              <div className="bg-white dark:bg-[#242424] rounded-xl border border-gray-200 dark:border-[#1F1F1F] p-8 max-md:p-6 text-center">
                <p className="text-lg max-md:text-base font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Nenhum ingresso disponível
                </p>
                <p className="text-sm max-md:text-xs text-slate-500">
                  Este evento ainda não possui ingressos cadastrados ou todos já foram vendidos.
                </p>
              </div>
            ) : (
              <>
                {/* Categorias com Accordion */}
                {categories.length > 0 && (
                  <Accordion type="single" collapsible defaultValue={categories[0]?.id} className="space-y-2">
                    {ticketsByCategory.map(({ category, tickets }) => {
                      // Calcular total de ingressos selecionados nesta categoria
                      const totalSelected = tickets.reduce((sum, ticket) => {
                        return sum + (selectedTickets[ticket.id] || 0);
                      }, 0);

                      return (
                        <AccordionItem
                          key={category.id}
                          value={category.id}
                          className="bg-white dark:bg-[#242424] rounded-xl border border-gray-200 dark:border-[#1F1F1F] overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 max-md:px-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-[#1F1F1F]">
                            <div className="flex items-center justify-between w-full pr-4 max-md:pr-2">
                              <span className="font-semibold text-[#091747] dark:text-white max-md:text-sm">{category.name}</span>
                              {totalSelected > 0 && (
                                <span className="text-sm max-md:text-xs text-slate-500 dark:text-slate-400">
                                  {totalSelected} {totalSelected === 1 ? 'ingresso' : 'ingressos'}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 max-md:px-2 space-y-2 max-md:space-y-1.5">
                            {tickets.map(ticket => {
                              const quantity = selectedTickets[ticket.id] || 0;

                              // Calculate Base + Fee if applicable
                              const feePercent = event?.organization?.platformFeePercent || 15;
                              let startPrice = ticket.price;
                              if (ticket.absorbFee === false) { // se NÃO absorve, repassa
                                const fee = ticket.price * (feePercent / 100);
                                startPrice += fee;
                              }

                              let displayPrice = startPrice;

                              // Apply discount only if coupon is applied AND ticket is eligible
                              if (appliedCoupon && eligibleTicketIds && eligibleTicketIds.includes(ticket.id)) {
                                if (appliedCoupon.type === 'FIXED') {
                                  displayPrice = Math.max(0, displayPrice - (appliedCoupon.amountOff || 0));
                                } else {
                                  displayPrice = displayPrice * (1 - (appliedCoupon.discountPercent || 0) / 100);
                                }
                              }

                              return (
                                <div
                                  key={ticket.id}
                                  className={`bg-gradient-to-br from-white to-gray-50/50 dark:from-[#242424] dark:to-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#1F1F1F] p-4 max-md:p-3.5 transition-all hover:shadow-md ${!ticket.isOnSale ? 'opacity-60' : ''
                                    } ${quantity > 0 ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20' : ''}`}
                                >
                                  <div className="flex items-start justify-between max-md:flex-col max-md:gap-3">
                                    <div className="flex-1 max-md:w-full">
                                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                        <span className="font-bold text-[#091747] dark:text-white max-md:text-[15px] leading-tight">{ticket.name}</span>
                                        {ticket.isHalf && (
                                          <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-sm">
                                            MEIA
                                          </span>
                                        )}
                                        {!ticket.isOnSale && (
                                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full">
                                            ENCERRADO
                                          </span>
                                        )}
                                        {ticket.isOnSale && ticket.available === 0 && (
                                          <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-sm">
                                            ESGOTADO
                                          </span>
                                        )}
                                        {appliedCoupon && eligibleTicketIds && (
                                          eligibleTicketIds.includes(ticket.id) ? (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-sm flex items-center gap-1">
                                              <Tag className="w-2.5 h-2.5" /> CUPOM APLICADO
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-300 rounded-full">
                                              NÃO ELEGÍVEL
                                            </span>
                                          )
                                        )}
                                      </div>
                                      {ticket.description && (
                                        <div className="text-xs max-md:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                          {ticket.description}
                                        </div>
                                      )}
                                      {ticket.available > 0 && (
                                        <div className="flex items-baseline gap-2 mt-3">
                                          <span className="text-2xl max-md:text-xl font-black text-indigo-600 dark:text-indigo-400">
                                            {formatBRL(displayPrice)}
                                          </span>
                                          {appliedCoupon && eligibleTicketIds && eligibleTicketIds.includes(ticket.id) && (
                                            <span className="text-sm max-md:text-xs text-slate-400 line-through font-medium">
                                              {formatBRL(ticket.price)}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Quantity controls */}
                                    {ticket.isOnSale && ticket.available > 0 && (
                                      <div className="flex items-center gap-2.5 max-md:w-full max-md:justify-between max-md:bg-white/50 dark:max-md:bg-[#1a1a1a]/50 max-md:rounded-xl max-md:p-2.5 max-md:border max-md:border-gray-200 dark:max-md:border-[#1F1F1F]">
                                        {quantity > 0 ? (
                                          <>
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              onClick={() => handleQuantityChange(ticket.id, -1)}
                                              className="h-10 w-10 max-md:h-11 max-md:w-11 rounded-xl border-2 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950 dark:hover:border-red-700 transition-all"
                                            >
                                              <Minus className="w-4 h-4" />
                                            </Button>
                                            <div className="flex flex-col items-center max-md:flex-1">
                                              <span className="font-black text-2xl max-md:text-3xl text-indigo-600 dark:text-indigo-400 leading-none">
                                                <AnimatedCounter value={quantity} />
                                              </span>
                                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5 max-md:hidden">selecionado{quantity > 1 ? 's' : ''}</span>
                                            </div>
                                            <Button
                                              size="icon"
                                              onClick={() => handleQuantityChange(ticket.id, 1)}
                                              disabled={quantity >= ticket.available}
                                              className="h-10 w-10 max-md:h-11 max-md:w-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
                                            >
                                              <Plus className="w-5 h-5" />
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            size="icon"
                                            onClick={() => handleQuantityChange(ticket.id, 1)}
                                            className="h-10 w-10 max-md:h-11 max-md:w-full max-md:rounded-xl rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/30 transition-all"
                                          >
                                            <Plus className="w-5 h-5" />
                                            <span className="md:hidden ml-2 font-bold">Adicionar</span>
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}

                {/* Tickets sem categoria */}
                {uncategorizedTickets.length > 0 && (
                  <div className="space-y-2 max-md:space-y-1.5">
                    {categories.length > 0 && (
                      <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2">
                        Ingressos
                      </h3>
                    )}
                    {uncategorizedTickets.map(ticket => {
                      const quantity = selectedTickets[ticket.id] || 0;

                      // Calculate Base + Fee if applicable
                      const feePercent = event?.organization?.platformFeePercent || 15;
                      let startPrice = ticket.price;
                      if (ticket.absorbFee === false) {
                        const fee = ticket.price * (feePercent / 100);
                        startPrice += fee;
                      }

                      let displayPrice = startPrice;

                      // Apply discount only if coupon is applied AND ticket is eligible
                      if (appliedCoupon && eligibleTicketIds && eligibleTicketIds.includes(ticket.id)) {
                        if (appliedCoupon.type === 'FIXED') {
                          displayPrice = Math.max(0, displayPrice - (appliedCoupon.amountOff || 0));
                        } else {
                          displayPrice = displayPrice * (1 - (appliedCoupon.discountPercent || 0) / 100);
                        }
                      }

                      return (
                        <div
                          key={ticket.id}
                          className={`bg-gradient-to-br from-white to-gray-50/50 dark:from-[#242424] dark:to-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#1F1F1F] p-4 max-md:p-3.5 transition-all hover:shadow-md ${!ticket.isOnSale ? 'opacity-60' : ''
                            } ${quantity > 0 ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20' : ''}`}
                        >
                          <div className="flex items-start justify-between max-md:flex-col max-md:gap-3">
                            <div className="flex-1 max-md:w-full">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="font-bold text-[#091747] dark:text-white max-md:text-[15px] leading-tight">{ticket.name}</span>
                                {ticket.isHalf && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-sm">
                                    MEIA
                                  </span>
                                )}
                                {!ticket.isOnSale && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full">
                                    ENCERRADO
                                  </span>
                                )}
                                {ticket.isOnSale && ticket.available === 0 && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-sm">
                                    ESGOTADO
                                  </span>
                                )}
                                {appliedCoupon && eligibleTicketIds && (
                                  eligibleTicketIds.includes(ticket.id) ? (
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-sm flex items-center gap-1">
                                      <Tag className="w-2.5 h-2.5" /> CUPOM APLICADO
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-300 rounded-full">
                                      NÃO ELEGÍVEL
                                    </span>
                                  )
                                )}
                              </div>
                              {ticket.description && (
                                <div className="text-xs max-md:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                  {ticket.description}
                                </div>
                              )}
                              {ticket.available > 0 && (
                                <div className="flex items-baseline gap-2 mt-3">
                                  <span className="text-2xl max-md:text-xl font-black text-indigo-600 dark:text-indigo-400">
                                    {formatBRL(displayPrice)}
                                  </span>
                                  {appliedCoupon && eligibleTicketIds && eligibleTicketIds.includes(ticket.id) && (
                                    <span className="text-sm max-md:text-xs text-slate-400 line-through font-medium">
                                      {formatBRL(ticket.price)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Quantity controls */}
                            {ticket.isOnSale && ticket.available > 0 && (
                              <div className="flex items-center gap-2.5 max-md:w-full max-md:justify-between max-md:bg-white/50 dark:max-md:bg-[#1a1a1a]/50 max-md:rounded-xl max-md:p-2.5 max-md:border max-md:border-gray-200 dark:max-md:border-[#1F1F1F]">
                                {quantity > 0 ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleQuantityChange(ticket.id, -1)}
                                      className="h-10 w-10 max-md:h-11 max-md:w-11 rounded-xl border-2 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950 dark:hover:border-red-700 transition-all"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <div className="flex flex-col items-center max-md:flex-1">
                                      <span className="font-black text-2xl max-md:text-3xl text-indigo-600 dark:text-indigo-400 leading-none">
                                        <AnimatedCounter value={quantity} />
                                      </span>
                                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-0.5 max-md:hidden">selecionado{quantity > 1 ? 's' : ''}</span>
                                    </div>
                                    <Button
                                      size="icon"
                                      onClick={() => handleQuantityChange(ticket.id, 1)}
                                      disabled={quantity >= ticket.available}
                                      className="h-10 w-10 max-md:h-11 max-md:w-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
                                    >
                                      <Plus className="w-5 h-5" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="icon"
                                    onClick={() => handleQuantityChange(ticket.id, 1)}
                                    className="h-10 w-10 max-md:h-11 max-md:w-full max-md:rounded-xl rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/30 transition-all"
                                  >
                                    <Plus className="w-5 h-5" />
                                    <span className="md:hidden ml-2 font-bold">Adicionar</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Spacer for bottom bar */}
            <div className="h-[100px] max-md:h-[120px]" />
          </div>

          {/* Map - only show if map exists */}
          {event.map && (
            <div className={`bg-white dark:bg-[#242424] rounded-xl border border-gray-200 dark:border-[#1F1F1F] overflow-hidden h-fit lg:block ${activeTab === 'tickets' ? 'max-md:hidden' : ''}`}>
              <div className="aspect-square bg-gray-100 dark:bg-[#1F1F1F] flex items-center justify-center overflow-hidden">
                <img
                  src={resolveImageUrl(event.map) || event.map}
                  alt={`${event.name} - mapa`}
                  className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowMapModal(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Viewer Modal */}
      <AnimatePresence>
        {showMapModal && event.map && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/70 z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMapModal(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mapa do Evento</h3>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Image container with zoom */}
                <div
                  className="relative max-h-[calc(90vh-120px)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
                  onWheel={(e) => {
                    e.preventDefault();
                    const img = document.getElementById('map-image') as HTMLImageElement;
                    if (img) {
                      const currentScale = parseFloat(img.style.transform.replace('scale(', '').replace(')', '') || '1');
                      const delta = e.deltaY > 0 ? -0.1 : 0.1;
                      const newScale = Math.max(0.5, Math.min(3, currentScale + delta));
                      img.style.transform = `scale(${newScale})`;
                    }
                  }}
                  onMouseDown={(e) => {
                    const container = e.currentTarget;
                    const img = container.querySelector('img') as HTMLImageElement;
                    if (!img) return;

                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startLeft = parseFloat(img.style.left || '0');
                    const startTop = parseFloat(img.style.top || '0');

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      const deltaY = moveEvent.clientY - startY;
                      img.style.left = `${startLeft + deltaX}px`;
                      img.style.top = `${startTop + deltaY}px`;
                      img.style.position = 'relative';
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <img
                    id="map-image"
                    src={resolveImageUrl(event.map) || event.map}
                    alt={`${event.name} - mapa`}
                    className="max-w-full h-auto transition-transform duration-200 select-none"
                    style={{ transformOrigin: 'center', left: '0px', top: '0px' }}
                    draggable={false}
                  />
                </div>

                {/* Zoom controls */}
                <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      const img = document.getElementById('map-image') as HTMLImageElement;
                      if (img) {
                        const currentScale = parseFloat(img.style.transform.replace('scale(', '').replace(')', '') || '1');
                        const newScale = Math.max(0.5, currentScale - 0.25);
                        img.style.transform = `scale(${newScale})`;
                      }
                    }}
                    className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      const img = document.getElementById('map-image') as HTMLImageElement;
                      if (img) {
                        img.style.transform = 'scale(1)';
                        img.style.left = '0px';
                        img.style.top = '0px';
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Resetar
                  </button>

                  <button
                    onClick={() => {
                      const img = document.getElementById('map-image') as HTMLImageElement;
                      if (img) {
                        const currentScale = parseFloat(img.style.transform.replace('scale(', '').replace(')', '') || '1');
                        const newScale = Math.min(3, currentScale + 0.25);
                        img.style.transform = `scale(${newScale})`;
                      }
                    }}
                    className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom bar - animated */}
      <AnimatePresence>
        {getTotalTickets() > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.2 }
            }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#242424] border-t border-gray-200 dark:border-[#1F1F1F] py-4 max-md:py-3 px-6 max-md:px-4 shadow-2xl z-50"
          >
            <div className="w-full max-w-5xl mx-auto flex items-center justify-between max-md:flex-col max-md:gap-3">
              <div className="max-md:w-full max-md:flex max-md:justify-between max-md:items-center">
                <motion.div
                  className="text-sm max-md:text-xs text-slate-600 dark:text-slate-300"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <AnimatedCounter value={getTotalTickets()} /> ingresso{getTotalTickets() !== 1 ? 's' : ''}
                </motion.div>
                <div>
                  <motion.div
                    className="text-2xl max-md:text-xl font-bold text-[#EF4118] dark:text-[#EF4118]"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {formatBRL(calculateTotal())}
                  </motion.div>
                  <motion.div
                    className="text-xs max-md:text-[10px] text-slate-500 dark:text-slate-400 max-md:text-right"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Taxa já inclusa no total acima */}
                  </motion.div>
                </div>
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                className="max-md:w-full"
              >
                <Button
                  onClick={handleContinue}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 max-md:h-11 px-8 max-md:px-6 text-lg max-md:text-base max-md:w-full"
                >
                  Quero pagar
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectTickets;
