// Adiciona a propriedade ao tipo Window
declare global {
  interface Window {
    reorderCategoriesTimeout?: any;
  }
}
import AppHeader from "@/components/AppHeader";
import { OrganizerLayout } from "@/components/OrganizerLayout";
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from 'react-dom';
import { Reorder } from "framer-motion";
import DndTicketList from "@/components/DndTicketList";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { WarpDialog } from "@/components/WarpDialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SidebarMenu from "@/components/SidebarMenu";
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import StepFlowOverlay from "@/components/overlays/StepFlowOverlay";
import { Pencil, Trash, MoreVertical, GripVertical, Info, ChevronDown, Copy, Tag, MapPin, FolderInput } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import CheckIcon from "../components/icons/CheckIcon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const CreateTickets: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();

  // Mocks para estados e funções faltantes
  // Funções e estados faltantes reportados nos erros
  const moveTicketToCategory = async (ticketId: string, categoryId: string | null) => {
    // Store previous state for rollback
    const previousTickets = [...ticketTypes];

    // Optimistic update - immediately update UI
    setTicketTypes(prev => prev.map(t =>
      t.id === ticketId ? { ...t, categoryId: categoryId || null } : t
    ));

    try {
      const res = await fetchApi(`/api/ticket-type/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categoryId: categoryId || null })
      });

      if (!res.ok) {
        // Rollback on failure
        setTicketTypes(previousTickets);
        let msg = 'Erro ao mover ingresso';
        try { const j = await res.json(); if (j?.message) msg = j.message; } catch { }
        toast?.({ title: 'Erro', description: msg, variant: 'destructive' });
        return;
      }

      toast?.({ title: 'Sucesso', description: categoryId ? 'Ingresso movido para categoria' : 'Ingresso removido da categoria' });
    } catch (e) {
      // Rollback on error
      setTicketTypes(previousTickets);
      toast?.({ title: 'Erro', description: 'Erro de conexão ao mover ingresso', variant: 'destructive' });
    }
  };
  const [draggingCategoryId, setDraggingCategoryId] = useState<string>("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState<string>("");
  const reorderTicketsTimeoutRef = useRef<any>(null);
  const reorderTickets = (finalList: any[]) => {
    // Debounce to avoid too many API calls while dragging
    if (reorderTicketsTimeoutRef.current) clearTimeout(reorderTicketsTimeoutRef.current);
    reorderTicketsTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        // Update order for each ticket
        for (let i = 0; i < finalList.length; i++) {
          await fetchApi(`/api/ticket-type/${finalList[i].id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ order: (i + 1) * 10 })
          });
        }
        toast?.({ title: 'Ordem atualizada' });
      } catch (e) {
        toast?.({ title: 'Erro', description: 'Erro ao reordenar ingressos', variant: 'destructive' });
      }
    }, 500);
  };
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const formatBRL = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const formatBRLNoSymbol = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const nameCheckTimeoutRef = useRef<any>(null);
  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    // Validação básica
    if (!ticketName || !price || !maxTickets || !eventId) {
      setError("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }
    try {
      const payload = {
        name: ticketName,
        price: parseFloat(price.replace(',', '.')),
        maxQuantity: parseInt(maxTickets),
        description,
        eventId,
        isFree,
        isAbsorbFee,
        isPrivate,
        // Adicione outros campos necessários aqui
      };
      const res = await fetchApi(`/api/ticket-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Erro ao criar ingresso.");
        setLoading(false);
        return;
      }
      setSuccess("Ingresso criado com sucesso!");
      setLoading(false);
      setDrawerOpen(false);
      // Limpa campos
      setTicketName("");
      setPrice("");
      setMaxTickets("");
      setDescription("");
      setIsFree(false);
      setIsAbsorbFee(false);
      setIsPrivate(false);
      // Atualiza lista de ingressos
      if (typeof fetchTickets === 'function') fetchTickets();
    } catch (e) {
      setError("Erro inesperado ao criar ingresso.");
      setLoading(false);
    }
  };
  const [categoryAdvancedOpen, setCategoryAdvancedOpen] = useState(false);
  const [publishTooltipPos, setPublishTooltipPos] = useState<any>(null);
  const [showPublishTooltip, setShowPublishTooltip] = useState(false);
  const [perUserTooltipPos, setPerUserTooltipPos] = useState<any>(null);
  const [halfTooltipPos, setHalfTooltipPos] = useState<any>(null);
  const [privateTooltipPos, setPrivateTooltipPos] = useState<any>(null);
  // Step type mock
  type Step = number | 'criar' | 'editar' | 'publicar';
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIncludeInLimit, setCategoryIncludeInLimit] = useState(false);
  const [categoryLocation, setCategoryLocation] = useState("");
  const [categoryImage, setCategoryImage] = useState<any>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [flowStep, setFlowStep] = useState<1 | 2 | 3>(2);
  const [flowVisible, setFlowVisible] = useState(false);
  const [showPerUserTooltip, setShowPerUserTooltip] = useState(false);
  const [perUserBtnRef, setPerUserBtnRef] = useState<any>({ current: null });
  const [showHalfInfoTooltip, setShowHalfInfoTooltip] = useState(false);
  const [halfBtnRef, setHalfBtnRef] = useState<any>({ current: null });
  const [createHalfAnim, setCreateHalfAnim] = useState(false);
  const [privateAnim, setPrivateAnim] = useState(false);
  const [faceAnim, setFaceAnim] = useState(false);
  const [showPrivateTooltip, setShowPrivateTooltip] = useState(false);
  const [privateBtnRef, setPrivateBtnRef] = useState<any>({ current: null });
  // Estados de loading faltantes
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [markSoldLoading, setMarkSoldLoading] = useState(false);
  const [reopenLoading, setReopenLoading] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [priceRaw, setPriceRaw] = useState("");
  const [priceFocused, setPriceFocused] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventStatus, setEventStatus] = useState<'Publicado' | 'Rascunho'>('Rascunho');
  // Mobile menu states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  // Map upload states
  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
  const [mapFile, setMapFile] = useState<any>(null);
  const [mapPreview, setMapPreview] = useState<string>("");
  const [mapUploading, setMapUploading] = useState(false);
  // Estados de loading adicionais
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  // Mocks para variáveis de categoria e datas
  const [categoryName, setCategoryName] = useState("");
  const [categoryMaxCapacity, setCategoryMaxCapacity] = useState("");
  const [categoryValidityStart, setCategoryValidityStart] = useState("");
  const [categoryValidityStartTime, setCategoryValidityStartTime] = useState("");
  const [categoryValidityEnd, setCategoryValidityEnd] = useState("");
  const [categoryValidityEndTime, setCategoryValidityEndTime] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  // Estados principais e helpers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [success, setSuccess] = useState("");
  const [originalCategoryId, setOriginalCategoryId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [perUserLimitNum, setPerUserLimitNum] = useState<number>(0);
  const [maxQ, setMaxQ] = useState<number>(0);
  const [startIso, setStartIso] = useState<string>("");
  const [endIso, setEndIso] = useState<string>("");
  const [eventStartTimestamp, setEventStartTimestamp] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [trimmedName, setTrimmedName] = useState("");
  const fetchTickets = async () => {
    if (!eventId) return;
    setTicketsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetchApi(`/api/ticket-type/event/${eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTicketTypes(Array.isArray(data) ? data : []);
      } else {
        setTicketTypes([]);
        toast?.({ title: 'Erro ao listar ingressos', description: 'Não foi possível obter os ingressos', variant: 'destructive' });
      }
    } catch (err) {
      setTicketTypes([]);
      toast?.({ title: 'Erro de conexão', description: String(err), variant: 'destructive' });
    } finally {
      setTicketsLoading(false);
    }
  };
  const [categories, setCategories] = useState<any[]>([]);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [eventId, setEventId] = useState<string>("");
  useEffect(() => {
    // Tenta pegar eventId da query string
    const params = new URLSearchParams(location.search);
    const eid = params.get("eventId");
    if (eid) setEventId(eid);
  }, [location.search]);

  // Load event details when eventId becomes available
  useEffect(() => {
    const loadEventDetails = async () => {
      if (!eventId) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetchApi(`/api/event/${eventId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEventName(data.name || '');
          if (data.startDate) {
            setEventStart(new Date(data.startDate).toLocaleDateString('pt-BR'));
          }
          // Set status based on event's published state
          if (data.published === true || data.status === 'PUBLISHED' || data.status === 'Publicado') {
            setEventStatus('Publicado');
          } else {
            setEventStatus('Rascunho');
          }
        }
      } catch (e) {
        console.error('Error loading event details:', e);
      }
    };
    loadEventDetails();
  }, [eventId]);

  // Load current event map once when eventId becomes available so UI can show status (check icon)
  useEffect(() => {
    const loadEventMap = async () => {
      if (!eventId) return;
      try {
        const res = await fetch(`/api/event/${eventId}`);
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const map = data?.map || null;
        if (map) setMapPreview(map);
      } catch (e) {
        // ignore
      }
    };
    loadEventMap();
  }, [eventId]);

  // Atualiza lista de ingressos ao montar ou quando eventId muda
  useEffect(() => {
    if (eventId) fetchTickets();
  }, [eventId]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<string | null>(null);
  const [ticketName, setTicketName] = useState<string>("");
  const [maxTickets, setMaxTickets] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [isFree, setIsFree] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [isAbsorbFee, setIsAbsorbFee] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [isFacePass, setIsFacePass] = useState<boolean>(false);
  const [perUserLimit, setPerUserLimit] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [salesStartDate, setSalesStartDate] = useState<string>("");
  const [salesStartTime, setSalesStartTime] = useState<string>("");
  const [salesEndDate, setSalesEndDate] = useState<string>("");
  const [salesEndTime, setSalesEndTime] = useState<string>("");
  const [createHalf, setCreateHalf] = useState<boolean>(false);
  const [duplicatePendingId, setDuplicatePendingId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState<string>("");
  const [moveToCategoryTicketId, setMoveToCategoryTicketId] = useState<string | null>(null);
  const [moveToCategoryTargetId, setMoveToCategoryTargetId] = useState<string>("");
  const [reopenPendingId, setReopenPendingId] = useState<string | null>(null);
  const [reopenValue, setReopenValue] = useState<string>("");
  const [markSoldPendingId, setMarkSoldPendingId] = useState<string | null>(null);

  // Função para buscar categorias do backend
  const fetchCategories = async () => {
    if (!eventId) {
      setCategories([]);
      return;
    }
    try {
      const res = await fetchApi(`/api/ticket-category/event/${eventId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } else {
        setCategories([]);
        console.error('Erro ao listar categorias');
      }
    } catch (err) {
      setCategories([]);
      console.error('Erro ao carregar categorias:', err);
    }
  };

  // Garantir que window.reorderCategoriesTimeout existe
  if (typeof window !== 'undefined' && window.reorderCategoriesTimeout === undefined) {
    (window as any).reorderCategoriesTimeout = null;
  }
  const serviceFeePercent = 0.1;
  const HALF_INDENT_PX = 40;
  // Estado para manter animação até backend remover

  // Carrega categorias quando eventId está disponível
  React.useEffect(() => {
    if (eventId) fetchCategories();
  }, [eventId]);

  // When opening the map drawer, pre-load existing event image (if any)
  useEffect(() => {
    const loadCurrentMap = async () => {
      if (!eventId) return;
      try {
        const res = await fetch(`/api/event/${eventId}`);
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        // Only show actual map, not banner
        const mapUrl = data?.map || null;
        if (mapUrl) setMapPreview(mapUrl);
      } catch (e) {
        // ignore
      }
    };
    if (mapDrawerOpen) {
      setMapFile(null);
      // if there's already a preview, keep it; attempt to refresh from backend
      loadCurrentMap();
    } else {
      // when closing, clear transient selection but keep preview
      setMapFile(null);
    }
  }, [mapDrawerOpen, eventId]);

  // Reorder categories
  const reorderCategories = async (newList: any[]) => {
    setCategories(newList);
    if (!eventId) return;
    // Debounce para não sobrecarregar o backend
    if (window.reorderCategoriesTimeout) clearTimeout(window.reorderCategoriesTimeout);
    window.reorderCategoriesTimeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        for (let i = 0; i < newList.length; i++) {
          await fetchApi(`/api/ticket-category/${newList[i].id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ order: (i + 1) * 10 })
          });
        }
        toast({ title: "Categorias reordenadas" });
      } catch (err) {
        toast({ title: "Erro ao reordenar categorias", description: String(err), variant: "destructive" });
      }
    }, 500);
  };

  const handleSaveCategory = async () => {
    if (!eventId) {
      toast?.({ title: 'Erro', description: 'ID do evento não encontrado', variant: 'destructive' });
      return;
    }

    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      toast?.({ title: 'Erro', description: 'Informe o nome da categoria', variant: 'destructive' });
      return;
    }

    // Validation for max capacity if provided
    if (categoryMaxCapacity) {
      const maxCap = Number(categoryMaxCapacity);
      if (!Number.isFinite(maxCap) || maxCap < 1) {
        toast?.({ title: 'Erro', description: 'Capacidade máxima deve ser pelo menos 1', variant: 'destructive' });
        return;
      }
    }

    // Validation for date ranges
    if ((!!categoryValidityStart && !categoryValidityStartTime) || (!categoryValidityStart && !!categoryValidityStartTime)) {
      toast?.({ title: 'Erro', description: 'Preencha data e horário de início', variant: 'destructive' });
      return;
    }
    if ((!!categoryValidityEnd && !categoryValidityEndTime) || (!categoryValidityEnd && !!categoryValidityEndTime)) {
      toast?.({ title: 'Erro', description: 'Preencha data e horário de término', variant: 'destructive' });
      return;
    }

    let startIso: string | null = null;
    let endIso: string | null = null;
    if (categoryValidityStart && categoryValidityStartTime) startIso = `${categoryValidityStart}T${categoryValidityStartTime}:00`;
    if (categoryValidityEnd && categoryValidityEndTime) endIso = `${categoryValidityEnd}T${categoryValidityEndTime}:00`;

    if (startIso && endIso) {
      const sd = new Date(startIso).getTime();
      const ed = new Date(endIso).getTime();
      if (ed <= sd) {
        toast?.({ title: 'Erro', description: 'O término deve ser posterior ao início', variant: 'destructive' });
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = editingCategoryId ? 'PUT' : 'POST';
      const url = editingCategoryId ? `/api/ticket-category/${editingCategoryId}` : "/api/ticket-category";

      // For now, send JSON (image upload can be added later)
      const res = await fetchApi(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventId,
          name: trimmedName,
          description: categoryDescription,
          maxCapacity: categoryMaxCapacity ? Number(categoryMaxCapacity) : null,
          includeInLimit: categoryIncludeInLimit,
          validityStart: startIso,
          validityEnd: endIso,
          location: categoryLocation || null,
        }),
      });

      if (res.ok) {
        toast?.({ title: 'Sucesso', description: editingCategoryId ? 'Categoria atualizada!' : 'Categoria criada!' });
        // Clear form
        setCategoryName("");
        setCategoryDescription("");
        setCategoryMaxCapacity("");
        setCategoryIncludeInLimit(false);
        setCategoryValidityStart("");
        setCategoryValidityStartTime("");
        setCategoryValidityEnd("");
        setCategoryValidityEndTime("");
        setCategoryLocation("");
        setCategoryImage(null);
        setCategoryImagePreview("");
        // Reload categories
        fetchCategories();
        // Close drawer
        setCategoryDrawerOpen(false);
        setEditingCategoryId(null);
      } else {
        let msg = "Erro ao salvar categoria.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch (_) { }
        toast?.({ title: 'Erro', description: msg, variant: 'destructive' });
      }
    } catch (e) {
      toast?.({ title: 'Erro', description: 'Erro de conexão ao salvar categoria', variant: 'destructive' });
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

  const handleDuplicateTicket = async (id: string, forcedName?: string) => {
    const t = ticketTypes.find(x => x.id === id);
    if (!t) {
      toast?.({ title: 'Erro', description: 'Ingresso não encontrado' });
      return;
    }
    // Ensure we have an eventId: prefer query param, fallback to ticket's eventId
    const targetEventId = eventId || t.eventId || t.event_id || null;
    if (!targetEventId) {
      toast?.({ title: 'Erro', description: 'ID do evento não encontrado. Não é possível duplicar.', variant: 'destructive' } as any);
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
        try { const j = await res.json().catch(() => null); if (j?.message) msg = j.message; } catch { }
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
            setSalesStartDate(d.toISOString().slice(0, 10));
            setSalesStartTime(d.toTimeString().slice(0, 5));
          } else { setSalesStartDate(''); setSalesStartTime(''); }
          if (created?.salesEnd) {
            const d2 = new Date(created.salesEnd);
            setSalesEndDate(d2.toISOString().slice(0, 10));
            setSalesEndTime(d2.toTimeString().slice(0, 5));
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
        try { const j = await res.json().catch(() => null); if (j?.message) msg = j.message; } catch { }
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
        try { const j = await res.json().catch(() => null); if (j?.message) msg = j.message; } catch { }
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
      {/* Mobile Main Menu */}
      <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileDrawerMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={location.pathname}
        organizations={[]}
        selectedOrg={undefined}
        selectOrganization={() => { }}
        user={user}
      />

      {/* Mobile Event Menu */}
      <EventMobileTopBar
        title="Ingressos"
        onMenuOpen={() => setEventMenuOpen(true)}
      />
      <EventMobileDrawer
        isOpen={eventMenuOpen}
        onClose={() => setEventMenuOpen(false)}
        currentPath={location.pathname}
        eventId={eventId || ''}
        eventName={eventName || 'Evento'}
        eventDate={eventStart ? eventStart : undefined}
        eventStatus={eventStatus}
        hasTickets={ticketTypes.length > 0}
        isPublished={eventStatus === 'Publicado'}
      />

      {/* Desktop Sidebars - Hidden on mobile */}
      <SidebarMenu className="max-md:hidden" />
      <div className="max-md:hidden">
        <EventDetailsSidebar
          eventName={eventName}
          eventDate={eventStart}
          eventStatus={eventStatus}
          onBack={() => navigate("/organizer-dashboard")}
          onStatusChange={() => { }}
          onViewEvent={() => { }}
          fixed
          fixedLeft={70}
          fixedWidth={300}
          fixedTop={0}
        />
      </div>
      <div className="flex-1 flex flex-col ml-[350px] max-md:ml-0">
        <AppHeader className="max-md:hidden" />
        <OrganizerLayout>

          <div className="flex-1 flex flex-col items-center px-8 max-sm:px-4 max-sm:pt-[118px]">
            <div className="rounded-3xl w-full max-w-[800px] max-sm:max-w-full relative min-h-[600px]">
              <div className="flex flex-col gap-6 max-sm:gap-4 flex-1 mt-[67px] max-sm:mt-4 p-8 max-sm:p-0">
                <div className="flex items-center justify-between mb-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
                  <h1 className="text-[28px] max-sm:text-[24px] font-bold text-indigo-950 dark:text-white max-sm:hidden">Ingressos</h1>
                  <div className="flex gap-2 items-center max-sm:flex-col max-sm:w-full">
                    <Button className="bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white font-bold px-4 py-2 rounded-lg shadow h-[38px] max-sm:w-full max-sm:h-[44px]" onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setEditingId(null); setOriginalCategoryId(null); setTicketName(""); setMaxTickets(""); setPrice(""); setDescription(""); setIsAbsorbFee(false); setIsPrivate(false); setIsFacePass(false); setSelectedCategoryId(""); setNameExists(false); setDrawerOpen(true); }}>
                      Adicionar mais ingressos
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-[38px] w-10 p-0 rounded-md flex items-center justify-center max-sm:hidden">
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#242424]">
                        <DropdownMenuItem onClick={() => { setEditingId(null); setOriginalCategoryId(null); setTicketName(""); setMaxTickets(""); setPrice(""); setDescription(""); setIsAbsorbFee(false); setIsPrivate(false); setIsFacePass(false); setSelectedCategoryId(""); setNameExists(false); setDrawerOpen(true); }}>
                          + Ingresso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingCategoryId(null); setCategoryName(""); setCategoryDescription(""); setCategoryMaxCapacity(""); setCategoryIncludeInLimit(false); setCategoryValidityStart(""); setCategoryValidityStartTime(""); setCategoryValidityEnd(""); setCategoryValidityEndTime(""); setCategoryLocation(""); setCategoryImage(null); setCategoryImagePreview(""); setCategoryDrawerOpen(true); }}>
                          Categoria de ingressos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMapDrawerOpen(true)} className="flex items-center justify-between">
                          <span>Adicionar mapa do evento</span>
                          {mapPreview ? (
                            <span className="ml-2 flex items-center">
                              <CheckIcon size={16} className="" />
                            </span>
                          ) : null}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile: Botões compactos (lado a lado) */}
                    <div className="hidden max-sm:flex w-full gap-2 mt-0">

                      <Button
                        variant="outline"
                        className="flex-1 h-[44px] items-center justify-center gap-2 dark:text-white dark:border-[#1F1F1F] dark:hover:bg-[#1F1F1F] px-2"
                        onClick={() => { setEditingCategoryId(null); setCategoryName(""); setCategoryDescription(""); setCategoryMaxCapacity(""); setCategoryIncludeInLimit(false); setCategoryValidityStart(""); setCategoryValidityStartTime(""); setCategoryValidityEnd(""); setCategoryValidityEndTime(""); setCategoryLocation(""); setCategoryImage(null); setCategoryImagePreview(""); setCategoryDrawerOpen(true); }}
                      >
                        <Tag className="w-4 h-4 shrink-0" />
                        <span className="truncate text-xs">Categoria</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-[44px] items-center justify-center gap-2 dark:text-white dark:border-[#1F1F1F] dark:hover:bg-[#1F1F1F] px-2"
                        onClick={() => setMapDrawerOpen(true)}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate text-xs">Mapa</span>
                        </div>
                        {mapPreview && <CheckIcon size={16} className="text-green-600 shrink-0" />}
                      </Button>
                    </div>
                  </div>
                </div>
                {/* O botão flutuante de Continuar para publicar ficará fixo no canto inferior direito (adicionado ao final da página) */}

                {/* Lista de ingressos criados (Ticket Types) */}
                {ticketsLoading ? (
                  <>
                    <div className="relative w-full">
                      <div className="bg-white dark:bg-[#242424] rounded-lg border border-[#E5E7EB] dark:border-[#1F1F1F] p-4 mb-2 shadow-sm">
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
                      <div className="bg-white dark:bg-[#242424] rounded-lg border border-[#E5E7EB] dark:border-[#1F1F1F] p-4 mb-4 shadow-sm" style={{ marginLeft: HALF_INDENT_PX, width: `calc(100% - ${HALF_INDENT_PX}px)` }}>
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
                ) : (
                  <>
                    {/* DndTicketList handles all ticket and category rendering */}
                    <DndTicketList
                      categories={categories}
                      tickets={ticketTypes}
                      onTicketsChange={setTicketTypes}
                      onCategoriesChange={setCategories}
                      onMoveToCategory={moveTicketToCategory}
                      onReorderTickets={reorderTickets}
                      onReorderCategories={reorderCategories}
                      onEditTicket={(t) => {
                        setEditingId(t.id);
                        setOriginalCategoryId(t.categoryId || null);
                        setTicketName(t.name || "");
                        setMaxTickets(String(t.maxQuantity ?? ""));
                        setPrice(String(t.price ?? ""));
                        setIsFree(Number(t.price || 0) === 0);
                        setDescription(t.description || "");
                        setIsAbsorbFee(!!t.absorbFee);
                        setIsPrivate(!!t.isPrivate);
                        setIsFacePass(!!t.isFacePass);
                        setPerUserLimit(String(t.perUserLimit ?? ""));
                        setSelectedCategoryId(t.categoryId || "");
                        setSalesStartDate(t.salesStart ? new Date(t.salesStart).toISOString().split('T')[0] : "");
                        setSalesStartTime(t.salesStart ? new Date(t.salesStart).toTimeString().slice(0, 5) : "");
                        setSalesEndDate(t.salesEnd ? new Date(t.salesEnd).toISOString().split('T')[0] : "");
                        setSalesEndTime(t.salesEnd ? new Date(t.salesEnd).toTimeString().slice(0, 5) : "");
                        setDrawerOpen(true);
                      }}
                      onDuplicateTicket={(ticketId) => {
                        const t = ticketTypes.find(tt => tt.id === ticketId);
                        if (t) {
                          setDuplicatePendingId(ticketId);
                          setDuplicateName(t.name + ' (Cópia)');
                        }
                      }}
                      onDeleteTicket={(ticketId) => {
                        const t = ticketTypes.find(tt => tt.id === ticketId);
                        if (t && (t.sold || 0) > 0) {
                          toast?.({ title: "Não é possível excluir", description: `Este ingresso já vendeu ${t.sold} unidade(s) e não pode ser excluído.`, variant: "destructive" });
                          return;
                        }
                        setDeleteId(ticketId);
                      }}
                      onMarkSold={(ticketId) => setMarkSoldPendingId(ticketId)}
                      onReopenSales={(ticketId) => { setReopenPendingId(ticketId); setReopenValue('10'); }}
                      onEditCategory={(cat) => {
                        setEditingCategoryId(cat.id);
                        setCategoryName(cat.name);
                        setCategoryDrawerOpen(true);
                      }}
                      onDeleteCategory={(catId) => {
                        const cat = categories.find(c => c.id === catId);
                        if (cat) {
                          setDeleteCategoryId(catId);
                          setDeleteCategoryName(cat.name);
                        }
                      }}
                      formatBRL={formatBRL}
                    />
                  </>
                )}

                {/* LEGACY CODE BELOW - COMPLETELY DISABLED */}
                {false && (<>
                  {/* Render categories with their tickets */}
                  {categories.length > 0 && (
                    <div className="space-y-6 mb-8">
                      <Reorder.Group
                        axis="y"
                        values={categories}
                        onReorder={(newOrder) => {
                          // Atualizar state imediatamente (optimistic update)
                          setCategories(newOrder);

                          // Chamar reorderCategories com debounce para salvar no backend
                          reorderCategories(newOrder);
                        }}
                        className="space-y-6"
                      >
                        {categories.map((category: any) => {
                          const categoryTickets = ticketTypes.filter((t: any) => t.categoryId === category.id);

                          return (
                            <Reorder.Item
                              key={category.id}
                              value={category}
                              className="mb-6 relative"
                              style={{ touchAction: 'none' }}
                            >
                              <div className="relative">
                                {/* Drop overlay - covers entire category when dragging - only shows when OTHER ticket is being dragged */}
                                {draggingTicketId && (
                                  <div
                                    className="absolute inset-0 z-20 rounded-xl border-4 border-dashed border-green-500 bg-green-50/20 dark:bg-green-900/20 flex items-center justify-center pointer-events-none"
                                    style={{ display: dropTargetCategoryId === category.id ? 'flex' : 'none' }}
                                  >
                                    <div className="text-center">
                                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        ⬇ Solte aqui em {category.name}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Category Container */}
                                <div
                                  className={`rounded-xl border-2 transition-all bg-white dark:bg-[#242424] ${dropTargetCategoryId === category.id ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20' :
                                    'border-gray-200 dark:border-gray-700'
                                    }`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (draggingTicketId) {
                                      setDropTargetCategoryId(category.id);
                                    }
                                  }}
                                  onDragLeave={(e) => {
                                    // Only clear if leaving to outside (not to child)
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX;
                                    const y = e.clientY;
                                    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                                      setDropTargetCategoryId(null);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    const ticketId = e.dataTransfer.getData('ticketId');

                                    if (ticketId) {
                                      // Check if ticket is already in this category - if so, skip (it's a reorder, not a move)
                                      const ticket = ticketTypes.find((t: any) => t.id === ticketId);
                                      if (ticket && ticket.categoryId !== category.id) {
                                        moveTicketToCategory(ticketId, category.id);
                                      }
                                    }

                                    setDraggingTicketId(null);
                                    setDropTargetCategoryId(null);
                                  }}
                                >
                                  {/* Category Header - NOT draggable to avoid blocking drop */}
                                  <div
                                    className={`flex items-center justify-between p-4 max-sm:p-3 pb-2 max-sm:pb-2 ${draggingCategoryId === category.id ? 'opacity-50' : ''
                                      }`}
                                  >
                                    <div className="flex items-center gap-3 max-sm:gap-2 flex-1 min-w-0">
                                      <GripVertical className="w-5 h-5 max-sm:w-4 max-sm:h-4 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0" />
                                      <h3 className="text-sm max-sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">{category.name} ({categoryTickets.length})</h3>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 h-8 w-8 max-sm:h-7 max-sm:w-7 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCategoryId(category.id);
                                          setCategoryName(category.name || "");
                                          setCategoryDescription(category.description || "");
                                          setCategoryMaxCapacity(category.maxCapacity?.toString() || "");
                                          setCategoryIncludeInLimit(category.includeInLimit || false);
                                          setCategoryValidityStart(category.validityStart ? new Date(category.validityStart).toISOString().split('T')[0] : "");
                                          setCategoryValidityStartTime(category.validityStart ? new Date(category.validityStart).toTimeString().slice(0, 5) : "");
                                          setCategoryValidityEnd(category.validityEnd ? new Date(category.validityEnd).toISOString().split('T')[0] : "");
                                          setCategoryValidityEndTime(category.validityEnd ? new Date(category.validityEnd).toTimeString().slice(0, 5) : "");
                                          setCategoryLocation(category.location || "");
                                          setCategoryImagePreview(category.image || "");
                                          setCategoryDrawerOpen(true);
                                        }}
                                      >
                                        <Pencil className="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 h-8 w-8 max-sm:h-7 max-sm:w-7 p-0"
                                        onClick={async (e) => {
                                          e.stopPropagation();

                                          // Verificar se há ingressos nesta categoria
                                          const ticketsInCategory = ticketTypes.filter((t: any) => t.categoryId === category.id);

                                          if (ticketsInCategory.length > 0) {
                                            toast({
                                              title: "Não é possível excluir",
                                              description: `Esta categoria contém ${ticketsInCategory.length} ingresso(s). Mova ou exclua os ingressos primeiro.`,
                                              variant: "destructive"
                                            });
                                            return;
                                          }

                                          setDeleteCategoryId(category.id || null);
                                          setDeleteCategoryName(category.name || "");
                                        }}
                                      >
                                        <Trash className="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Category tickets - Full ticket cards */}
                                  <div className="px-4 max-sm:px-3 pb-4 max-sm:pb-3 pt-2 space-y-2">
                                    {categoryTickets.length === 0 ? (
                                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                        <p className="text-sm">Nenhum ingresso nesta categoria</p>
                                        <p className="text-xs mt-1">Mova ingressos para adicionar</p>
                                      </div>
                                    ) : (
                                      <Reorder.Group
                                        axis="y"
                                        values={categoryTickets.filter((t: any) => !t.isHalf)}
                                        onReorder={(newOrder) => {
                                          // Construir lista de tickets desta categoria com filhos
                                          const reorderedWithChildren: any[] = [];
                                          newOrder.forEach((parent) => {
                                            reorderedWithChildren.push(parent);
                                            const child = categoryTickets.find((t: any) => t.parentId === parent.id && t.isHalf);
                                            if (child) reorderedWithChildren.push(child);
                                          });

                                          // Atualizar apenas os tickets desta categoria na lista completa
                                          const updatedList = ticketTypes.map(t => {
                                            // Se for desta categoria, substituir pela versão reordenada
                                            if (t.categoryId === category.id) {
                                              const newVersion = reorderedWithChildren.find(rt => rt.id === t.id);
                                              return newVersion || t;
                                            }
                                            return t;
                                          });

                                          // Reordenar: manter a estrutura geral mas com nova ordem interna
                                          const beforeCategory = updatedList.filter(t =>
                                            t.categoryId && t.categoryId !== category.id &&
                                            updatedList.indexOf(t) < updatedList.findIndex(x => x.categoryId === category.id)
                                          );
                                          const afterCategory = updatedList.filter(t =>
                                            (t.categoryId && t.categoryId !== category.id &&
                                              updatedList.indexOf(t) > updatedList.findIndex(x => x.categoryId === category.id)) ||
                                            !t.categoryId
                                          );

                                          const finalList = [...beforeCategory, ...reorderedWithChildren, ...afterCategory];

                                          // Atualizar state imediatamente (optimistic update)
                                          setTicketTypes(finalList);

                                          // Chamar reorderTickets com debounce para salvar no backend
                                          reorderTickets(finalList);
                                        }}
                                        className="space-y-2"
                                      >
                                        {categoryTickets.filter((t: any) => !t.isHalf).map((t: any, index: number) => {
                                          const hasHalfChild = ticketTypes.some((tt: any) => tt.parentId === t.id && tt.isHalf);
                                          const isParentWithHalf = !t.isHalf && hasHalfChild;
                                          const rawName = t.name || 'Nome do ingresso';
                                          const displayName = t.isHalf ? (rawName.replace(/\s*-\s*Meia-entrada\s*$/i, '') || rawName) : rawName;
                                          return (
                                            <Reorder.Item
                                              key={t.id}
                                              value={t}
                                              className="relative w-full"
                                              style={{ touchAction: 'none' }}
                                            >
                                              <div
                                                className={`bg-white dark:bg-[#242424] rounded-2xl border p-6 max-sm:p-4 relative transition-all ${isParentWithHalf ? 'mb-0' : 'mb-4'} shadow-sm ${deleteId === t.id ? 'border-red-300 animate-delete-ticket' : 'border-[#E5E7EB] dark:border-[#1F1F1F]'}`}
                                              >
                                                <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
                                                  <div className="flex items-center gap-4 max-sm:gap-2 max-sm:w-full">
                                                    <div className="flex items-center gap-1">
                                                      {/* Grip for reordering within category */}
                                                      <div className="mt-0.5 text-gray-400 cursor-grab select-none max-sm:hidden" title="Arraste para reordenar">
                                                        <GripVertical className="w-4 h-4" />
                                                      </div>
                                                      {/* Drag handle for moving between categories */}
                                                      <div
                                                        draggable
                                                        onDragStart={(e) => {
                                                          e.dataTransfer.setData('ticketId', t.id);
                                                          e.dataTransfer.effectAllowed = 'move';
                                                          setDraggingTicketId(t.id);
                                                        }}
                                                        onDragEnd={() => {
                                                          setDraggingTicketId(null);
                                                          setDropTargetCategoryId(null);
                                                        }}
                                                        className="mt-0.5 text-blue-400 hover:text-blue-600 cursor-grab select-none max-sm:hidden"
                                                        title="Arraste para mover entre categorias"
                                                      >
                                                        <FolderInput className="w-4 h-4" />
                                                      </div>
                                                    </div>
                                                    <div className="flex flex-col max-sm:flex-1">
                                                      <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:gap-2">
                                                        <div className="text-lg max-sm:text-base font-bold text-[#091747] dark:text-white">{displayName}</div>
                                                        {!t.isOnSale ? (
                                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-500 text-white text-xs max-sm:text-[10px] font-medium uppercase flex-shrink-0">VENDAS ENCERRADAS</span>
                                                        ) : t.maxQuantity === 0 || (t.sold || 0) >= t.maxQuantity ? (
                                                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#2A2AD7] text-white border border-[#2A2AD7] text-[12px] max-sm:text-[10px]">ESGOTADO</span>
                                                        ) : (
                                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-xs max-sm:text-[10px] font-medium uppercase flex-shrink-0">À VENDA</span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-4 max-sm:gap-3 max-sm:w-full max-sm:justify-between max-sm:flex-wrap">
                                                    <div className="text-[#091747] dark:text-white text-lg max-sm:text-base font-bold">{Number(t.price || 0) === 0 ? 'Gratuito' : formatBRL(Number(t.price || 0))}</div>
                                                    <div className="text-sm max-sm:text-xs text-slate-500">{t.sold || 0} / {t.maxQuantity}</div>
                                                    <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                        <button className="w-9 h-9 max-sm:w-8 max-sm:h-8 rounded-full bg-slate-100 dark:bg-[#1F1F1F] flex items-center justify-center text-slate-600 dark:text-slate-300" aria-label="Ações do ingresso">
                                                          <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                                                        <DropdownMenuItem onClick={() => {
                                                          setEditingId(t.id);
                                                          setOriginalCategoryId(t.categoryId || null);
                                                          setTicketName(t.name || "");
                                                          setMaxTickets(String(t.maxQuantity ?? ""));
                                                          setPrice(String(t.price ?? ""));
                                                          setIsFree(Number(t.price || 0) === 0);
                                                          setDescription(t.description || "");
                                                          setIsAbsorbFee(!!t.absorbFee);
                                                          setIsPrivate(!!t.isPrivate);
                                                          setIsFacePass(!!t.isFacePass);
                                                          setPerUserLimit(String(t.perUserLimit ?? ""));
                                                          setSelectedCategoryId(t.categoryId || "");
                                                          setSalesStartDate(t.salesStart ? new Date(t.salesStart).toISOString().split('T')[0] : "");
                                                          setSalesStartTime(t.salesStart ? new Date(t.salesStart).toTimeString().slice(0, 5) : "");
                                                          setSalesEndDate(t.salesEnd ? new Date(t.salesEnd).toISOString().split('T')[0] : "");
                                                          setSalesEndTime(t.salesEnd ? new Date(t.salesEnd).toTimeString().slice(0, 5) : "");
                                                          setDrawerOpen(true);
                                                        }} className="flex items-center gap-2">
                                                          <Pencil className="w-4 h-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                          setDuplicatePendingId(t.id);
                                                          setDuplicateName(t.name + ' (Cópia)');
                                                        }} className="flex items-center gap-2 whitespace-nowrap">
                                                          <Copy className="w-4 h-4 mr-2" /> Duplicar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                          setMoveToCategoryTicketId(t.id);
                                                          setMoveToCategoryTargetId(t.categoryId || '');
                                                        }} className="flex items-center gap-2 whitespace-nowrap">
                                                          <FolderInput className="w-4 h-4 mr-2" /> Mover para categoria
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
                                                        <DropdownMenuItem
                                                          className="text-red-600 focus:text-red-700 whitespace-nowrap"
                                                          onSelect={() => {
                                                            if ((t.sold || 0) > 0) {
                                                              toast({
                                                                title: "Não é possível excluir",
                                                                description: `Este ingresso já vendeu ${t.sold} unidade(s) e não pode ser excluído.`,
                                                                variant: "destructive"
                                                              });
                                                              return;
                                                            }
                                                            setDeleteId(t.id);
                                                          }}
                                                          disabled={(t.sold || 0) > 0}
                                                        >
                                                          <Trash className="w-4 h-4 mr-2" /> Apagar
                                                        </DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Meia-entrada child (if exists) */}
                                              {isParentWithHalf && (() => {
                                                const child = ticketTypes.find((tt: any) => tt.parentId === t.id && tt.isHalf);
                                                if (!child) return null;
                                                const childRawName = child.name || 'Nome do ingresso';
                                                const childDisplayName = childRawName.replace(/\s*-\s*Meia-entrada\s*$/i, '') || childRawName;
                                                return (
                                                  <div
                                                    className="bg-white dark:bg-[#242424] rounded-xl border p-3 max-sm:p-2.5 relative shadow-sm border-[#E5E7EB] dark:border-[#1F1F1F] -mt-2"
                                                    style={{ marginLeft: HALF_INDENT_PX / 2, width: `calc(100% - ${HALF_INDENT_PX / 2}px)` }}
                                                  >
                                                    <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-2">
                                                      <div className="flex items-center gap-3 max-sm:gap-2 max-sm:flex-wrap">
                                                        <div className="text-base max-sm:text-sm font-semibold text-[#091747] dark:text-white">{childDisplayName}</div>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs max-sm:text-[10px] font-medium uppercase">MEIA</span>
                                                      </div>
                                                      <div className="flex items-center gap-6 max-sm:gap-3 max-sm:w-full max-sm:justify-between">
                                                        <div className="text-base max-sm:text-sm font-bold text-[#091747] dark:text-white">{formatBRL(child.price)}</div>
                                                        <div className="text-sm max-sm:text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                                                          0 / {child.maxQuantity}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })()}
                                            </Reorder.Item>
                                          );
                                        })}
                                      </Reorder.Group>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Reorder.Item>
                          );
                        })}
                      </Reorder.Group>
                    </div>
                  )}

                  {/* All tickets WITHOUT category - with drop zone */}
                  {categories.length > 0 ? (
                    <div className="mb-6 mt-8">
                      <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 px-2">
                        Sem categoria {ticketTypes.filter((t: any) => !t.categoryId).length > 0 && `(${ticketTypes.filter((t: any) => !t.categoryId).length})`}
                      </h3>

                      {/* Drop zone wrapper */}
                      <div
                        className="relative"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggingTicketId) {
                            setDropTargetCategoryId('uncategorized');
                          }
                        }}
                        onDragLeave={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX;
                          const y = e.clientY;
                          if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                            setDropTargetCategoryId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Aceita tanto do dataTransfer quanto do estado draggingTicketId
                          const ticketId = draggingTicketId || e.dataTransfer.getData('ticketId');
                          if (ticketId) {
                            const ticket = ticketTypes.find((tt: any) => tt.id === ticketId);
                            // Só move se tiver categoria (para remover)
                            if (ticket && ticket.categoryId) {
                              moveTicketToCategory(ticketId, null);
                            }
                          }
                          setDropTargetCategoryId(null);
                          setDraggingTicketId(null);
                        }}
                      >
                        {draggingTicketId && (
                          <div
                            className="absolute inset-0 z-20 rounded-2xl border-4 border-dashed border-blue-500 bg-blue-50/20 dark:bg-blue-900/20 flex items-center justify-center pointer-events-none"
                            style={{ display: dropTargetCategoryId === 'uncategorized' ? 'flex' : 'none' }}
                          >
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                ⬇ Solte aqui para remover da categoria
                              </p>
                            </div>
                          </div>
                        )}

                        {ticketTypes.filter((t: any) => !t.categoryId).length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-[#1a1a1a] min-h-[120px]">
                            <Tag className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              Nenhum ingresso sem categoria
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Mova ingressos para adicionar
                            </p>
                          </div>
                        )}

                        <Reorder.Group
                          axis="y"
                          values={ticketTypes.filter((t: any) => !t.categoryId && !t.isHalf)}
                          onReorder={(newOrder) => {
                            // Build the final list with parents and their children
                            const reorderedUncategorized: any[] = [];
                            const allUncategorized = ticketTypes.filter((t: any) => !t.categoryId);

                            newOrder.forEach((parent) => {
                              reorderedUncategorized.push(parent);
                              const child = allUncategorized.find((t: any) => t.parentId === parent.id && t.isHalf);
                              if (child) {
                                reorderedUncategorized.push(child);
                              }
                            });

                            // Manter categorias + adicionar sem categoria reordenados
                            const categorized = ticketTypes.filter((t: any) => t.categoryId);
                            const finalList = [...categorized, ...reorderedUncategorized];

                            setTicketTypes(finalList);
                          }}
                          className="space-y-4"
                        >
                          {ticketTypes.filter((t: any) => !t.categoryId && !t.isHalf).map((t: any) => {
                            const hasHalfChild = ticketTypes.some((tt: any) => tt.parentId === t.id && tt.isHalf);
                            const isParentWithHalf = !t.isHalf && hasHalfChild;
                            const rawName = t.name || 'Nome do ingresso';
                            const displayName = t.isHalf ? (rawName.replace(/\s*-\s*Meia-entrada\s*$/i, '') || rawName) : rawName;
                            return (
                              <Reorder.Item
                                key={t.id}
                                value={t}
                                className="relative w-full"
                                style={{ touchAction: 'none' }}
                              >
                                <div
                                  className={`bg-white dark:bg-[#242424] rounded-2xl border p-6 max-sm:p-4 relative transition-all ${isParentWithHalf ? 'mb-0' : 'mb-4'} shadow-sm ${deleteId === t.id ? 'border-red-300 animate-delete-ticket' : 'border-[#E5E7EB] dark:border-[#1F1F1F]'}`}
                                >
                                  <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
                                    <div className="flex items-center gap-4 max-sm:gap-2 max-sm:w-full">
                                      <div className="flex items-center gap-1">
                                        {/* Grip for reordering */}
                                        <div className="mt-0.5 text-gray-400 cursor-grab select-none max-sm:hidden" title="Arraste para reordenar">
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                        {/* Drag handle for moving to categories */}
                                        {categories.length > 0 && (
                                          <div
                                            draggable
                                            onDragStart={(e) => {
                                              e.dataTransfer.setData('ticketId', t.id);
                                              e.dataTransfer.effectAllowed = 'move';
                                              setDraggingTicketId(t.id);
                                            }}
                                            onDragEnd={() => {
                                              setDraggingTicketId(null);
                                              setDropTargetCategoryId(null);
                                            }}
                                            className="mt-0.5 text-blue-400 hover:text-blue-600 cursor-grab select-none max-sm:hidden"
                                            title="Arraste para mover para categoria"
                                          >
                                            <FolderInput className="w-4 h-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col max-sm:flex-1">
                                        <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:gap-2">
                                          <div className="text-lg max-sm:text-base font-bold text-[#091747] dark:text-white">{displayName}</div>
                                          {!t.isOnSale ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-500 text-white text-xs max-sm:text-[10px] font-medium uppercase flex-shrink-0">VENDAS ENCERRADAS</span>
                                          ) : t.maxQuantity === 0 || (t.sold || 0) >= t.maxQuantity ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#2A2AD7] text-white border border-[#2A2AD7] text-[12px] max-sm:text-[10px]">ESGOTADO</span>
                                          ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-xs max-sm:text-[10px] font-medium uppercase flex-shrink-0">À VENDA</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 max-sm:gap-3 max-sm:w-full max-sm:justify-between max-sm:flex-wrap">
                                      <div className="text-[#091747] dark:text-white text-lg max-sm:text-base font-bold">{Number(t.price || 0) === 0 ? 'Gratuito' : formatBRL(Number(t.price || 0))}</div>
                                      <div className="text-sm max-sm:text-xs text-slate-500">{t.sold || 0} / {t.maxQuantity}</div>
                                      {categories.length > 0 && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button className="h-8 px-3 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium transition-colors max-sm:hidden" title="Mover para categoria">
                                              <FolderInput className="w-4 h-4" />
                                              Mover
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                                            {categories.map(cat => (
                                              <DropdownMenuItem
                                                key={cat.id}
                                                onClick={() => moveTicketToCategory(t.id, cat.id)}
                                              >
                                                {cat.name}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="w-9 h-9 max-sm:w-8 max-sm:h-8 rounded-full bg-slate-100 dark:bg-[#1F1F1F] flex items-center justify-center text-slate-600 dark:text-slate-300" aria-label="Ações do ingresso">
                                            <MoreVertical className="w-4 h-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                                          <DropdownMenuItem onClick={() => {
                                            setEditingId(t.id);
                                            setOriginalCategoryId(t.categoryId || null);
                                            setTicketName(t.name || "");
                                            setMaxTickets(String(t.maxQuantity ?? ""));
                                            setPrice(String(t.price ?? ""));
                                            setIsFree(Number(t.price || 0) === 0);
                                            setDescription(t.description || "");
                                            setIsAbsorbFee(!!t.absorbFee);
                                            setIsPrivate(!!t.isPrivate);
                                            setIsFacePass(!!t.isFacePass);
                                            setPerUserLimit(String(t.perUserLimit ?? ""));
                                            setSelectedCategoryId(t.categoryId || "");
                                            setSalesStartDate(t.salesStart ? new Date(t.salesStart).toISOString().split('T')[0] : "");
                                            setSalesStartTime(t.salesStart ? new Date(t.salesStart).toTimeString().slice(0, 5) : "");
                                            setSalesEndDate(t.salesEnd ? new Date(t.salesEnd).toISOString().split('T')[0] : "");
                                            setSalesEndTime(t.salesEnd ? new Date(t.salesEnd).toTimeString().slice(0, 5) : "");
                                            setDrawerOpen(true);
                                          }} className="flex items-center gap-2">
                                            <Pencil className="w-4 h-4" /> Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            setDuplicatePendingId(t.id);
                                            setDuplicateName(t.name + ' (Cópia)');
                                          }} className="flex items-center gap-2 whitespace-nowrap">
                                            <Copy className="w-4 h-4 mr-2" /> Duplicar
                                          </DropdownMenuItem>
                                          {categories.length > 0 && (
                                            <DropdownMenuItem onClick={() => {
                                              setMoveToCategoryTicketId(t.id);
                                              setMoveToCategoryTargetId(t.categoryId || '');
                                            }} className="flex items-center gap-2 whitespace-nowrap">
                                              <FolderInput className="w-4 h-4 mr-2" /> Mover para categoria
                                            </DropdownMenuItem>
                                          )}
                                          {t.maxQuantity === 0 ? (
                                            <DropdownMenuItem onClick={() => { setReopenPendingId(t.id); setReopenValue('10'); }} className="flex items-center gap-2 whitespace-nowrap">
                                              <Tag className="w-4 h-4 mr-2" /> Reabrir vendas
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem onClick={() => setMarkSoldPendingId(t.id)} className="flex items-center gap-2 whitespace-nowrap">
                                              <Tag className="w-4 h-4 mr-2" /> Marcar como esgotado
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-700 whitespace-nowrap"
                                            onSelect={() => {
                                              if ((t.sold || 0) > 0) {
                                                toast({
                                                  title: "Não é possível excluir",
                                                  description: `Este ingresso já vendeu ${t.sold} unidade(s) e não pode ser excluído.`,
                                                  variant: "destructive"
                                                });
                                                return;
                                              }
                                              setDeleteId(t.id);
                                            }}
                                            disabled={(t.sold || 0) > 0}
                                          >
                                            <Trash className="w-4 h-4 mr-2" /> Apagar
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>

                                {/* Meia-entrada child (if exists) */}
                                {isParentWithHalf && (() => {
                                  const child = ticketTypes.find((tt: any) => tt.parentId === t.id && tt.isHalf);
                                  if (!child) return null;
                                  const childRawName = child.name || 'Nome do ingresso';
                                  const childDisplayName = childRawName.replace(/\s*-\s*Meia-entrada\s*$/i, '') || childRawName;
                                  return (
                                    <div
                                      className="bg-white dark:bg-[#242424] rounded-xl border p-3 max-sm:p-2.5 relative shadow-sm border-[#E5E7EB] dark:border-[#1F1F1F] -mt-2"
                                      style={{ marginLeft: HALF_INDENT_PX / 2, width: `calc(100% - ${HALF_INDENT_PX / 2}px)` }}
                                    >
                                      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-2">
                                        <div className="flex items-center gap-3 max-sm:gap-2 max-sm:flex-wrap">
                                          <div className="text-base max-sm:text-sm font-semibold text-[#091747] dark:text-white">{childDisplayName}</div>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs max-sm:text-[10px] font-medium uppercase">MEIA</span>
                                        </div>
                                        <div className="flex items-center gap-6 max-sm:gap-3 max-sm:w-full max-sm:justify-between">
                                          <div className="text-base max-sm:text-sm font-bold text-[#091747] dark:text-white">{formatBRL(child.price)}</div>
                                          <div className="text-sm max-sm:text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                                            0 / {child.maxQuantity}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </Reorder.Item>
                            );
                          })}
                        </Reorder.Group>
                      </div>
                    </div>
                  ) : (
                    // Se NÃO há categorias, mostra todos os tickets diretamente
                    ticketTypes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 px-2">
                          Ingressos ({ticketTypes.filter((t: any) => !t.isHalf).length})
                        </h3>
                        <Reorder.Group
                          axis="y"
                          values={ticketTypes.filter((t: any) => !t.isHalf)}
                          onReorder={(newOrder) => {
                            const reorderedWithChildren: any[] = [];
                            newOrder.forEach((parent) => {
                              reorderedWithChildren.push(parent);
                              const child = ticketTypes.find((t: any) => t.parentId === parent.id && t.isHalf);
                              if (child) reorderedWithChildren.push(child);
                            });

                            setTicketTypes(reorderedWithChildren);
                          }}
                          className="space-y-4"
                        >
                          {ticketTypes.filter((t: any) => !t.isHalf).map((t: any) => {
                            // Buscar filho diretamente
                            const hasHalfChild = ticketTypes.some((tt: any) => tt.parentId === t.id && tt.isHalf);
                            const isParentWithHalf = !t.isHalf && hasHalfChild;
                            const rawName = t.name || 'Nome do ingresso';
                            const displayName = t.isHalf ? (rawName.replace(/\s*-\s*Meia-entrada\s*$/i, '') || rawName) : rawName;
                            const feeRaw = (t.price ?? 0) * (serviceFeePercent ?? 0);
                            const fee = round2(feeRaw);
                            const receive = round2(t.absorbFee ? (t.price - fee) : t.price);
                            return (
                              <Reorder.Item key={t.id} value={t} className="relative w-full" style={{ touchAction: 'none' }}>
                                <div
                                  className={`bg-white dark:bg-[#242424] rounded-2xl border p-6 max-sm:p-4 relative transition-all ${isParentWithHalf ? 'mb-0' : 'mb-4'} shadow-sm ${deleteId === t.id ? 'border-red-300 animate-delete-ticket' : 'border-[#E5E7EB] dark:border-[#1F1F1F]'}`}
                                >
                                  <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
                                    <div className="flex items-center gap-4 max-sm:gap-2 max-sm:w-full">
                                      <div className="mt-0.5 text-gray-400 cursor-grab select-none max-sm:hidden" title="Arraste para reordenar">
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col max-sm:flex-1">
                                        <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:gap-2">
                                          <div className="text-lg max-sm:text-base font-bold text-[#091747] dark:text-white">{displayName}</div>
                                          {!t.isOnSale ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-500 text-white text-xs max-sm:text-[10px] font-medium uppercase flex-shrink-0">VENDAS ENCERRADAS</span>
                                          ) : t.maxQuantity === 0 || (t.sold || 0) >= t.maxQuantity ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#2A2AD7] text-white border border-[#2A2AD7] text-[12px] max-sm:text-[10px]">ESGOTADO</span>
                                          ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-xs max-sm:text-[10px] font-medium uppercase flex-shrink-0">À VENDA</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 max-sm:gap-3 max-sm:w-full max-sm:justify-between max-sm:flex-wrap">
                                      <div className="text-[#091747] dark:text-white text-lg max-sm:text-base font-bold">{Number(t.price || 0) === 0 ? 'Gratuito' : formatBRL(Number(t.price || 0))}</div>
                                      <div className="text-sm max-sm:text-xs text-slate-500">{t.sold || 0} / {t.maxQuantity}</div>
                                      {categories.length > 0 && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button className="h-8 px-3 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium transition-colors max-sm:hidden" title="Mover para categoria">
                                              <FolderInput className="w-4 h-4" />
                                              Mover
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                                            {categories.map(cat => (
                                              <DropdownMenuItem
                                                key={cat.id}
                                                onClick={() => moveTicketToCategory(t.id, cat.id)}
                                                className={t.categoryId === cat.id ? 'bg-blue-50 dark:bg-900/20' : ''}
                                              >
                                                {t.categoryId === cat.id ? '✓ ' : ''}{cat.name}
                                              </DropdownMenuItem>
                                            ))}
                                            {t.categoryId && (
                                              <>
                                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                                                <DropdownMenuItem onClick={() => moveTicketToCategory(t.id, null)}>
                                                  Sem categoria
                                                </DropdownMenuItem>
                                              </>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="w-9 h-9 max-sm:w-8 max-sm:h-8 rounded-full bg-slate-100 dark:bg-[#1F1F1F] flex items-center justify-center text-slate-600 dark:text-slate-300" aria-label="Ações do ingresso">
                                            <MoreVertical className="w-4 h-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                                          <DropdownMenuItem onClick={() => {
                                            setEditingId(t.id);
                                            setOriginalCategoryId(t.categoryId || null);
                                            setTicketName(t.name || "");
                                            setMaxTickets(String(t.maxQuantity ?? ""));
                                            setPrice(String(t.price ?? ""));
                                            setIsFree(Number(t.price || 0) === 0);
                                            setDescription(t.description || "");
                                            setIsAbsorbFee(!!t.absorbFee);
                                            setIsPrivate(!!t.isPrivate);
                                            setIsFacePass(!!t.isFacePass);
                                            setPerUserLimit(String(t.perUserLimit ?? ""));
                                            setSelectedCategoryId(t.categoryId || "");
                                            setSalesStartDate(t.salesStart ? new Date(t.salesStart).toISOString().split('T')[0] : "");
                                            setSalesStartTime(t.salesStart ? new Date(t.salesStart).toTimeString().slice(0, 5) : "");
                                            setSalesEndDate(t.salesEnd ? new Date(t.salesEnd).toISOString().split('T')[0] : "");
                                            setSalesEndTime(t.salesEnd ? new Date(t.salesEnd).toTimeString().slice(0, 5) : "");
                                            setDrawerOpen(true);
                                          }} className="flex items-center gap-2">
                                            <Pencil className="w-4 h-4" /> Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            setDuplicatePendingId(t.id);
                                            setDuplicateName(t.name + ' (Cópia)');
                                          }} className="flex items-center gap-2 whitespace-nowrap">
                                            <Copy className="w-4 h-4 mr-2" /> Duplicar
                                          </DropdownMenuItem>
                                          {categories.length > 0 && (
                                            <DropdownMenuItem onClick={() => {
                                              setMoveToCategoryTicketId(t.id);
                                              setMoveToCategoryTargetId(t.categoryId || '');
                                            }} className="flex items-center gap-2 whitespace-nowrap">
                                              <FolderInput className="w-4 h-4 mr-2" /> Mover para categoria
                                            </DropdownMenuItem>
                                          )}
                                          {t.maxQuantity === 0 ? (
                                            <DropdownMenuItem onClick={() => { setReopenPendingId(t.id); setReopenValue('10'); }} className="flex items-center gap-2 whitespace-nowrap">
                                              <Tag className="w-4 h-4 mr-2" /> Reabrir vendas
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem onClick={() => setMarkSoldPendingId(t.id)} className="flex items-center gap-2 whitespace-nowrap">
                                              <Tag className="w-4 h-4 mr-2" /> Marcar como esgotado
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-700 whitespace-nowrap"
                                            onSelect={() => {
                                              if ((t.sold || 0) > 0) {
                                                toast({
                                                  title: "Não é possível excluir",
                                                  description: `Este ingresso já vendeu ${t.sold} unidade(s) e não pode ser excluído.`,
                                                  variant: "destructive"
                                                });
                                                return;
                                              }
                                              setDeleteId(t.id);
                                            }}
                                            disabled={(t.sold || 0) > 0}
                                          >
                                            <Trash className="w-4 h-4 mr-2" /> Apagar
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>

                                {/* Meia-entrada child (if exists) - rendered right after parent */}
                                {isParentWithHalf && (() => {
                                  const child = ticketTypes.find((tt: any) => tt.parentId === t.id && tt.isHalf);
                                  if (!child) return null;

                                  const childRawName = child.name || 'Nome do ingresso';
                                  const childDisplayName = childRawName.replace(/\s*-\s*Meia-entrada\s*$/i, '') || childRawName;
                                  const childFeeRaw = (child.price ?? 0) * (serviceFeePercent ?? 0);
                                  const childFee = round2(childFeeRaw);
                                  const childReceive = round2(child.absorbFee ? (child.price - childFee) : child.price);

                                  return (
                                    <div
                                      className="bg-white dark:bg-[#242424] rounded-xl border p-3 max-sm:p-2.5 relative shadow-sm border-[#E5E7EB] dark:border-[#1F1F1F] -mt-2"
                                      style={{ marginLeft: HALF_INDENT_PX / 2, width: `calc(100% - ${HALF_INDENT_PX / 2}px)` }}
                                    >
                                      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-2">
                                        <div className="flex items-center gap-3 max-sm:gap-2 max-sm:flex-wrap">
                                          <div className="text-base max-sm:text-sm font-semibold text-[#091747] dark:text-white">{childDisplayName}</div>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs max-sm:text-[10px] font-medium uppercase">MEIA</span>
                                        </div>
                                        <div className="flex items-center gap-6 max-sm:gap-3 max-sm:w-full max-sm:justify-between">
                                          <div className="text-base max-sm:text-sm font-bold text-[#091747] dark:text-white">{formatBRL(child.price)}</div>
                                          <div className="text-sm max-sm:text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                                            0 / {child.maxQuantity}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </Reorder.Item>
                            );
                          })}
                        </Reorder.Group>
                      </div>
                    )
                  )}
                </>
                )}

                {/* Sem fallback legado: quando não houver TicketTypes, mostramos apenas o card grande para criar */}

                {/* Removido fallback legado: forçamos o novo modelo baseado em TicketTypes */}
                <Drawer open={drawerOpen} onOpenChange={(open) => {
                  setDrawerOpen(open);
                  if (!open) {
                    // Limpar validação ao fechar o drawer
                    setNameExists(false);
                    if (nameCheckTimeoutRef.current) {
                      clearTimeout(nameCheckTimeoutRef.current);
                    }
                  }
                }}>
                  {/* Botão grande de criar ingressos só aparece quando ainda não há TicketTypes */}
                  {(ticketTypes.length === 0) && !ticketsLoading && (
                    <DrawerTrigger asChild>
                      <button
                        type="button"
                        className="group bg-white dark:bg-[#242424] rounded-xl shadow p-6 max-sm:p-4 flex items-center gap-4 max-sm:gap-3 w-full transition-all duration-150 border border-transparent dark:border-[#1F1F1F] hover:border-indigo-200 hover:shadow-lg hover:bg-indigo-50 dark:hover:bg-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-indigo-200 max-sm:hidden"
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="flex items-center justify-center w-10 h-10 max-sm:w-8 max-sm:h-8 rounded-full bg-indigo-50 text-indigo-600 text-[26px] max-sm:text-[20px] font-regular group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-all">+</span>
                        <span className="font-semibold max-sm:text-sm text-indigo-950 dark:text-white group-hover:text-indigo-700 transition-colors">Criar novos ingressos</span>
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

                      {/* Category Selection */}
                      {categories.length > 0 && (
                        <>
                          <Label className="mt-2">Categoria (opcional)</Label>
                          <Select
                            value={selectedCategoryId || "__none__"}
                            onValueChange={(val) => setSelectedCategoryId(val === "__none__" ? "" : val)}
                          >
                            <SelectTrigger className="dark:bg-[#121212] dark:border-transparent dark:text-white">
                              <SelectValue placeholder="Sem categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Sem categoria</SelectItem>
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}

                      <Label className="mt-2">Nome do ingresso</Label>
                      <Input
                        placeholder="Nome do ingresso"
                        value={ticketName}
                        onChange={e => {
                          const newName = e.target.value;
                          setTicketName(newName);

                          // Limpar timeout anterior
                          if (nameCheckTimeoutRef.current) {
                            clearTimeout(nameCheckTimeoutRef.current);
                          }

                          // Validar nome após 300ms de pausa na digitação
                          if (newName.trim()) {
                            nameCheckTimeoutRef.current = setTimeout(() => {
                              const trimmedName = newName.trim().toLowerCase();
                              const exists = ticketTypes.some(t =>
                                t.name.toLowerCase() === trimmedName &&
                                (!editingId || t.id !== editingId)
                              );
                              setNameExists(exists);
                            }, 300);
                          } else {
                            setNameExists(false);
                          }
                        }}
                        className={`dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white ${nameExists ? 'border-red-500 focus-visible:ring-red-500' : ''
                          }`}
                      />
                      {nameExists && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <Info className="h-4 w-4" />
                          Já existe um ingresso com esse nome para este evento
                        </p>
                      )}
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
                      <Button className="flex-1 bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white font-bold" onClick={handleSave} disabled={loading || nameExists}>
                        {loading ? "Salvando..." : "Salvar"}
                      </Button>
                    </DrawerFooter>
                    {/* Feedback */}
                    {success && <div className="text-green-600 font-bold text-center mt-2">{success}</div>}
                    {error && <div className="text-red-600 font-bold text-center mt-2">{error}</div>}
                  </DrawerContent>
                </Drawer>

                {/* Drawer for Category Creation/Editing */}
                <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
                  <DrawerContent>
                    <DrawerHeader className="p-6 pb-2 border-b border-gray-100 dark:border-[#1F1F1F]">
                      <DrawerTitle className="text-xl font-bold text-indigo-950 dark:text-white">
                        {editingCategoryId ? 'Editar Categoria' : 'Salvar Categoria'}
                      </DrawerTitle>
                      <DrawerDescription className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Ingressos que compartilham as mesmas definições aparecerão juntos dentro de uma mesma categoria na página do seu evento.
                      </DrawerDescription>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        ex: Categoria "Passe Dia 1" com 2 ingressos: "Early Bird" e "Regular"
                      </p>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                      {/* Category Name */}
                      <div>
                        <Label className="text-slate-700 dark:text-slate-200 font-medium">Categoria sem Título</Label>
                        <Input
                          placeholder="ex: Categoria &quot;Passe Dia 1&quot; com 2 ingressos: &quot;Early Bird&quot; e &quot;Regular&quot;"
                          value={categoryName}
                          onChange={e => setCategoryName(e.target.value)}
                          className="mt-2 dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                        />
                      </div>

                      {/* Advanced Options Toggle */}
                      <button
                        onClick={() => setCategoryAdvancedOpen(!categoryAdvancedOpen)}
                        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:underline mt-2"
                      >
                        Opções avançadas
                        <ChevronDown className={`w-4 h-4 transition-transform ${categoryAdvancedOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Advanced Options */}
                      {categoryAdvancedOpen && (
                        <div className="flex flex-col gap-4 pt-2 border-t border-gray-100 dark:border-[#1F1F1F]">
                          {/* Description & Image */}
                          <div className="bg-gray-50 dark:bg-[#1F1F1F] rounded-lg p-4">
                            <div className="flex items-start gap-2 mb-3">
                              <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                              <h3 className="font-semibold text-indigo-950 dark:text-white">Descrição & Imagem</h3>
                            </div>

                            {/* Description */}
                            <div className="mb-4">
                              <Label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Descrição</Label>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                A descrição aparecerá na página do evento e no PDF dos ingressos.
                              </p>
                              <Textarea
                                placeholder="Inclua mais dados na categoria, como condições de acesso"
                                value={categoryDescription}
                                onChange={e => setCategoryDescription(e.target.value)}
                                className="min-h-[80px] dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                              />
                            </div>

                            {/* Image Upload */}
                            <div>
                              <Label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Imagem 16/9</Label>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                A imagem aparecerá na página do evento e no PDF dos ingressos que não têm imagens específicas.
                              </p>
                              <div className="border-2 border-dashed border-gray-300 dark:border-[#1F1F1F] rounded-lg p-6 text-center hover:border-indigo-300 dark:hover:border-indigo-600 transition cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="category-image-upload"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setCategoryImage(file);
                                      setCategoryImagePreview(URL.createObjectURL(file));
                                    }
                                  }}
                                />
                                <label htmlFor="category-image-upload" className="cursor-pointer">
                                  {categoryImagePreview ? (
                                    <img src={categoryImagePreview} alt="Preview" className="max-w-full h-auto rounded" />
                                  ) : (
                                    <>
                                      <div className="text-6xl text-gray-400 mb-2">📷</div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">1920×1080</p>
                                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Imagem</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Max Capacity */}
                          <div className="bg-gray-50 dark:bg-[#1F1F1F] rounded-lg p-4">
                            <div className="flex items-start gap-2 mb-3">
                              <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                              <h3 className="font-semibold text-indigo-950 dark:text-white">Capacidade Máxima</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                              Estabelecer uma capacidade máxima para esta categoria. As vendas de ingressos dentro da categoria serão limitadas a esse número.
                            </p>
                            <div className="mb-3">
                              <Label className="text-sm text-slate-600 dark:text-slate-300 mb-1">Capacidade</Label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Número máximo de ingressos desta categoria"
                                value={categoryMaxCapacity}
                                onChange={e => setCategoryMaxCapacity(e.target.value)}
                                className="dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={categoryIncludeInLimit}
                                onCheckedChange={setCategoryIncludeInLimit}
                              />
                              <Label className="text-sm text-slate-600 dark:text-slate-300">
                                Incluir estas cortesias dentro do limite da categoria
                              </Label>
                            </div>
                          </div>

                          {/* Validity Period */}
                          <div className="bg-gray-50 dark:bg-[#1F1F1F] rounded-lg p-4">
                            <div className="flex items-start gap-2 mb-3">
                              <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                              <h3 className="font-semibold text-indigo-950 dark:text-white">Validade do acesso por categoria</h3>
                            </div>

                            <div className="mb-4">
                              <Label className="text-sm text-slate-600 dark:text-slate-300 mb-2">Início</Label>
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  type="date"
                                  value={categoryValidityStart}
                                  onChange={e => setCategoryValidityStart(e.target.value)}
                                  className="dark:bg-[#121212] dark:border-transparent dark:text-white"
                                />
                                <Input
                                  type="time"
                                  value={categoryValidityStartTime}
                                  onChange={e => setCategoryValidityStartTime(e.target.value)}
                                  className="dark:bg-[#121212] dark:border-transparent dark:text-white"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm text-slate-600 dark:text-slate-300 mb-2">Fim</Label>
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  type="date"
                                  value={categoryValidityEnd}
                                  onChange={e => setCategoryValidityEnd(e.target.value)}
                                  className="dark:bg-[#121212] dark:border-transparent dark:text-white"
                                />
                                <Input
                                  type="time"
                                  value={categoryValidityEndTime}
                                  onChange={e => setCategoryValidityEndTime(e.target.value)}
                                  className="dark:bg-[#121212] dark:border-transparent dark:text-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="bg-gray-50 dark:bg-[#1F1F1F] rounded-lg p-4">
                            <div className="flex items-start gap-2 mb-3">
                              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                              <h3 className="font-semibold text-indigo-950 dark:text-white">Localização</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                              Defina um local caso os ingressos estejam restritos a uma determinada área
                            </p>
                            <Input
                              placeholder="Insira o endereço aqui"
                              value={categoryLocation}
                              onChange={e => setCategoryLocation(e.target.value)}
                              className="dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <DrawerFooter className="p-6 border-t border-gray-100 dark:border-[#1F1F1F] flex flex-row gap-3">
                      <DrawerClose asChild>
                        <Button variant="outline" className="flex-1 dark:border-[#1F1F1F] dark:text-white dark:hover:bg-[#1F1F1F]">
                          Cancelar
                        </Button>
                      </DrawerClose>
                      <Button
                        onClick={handleSaveCategory}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {loading ? 'Salvando...' : 'Salvar Categoria'}
                      </Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>
        </OrganizerLayout>
        {/* Botão fixo Continuar para publicar (mesmo estilo do CreateEditEvent)
          Só mostra quando o evento ainda não foi publicado */}
        {
          eventStatus !== 'Publicado' && (
            <div className="fixed bottom-6 right-6 z-50 max-sm:left-4 max-sm:right-4">
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
                className={`bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-12 min-w-[180px] max-sm:w-full rounded-md shadow-lg px-4 flex items-center justify-center gap-2 whitespace-nowrap ${((ticketTypes || []).length === 0) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span>Continuar para publicar</span>
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
              </Button>
            </div>
          )
        }
        <StepFlowOverlay visible={flowVisible} activeStep={flowStep} subtitle={flowStep === 2 ? "Preparando criação de ingressos…" : undefined} />
        {
          showPublishTooltip && publishTooltipPos && createPortal(
            <div
              role="tooltip"
              style={{ position: 'fixed', left: publishTooltipPos.left, top: publishTooltipPos.top, transform: 'translate(-50%, -100%)' }}
              className="z-50 max-w-[320px] w-[260px] bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] text-[12px] text-slate-700 dark:text-slate-300 p-3 rounded-lg shadow-lg whitespace-normal break-words"
            >
              Você precisa criar ao menos 1 ingresso antes de publicar o evento.
            </div>,
            document.body
          )
        }
        {/* Modal único de confirmação de exclusão */}
        <WarpDialog
          open={!!deleteId}
          onOpenChange={(open) => { if (!open) setDeleteId(null); }}
          title="Apagar ingresso?"
          description="Esta ação não pode ser desfeita. O tipo de ingresso será removido permanentemente."
          confirmText="Confirmar"
          cancelText="Cancelar"
          loading={deleteLoading}
          onConfirm={async () => {
            if (!deleteId) return;
            setPendingDeleteId(deleteId);
            setDeleteLoading(true);
            setDeleteId(null);
            try {
              await fetchApi(`/api/ticket-type/${deleteId}`, { method: 'DELETE' });
              await fetchTickets();
            } finally {
              setDeleteLoading(false);
              setPendingDeleteId(null);
            }
          }}
        />
        {/* Modal para confirmar marcar como esgotado */}
        <ConfirmDialog
          open={!!markSoldPendingId}
          onOpenChange={(open) => { if (!open) setMarkSoldPendingId(null); }}
          title="Marcar ingresso como esgotado?"
          description="Essa ação vai fechar as vendas deste tipo de ingresso. Você poderá reabrir ajustando a quantidade depois."
          confirmText="Confirmar"
          cancelText="Cancelar"
          variant="warning"
          loading={markSoldLoading}
          onConfirm={async () => {
            if (!markSoldPendingId) return;
            setMarkSoldLoading(true);
            try {
              await handleMarkAsSold(markSoldPendingId);
            } finally {
              setMarkSoldLoading(false);
              setMarkSoldPendingId(null);
            }
          }}
        />
        {/* Modal para reabrir vendas (definir nova quantidade) */}
        <ConfirmDialog
          open={!!reopenPendingId}
          onOpenChange={(open) => { if (!open) setReopenPendingId(null); }}
          title="Reabrir vendas"
          description="Informe a nova quantidade máxima disponível para este tipo de ingresso."
          confirmText="Confirmar"
          cancelText="Cancelar"
          variant="default"
          loading={reopenLoading}
          onConfirm={async () => {
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
          <div className="space-y-2">
            <Label>Quantidade máxima</Label>
            <Input type="number" min={1} value={reopenValue} onChange={e => setReopenValue(e.target.value)} />
          </div>
        </ConfirmDialog>
        {/* Drawer para adicionar/editar mapa do evento */}
        <Drawer open={mapDrawerOpen} onOpenChange={setMapDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="p-6 pb-2 border-b border-gray-100 dark:border-[#1F1F1F]">
              <DrawerTitle className="text-xl font-bold text-indigo-950 dark:text-white">Adicionar mapa do evento</DrawerTitle>
              <DrawerDescription className="text-sm text-slate-600 dark:text-slate-300">Faça upload de uma imagem do mapa do evento (planta/plantas de assentos etc.).</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-[#1F1F1F] rounded-lg p-6 text-center hover:border-indigo-300 dark:hover:border-indigo-600 transition cursor-pointer">
                <input
                  id="event-map-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMapFile(file);
                      setMapPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <label htmlFor="event-map-upload" className="cursor-pointer inline-flex flex-col items-center">
                  {mapPreview ? (
                    <img src={mapPreview} alt="Preview do mapa" className="max-w-full h-auto rounded mb-2" />
                  ) : (
                    <>
                      <div className="text-6xl text-gray-400 mb-2">🗺️</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Clique para selecionar um arquivo</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">PNG, JPG, SVG (preferencialmente 1920×1080)</p>
                    </>
                  )}
                </label>
              </div>
              {mapPreview && (
                <div className="text-sm text-slate-600">Preview carregado. Clique em Salvar para enviar.</div>
              )}
            </div>
            <DrawerFooter className="p-6 border-t border-gray-100 dark:border-[#1F1F1F] flex flex-row gap-3">
              {mapPreview && (
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={async () => {
                    if (!eventId) return;
                    if (!confirm('Tem certeza que deseja excluir o mapa do evento? Esta ação não pode ser desfeita.')) return;

                    try {
                      const token = localStorage.getItem('token');
                      // Send empty map field to delete
                      const res = await fetch(`/api/event/${eventId}`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': token ? `Bearer ${token}` : '',
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ map: null })
                      });

                      if (res.ok) {
                        toast?.({ title: 'Mapa excluído', description: 'O mapa do evento foi removido com sucesso.' });
                        setMapPreview('');
                        setMapFile(null);
                        setMapDrawerOpen(false);
                      } else {
                        toast?.({ title: 'Erro', description: 'Não foi possível excluir o mapa.', variant: 'destructive' });
                      }
                    } catch (e) {
                      toast?.({ title: 'Erro', description: String(e), variant: 'destructive' });
                    }
                  }}
                >
                  Excluir Mapa
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">Cancelar</Button>
              </DrawerClose>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={async () => {
                  if (!eventId) {
                    toast?.({ title: 'Erro', description: 'ID do evento não encontrado. Abra a página do evento primeiro.', variant: 'destructive' });
                    return;
                  }
                  if (!mapFile) {
                    toast?.({ title: 'Erro', description: 'Selecione um arquivo para o mapa.', variant: 'destructive' });
                    return;
                  }
                  setMapUploading(true);
                  try {
                    const token = localStorage.getItem('token');
                    const fd = new FormData();
                    // send 'map' field for event map (backend handles 'map' separately from banner)
                    fd.append('map', mapFile);
                    const res = await fetch(`/api/event/${eventId}`, {
                      method: 'PUT',
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                      body: fd
                    });
                    if (!res.ok) {
                      const j = await res.json().catch(() => null);
                      toast?.({ title: 'Erro', description: j?.message || 'Falha ao enviar mapa', variant: 'destructive' });
                    } else {
                      toast?.({ title: 'Mapa atualizado', description: 'Mapa do evento salvo com sucesso.' });
                      // refresh preview from server
                      try {
                        const updated = await fetch(`/api/event/${eventId}`).then(r => r.ok ? r.json() : null);
                        // Only update preview if map exists
                        if (updated?.map) setMapPreview(updated.map);
                      } catch (_) { }
                      setMapDrawerOpen(false);
                    }
                  } catch (e) {
                    toast?.({ title: 'Erro', description: String(e), variant: 'destructive' });
                  } finally {
                    setMapUploading(false);
                  }
                }}
                disabled={mapUploading}
              >
                {mapUploading ? 'Enviando...' : 'Salvar mapa'}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        {/* Modal para escolher nome ao duplicar ingresso */}
        <ConfirmDialog
          open={!!duplicatePendingId}
          onOpenChange={(open) => { if (!open) setDuplicatePendingId(null); }}
          title="Duplicar ingresso"
          description="Escolha um nome para a cópia do ingresso. Você pode editar mais detalhes depois."
          confirmText="Duplicar"
          cancelText="Cancelar"
          variant="default"
          loading={duplicateLoading}
          onConfirm={async () => {
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
          <div className="space-y-2">
            <Label>Nome da cópia</Label>
            <Input value={duplicateName} onChange={e => setDuplicateName(e.target.value)} />
          </div>
        </ConfirmDialog>

        {/* Category deletion confirmation */}
        <WarpDialog
          open={!!deleteCategoryId}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteCategoryId(null);
              setDeleteCategoryName("");
            }
          }}
          title="Excluir categoria"
          description={`Tem certeza que deseja excluir a categoria "${deleteCategoryName}"? Os ingressos não serão excluídos.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          loading={deleteCategoryLoading}
          onConfirm={async () => {
            if (!deleteCategoryId) return;
            setDeleteCategoryLoading(true);
            try {
              const response = await fetchApi(`/api/ticket-category/${deleteCategoryId}`, {
                method: 'DELETE'
              });

              if (response && response.ok) {
                toast({
                  title: "Categoria excluída",
                  description: `A categoria "${deleteCategoryName}" foi removida com sucesso.`,
                });
                await fetchCategories();
                await fetchTickets();
                setDeleteCategoryId(null);
                setDeleteCategoryName("");
              } else {
                const errorText = await response?.text().catch(() => 'Erro desconhecido');
                console.error('Erro na resposta:', errorText);
                throw new Error(errorText || 'Falha ao excluir categoria');
              }
            } catch (e: any) {
              console.error('Erro ao excluir categoria:', e);
              toast({
                title: "Erro ao excluir",
                description: e?.message || "Não foi possível excluir a categoria. Tente novamente.",
                variant: "destructive",
              });
            } finally {
              setDeleteCategoryLoading(false);
            }
          }}
        />

        {/* Move to category dialog */}
        <ConfirmDialog
          open={!!moveToCategoryTicketId}
          onOpenChange={(open) => { if (!open) setMoveToCategoryTicketId(null); }}
          title="Mover para categoria"
          description="Escolha a categoria de destino para este ingresso."
          confirmText="Mover"
          cancelText="Cancelar"
          variant="default"
          onConfirm={async () => {
            if (!moveToCategoryTicketId) return;
            await moveTicketToCategory(moveToCategoryTicketId, moveToCategoryTargetId || null);
            setMoveToCategoryTicketId(null);
          }}
        >
          <div className="space-y-2">
            <Label>Categoria</Label>
            <select
              className="w-full p-2 border rounded-md bg-white dark:bg-[#242424] dark:border-[#1F1F1F]"
              value={moveToCategoryTargetId}
              onChange={e => setMoveToCategoryTargetId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </ConfirmDialog>
      </div >
    </div >
  );
}

export default CreateTickets;
