import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, Hourglass, LockKeyhole, Minus, Plus, UserRoundCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useToast } from '@/hooks/use-toast';

export type RegistrationAction = 'checkout' | 'rsvp' | 'register' | 'request' | 'waitlist' | 'closed';

export interface RegistrationActionContext {
  action: RegistrationAction;
  event: any;
  ticketTypes: any[];
  quantities: Record<string, number>;
  couponCode?: string;
}

interface EventRegistrationCardProps {
  event: any;
  ticketTypes?: any[];
  quantities?: Record<string, number>;
  onQuantitiesChange?: (quantities: Record<string, number>) => void;
  onPrimaryAction?: (context: RegistrationActionContext) => void;
  compact?: boolean;
  variant?: 'default' | 'event-page';
  className?: string;
  headerOverride?: string;
  disableRemoteFetch?: boolean;
}

const parseForm = (value: any): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
};

const asNumber = (...values: any[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const formatMoney = (amount: number) => {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`;
  }
};

const availableFor = (ticket: any) => {
  if (Number.isFinite(Number(ticket.available))) return Math.max(0, Number(ticket.available));
  const capacity = asNumber(ticket.maxQuantity, ticket.maxTickets, ticket.capacity);
  const sold = asNumber(ticket.sold, ticket.soldCount, ticket._count?.tickets);
  return Math.max(0, capacity - sold);
};

const getLowAvailabilityThreshold = (capacity: number) => Math.min(12, Math.max(3, Math.ceil(capacity * 0.15)));

export const EventRegistrationCard: React.FC<EventRegistrationCardProps> = ({
  event: initialEvent,
  ticketTypes: providedTicketTypes,
  quantities,
  onQuantitiesChange,
  onPrimaryAction,
  compact = false,
  variant = 'default',
  className = '',
  headerOverride,
  disableRemoteFetch = false,
}) => {
  const navigate = useNavigate();
  const { user, openLoginModal } = useAuth();
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [resolvedEvent, setResolvedEvent] = React.useState(initialEvent);
  const [loadedTicketTypes, setLoadedTicketTypes] = React.useState<any[]>(providedTicketTypes || initialEvent?.ticketTypes || []);
  const [internalQuantities, setInternalQuantities] = React.useState<Record<string, number>>({});
  const [specialActionStatus, setSpecialActionStatus] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [accessCode, setAccessCode] = React.useState('');
  const [applyingAccessCode, setApplyingAccessCode] = React.useState(false);
  const [grantedTicketIds, setGrantedTicketIds] = React.useState<string[]>([]);
  const [appliedAccessCode, setAppliedAccessCode] = React.useState('');
  const [loadingTickets, setLoadingTickets] = React.useState(!disableRemoteFetch && (!providedTicketTypes || !providedTicketTypes.length));

  React.useEffect(() => {
    setResolvedEvent(initialEvent);
    if (initialEvent?.ticketTypes?.length && !providedTicketTypes?.length) {
      setLoadedTicketTypes(initialEvent.ticketTypes);
    }
  }, [initialEvent, providedTicketTypes]);

  React.useEffect(() => {
    if (providedTicketTypes?.length) {
      setLoadedTicketTypes(providedTicketTypes);
      setLoadingTickets(false);
    }
  }, [providedTicketTypes]);

  React.useEffect(() => {
    if (disableRemoteFetch) return;
    const eventId = initialEvent?.id || initialEvent?._id;
    if (!eventId) return;
    let cancelled = false;

    setLoadingTickets(true);

    const hasFullDetails = initialEvent && (initialEvent.description || initialEvent.descriptionHtml || initialEvent.registrationForm);

    const promises = [
      hasFullDetails
        ? Promise.resolve(initialEvent)
        : fetchApi(`/api/event/${eventId}`).then((response) => response.ok ? response.json() : null).catch(() => null),
      fetchApi(`/api/ticket-type/event/${eventId}/with-stats`).then((response) => response.ok ? response.json() : []).catch(() => []),
    ] as const;

    Promise.all(promises).then(([fullEvent, tickets]) => {
      if (cancelled) return;
      if (fullEvent) setResolvedEvent((current: any) => ({ ...current, ...fullEvent }));
      if (Array.isArray(tickets) && tickets.length) setLoadedTicketTypes(tickets);
      setLoadingTickets(false);
    }).catch(() => {
      if (!cancelled) setLoadingTickets(false);
    });

    return () => { cancelled = true; };
  }, [disableRemoteFetch, initialEvent?.id, initialEvent?._id]);

  const event = resolvedEvent || initialEvent || {};
  const form = React.useMemo(() => parseForm(event.registrationForm), [event.registrationForm]);
  const allTickets = loadedTicketTypes.length ? loadedTicketTypes : (providedTicketTypes || event.ticketTypes || []);
  const hiddenTickets = React.useMemo(
    () => allTickets.filter((ticket: any) => ticket.isPrivate && !grantedTicketIds.includes(ticket.id)),
    [allTickets, grantedTicketIds],
  );
  const visibleTickets = React.useMemo(
    () => allTickets.filter((ticket: any) => !ticket.isPrivate || ticket.accessGranted || grantedTicketIds.includes(ticket.id)),
    [allTickets, grantedTicketIds],
  );
  const currentQuantities = quantities ?? internalQuantities;

  React.useEffect(() => {
    if (!visibleTickets.length || Object.values(currentQuantities).some((quantity) => quantity > 0)) return;
    const first = visibleTickets[0];
    const next = { [first.id]: 1 };
    if (onQuantitiesChange) onQuantitiesChange(next);
    else setInternalQuantities(next);
    // Selection is intentionally reset only when the event/ticket collection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, visibleTickets.map((ticket: any) => ticket.id).join('|')]);

  const updateQuantity = (ticket: any, delta: number) => {
    const current = currentQuantities[ticket.id] || 0;
    const perUserLimit = Math.max(1, asNumber(ticket.perUserLimit, ticket.maxPerUser, form.perUserLimit) || 10);
    const available = availableFor(ticket);
    const maximum = Math.min(perUserLimit, available || perUserLimit);
    const nextValue = Math.max(0, Math.min(maximum, current + delta));
    const next = { ...currentQuantities, [ticket.id]: nextValue };
    if (onQuantitiesChange) onQuantitiesChange(next);
    else setInternalQuantities(next);
  };

  const applyAccessCode = async (codeOverride?: string) => {
    const normalizedCode = (codeOverride || accessCode).trim().toUpperCase();
    const eventId = event.id || event._id;
    if (!normalizedCode || !eventId) return;
    setApplyingAccessCode(true);
    try {
      const response = await fetchApi('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode, eventId }),
      });
      if (!response.ok) throw new Error('Código inválido ou expirado');
      const coupon = await response.json();
      const eligibleIds = Array.isArray(coupon.eligibleTicketIds) ? coupon.eligibleTicketIds : [];
      const unlockedIds = allTickets
        .filter((ticket: any) => ticket.isPrivate && eligibleIds.includes(ticket.id))
        .map((ticket: any) => ticket.id);
      if (!unlockedIds.length) throw new Error('Este código não libera nenhum ingresso oculto');

      setGrantedTicketIds((current) => Array.from(new Set([...current, ...unlockedIds])));
      setAppliedAccessCode(coupon.code || normalizedCode);
      setAccessCode('');
      toast({ title: 'Acesso liberado', description: `${unlockedIds.length === 1 ? 'O ingresso oculto foi liberado' : 'Os ingressos ocultos foram liberados'}.` });
    } catch (error: any) {
      toast({ title: 'Código inválido', description: error.message || 'Não foi possível liberar o ingresso.', variant: 'destructive' });
    } finally {
      setApplyingAccessCode(false);
    }
  };

  const autoAppliedCodeRef = React.useRef('');
  React.useEffect(() => {
    if (!allTickets.length || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('coupon') || params.get('accessCode') || '').trim().toUpperCase();
    if (!code || autoAppliedCodeRef.current === code) return;
    autoAppliedCodeRef.current = code;
    setAccessCode(code);
    void applyAccessCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, allTickets.map((ticket: any) => ticket.id).join('|')]);

  const now = Date.now();
  const capacities = visibleTickets.map((ticket: any) => asNumber(ticket.maxQuantity, ticket.maxTickets, ticket.capacity));
  const totalCapacity = capacities.reduce((sum: number, value: number) => sum + value, 0) || asNumber(event.capacity, form.capacity);
  const totalAvailable = visibleTickets.length
    ? visibleTickets.reduce((sum: number, ticket: any) => sum + availableFor(ticket), 0)
    : Math.max(0, totalCapacity - asNumber(event.registeredCount, event.attendeesCount, event._count?.tickets));
  const lowAvailability = totalCapacity > 0 && totalAvailable > 0 && totalAvailable <= getLowAvailabilityThreshold(totalCapacity);
  const acceptingRegistrations = event.acceptingRegistrations ?? form.acceptingRegistrations ?? true;
  const requiresApproval = Boolean(
    event.requireApproval ?? event.requiresApproval ?? form.requireApproval ?? form.requiresApproval ??
    visibleTickets.some((ticket: any) => ticket.requireApproval || ticket.requiresApproval),
  );
  const waitingListEnabled = Boolean(event.waitlist ?? event.waitingListEnabled ?? form.waitlist ?? form.waitingListEnabled);
  const registrationType = String(event.registrationType || form.registrationType || '').toLowerCase();
  const isRsvp = registrationType === 'rsvp' || Boolean(event.rsvpEnabled ?? form.rsvpEnabled);
  const registrationRequired = Boolean(event.registrationRequired ?? form.registrationRequired ?? form.requiresRegistration);
  const eventEnded = event.endDate ? new Date(event.endDate).getTime() < now : event.startDate ? new Date(event.startDate).getTime() < now : false;
  const allSalesEnded = visibleTickets.length > 0 && visibleTickets.every((ticket: any) => {
    if (!ticket.salesEnd) return false;
    const salesEnd = new Date(ticket.salesEnd).getTime();
    return Number.isFinite(salesEnd) && salesEnd <= now;
  });
  const soldOut = visibleTickets.length > 0 && visibleTickets.every((ticket: any) => availableFor(ticket) <= 0);
  const closed = acceptingRegistrations === false || eventEnded || allSalesEnded || (soldOut && !waitingListEnabled);

  let action: RegistrationAction = 'checkout';
  if (closed) action = 'closed';
  else if (soldOut && waitingListEnabled) action = 'waitlist';
  else if (requiresApproval) action = 'request';
  else if (isRsvp) action = 'rsvp';
  else if (registrationRequired || visibleTickets.every((ticket: any) => asNumber(ticket.price) === 0)) action = 'register';

  const header = headerOverride || (action === 'checkout' || (action === 'request' && visibleTickets.length > 0) ? 'Comprar Ingressos' : 'Cadastro');
  const firstTicket = visibleTickets[0];
  const isSingleTicket = visibleTickets.length === 1;
  const greetingName = user?.name?.split(' ')[0] || 'Visitante';
  const actionLabel: Record<RegistrationAction, string> = {
    checkout: 'Pegar ingresso',
    rsvp: 'RSVP com um clique',
    register: 'Cadastrar-se',
    request: 'Solicitar participação',
    waitlist: 'Entrar na Lista de espera',
    closed: '',
  };

  const handleAction = async () => {
    const context = { action, event, ticketTypes: visibleTickets, quantities: currentQuantities, couponCode: appliedAccessCode || undefined };
    if (action === 'closed') return;
    if (action === 'request' || action === 'waitlist') {
      if (!user?.email) {
        openLoginModal(window.location.pathname);
        return;
      }
      setSpecialActionStatus('loading');
      try {
        const response = await fetchApi('/api/event-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact: user.email, source: `${action}:${event.id}` }),
        });
        if (!response.ok) throw new Error('Falha ao registrar solicitação');
        setSpecialActionStatus('done');
      } catch {
        setSpecialActionStatus('error');
      }
      return;
    }
    if (onPrimaryAction) return onPrimaryAction(context);
    navigate(`/select-tickets/${event.id}`);
  };

  const showUrgency = lowAvailability && action !== 'closed' && action !== 'waitlist';

  return (
    <section
      className={`event-registration-card ${isDark ? 'is-dark' : ''} ${compact ? 'is-compact' : ''} ${variant === 'event-page' ? 'is-event-page' : ''} ${className}`}
      aria-label={header}
    >
      <style>{`
        .event-registration-card { --erc-bg:#fff; --erc-header:#f3f3f3; --erc-row:#f5f5f5; --erc-selected:#fff; --erc-text:#171717; --erc-muted:#737373; --erc-border:rgba(0,0,0,.10); --erc-button:#171717; --erc-button-text:#fff; width:100%; overflow:hidden; border:1px solid var(--erc-border); border-radius:12px; background:var(--erc-bg); color:var(--erc-text); box-shadow:0 2px 8px rgba(0,0,0,.05); font-family:inherit; }
        .event-registration-card.is-dark { --erc-bg:#252525; --erc-header:#383838; --erc-row:#353535; --erc-selected:#1f1f1f; --erc-text:#f7f7f7; --erc-muted:#aaa; --erc-border:rgba(255,255,255,.08); --erc-button:#fff; --erc-button-text:#171717; box-shadow:0 2px 8px rgba(0,0,0,.22); }
        .event-registration-card.is-event-page { --erc-bg:color-mix(in srgb,var(--theme-text,#171717) 8%,transparent); --erc-header:color-mix(in srgb,var(--theme-text,#171717) 7%,transparent); --erc-row:color-mix(in srgb,var(--theme-text,#171717) 6%,transparent); --erc-selected:color-mix(in srgb,var(--theme-text,#171717) 12%,transparent); --erc-text:var(--theme-text,#171717); --erc-muted:var(--theme-muted,#737373); --erc-border:color-mix(in srgb,var(--theme-text,#171717) 11%,transparent); --erc-button:var(--theme-text,#171717); --erc-button-text:var(--theme-bg,#fff); border-color:var(--erc-border); background:var(--erc-bg); box-shadow:0 8px 28px rgba(0,0,0,.05),inset 0 1px 0 color-mix(in srgb,var(--theme-text,#fff) 5%,transparent); backdrop-filter:blur(18px) saturate(1.04); -webkit-backdrop-filter:blur(18px) saturate(1.04); }
        .event-registration-card.is-event-page .erc-header { min-height:39px; padding:9px 16px; font-size:14px; background:var(--erc-header); }
        .event-registration-card.is-event-page .erc-body { padding:17px 16px 16px; }
        .event-registration-card.is-event-page .erc-copy { margin-bottom:14px; color:var(--erc-text); font-size:14px; line-height:1.5; }
        .event-registration-card.is-event-page .erc-user { margin:13px 0; }
        .event-registration-card.is-event-page .erc-avatar { width:24px; height:24px; }
        .event-registration-card.is-event-page .erc-user-text { font-size:14px; }
        .event-registration-card.is-event-page .erc-button { min-height:44px; border-radius:9px; font-size:14px; }
        .event-registration-card.is-event-page .erc-price-label { font-size:13px; }
        .event-registration-card.is-event-page .erc-price { font-size:24px; }
        .event-registration-card.is-event-page .erc-price small { font-size:12px; }
        .event-registration-card.is-event-page .erc-status { padding:14px 16px; }
        .event-registration-card.is-event-page .erc-status-icon { background:color-mix(in srgb,var(--theme-text,#171717) 10%,transparent); }
        .event-registration-card.is-event-page .erc-status-title { font-size:14px; }
        .event-registration-card.is-event-page .erc-status-copy { font-size:12px; }
        .event-registration-card.is-event-page .erc-ticket { min-height:58px; padding:10px 12px; background:var(--erc-row); }
        .event-registration-card.is-event-page .erc-ticket-top { font-size:13px; }
        .event-registration-card.is-event-page .erc-ticket-description { font-size:11px; }
        .event-registration-card.is-event-page .erc-meta,.event-registration-card.is-event-page .erc-access { font-size:11px; }
        .event-registration-card.is-event-page .erc-counter button { background:color-mix(in srgb,var(--theme-text,#171717) 10%,transparent); }
        .erc-header { min-height:32px; display:flex; align-items:center; padding:7px 14px; background:var(--erc-header); font-size:12px; line-height:1.2; font-weight:600; }
        .erc-body { padding:13px 14px 14px; }
        .erc-divider { height:1px; margin:11px 0; background:var(--erc-border); }
        .erc-price-label,.erc-copy,.erc-ticket-description,.erc-meta,.erc-access { color:var(--erc-muted); }
        .erc-price-label { font-size:12px; font-weight:600; }
        .erc-price { display:flex; align-items:baseline; gap:7px; margin-top:1px; font-size:21px; line-height:1.15; font-weight:600; letter-spacing:-.02em; }
        .erc-price small { font-size:11px; font-weight:400; letter-spacing:0; color:var(--erc-muted); }
        .erc-status { display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border-bottom:1px solid var(--erc-border); }
        .erc-status-icon { width:27px; height:27px; flex:0 0 auto; display:grid; place-items:center; border-radius:7px; background:rgba(128,128,128,.16); color:var(--erc-muted); }
        .erc-status-title { margin-top:1px; font-size:13px; font-weight:600; }
        .erc-status-copy { margin-top:2px; color:var(--erc-muted); font-size:11px; line-height:1.35; }
        .erc-copy { margin:0 0 12px; font-size:12px; line-height:1.45; font-weight:400; }
        .erc-copy strong { color:var(--erc-text); }
        .erc-user { display:flex; align-items:center; min-width:0; gap:8px; margin:11px 0; }
        .erc-avatar { width:20px; height:20px; border-radius:50%; object-fit:cover; background:linear-gradient(145deg,#ff8fac,#d94d70); }
        .erc-user-text { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:var(--erc-muted); }
        .erc-user-text strong { color:var(--erc-text); font-weight:600; }
        .erc-button { width:100%; min-height:35px; border:0; border-radius:8px; background:var(--erc-button); color:var(--erc-button-text); font:inherit; font-size:12px; font-weight:500; cursor:pointer; transition:filter .15s ease,transform .15s ease; }
        .erc-button:hover { filter:brightness(.93); } .erc-button:active { transform:translateY(1px); }
        .erc-ticket-list { display:flex; flex-direction:column; gap:7px; }
        .erc-ticket { width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:50px; padding:8px 10px; border:1px solid transparent; border-radius:7px; background:var(--erc-row); color:var(--erc-text); text-align:left; cursor:pointer; }
        .erc-ticket.is-selected { border-color:currentColor; background:var(--erc-selected); }
        .erc-ticket-main { min-width:0; flex:1; }
        .erc-ticket-top { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:12px; font-weight:600; }
        .erc-ticket-price { flex:0 0 auto; }
        .erc-ticket-description { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px; font-size:10px; }
        .erc-meta { display:flex; flex-wrap:wrap; align-items:center; gap:5px; margin-top:3px; font-size:9px; }
        .erc-badge { display:inline-flex; align-items:center; min-height:16px; padding:2px 6px; border-radius:999px; background:rgba(217,164,65,.16); color:#d9a441; font-weight:600; }
        .erc-availability-dot { width:6px; height:6px; border-radius:50%; background:#36c55f; }
        .erc-counter { flex:0 0 auto; display:flex; align-items:center; gap:6px; }
        .erc-counter button { width:23px; height:23px; display:grid; place-items:center; padding:0; border:0; border-radius:5px; background:rgba(128,128,128,.14); color:var(--erc-text); cursor:pointer; }
        .erc-counter button:disabled { opacity:.3; cursor:default; }
        .erc-counter span { min-width:12px; text-align:center; font-size:12px; font-weight:600; }
        .erc-access { display:flex; align-items:center; gap:6px; margin-top:10px; font-size:10px; }
        .erc-access-box { margin-top:11px; padding-top:11px; border-top:1px solid var(--erc-border); }
        .erc-access-label { display:flex; align-items:center; gap:6px; margin-bottom:7px; color:var(--erc-muted); font-size:11px; font-weight:600; }
        .erc-access-form { display:flex; gap:7px; }
        .erc-access-input { min-width:0; flex:1; height:34px; border:1px solid var(--erc-border); border-radius:7px; background:var(--erc-row); color:var(--erc-text); padding:0 10px; font:inherit; font-size:12px; font-weight:600; text-transform:uppercase; outline:none; }
        .erc-access-input:focus { border-color:color-mix(in srgb,var(--erc-text) 35%,transparent); }
        .erc-access-submit { height:34px; border:0; border-radius:7px; background:var(--erc-button); color:var(--erc-button-text); padding:0 11px; font:inherit; font-size:11px; font-weight:600; cursor:pointer; }
        .erc-access-submit:disabled { opacity:.45; cursor:default; }
        .event-registration-card.is-compact .erc-body { padding:11px 12px 12px; }
        .event-registration-card.is-compact .erc-header { padding-left:12px; padding-right:12px; }
      `}</style>

      <div className="erc-header">{header}</div>

      {loadingTickets ? (
        <div className="erc-body">
          <style>{`
            @keyframes erc-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: .4; }
            }
            .erc-skeleton {
              animation: erc-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .erc-skeleton-bar {
              height: 11px;
              background-color: var(--erc-border);
              border-radius: 4px;
              margin: 8px 0;
            }
            .erc-skeleton-button {
              height: 35px;
              background-color: var(--erc-border);
              border-radius: 8px;
              width: 100%;
              margin-top: 14px;
            }
            .erc-skeleton-ticket {
              height: 50px;
              background-color: var(--erc-row);
              border-radius: 7px;
              border: 1px solid var(--erc-border);
              margin: 10px 0;
            }
          `}</style>
          
          <div className="erc-skeleton">
            <div className="erc-skeleton-bar" style={{ width: '40%' }} />
            <div className="erc-skeleton-bar" style={{ width: '75%' }} />
            
            <div className="erc-divider" />
            
            <div className="erc-skeleton-ticket" />
            
            <div className="erc-user" style={{ marginTop: '12px', gap: '8px' }}>
              <div className="erc-avatar" style={{ background: 'var(--erc-border)' }} />
              <div className="erc-skeleton-bar" style={{ width: '55%', margin: 0 }} />
            </div>
            
            <div className="erc-skeleton-button" />
          </div>
        </div>
      ) : (
        <>
          {showUrgency && (
            <div className="erc-status">
              <div className="erc-status-icon"><Clock3 size={15} /></div>
              <div>
                <div className="erc-status-title">{totalAvailable} {totalAvailable === 1 ? 'Vaga Restante' : 'Vagas Restantes'}</div>
                <div className="erc-status-copy">Corra e se cadastre antes que o evento esgote!</div>
              </div>
            </div>
          )}

          {action === 'request' && !showUrgency && (
            <div className="erc-status">
              <div className="erc-status-icon"><UserRoundCheck size={15} /></div>
              <div>
                <div className="erc-status-title">Aprovação Necessária</div>
                <div className="erc-status-copy">Seu cadastro está sujeito à aprovação do organizador.</div>
              </div>
            </div>
          )}

          {action === 'waitlist' && (
            <div className="erc-status">
              <div className="erc-status-icon"><Hourglass size={15} /></div>
              <div>
                <div className="erc-status-title">Evento Lotado</div>
                <div className="erc-status-copy">Se quiser, você pode entrar na lista de espera.</div>
              </div>
            </div>
          )}

          {action === 'closed' && (
            <div className="erc-status" style={{ borderBottom: 0 }}>
              <div className="erc-status-icon"><Minus size={15} /></div>
              <div>
                <div className="erc-status-title">{soldOut ? 'Ingressos Esgotados' : 'Inscrições Encerradas'}</div>
                <div className="erc-status-copy">Este evento não está aceitando inscrições no momento. Você pode entrar em contato com o organizador ou se inscrever para receber atualizações.</div>
              </div>
            </div>
          )}

          {action !== 'closed' && (
            <div className="erc-body">
              {action === 'waitlist' ? (
                <p className="erc-copy">Clique no botão abaixo para entrar na lista de espera. Você será notificado se mais vagas ficarem disponíveis.</p>
              ) : (
                <>
                  {action === 'checkout' && isSingleTicket && (
                    <div>
                      <div className="erc-price-label">Preço do Ingresso</div>
                      <div className="erc-price">
                        {formatMoney(asNumber(firstTicket.price))}
                        {asNumber(firstTicket.perUserLimit, firstTicket.maxPerUser, form.perUserLimit) > 1 && <small>Por ingresso</small>}
                      </div>
                      <div className="erc-divider" />
                    </div>
                  )}

                  <p className="erc-copy">
                    Olá, <strong>{greetingName}</strong>! {isRsvp || registrationRequired
                      ? 'Para participar do evento, cadastre-se abaixo.'
                      : isSingleTicket
                        ? 'Para participar do evento, pegue seu ingresso abaixo.'
                        : 'Por favor, escolha o tipo de ingresso desejado:'}
                  </p>

                  {visibleTickets.length > 1 && (
                    <div className="erc-ticket-list">
                      {visibleTickets.map((ticket: any) => {
                        const count = currentQuantities[ticket.id] || 0;
                        const available = availableFor(ticket);
                        const capacity = asNumber(ticket.maxQuantity, ticket.maxTickets, ticket.capacity);
                        const ticketLow = capacity > 0 && available > 0 && available <= getLowAvailabilityThreshold(capacity);
                        const maxPerUser = Math.max(1, asNumber(ticket.perUserLimit, ticket.maxPerUser, form.perUserLimit) || 10);
                        return (
                          <button key={ticket.id} type="button" className={`erc-ticket ${count > 0 ? 'is-selected' : ''}`} onClick={() => updateQuantity(ticket, count > 0 ? -count : 1)}>
                            <div className="erc-ticket-main">
                              <div className="erc-ticket-top">
                                <span>{ticket.name}</span>
                                <span className="erc-ticket-price">{asNumber(ticket.price) === 0 ? 'Gratuito' : formatMoney(asNumber(ticket.price))}</span>
                              </div>
                              {ticket.description && <div className="erc-ticket-description">{ticket.description}</div>}
                              <div className="erc-meta">
                                {ticketLow && <span>{available} restantes</span>}
                                {(ticket.requiresApproval || ticket.requireApproval || requiresApproval) && <span className="erc-badge">Requer Aprovação</span>}
                                {ticket.salesEnd && <><span className="erc-availability-dot" /><span>Disponível até {new Date(ticket.salesEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></>}
                              </div>
                            </div>
                            {maxPerUser > 1 && (
                              <div className="erc-counter" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                                <button type="button" disabled={count <= 0} onClick={() => updateQuantity(ticket, -1)} aria-label={`Remover ${ticket.name}`}><Minus size={12} /></button>
                                {count > 0 && <span>{count}</span>}
                                <button type="button" disabled={count >= Math.min(maxPerUser, available || maxPerUser)} onClick={() => updateQuantity(ticket, 1)} aria-label={`Adicionar ${ticket.name}`}><Plus size={12} /></button>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isSingleTicket && asNumber(firstTicket?.perUserLimit, firstTicket?.maxPerUser, form.perUserLimit) > 1 && (
                    <div className="erc-ticket" style={{ cursor: 'default' }}>
                      <div className="erc-ticket-main"><div className="erc-ticket-top"><span>Ingressos</span></div></div>
                      <div className="erc-counter">
                        <button type="button" disabled={(currentQuantities[firstTicket.id] || 0) <= 1} onClick={() => updateQuantity(firstTicket, -1)}><Minus size={12} /></button>
                        <span>{currentQuantities[firstTicket.id] || 1}</span>
                        <button type="button" onClick={() => updateQuantity(firstTicket, 1)}><Plus size={12} /></button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {visibleTickets.length > 0 && (
                <>
                  <div className="erc-user">
                    <img className="erc-avatar" src={resolveImageUrl(user?.photoUrl || user?.avatar || 'https://cdn.lu.ma/avatars-default/avatar_25.png')} alt="" />
                    <div className="erc-user-text">{user ? <><strong>{user.name || 'Usuário'}</strong> {user.email}</> : <strong>Entre ou informe seus dados para continuar</strong>}</div>
                  </div>
                  <button className="erc-button" type="button" onClick={handleAction} disabled={specialActionStatus === 'loading' || specialActionStatus === 'done'}>
                    {specialActionStatus === 'loading'
                      ? 'Enviando...'
                      : specialActionStatus === 'done'
                        ? (action === 'waitlist' ? 'Você está na lista de espera' : 'Solicitação enviada')
                        : specialActionStatus === 'error'
                          ? 'Tentar novamente'
                          : actionLabel[action]}
                  </button>
                </>
              )}
              {hiddenTickets.length > 0 && (
                <div className="erc-access-box">
                  <div className="erc-access-label"><LockKeyhole size={12} /> Tem um código de acesso?</div>
                  <div className="erc-access-form">
                    <input
                      value={accessCode}
                      onChange={(event) => setAccessCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void applyAccessCode(); } }}
                      placeholder="Digite o código"
                      className="erc-access-input"
                    />
                    <button type="button" className="erc-access-submit" disabled={!accessCode.trim() || applyingAccessCode} onClick={() => void applyAccessCode()}>
                      {applyingAccessCode ? 'Validando...' : 'Aplicar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {action === 'closed' && (
            <div className="erc-access" style={{ padding: '0 14px 12px' }}><LockKeyhole size={11} /> Tem um código de acesso? Você pode inserir aqui.</div>
          )}
        </>
      )}
    </section>
  );
};

export default EventRegistrationCard;
