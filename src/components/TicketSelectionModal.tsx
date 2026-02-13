import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { saveCheckoutSelection } from '@/lib/checkoutSelection';
import { useNavigate, useLocation } from 'react-router-dom';

interface TicketType {
  id: string;
  name: string;
  price: number;
  available: number;
  isHalf?: boolean;
}

interface SelectedTicket extends TicketType {
  quantity: number;
}

interface TicketSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  eventDate: string;
  eventImage?: string;
  ticketTypes: TicketType[];
  onPurchase: (selectedTickets: SelectedTicket[]) => void;
}

const TicketSelectionModal: React.FC<TicketSelectionModalProps & { debug?: boolean }> = ({
  isOpen,
  onClose,
  eventName,
  eventDate,
  eventImage,
  ticketTypes,
  onPurchase,
  debug,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    if (isOpen) {
      console.log('TicketSelectionModal montado (isOpen=true)');
    }
  }, [isOpen]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  // Track which ticket is expanded for details
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const updateQuantity = (ticketId: string, newQuantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, newQuantity),
    }));
  };

  const getSelectedTicketsList = (): SelectedTicket[] => {
    return ticketTypes
      .filter(ticket => selectedTickets[ticket.id] > 0)
      .map(ticket => ({
        ...ticket,
        quantity: selectedTickets[ticket.id],
      }));
  };

  const getTotalPrice = (): number => {
    return getSelectedTicketsList().reduce(
      (total, ticket) => total + ticket.price * ticket.quantity,
      0
    );
  };

  const handlePurchase = () => {
    const selected = getSelectedTicketsList();
    if (!selected.length) return;
    // Persist selection
    // Attempt to derive eventId/slug from current URL (heuristic)
    let eventId: string | undefined;
    let eventSlug: string | undefined;
    const path = location.pathname;
    // Example patterns: /event/<id> or /event/slug/<slug>
    const parts = path.split('/').filter(Boolean);
    const idxEvent = parts.indexOf('event');
    if (idxEvent !== -1) {
      const maybe = parts[idxEvent + 1];
      if (maybe === 'slug') {
        eventSlug = parts[idxEvent + 2];
      } else if (maybe) {
        eventId = maybe;
      }
    }
    saveCheckoutSelection({
      eventId: eventId || 'unknown',
      eventSlug,
      eventName,
      eventDate,
      items: selected.map(s => ({ ticketTypeId: s.id, name: s.name, price: s.price, quantity: s.quantity })),
      createdAt: Date.now(),
    });
    // Callback (for analytics/hooks) then navigate
    onPurchase(selected);
    navigate('/checkout');
  };

  const formatPrice = (price: number): string => {
    return `R$${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="overflow-hidden bg-white rounded-3xl max-w-[800px] w-full max-h-[90vh] shadow-2xl p-0">
        <div className="flex max-md:flex-col">
          {/* Left Section - Ticket Selection */}
          <div className="flex flex-col min-w-60 w-[500px] max-md:w-full">
            {/* Header */}
            <div className="flex flex-col justify-center items-start p-5 w-full bg-white border-b border-gray-200 min-h-20">
              <div className="max-w-full">
                <div className="text-lg font-semibold text-indigo-950">
                  {eventName}
                </div>
                <div className="text-xs text-indigo-950">
                  {eventDate}
                </div>
              </div>
            </div>

            {/* Ticket Types com scroll full height/width */}
            <div className="self-center mt-5 flex-1 flex flex-col max-w-full w-full max-md:w-full max-md:px-4">
              <div
                className="space-y-2.5 flex-1 overflow-y-auto w-full h-full px-2 py-2 rounded-xl bg-white"
              >
                {ticketTypes.map((ticket) => {
                  const expanded = expandedTicketId === ticket.id;
                  return (
                    <div key={ticket.id} className="w-full">
                      <div
                        className={
                          cn(
                            "flex flex-col px-5 py-4 w-full bg-gray-50 rounded-xl border border-solid border-indigo-950 border-opacity-10 min-h-[100px] mb-2.5"
                          )
                        }
                      >
                        <div className="flex gap-10 justify-between items-center w-full">
                          <div className="self-stretch my-auto text-lg font-semibold text-indigo-950 w-[160px] min-w-[120px] max-w-[200px] break-words">
                            <div className="flex items-center gap-2 whitespace-normal leading-snug">
                              <div>{ticket.name}</div>
                              {ticket.isHalf && (
                                <span className="inline-block text-xs bg-indigo-100 text-indigo-800 font-semibold rounded-md px-2 py-0.5">
                                  Meia-entrada
                                </span>
                              )}
                            </div>
                            <div className="mt-5">{formatPrice(ticket.price)}</div>
                          </div>
                          <div className="self-stretch my-auto w-[103px] flex flex-col items-end">
                            <div className="flex gap-4 items-center w-full justify-end">
                              {/* Minus Button */}
                              <button
                                onClick={() => updateQuantity(ticket.id, (selectedTickets[ticket.id] || 0) - 1)}
                                disabled={(selectedTickets[ticket.id] || 0) === 0}
                                className={cn(
                                  "flex flex-col justify-center items-center px-2.5 bg-[#2A2AD7] rounded-md h-[30px] min-h-[30px] w-[30px] transition-opacity",
                                  (selectedTickets[ticket.id] || 0) === 0 && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <Minus className="w-3 h-3 text-white" />
                              </button>
                              {/* Quantity Display */}
                              <div className="self-stretch my-auto text-lg font-semibold text-indigo-950">
                                {selectedTickets[ticket.id] || 0}
                              </div>
                              {/* Plus Button */}
                              <button
                                onClick={() => updateQuantity(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                                disabled={(selectedTickets[ticket.id] || 0) >= ticket.available}
                                className={cn(
                                  "flex flex-col justify-center items-center px-2.5 bg-[#2A2AD7] rounded-md h-[30px] min-h-[30px] w-[30px] transition-opacity",
                                  (selectedTickets[ticket.id] || 0) >= ticket.available && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <Plus className="w-3 h-3 text-white" />
                              </button>
                            </div>
                            <div
                              className="mt-5 text-sm font-semibold text-right text-[#2A2AD7] cursor-pointer select-none"
                              onClick={() => setExpandedTicketId(expanded ? null : ticket.id)}
                            >
                              {expanded ? '- Detalhes' : '+ Detalhes'}
                            </div>
                          </div>
                        </div>
                        {/* Details section, always below the row */}
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-200 w-full",
                            expanded ? "max-h-40 py-3 opacity-100" : "max-h-0 py-0 opacity-0"
                          )}
                        >
                          {expanded && (
                            <div className="text-indigo-950 text-sm px-1">
                              <div className="font-semibold mb-1">Sobre este ingresso</div>
                              <div className="mb-1">• Disponíveis: <span className="font-bold">{ticket.available}</span></div>
                              <div className="mb-1">• Valor unitário: <span className="font-bold">{formatPrice(ticket.price)}</span></div>
                              {/* Adicione mais detalhes aqui conforme necessário */}
                              <div className="text-gray-500 mt-2">Descrição do ingresso ou informações adicionais podem ser exibidas aqui.</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="min-w-60 w-[300px] max-md:w-full h-full flex flex-col">
            <div className="pb-5 w-full bg-[#F2F3F6] flex flex-col h-full">
              {/* Image and Close Button */}
              <div className="flex relative flex-col gap-2.5 items-start px-5 pt-4 pb-28 text-xs text-black whitespace-nowrap aspect-[2] min-h-[150px] max-md:pb-24">
                {eventImage && (
                  <img
                    src={eventImage}
                    className="object-cover absolute inset-0 size-full"
                    alt={eventName}
                  />
                )}
                {/* X customizado removido, usaremos o X padrão do DialogContent com glass effect via CSS */}
              </div>

              {/* Order Summary + Scrollable Content */}
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="mx-5 mt-5 text-base font-semibold text-indigo-950 max-md:mx-2.5 flex-1 min-h-0">
                  <div>Resumo do pedido</div>
                  <div className="mt-5 w-full">
                    {getSelectedTicketsList().length === 0 ? (
                      <div className="text-gray-500 text-sm">Nenhum ingresso selecionado</div>
                    ) : (
                      getSelectedTicketsList().map((ticket) => (
                        <div key={ticket.id} className="flex gap-10 justify-between items-center w-full mb-2.5">
                          <div className="self-stretch my-auto">
                            {ticket.quantity} × {ticket.name}
                          </div>
                          <div className="self-stretch my-auto text-right">
                            {formatPrice(ticket.price * ticket.quantity)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Total */}
                  <div className="flex gap-10 justify-between items-center mt-5 w-full whitespace-nowrap border-t border-indigo-950 border-opacity-10 pt-3">
                    <div className="self-stretch my-auto">Total:</div>
                    <div className="self-stretch my-auto text-right">
                      {formatPrice(getTotalPrice())}
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Button always at the bottom */}
              <div className="shrink-0 mt-16 h-px border border-solid border-[#DBDDE5] border-[1px] max-md:mt-10" />
              <div className="px-6 mt-5 max-md:px-2.5">
                <Button
                  onClick={handlePurchase}
                  disabled={getSelectedTicketsList().length === 0}
                  className="w-full bg-indigo-700 hover:bg-[#2A2AD7] text-white font-bold text-base py-3.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Finalizar compra
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
                  <style>{`
                    .fixed .absolute.right-4.top-4 {
                      background: rgba(255,255,255,0.4);
                      backdrop-filter: blur(8px);
                      border-radius: 9999px;
                      border: 1.5px solid rgba(255,255,255,0.6);
                      box-shadow: 0 2px 8px 0 rgba(0,0,0,0.10);
                      width: 32px;
                      height: 32px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      transition: background 0.2s;
                    }
                    .fixed .absolute.right-4.top-4:hover {
                      background: rgba(255,255,255,0.6);
                    }
                    .fixed .absolute.right-4.top-4 svg {
                      color: #312e81;
                      width: 20px;
                      height: 20px;
                    }
                  `}</style>

export default TicketSelectionModal;
