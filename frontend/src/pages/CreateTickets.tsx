import AppHeader from "@/components/AppHeader";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from 'react-dom';
// Animated ticket deletion effect styles
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes trash { 0% { transform: scale(1) rotate(0deg); } 40% { transform: scale(1.2) rotate(-10deg); } 60% { transform: scale(1.1) rotate(10deg); } 100% { transform: scale(1) rotate(0deg); } }
  .animate-fade-in { animation: fade-in 0.5s ease; }
  .animate-slide-up { animation: slide-up 0.7s cubic-bezier(.4,2,.6,1); }
  .animate-trash { animation: trash 0.7s cubic-bezier(.4,2,.6,1); }
  .animate-delete-ticket { border-color: #fca5a5 !important; box-shadow: 0 0 0 4px #fca5a555; transition: border-color 0.7s, box-shadow 0.7s; }
  @keyframes emoji-pop { 0% { transform: scale(1) rotate(0deg); } 30% { transform: scale(1.25) rotate(-10deg); } 60% { transform: scale(0.95) rotate(8deg); } 100% { transform: scale(1) rotate(0deg); } }
  .emoji-pop { display: inline-block; transform-origin: center; animation: emoji-pop 700ms cubic-bezier(.2,.9,.2,1); }
`;
document.head.appendChild(style);
import { fetchApi } from "@/lib/apiBase";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose, DrawerTrigger, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SidebarMenu from "@/components/SidebarMenu";
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import { useNavigate, useLocation } from "react-router-dom";
import StepFlowOverlay from "@/components/overlays/StepFlowOverlay";
import { Pencil, Trash, MoreVertical, GripVertical, Info, ChevronDown, Copy, Tag } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CheckIcon from "../components/icons/CheckIcon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const CreateTickets: React.FC = () => {
  // Estado para manter animação até backend remover
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // Util para formatar BRL sem espaço após R$
  const formatBRL = React.useCallback((n: number) => {
    if (Number.isNaN(n)) n = 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
      .format(n)
      .replace(/\s/g, '');
  }, []);
  // Format number for BRL without the currency symbol (used when we render the fixed 'R$' prefix)
  const formatBRLNoSymbol = React.useCallback((n: number) => {
    if (Number.isNaN(n)) n = 0;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }, []);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const formatDateTimeShort = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} ${hh}:${mi}`;
  };
  // Estado para lista de tipos de ingresso
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);

  // Local form / UI state that was accidentally removed in previous edits
  const [ticketName, setTicketName] = useState<string>("");
  const [maxTickets, setMaxTickets] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [priceRaw, setPriceRaw] = useState<string>("");
  const [priceFocused, setPriceFocused] = useState<boolean>(false);
  const [isFree, setIsFree] = useState<boolean>(false);
  const [isAbsorbFee, setIsAbsorbFee] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [isFacePass, setIsFacePass] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [perUserLimit, setPerUserLimit] = useState<string>("");
  const [salesStartDate, setSalesStartDate] = useState<string>("");
  const [salesStartTime, setSalesStartTime] = useState<string>("");
  const [salesEndDate, setSalesEndDate] = useState<string>("");
  const [salesEndTime, setSalesEndTime] = useState<string>("");
  const [createHalf, setCreateHalf] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [duplicatePendingId, setDuplicatePendingId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState<string>('');
  const [duplicateLoading, setDuplicateLoading] = useState<boolean>(false);
  const [markSoldPendingId, setMarkSoldPendingId] = useState<string | null>(null);
  const [markSoldLoading, setMarkSoldLoading] = useState<boolean>(false);
  const [reopenPendingId, setReopenPendingId] = useState<string | null>(null);
  const [reopenLoading, setReopenLoading] = useState<boolean>(false);
  const [reopenValue, setReopenValue] = useState<string>('10');

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);

  const [flowStep, setFlowStep] = useState<1|2|3>(1);
  const [flowVisible, setFlowVisible] = useState<boolean>(false);

  const [ticketsLoading, setTicketsLoading] = useState<boolean>(true);

  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

  const [perUserTooltipPos, setPerUserTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const [halfTooltipPos, setHalfTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const [privateTooltipPos, setPrivateTooltipPos] = useState<{ left: number; top: number } | null>(null);

  const [showPerUserTooltip, setShowPerUserTooltip] = useState<boolean>(false);
  const [showHalfInfoTooltip, setShowHalfInfoTooltip] = useState<boolean>(false);
  const [showPrivateTooltip, setShowPrivateTooltip] = useState<boolean>(false);

  const [createHalfAnim, setCreateHalfAnim] = useState<boolean>(false);
  const [privateAnim, setPrivateAnim] = useState<boolean>(false);
  const [faceAnim, setFaceAnim] = useState<boolean>(false);

  const perUserBtnRef = useRef<HTMLButtonElement | null>(null);
  const halfBtnRef = useRef<HTMLButtonElement | null>(null);
  const privateBtnRef = useRef<HTMLButtonElement | null>(null);

  const [showPublishTooltip, setShowPublishTooltip] = useState<boolean>(false);
  const [publishTooltipPos, setPublishTooltipPos] = useState<{ left: number; top: number } | null>(null);

  const HALF_INDENT_PX = 48;
  const serviceFeePercent = 0.1;
  const navigate = useNavigate();
  const location = useLocation();
  // Pega eventId da query string
  const eventId = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("eventId");
  }, [location.search]);

  // Fetch ticket types and some event info
  const fetchTickets = React.useCallback(async () => {
    if (!eventId) {
      setTicketTypes([]);
      setTicketsLoading(false);
      return;
    }
    setTicketsLoading(true);
    try {
      const res = await fetchApi(`/api/ticket-type/event/${eventId}`);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (Array.isArray(data)) setTicketTypes(data);
        else setTicketTypes([]);
      } else {
        setTicketTypes([]);
      }
    } catch (e) {
      setTicketTypes([]);
    } finally {
      setTicketsLoading(false);
    }
    // Also try to fetch basic event info (non-blocking)
    try {
      const ev = await fetchApi(`/api/event/${eventId}`);
      if (ev && ev.ok) {
        const json = await ev.json().catch(() => null);
        if (json) {
          if (json.name) setEventName(json.name);
          if (json.startDate) setEventStart(json.startDate + (json.startTime ? ` às ${json.startTime}` : ''));
          if (typeof json.isPublished === 'boolean') setEventStatus(json.isPublished ? 'Publicado' : 'Rascunho');
        }
      }
    } catch (_) {}
  }, [eventId]);

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
  // Event summary for sidebar
  const [eventName, setEventName] = useState<string>("Nome do evento");
  const [eventStatus, setEventStatus] = useState<"Rascunho" | "Publicado">("Rascunho");
  const [eventStart, setEventStart] = useState<string>("");
 

  const groupOf = React.useCallback((list: any[], id: string) => {
    const item = list.find((x) => x.id === id);
    if (!item) return { startIdx: -1, count: 0 };
    // If dragging a half ticket, do not allow
    if (item.isHalf) return { startIdx: -1, count: 0 };
    const startIdx = list.findIndex((x) => x.id === id);
    // If the next item is its half child, include it
    const childIdx = list.findIndex((x) => x.parentId === id);
    let count = 1;
    if (childIdx !== -1) {
      // Keep child next to parent; if already adjacent after parent, treat as a 2-sized group
      if (childIdx === startIdx + 1) count = 2;
      else count = 1; // child elsewhere shouldn't happen because backend orders them consecutively, but keep safe
    }
    return { startIdx, count };
  }, []);

  const reorderTickets = React.useCallback(async (newList: any[]) => {
    setTicketTypes(newList);
    if (!eventId) return;
    try {
      // Use multiples of 10
      const items = newList.map((t, idx) => ({ id: t.id, sortOrder: (idx + 1) * 10 }));
      await fetchApi(`/api/ticket-type/event/${eventId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (_) {}
  }, [eventId]);

  const handleSave = async () => {
    if (!eventId) {
      setError("ID do evento não encontrado. Volte e crie o evento primeiro.");
      return;
    }
    setSuccess("");
    setError("");

    const trimmedName = ticketName.trim();
    if (!trimmedName) {
      setError("Informe o nome do ingresso.");
      return;
    }
    const maxQ = Number(maxTickets || 0);
    if (!Number.isFinite(maxQ) || maxQ < 1) {
      setError("A quantidade máxima de ingressos deve ser pelo menos 1.");
      return;
    }
    if (!isFree) {
      const p = Number(price || 0);
      if (!Number.isFinite(p) || p < 30) {
        setError("Preço mínimo para ingressos pagos é de R$30,00.");
        return;
      }
    }
    let perUserLimitNum: number | null = null;
    if (perUserLimit !== "") {
      const pul = Number(perUserLimit);
      if (!Number.isFinite(pul) || pul < 1 || pul > maxQ) {
        setError("Quantidade máxima por usuário deve ser entre 1 e o total de ingressos.");
        return;
      }
      perUserLimitNum = pul;
    }
    if ((!!salesStartDate && !salesStartTime) || (!salesStartDate && !!salesStartTime)) {
      setError("Preencha data e horário do início das vendas.");
      return;
    }
    if ((!!salesEndDate && !salesEndTime) || (!salesEndDate && !!salesEndTime)) {
      setError("Preencha data e horário do término das vendas.");
      return;
    }
    let startIso: string | null = null;
    let endIso: string | null = null;
    if (salesStartDate && salesStartTime) startIso = `${salesStartDate}T${salesStartTime}:00`;
    if (salesEndDate && salesEndTime) endIso = `${salesEndDate}T${salesEndTime}:00`;
    // Não permitir início no passado
    const nowTs = Date.now();
    if (startIso) {
      const sd = new Date(startIso).getTime();
      if (sd < nowTs) {
        setError("O início das vendas não pode ser no passado.");
        return;
      }
    }
    if (startIso && endIso) {
      const sd = new Date(startIso).getTime();
      const ed = new Date(endIso).getTime();
      if (ed <= sd) {
        setError("O término das vendas deve ser posterior ao início.");
        return;
      }
    }

    setLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/ticket-type/${editingId}` : "/api/ticket-type";
      const res = await fetchApi(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name: trimmedName,
          maxQuantity: maxQ,
          price: isFree ? 0 : Number(price || 0),
          perUserLimit: perUserLimitNum,
          description,
          absorbFee: isAbsorbFee,
          isPrivate,
          isFacePass,
          salesStart: startIso,
          salesEnd: endIso,
          createHalf: !editingId && !isFree ? createHalf : false,
        }),
      });
      if (res.ok) {
        setSuccess(editingId ? "Ingresso atualizado com sucesso!" : "Ingresso criado com sucesso!");
        setTicketName("");
        setMaxTickets("");
        setPrice("");
        setDescription("");
        setIsAbsorbFee(false);
        setIsPrivate(false);
        setIsFacePass(false);
        setIsFree(false);
        setPerUserLimit("");
        setSalesStartDate("");
        setSalesStartTime("");
        setSalesEndDate("");
        setSalesEndTime("");
        setCreateHalf(false);
        // Recarrega lista real
        fetchTickets();
        // Fecha o drawer e limpa modo de edição somente após sucesso
        setDrawerOpen(false);
        setEditingId(null);
      } else {
        let msg = "Erro ao salvar ingresso.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch (_) {}
        setError(msg);
      }
    } catch (e) {
      setError("Erro de conexão ao salvar ingresso.");
    } finally {
      setLoading(false);
    }
  };

  const goToPublish = () => {
    // Show step 3 overlay, wait briefly for animation, then navigate to publish
    setFlowStep(3);
    setFlowVisible(true);
    setTimeout(() => {
      navigate(`/publish-details${eventId ? `?eventId=${eventId}` : ''}`, { state: { stepFlow: { visible: true, step: 3 } } });
    }, 700);
  };

  const { toast } = useToast();

  const handleDuplicateTicket = async (id: string, forcedName?: string) => {
    const t = ticketTypes.find(x => x.id === id);
    if (!t) {
      toast?.({ title: 'Erro', description: 'Ingresso não encontrado' });
      return;
    }
    // Ensure we have an eventId: prefer query param, fallback to ticket's eventId
    const targetEventId = eventId || t.eventId || t.event_id || null;
    if (!targetEventId) {
      toast?.({ title: 'Erro', description: 'ID do evento não encontrado. Não é possível duplicar.' , variant: 'destructive'} as any);
      return;
    }
    try {
      const baseName = forcedName ?? (t.name ? `${t.name} (Cópia)` : 'Cópia de ingresso');
      const body: any = {
        eventId: targetEventId,
        name: baseName,
        maxQuantity: Number(t.maxQuantity || 0),
        price: Number(t.price || 0),
        description: t.description || undefined,
        absorbFee: !!t.absorbFee,
        isPrivate: !!t.isPrivate,
        isFacePass: !!t.isFacePass,
        perUserLimit: typeof t.perUserLimit !== 'undefined' ? t.perUserLimit : undefined,
      };

      let res = await fetchApi('/api/ticket-type', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });

      // If backend rejected due to conflict (409), retry with a unique suffix
      if (res && res.status === 409 && !forcedName) {
        // If conflict and user didn't force a name, attempt a single retry with a unique suffix
        const suffix = `c${String(Date.now()).slice(-5)}`;
        body.name = `${baseName} — ${suffix}`;
        res = await fetchApi('/api/ticket-type', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
      }

      if (!res || !res.ok) {
        let msg = `Falha ao duplicar ingresso (${res ? res.status : 'sem resposta'})`;
        try { const j = await res.json().catch(() => null); if (j?.message) msg = j.message; } catch {}
        toast?.({ title: 'Erro', description: msg, variant: 'destructive' } as any);
        return;
      }

      const created = await res.json().catch(() => null);
      toast?.({ title: 'Duplicado', description: 'Ingresso duplicado com sucesso' });
      // refresh list and open drawer to edit the duplicated ticket
      await fetchTickets();
  const newId = created?.id || created?.ticketTypeId || created?.ticket_type_id || null;
      if (newId) {
        // Pre-fill drawer with created ticket data
        setEditingId(newId);
        setTicketName(created?.name || (t.name ? `${t.name}` : ''));
        setMaxTickets(String(created?.maxQuantity ?? created?.max_quantity ?? t.maxQuantity ?? ''));
        setPrice(String(created?.price ?? t.price ?? ''));
        setIsFree(Number(created?.price ?? t.price ?? 0) === 0);
        setDescription(created?.description || t.description || '');
        setIsAbsorbFee(!!(created?.absorbFee ?? t.absorbFee));
        setIsPrivate(!!(created?.isPrivate ?? t.isPrivate));
        setIsFacePass(!!(created?.isFacePass ?? t.isFacePass));
        setPerUserLimit(String(created?.perUserLimit ?? t.perUserLimit ?? ''));
        try {
          if (created?.salesStart) {
            const d = new Date(created.salesStart);
            setSalesStartDate(d.toISOString().slice(0,10));
            setSalesStartTime(d.toTimeString().slice(0,5));
          } else { setSalesStartDate(''); setSalesStartTime(''); }
          if (created?.salesEnd) {
            const d2 = new Date(created.salesEnd);
            setSalesEndDate(d2.toISOString().slice(0,10));
            setSalesEndTime(d2.toTimeString().slice(0,5));
          } else { setSalesEndDate(''); setSalesEndTime(''); }
        } catch (_) {
          setSalesStartDate(''); setSalesStartTime(''); setSalesEndDate(''); setSalesEndTime('');
        }
        setCreateHalf(false);
        setDrawerOpen(true);
      }
    } catch (e) {
      toast?.({ title: 'Erro', description: 'Erro de conexão ao duplicar', variant: 'destructive' } as any);
    }
  };

  const handleMarkAsSold = async (id: string) => {
    const t = ticketTypes.find(x => x.id === id);
    if (!t) {
      toast?.({ title: 'Erro', description: 'Ingresso não encontrado' });
      return;
    }
    try {
      // set maxQuantity to 0 to stop future sales
      const res = await fetchApi(`/api/ticket-type/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maxQuantity: 0 })
      });
      if (!res || !res.ok) {
        let msg = 'Falha ao marcar como esgotado';
        try { const j = await res.json().catch(() => null); if (j?.message) msg = j.message; } catch {}
        toast?.({ title: 'Erro', description: msg, variant: 'destructive' } as any);
        return;
      }
      toast?.({ title: 'Atualizado', description: 'Ingresso marcado como esgotado' });
      // update local state optimistically
      setTicketTypes(prev => prev.map(x => x.id === id ? ({ ...x, maxQuantity: 0 }) : x));
    } catch (e) {
      toast?.({ title: 'Erro', description: 'Erro de conexão ao atualizar', variant: 'destructive' } as any);
    }
  };

  const handleReopenTicket = async (id: string, qty: number) => {
    const t = ticketTypes.find(x => x.id === id);
    if (!t) {
      toast?.({ title: 'Erro', description: 'Ingresso não encontrado' });
      return;
    }
    try {
      const res = await fetchApi(`/api/ticket-type/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maxQuantity: qty })
      });
      if (!res || !res.ok) {
        let msg = `Falha ao reabrir vendas (${res ? res.status : 'sem resposta'})`;
        try { const j = await res.json().catch(() => null); if (j?.message) msg = j.message; } catch {}
        toast?.({ title: 'Erro', description: msg, variant: 'destructive' } as any);
        return;
      }
      toast?.({ title: 'Atualizado', description: 'Vendas reabertas com sucesso' });
      await fetchTickets();
    } catch (e) {
      toast?.({ title: 'Erro', description: 'Erro de conexão ao reabrir vendas', variant: 'destructive' } as any);
    }
  };

  // Helpers for date/time input constraints
  const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const toHm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const now = new Date();
  const todayYmd = toYmd(now);
  const nowHm = toHm(now);
  const nowPlus5 = new Date(Date.now() + 5 * 60 * 1000);
  const nowPlus5Hm = toHm(nowPlus5);
  const startDateIsToday = salesStartDate === todayYmd;
  const endDateIsToday = salesEndDate === todayYmd;
  const endSameAsStart = !!salesStartDate && !!salesEndDate && salesStartDate === salesEndDate;
  const startTimeMin = startDateIsToday ? nowPlus5Hm : undefined;
  const endDateMin = salesStartDate || todayYmd;
  const addMinutesToTime = (time: string, mins: number) => {
    if (!time) return '';
    const [hh, mm] = time.split(':').map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return '';
    const d = new Date();
    d.setHours(hh, mm + mins, 0, 0);
    // clamp to 23:59
    if (d.getHours() >= 24) return '23:59';
    return toHm(d);
  };
  const endTimeMin = endSameAsStart
    ? (salesStartTime ? addMinutesToTime(salesStartTime, 30) : undefined)
    : undefined;

  // When a tooltip is shown, compute its position relative to viewport and portal it to document.body
  useEffect(() => {
    if (showPerUserTooltip && perUserBtnRef.current) {
      const r = perUserBtnRef.current.getBoundingClientRect();
      setPerUserTooltipPos({ left: r.left + r.width / 2, top: r.top - 8 });
    } else {
      setPerUserTooltipPos(null);
    }
  }, [showPerUserTooltip]);

  useEffect(() => {
    if (showHalfInfoTooltip && halfBtnRef.current) {
      const r = halfBtnRef.current.getBoundingClientRect();
      setHalfTooltipPos({ left: r.left + r.width / 2, top: r.top - 8 });
    } else {
      setHalfTooltipPos(null);
    }
  }, [showHalfInfoTooltip]);

  // trigger emoji animation when createHalf toggles
  useEffect(() => {
    setCreateHalfAnim(true);
    const t = setTimeout(() => setCreateHalfAnim(false), 700);
    return () => clearTimeout(t);
  }, [createHalf]);

  // animate private emoji when toggled
  useEffect(() => {
    setPrivateAnim(true);
    const t = setTimeout(() => setPrivateAnim(false), 700);
    return () => clearTimeout(t);
  }, [isPrivate]);

  // animate facepass emoji when toggled
  useEffect(() => {
    setFaceAnim(true);
    const t = setTimeout(() => setFaceAnim(false), 700);
    return () => clearTimeout(t);
  }, [isFacePass]);

  useEffect(() => {
    if (showPrivateTooltip && privateBtnRef.current) {
      const r = privateBtnRef.current.getBoundingClientRect();
      setPrivateTooltipPos({ left: r.left + r.width / 2, top: r.top - 8 });
    } else {
      setPrivateTooltipPos(null);
    }
  }, [showPrivateTooltip]);

  // Prefill sales start/end when opening drawer for a NEW ticket
  // Persistent behavior: always reset to sensible defaults when opening create drawer
  useEffect(() => {
    if (drawerOpen && !editingId) {
      setSalesStartDate(todayYmd);
      setSalesStartTime(nowPlus5Hm);
      setSalesEndDate(todayYmd);
      setSalesEndTime(addMinutesToTime(nowPlus5Hm, 30));
      // Ensure feature toggles are off for a fresh create
      setCreateHalf(false);
      setIsPrivate(false);
      setIsFacePass(false);
    }
  }, [drawerOpen, editingId]);

  // When the drawer closes, reset the advanced panel state so it's collapsed on next open
  useEffect(() => {
    if (!drawerOpen) {
      setAdvancedOpen(false);
      // also hide any visible tooltips
      setShowPerUserTooltip(false);
      setShowHalfInfoTooltip(false);
      setShowPrivateTooltip(false);
      // Reset advanced inputs so next open starts fresh (description, per-user limits, sales window and feature toggles)
      setDescription("");
      setPerUserLimit("");
      setSalesStartDate("");
      setSalesStartTime("");
      setSalesEndDate("");
      setSalesEndTime("");
      setCreateHalf(false);
      setIsPrivate(false);
      setIsFacePass(false);
      // Also reset main form fields so canceling/closing clears the form
      setTicketName("");
      setMaxTickets("");
      setPrice("");
      setPriceRaw("");
      setPriceFocused(false);
      setIsFree(false);
      setIsAbsorbFee(false);
      setSuccess("");
      setError("");
      setEditingId(null);
    }
  }, [drawerOpen]);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b] flex">
      <SidebarMenu />
      <div className="fixed top-0 left-[70px] h-screen z-10">
        <EventDetailsSidebar
          eventName={eventName}
          eventDate={eventStart}
          eventStatus={eventStatus}
          onBack={() => navigate("/organizer-dashboard")}
          onStatusChange={() => {}}
          onViewEvent={() => {}}
        />
      </div>
      <div className="flex-1 flex flex-col ml-[350px]">
        <AppHeader />
        <div className="flex-1 flex flex-col items-start px-8">
          <div className="rounded-3xl w-full max-w-[800px] max-md:p-5 max-md:w-full max-md:max-w-screen-md max-sm:p-4 relative min-h-[600px]">
            <div className="flex flex-col gap-6 flex-1 mt-[67px] p-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-[28px] font-bold text-indigo-950 dark:text-white">Ingressos</h1>
                {ticketTypes.length > 0 && !ticketsLoading && (
                  <Button className="bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white font-bold px-4 py-2 rounded-lg shadow h-[38px]" onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setEditingId(null); setTicketName(""); setMaxTickets(""); setPrice(""); setDescription(""); setIsAbsorbFee(false); setIsPrivate(false); setIsFacePass(false); setDrawerOpen(true); }}>
                    Adicionar mais ingressos
                  </Button>
                )}
              </div>
              {/* O botão flutuante de Continuar para publicar ficará fixo no canto inferior direito (adicionado ao final da página) */}

              {/* Lista de ingressos criados (Ticket Types) */}
              {ticketsLoading ? (
                <>
                  <div className="relative w-full">
                    <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-6 mb-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <div>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-3 w-24 mb-1" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <hr className="my-3 border-gray-100" />
                      <div className="flex justify-between items-center text-sm">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full">
                    <div className="bg-white dark:bg-[#242424] rounded-2xl border border-[#E5E7EB] dark:border-[#1F1F1F] p-6 mb-4 shadow-sm" style={{ marginLeft: HALF_INDENT_PX, width: `calc(100% - ${HALF_INDENT_PX}px)` }}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="h-4 w-4" />
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Skeleton className="h-6 w-32" />
                              <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-24 mb-1" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <hr className="my-3 border-gray-100" />
                      <div className="flex justify-between items-center text-sm">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : ticketTypes.map((t: any, index: number) => {
                const isParentWithHalf = !t.isHalf && !!ticketTypes[index + 1] && ticketTypes[index + 1].isHalf && ticketTypes[index + 1].parentId === t.id;
                const rawName = t.name || 'Nome do ingresso';
                const displayName = t.isHalf ? (rawName.replace(/\s*-\s*Meia-entrada\s*$/i, '') || rawName) : rawName;
                const feeRaw = (t.price ?? 0) * (serviceFeePercent ?? 0);
                const fee = round2(feeRaw);
                const receive = round2(t.absorbFee ? (t.price - fee) : t.price);
                return (
                  <div key={t.id} className="relative w-full">
                    {/* Animated deletion effect */}
                    <div
                      className={`bg-white dark:bg-[#242424] rounded-2xl border p-6 relative transition-all duration-700 ${isParentWithHalf ? 'mb-0' : 'mb-4'} shadow-sm ${draggingId === t.id ? 'opacity-70' : ''} ${deleteId === t.id ? 'border-red-300 animate-delete-ticket' : 'border-[#E5E7EB] dark:border-[#1F1F1F]'}`}
                      style={t.isHalf ? { marginLeft: HALF_INDENT_PX / 2, width: `calc(100% - ${HALF_INDENT_PX / 2}px)`, marginTop: '-8px' } : undefined}
                      draggable={!t.isHalf}
                      onDragStart={(e) => {
                        if (t.isHalf) { e.preventDefault(); return; }
                        setDraggingId(t.id);
                        e.dataTransfer.setData('text/plain', t.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        // decide before/after based on cursor Y relative to element midpoint
                        try {
                          const el = e.currentTarget as HTMLElement;
                          const r = el.getBoundingClientRect();
                          const cursorY = e.clientY;
                          const pos = cursorY < (r.top + r.height / 2) ? 'before' : 'after';
                          const targetId = t.isHalf ? (ticketTypes.find((x: any) => x.id === t.parentId)?.id || t.id) : t.id;
                          setDragOverId(targetId);
                          setDragOverPosition(pos as 'before' | 'after');
                        } catch (_) {
                          setDragOverId(t.id);
                          setDragOverPosition(null);
                        }
                      }}
                      onDragLeave={() => { setDragOverId(null); setDragOverPosition(null); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = draggingId || e.dataTransfer.getData('text/plain');
                        const pos = dragOverPosition;
                        setDragOverId(null);
                        setDragOverPosition(null);
                        setDraggingId(null);
                        if (!sourceId || sourceId === t.id) return;
                        const src = groupOf(ticketTypes, sourceId);
                        if (src.startIdx < 0 || src.count === 0) return;
                        const list = [...ticketTypes];
                        const moved = list.splice(src.startIdx, src.count);
                        const normalizedTargetId = t.isHalf ? t.parentId : t.id;
                        let targetIdx = list.findIndex((x) => x.id === normalizedTargetId);
                        if (targetIdx < 0) targetIdx = 0;
                        // If the target has an adjacent half-child, treat parent+child as a single group
                        let groupEndIdx = targetIdx + 1; // default: after parent only
                        const childIdx = list.findIndex((x) => x.parentId === normalizedTargetId);
                        if (childIdx === targetIdx + 1) {
                          groupEndIdx = childIdx + 1; // position after the child
                        }
                        // decide insertion index: before parent (targetIdx) or after the whole group (groupEndIdx)
                        let insertIdx = (pos === 'after') ? groupEndIdx : targetIdx;
                        // account for the earlier splice that removed the moved items
                        if (src.startIdx < insertIdx) insertIdx = Math.max(0, insertIdx - src.count);
                        // if insertion would still fall inside the moved block, ignore
                        if (insertIdx >= src.startIdx && insertIdx <= src.startIdx + src.count) return;
                        list.splice(insertIdx, 0, ...moved);
                        reorderTickets(list);
                      }}
                    >
                      {/* visual indicator for before/after insertion while dragging */}
                      {dragOverId === (t.isHalf ? (ticketTypes.find((x: any) => x.id === t.parentId)?.id || t.id) : t.id) && dragOverPosition === 'before' && (
                        <div className="absolute left-0 right-0 top-0 h-1 bg-indigo-500 rounded-t-2xl z-20" />
                      )}
                      {dragOverId === (t.isHalf ? (ticketTypes.find((x: any) => x.id === t.parentId)?.id || t.id) : t.id) && dragOverPosition === 'after' && (
                        <div className="absolute left-0 right-0 bottom-0 h-1 bg-indigo-500 rounded-b-2xl z-20" />
                      )}
                      {pendingDeleteId === t.id && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#0b0b0b]/80 z-10 rounded-2xl border-2 border-red-300 animate-fade-in">
                          <svg className="w-16 h-16 text-red-400 animate-trash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6m5 10v-6" />
                          </svg>
                          <div className="mt-4 text-lg font-bold text-red-500 animate-slide-up">Jogando fora esse ingresso…</div>
                        </div>
                      )}

                      {/* Top row: name + badge on left, price + sold + menu on right */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {!t.isHalf && (
                            <div className="mt-0.5 text-gray-400 cursor-grab select-none" title="Arraste para reordenar">
                              <GripVertical className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-bold text-[#091747] dark:text-white">{displayName}</div>
                              {!t.isHalf ? (
                                t.maxQuantity === 0 ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#2A2AD7] text-white border border-[#2A2AD7] text-[12px]">ESGOTADO</span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[12px]">PRONTO</span>
                                )
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFF4F0] text-[#EF4118] border border-[#FFBCA3] text-[12px]">MEIA ENTRADA</span>
                              )}
                            </div>
                            {/* sales period removed from card header as per design */}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-[#091747] text-lg font-bold">{Number(t.price || 0) === 0 ? 'Gratuito' : formatBRL(Number(t.price || 0))}</div>
                          <div className="text-sm text-slate-500">0 / {t.maxQuantity}</div>
                          {!t.isHalf && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1F1F1F] flex items-center justify-center text-slate-600 dark:text-slate-300" aria-label="Ações do ingresso">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                                <DropdownMenuItem onClick={() => {
                                  setEditingId(t.id);
                                  setTicketName(t.name || "");
                                  setMaxTickets(String(t.maxQuantity ?? ""));
                                  setPrice(String(t.price ?? ""));
                                  setIsFree(Number(t.price || 0) === 0);
                                  setDescription(t.description || "");
                                  setIsAbsorbFee(!!t.absorbFee);
                                  setIsPrivate(!!t.isPrivate);
                                  setIsFacePass(!!t.isFacePass);
                                  setPerUserLimit(String(t.perUserLimit ?? ""));
                                  try {
                                    if (t.salesStart) {
                                      const d = new Date(t.salesStart);
                                      const yyyy = d.getFullYear();
                                      const mm = String(d.getMonth() + 1).padStart(2,'0');
                                      const dd = String(d.getDate()).padStart(2,'0');
                                      const hh = String(d.getHours()).padStart(2,'0');
                                      const mi = String(d.getMinutes()).padStart(2,'0');
                                      setSalesStartDate(`${yyyy}-${mm}-${dd}`);
                                      setSalesStartTime(`${hh}:${mi}`);
                                    } else { setSalesStartDate(""); setSalesStartTime(""); }
                                    if (t.salesEnd) {
                                      const d2 = new Date(t.salesEnd);
                                      const yyyy2 = d2.getFullYear();
                                      const mm2 = String(d2.getMonth() + 1).padStart(2,'0');
                                      const dd2 = String(d2.getDate()).padStart(2,'0');
                                      const hh2 = String(d2.getHours()).padStart(2,'0');
                                      const mi2 = String(d2.getMinutes()).padStart(2,'0');
                                      setSalesEndDate(`${yyyy2}-${mm2}-${dd2}`);
                                      setSalesEndTime(`${hh2}:${mi2}`);
                                    } else { setSalesEndDate(""); setSalesEndTime(""); }
                                  } catch (_) {
                                    setSalesStartDate(""); setSalesStartTime(""); setSalesEndDate(""); setSalesEndTime("");
                                  }
                                  setCreateHalf(false);
                                  setDrawerOpen(true);
                                }}>
                                  <Pencil className="w-4 h-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setDuplicatePendingId(t.id);
                                  setDuplicateName(t.name ? `${t.name} (Cópia)` : 'Cópia de ingresso');
                                }} className="flex items-center gap-2 whitespace-nowrap">
                                  <Copy className="w-4 h-4 mr-2" /> Duplicar
                                </DropdownMenuItem>
                                {t.maxQuantity === 0 ? (
                                  <DropdownMenuItem onClick={() => { setReopenPendingId(t.id); setReopenValue('10'); }} className="flex items-center gap-2 whitespace-nowrap">
                                    <Tag className="w-4 h-4 mr-2" /> Reabrir vendas
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setMarkSoldPendingId(t.id)} className="flex items-center gap-2 whitespace-nowrap">
                                    <Tag className="w-4 h-4 mr-2" /> Marcar como esgotado
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-red-600 focus:text-red-700 whitespace-nowrap" onSelect={() => setDeleteId(t.id)}>
                                  <Trash className="w-4 h-4 mr-2" /> Apagar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* removed dividing hr between cards per design */}
                  </div>
                );
              })}

              {/* Sem fallback legado: quando não houver TicketTypes, mostramos apenas o card grande para criar */}

              {/* Removido fallback legado: forçamos o novo modelo baseado em TicketTypes */}
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                {/* Botão grande de criar ingressos só aparece quando ainda não há TicketTypes */}
                {(ticketTypes.length === 0) && !ticketsLoading && (
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      className="group bg-white dark:bg-[#242424] rounded-xl shadow p-6 flex items-center gap-4 w-full transition-all duration-150 border border-transparent dark:border-[#1F1F1F] hover:border-indigo-200 hover:shadow-lg hover:bg-indigo-50 dark:hover:bg-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 text-[26px] font-regular group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-all">+</span>
                      <span className="font-semibold text-indigo-950 dark:text-white group-hover:text-indigo-700 transition-colors">Criar novos ingressos</span>
                    </button>
                  </DrawerTrigger>
                )}
                <DrawerContent>
                  <DrawerHeader className="p-6 pb-2 border-b border-gray-100 dark:border-[#1F1F1F]">
                    <DrawerTitle className="text-xl font-bold text-indigo-950 dark:text-white">{editingId ? 'Editar ingresso' : 'Configurar ingresso'}</DrawerTitle>
                    <DrawerDescription className="dark:text-slate-300">Defina o período de vendas e as informações do ingresso.</DrawerDescription>
                  </DrawerHeader>
                  <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                    {/* Tabs Pago/Gratuito */}
                    <Tabs value={isFree ? 'gratuito' : 'pago'} onValueChange={(v) => {
                      const free = v === 'gratuito';
                      setIsFree(free);
                      if (free) {
                        setPrice('0');
                        setIsAbsorbFee(false);
                      }
                    }} className="w-full">
                      <TabsList className="flex gap-2 bg-indigo-50 rounded-lg p-1 w-full mb-2">
                        <TabsTrigger value="pago" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-lg text-base font-semibold">Pago</TabsTrigger>
                        <TabsTrigger value="gratuito" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 rounded-lg text-base font-semibold">Gratuito</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Label className="mt-2">Nome do ingresso</Label>
                    <Input placeholder="Nome do ingresso" value={ticketName} onChange={e => setTicketName(e.target.value)} className="dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white" />
                    <Label>Quantidade máxima de ingressos</Label>
                    <Input placeholder="Quantidade máxima de ingressos" type="number" min={1} value={maxTickets} onChange={e => setMaxTickets(e.target.value)} className="dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white" />
                    {!isFree && (
                      <>
                        <Label>Preço</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-600">R$</span>
                          <Input
                            placeholder="Preço"
                            type="text"
                            value={priceFocused ? priceRaw : (price === '' ? '' : formatBRLNoSymbol(Number(price)))}
                            onFocus={(e) => {
                              setPriceFocused(true);
                              setPriceRaw(price ? price.replace('.', ',') : '');
                            }}
                            onBlur={(e) => {
                              const raw = String(priceRaw || '').replace(/[^0-9,\.]/g, '');
                              if (!raw) {
                                setPrice('');
                                setPriceFocused(false);
                                return;
                              }
                              const normalized = raw.replace(/,/g, '.');
                              const parts = normalized.split('.');
                              let numStr = normalized;
                              if (parts.length > 2) {
                                const dec = parts.pop();
                                numStr = parts.join('') + '.' + dec;
                              }
                              const n = parseFloat(numStr);
                              if (Number.isNaN(n)) {
                                setPrice('');
                              } else {
                                setPrice((round2(n)).toFixed(2));
                              }
                              setPriceFocused(false);
                            }}
                            onChange={e => {
                              const val = String(e.target.value || '');
                              const cleaned = val.replace(/[^0-9,\.]/g, '');
                              setPriceRaw(cleaned);
                            }}
                            className="pl-10 dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between text-sm mt-1 mb-2">
                      {(() => {
                        const p = String(price || '').trim();
                        const priceNum = p === '' ? 0 : Number(p.replace(',', '.')) || 0;
                        const total = isFree ? 0 : (priceNum + (isAbsorbFee ? 0 : priceNum * (serviceFeePercent ?? 0)));
                        return (
                          <span className="text-[#091747] font-medium">Total do comprador: {formatBRL(total)}</span>
                        );
                      })()}
                      <a href="#" className="text-indigo-700 font-medium hover:underline">Ver detalhes</a>
                    </div>
                    <div className="flex items-center gap-3 bg-indigo-50 rounded-lg px-4 py-3">
                      <span className="text-[#091747] dark:text-white text-sm flex-1">Absorver o valor da taxa, ou seja, o cliente não pagará pela taxa de serviço da Fauves.</span>
                      <Switch checked={isAbsorbFee} onCheckedChange={setIsAbsorbFee} disabled={isFree} />
                    </div>
                    
                    <div className="flex justify-center">
                      <button type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(v => !v)} className="flex items-center gap-2 font-semibold text-indigo-600 mt-8 mb-1 hover:underline">
                        <span>Configurações avançadas</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                    </div>
                    {advancedOpen && (
                      <>
                        <Label>Descrição</Label>
                        <Textarea placeholder="Explique para os participantes mais sobre esse ingresso." className="resize-none dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white" value={description} onChange={e => setDescription(e.target.value)} />
                        <div className="flex items-center gap-2">
                          <Label>Quantidade máxima por usuário</Label>
                            <div className="relative inline-block">
                              <button
                                ref={perUserBtnRef}
                                type="button"
                                aria-label="Informação sobre quantidade máxima por usuário"
                                onMouseEnter={() => setShowPerUserTooltip(true)}
                                onMouseLeave={() => setShowPerUserTooltip(false)}
                                onFocus={() => setShowPerUserTooltip(true)}
                                onBlur={() => setShowPerUserTooltip(false)}
                                className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#1f1f1f] text-slate-600 dark:text-slate-300 text-xs"
                              >
                                <Info className="w-3 h-3" />
                              </button>
                              {perUserTooltipPos && perUserTooltipPos.left != null && createPortal(
                                <div
                                  role="tooltip"
                                  style={{ position: 'fixed', left: perUserTooltipPos.left, top: perUserTooltipPos.top, transform: 'translate(-50%, -100%)' }}
                                  className="z-50 max-w-[calc(100vw-48px)] w-[280px] bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] text-[12px] text-slate-700 dark:text-slate-300 p-3 rounded-lg shadow-lg whitespace-normal break-words"
                                >
                                  <div className="leading-snug">
                                    A quantidade mínima por compra deste ingresso é definida em 1. Abaixo, a quantidade máxima que o usuário pode comprar deste ingresso.
                                  </div>
                                </div>,
                                document.body
                              )}
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-2 w-full">
                          <div className="w-full">
                            <Label className="mb-1 block">Início das vendas</Label>
                            <div className="flex gap-2 w-full">
                              <Input
                                className="flex-1 dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                                type="date"
                                value={salesStartDate}
                                min={todayYmd}
                                onFocus={e => { (e.currentTarget as any).showPicker?.(); }}
                                onChange={e => {
                                  let v = e.target.value;
                                  if (v && v < todayYmd) v = todayYmd;
                                  // If end exists and is before new start date, align
                                  if (salesEndDate && v && salesEndDate < v) {
                                    setSalesEndDate(v);
                                  }
                                  setSalesStartDate(v);
                                  // If same day and endTime exists, ensure endTime >= startTime + 30min
                                  if (v && salesEndDate === v && salesStartTime && salesEndTime) {
                                    const minEnd = addMinutesToTime(salesStartTime, 30);
                                    if (salesEndTime < minEnd) setSalesEndTime(minEnd as any);
                                  }
                                }}
                              />
                              <Input
                                className="flex-1 dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                                type="time"
                                value={salesStartTime}
                                min={startTimeMin}
                                disabled={!salesStartDate}
                                onChange={e => {
                                  const v = e.target.value;
                                  setSalesStartTime(v);
                                  // If end is same day, ensure endTime >= startTime + 30min
                                  if (salesEndDate && salesEndDate === salesStartDate && salesEndTime) {
                                    const minEnd = addMinutesToTime(v, 30);
                                    if (salesEndTime < minEnd) setSalesEndTime(minEnd as any);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-full">
                            <Label className="mb-1 block">Término das vendas</Label>
                            <div className="flex gap-2 w-full">
                              <Input
                                className="flex-1 dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                                type="date"
                                value={salesEndDate}
                                min={endDateMin}
                                onFocus={e => { (e.currentTarget as any).showPicker?.(); }}
                                onChange={e => {
                                  let v = e.target.value;
                                  const min = endDateMin;
                                  if (v && min && v < min) v = min as string;
                                  setSalesEndDate(v);
                                  // If same day as start and endTime exists but less than start+30, align
                                  if (v && v === salesStartDate && salesStartTime && salesEndTime) {
                                    const minEnd = addMinutesToTime(salesStartTime, 30);
                                    if (salesEndTime < minEnd) setSalesEndTime(minEnd as any);
                                  }
                                }}
                              />
                              <Input
                                className="flex-1 dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                                type="time"
                                value={salesEndTime}
                                min={endTimeMin}
                                disabled={!salesEndDate}
                                onChange={e => setSalesEndTime(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        {/* Meia-entrada automática 40/60 - custom card (visually similar to FacePass) */}
                        <div className="mt-3">
                          <div className="flex items-center gap-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm text-2xl">
                              {/* Inline emoji fallback. To use a Noto animated emoji, replace the contents below with an <img src="<NOTO_ANIM_URL>" alt="emoji" /> */}
                              <span aria-hidden className={`${createHalfAnim ? 'emoji-pop' : ''}`}>🥳</span>
                            </div>
                            <div className="flex-1 relative">
                              <div className="font-semibold text-[#091747] dark:text-white flex items-center gap-2">
                                <span>Criar automaticamente meia-entrada</span>
                                <div className="relative inline-block">
                                  <button
                                    ref={halfBtnRef}
                                    type="button"
                                    aria-label="Informação sobre criar automaticamente meia-entrada"
                                    onMouseEnter={() => setShowHalfInfoTooltip(true)}
                                    onMouseLeave={() => setShowHalfInfoTooltip(false)}
                                    onFocus={() => setShowHalfInfoTooltip(true)}
                                    onBlur={() => setShowHalfInfoTooltip(false)}
                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#1f1f1f] text-slate-600 dark:text-slate-300 text-xs"
                                  >
                                    <Info className="w-3 h-3" />
                                  </button>
                                  {halfTooltipPos && halfTooltipPos.left != null && createPortal(
                                    <div
                                      role="tooltip"
                                      style={{ position: 'fixed', left: halfTooltipPos.left, top: halfTooltipPos.top, transform: 'translate(-50%, -100%)' }}
                                      className="z-50 max-w-[calc(100vw-48px)] w-[300px] bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] text-[12px] text-slate-700 dark:text-slate-300 p-3 rounded-lg shadow-lg whitespace-normal break-words"
                                    >
                                      <div className="leading-snug">
                                        Ao ativar, serão criados automaticamente ingressos de meia-entrada (40%) para cada ingresso inteiro (60%). Não editável individualmente.
                                      </div>
                                    </div>,
                                    document.body
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <Switch checked={createHalf} onCheckedChange={setCreateHalf} disabled={isFree || !!editingId} />
                            </div>
                          </div>
                        </div>
                        {/* Ingresso privado (styled card like meia-entrada) */}
                        <div className="mt-0">
                          <div className="flex items-center gap-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm text-2xl">
                              {/* Lock emoji as visual for private ticket */}
                              <span aria-hidden className={`${privateAnim ? 'emoji-pop' : ''}`}>🔒</span>
                            </div>
                            <div className="flex-1 relative">
                              <div className="font-semibold text-[#091747] dark:text-white flex items-center gap-2">
                                <span>Ingresso privado</span>
                                <div className="relative inline-block">
                                  <button
                                    ref={privateBtnRef}
                                    type="button"
                                    aria-label="Informação sobre ingresso privado"
                                    onMouseEnter={() => setShowPrivateTooltip(true)}
                                    onMouseLeave={() => setShowPrivateTooltip(false)}
                                    onFocus={() => setShowPrivateTooltip(true)}
                                    onBlur={() => setShowPrivateTooltip(false)}
                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#1f1f1f] text-slate-600 dark:text-slate-300 text-xs"
                                  >
                                    <Info className="w-3 h-3" />
                                  </button>
                                  {privateTooltipPos && privateTooltipPos.left != null && createPortal(
                                    <div
                                      role="tooltip"
                                      style={{ position: 'fixed', left: privateTooltipPos.left, top: privateTooltipPos.top, transform: 'translate(-50%, -100%)' }}
                                      className="z-50 max-w-[calc(100vw-48px)] w-[300px] bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] text-[12px] text-slate-700 dark:text-slate-300 p-3 rounded-lg shadow-lg whitespace-normal break-words"
                                    >
                                      <div className="leading-snug">
                                        Ative esta opção para que este ingresso só seja acessível por convite/ link privado — ideal para ingressos restritos ou por lista.
                                      </div>
                                    </div>,
                                    document.body
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                            </div>
                          </div>
                        </div>
                        {/* FacePass card (orange) */}
                        <div className="mt-0">
                          <div className="flex items-center gap-4 p-3 rounded-xl bg-[#FFF4F0] border border-[#FFBCA3]">
                            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm text-2xl">
                              <span aria-hidden className={`${faceAnim ? 'emoji-pop' : ''}`}>🦊</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-[#EF4118]">FacePass by Fauves</div>
                              <div className="text-[#EF4118] text-xs">Ative o FacePass para que esse ingresso seja validado nessa modalidade.</div>
                            </div>
                            <div className="flex-shrink-0">
                              <Switch checked={isFacePass} onCheckedChange={setIsFacePass} />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <DrawerFooter className="flex flex-row gap-4 justify-between p-6 border-t border-gray-100 dark:border-[#1F1F1F]">
                    <DrawerClose asChild>
                      <Button variant="outline" className="flex-1">Cancelar</Button>
                    </DrawerClose>
                    <Button className="flex-1 bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white font-bold" onClick={handleSave} disabled={loading}>
                      {loading ? "Salvando..." : "Salvar"}
                    </Button>
                  </DrawerFooter>
                  {/* Feedback */}
                  {success && <div className="text-green-600 font-bold text-center mt-2">{success}</div>}
                  {error && <div className="text-red-600 font-bold text-center mt-2">{error}</div>}
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </div>
      </div>
      {/* Botão fixo Continuar para publicar (mesmo estilo do CreateEditEvent)
          Não mostrar quando já publicamos a página e existe ao menos 1 ingresso criado */}
      {!(eventStatus === 'Publicado' && ticketTypes.length > 0) && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={(e) => {
              if ((ticketTypes || []).length === 0) {
                // show tooltip explaining why publish is disabled
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setPublishTooltipPos({ left: r.left + r.width / 2, top: r.top - 8 });
                setShowPublishTooltip(true);
                return;
              }
              setFlowStep(3);
              setFlowVisible(true);
              setTimeout(() => goToPublish(), 80);
            }}
            onMouseEnter={(e) => {
              if ((ticketTypes || []).length === 0) {
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setPublishTooltipPos({ left: r.left + r.width / 2, top: r.top - 8 });
                setShowPublishTooltip(true);
              }
            }}
            onMouseLeave={() => setShowPublishTooltip(false)}
            disabled={(ticketTypes || []).length === 0}
            className={`bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-12 min-w-[180px] rounded-md shadow-lg px-4 flex items-center justify-center gap-2 whitespace-nowrap ${((ticketTypes || []).length === 0) ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span>Continuar para publicar</span>
            <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Button>
        </div>
      )}
      <StepFlowOverlay visible={flowVisible} activeStep={flowStep} subtitle={flowStep === 2 ? "Preparando criação de ingressos…" : undefined} />
      {showPublishTooltip && publishTooltipPos && createPortal(
        <div
          role="tooltip"
          style={{ position: 'fixed', left: publishTooltipPos.left, top: publishTooltipPos.top, transform: 'translate(-50%, -100%)' }}
          className="z-50 max-w-[320px] w-[260px] bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] text-[12px] text-slate-700 dark:text-slate-300 p-3 rounded-lg shadow-lg whitespace-normal break-words"
        >
          Você precisa criar ao menos 1 ingresso antes de publicar o evento.
        </div>,
        document.body
      )}
      {/* Modal único de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar ingresso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O tipo de ingresso será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteLoading}
              onClick={async () => {
                if (!deleteId) return;
                setPendingDeleteId(deleteId); // inicia animação
                setDeleteLoading(true);
                setDeleteId(null); // fecha popup imediatamente
                try {
                  await fetchApi(`/api/ticket-type/${deleteId}`, { method: 'DELETE' });
                  await fetchTickets();
                } finally {
                  setDeleteLoading(false);
                  setPendingDeleteId(null); // encerra animação após backend remover
                }
              }}
            >
              {deleteLoading ? 'Apagando…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Modal para confirmar marcar como esgotado */}
      <AlertDialog open={!!markSoldPendingId} onOpenChange={(open) => { if (!open) setMarkSoldPendingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar ingresso como esgotado?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação vai fechar as vendas deste tipo de ingresso. Você poderá reabrir ajustando a quantidade depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markSoldLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={markSoldLoading}
              onClick={async () => {
                if (!markSoldPendingId) return;
                setMarkSoldLoading(true);
                try {
                  await handleMarkAsSold(markSoldPendingId);
                } finally {
                  setMarkSoldLoading(false);
                  setMarkSoldPendingId(null);
                }
              }}
            >
              {markSoldLoading ? 'Processando…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Modal para reabrir vendas (definir nova quantidade) */}
      <AlertDialog open={!!reopenPendingId} onOpenChange={(open) => { if (!open) setReopenPendingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir vendas</AlertDialogTitle>
            <AlertDialogDescription>
              Informe a nova quantidade máxima disponível para este tipo de ingresso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6">
            <Label className="mb-2">Quantidade máxima</Label>
            <Input type="number" min={1} value={reopenValue} onChange={e => setReopenValue(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reopenLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-indigo-700 hover:bg-indigo-800 text-white"
              disabled={reopenLoading}
              onClick={async () => {
                if (!reopenPendingId) return;
                const q = Number(reopenValue || 0);
                if (!Number.isFinite(q) || q < 1) {
                  toast?.({ title: 'Erro', description: 'Informe uma quantidade válida.' });
                  return;
                }
                setReopenLoading(true);
                try {
                  await handleReopenTicket(reopenPendingId, q);
                } finally {
                  setReopenLoading(false);
                  setReopenPendingId(null);
                }
              }}
            >
              {reopenLoading ? 'Processando…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Modal para escolher nome ao duplicar ingresso */}
      <AlertDialog open={!!duplicatePendingId} onOpenChange={(open) => { if (!open) setDuplicatePendingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar ingresso</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha um nome para a cópia do ingresso. Você pode editar mais detalhes depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6">
            <Label className="mb-2">Nome da cópia</Label>
            <Input value={duplicateName} onChange={e => setDuplicateName(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={duplicateLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-indigo-700 hover:bg-indigo-800 text-white"
              disabled={duplicateLoading}
              onClick={async () => {
                if (!duplicatePendingId) return;
                setDuplicateLoading(true);
                try {
                  await handleDuplicateTicket(duplicatePendingId, duplicateName);
                } finally {
                  setDuplicateLoading(false);
                  setDuplicatePendingId(null);
                }
              }}
            >
              {duplicateLoading ? 'Duplicando…' : 'Duplicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CreateTickets;
