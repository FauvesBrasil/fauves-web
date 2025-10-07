import AppHeader from "@/components/AppHeader";
import React, { useEffect, useState } from "react";
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
import { Pencil, Trash, MoreVertical, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const CreateTickets: React.FC = () => {
  // Util para formatar BRL sem espaço após R$
  const formatBRL = React.useCallback((n: number) => {
    if (Number.isNaN(n)) n = 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
      .format(n)
      .replace(/\s/g, '');
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

  const navigate = useNavigate();
  const location = useLocation();
  // Pega eventId da query string
  const eventId = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("eventId");
  }, [location.search]);
  // Event summary for sidebar
  const [eventName, setEventName] = useState<string>("Nome do evento");
  const [eventStatus, setEventStatus] = useState<"Rascunho" | "Publicado">("Rascunho");
  const [eventStart, setEventStart] = useState<string>("");
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [serviceFeePercent, setServiceFeePercent] = useState<number>(0.15);

  // Fetch event for sidebar details
  React.useEffect(() => {
    const run = async () => {
      if (!eventId) return;
      try {
  const res = await fetchApi(`/api/event/${eventId}`);
        if (!res.ok) return;
        const ev = await res.json();
        setEventName(ev.name || "Nome do evento");
        setEventStatus(ev.isPublished ? 'Publicado' : 'Rascunho');
        if (ev.startDate) {
          const d = new Date(ev.startDate);
          const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
          const dia = String(d.getDate()).padStart(2,'0');
          const mes = months[d.getMonth()];
          const ano = d.getFullYear();
          const hh = String(d.getHours()).padStart(2,'0');
          const mi = String(d.getMinutes()).padStart(2,'0');
          setEventStart(`${dia} ${mes} ${ano} às ${hh}:${mi}`);
        }
        const orgId = ev.organizerId || ev.organizationId || null;
        setOrganizerId(orgId);
        if (orgId) {
          try {
            const feeRes = await fetchApi(`/api/organization/${orgId}/fee`);
            if (feeRes.ok) {
              const feeData = await feeRes.json();
              if (typeof feeData.serviceFeePercent === 'number') setServiceFeePercent(feeData.serviceFeePercent);
            }
          } catch (_) {}
        }
      } catch (_) {}
    };
    run();
  }, [eventId]);

  // Step overlay based on navigation state
  const [flowVisible, setFlowVisible] = useState(!!(location.state as any)?.stepFlow?.visible);
  const [flowStep, setFlowStep] = useState<1 | 2 | 3>((location.state as any)?.stepFlow?.step || 2);

  useEffect(() => {
    if (flowVisible) {
      const t = setTimeout(() => setFlowVisible(false), 1200);
      return () => clearTimeout(t);
    }
  }, [flowVisible]);

  // Buscar tipos de ingresso do evento
  const fetchTickets = React.useCallback(async () => {
    if (!eventId) return;
    try {
      setTicketsLoading(true);
  const res = await fetchApi(`/api/ticket-type/event/${eventId}`);
      if (res.ok) {
        const list = await res.json();
        setTicketTypes(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      // mantém lista atual em caso de erro
    } finally {
      setTicketsLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);
  const [ticketName, setTicketName] = useState("");
  const [maxTickets, setMaxTickets] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [description, setDescription] = useState("");
  const [isAbsorbFee, setIsAbsorbFee] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isFacePass, setIsFacePass] = useState(false);
  const [perUserLimit, setPerUserLimit] = useState("");
  const [salesStartDate, setSalesStartDate] = useState("");
  const [salesStartTime, setSalesStartTime] = useState("");
  const [salesEndDate, setSalesEndDate] = useState("");
  const [salesEndTime, setSalesEndTime] = useState("");
  const [createHalf, setCreateHalf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Drag-and-drop ordering
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // Visual hierarchy: keep child (meia) indented to the right of the parent
  const HALF_INDENT_PX = 80;

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
    // Show step 3 overlay and navigate to publish
    setFlowStep(3);
    setFlowVisible(true);
    navigate(`/publish-details${eventId ? `?eventId=${eventId}` : ''}`, { state: { stepFlow: { visible: true, step: 3 } } });
  };

  // Helpers for date/time input constraints
  const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const toHm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const now = new Date();
  const todayYmd = toYmd(now);
  const nowHm = toHm(now);
  const startDateIsToday = salesStartDate === todayYmd;
  const endDateIsToday = salesEndDate === todayYmd;
  const endSameAsStart = !!salesStartDate && !!salesEndDate && salesStartDate === salesEndDate;
  const startTimeMin = startDateIsToday ? nowHm : undefined;
  const endDateMin = salesStartDate || todayYmd;
  const endTimeMin = endSameAsStart
    ? (salesStartTime || (startDateIsToday ? nowHm : undefined))
    : (endDateIsToday ? nowHm : undefined);

  return (
    <div className="min-h-screen w-full bg-white flex">
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
                <h1 className="text-[28px] font-bold text-indigo-950">Ingressos</h1>
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
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-2 shadow-sm">
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
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-4 shadow-sm" style={{ marginLeft: HALF_INDENT_PX, width: `calc(100% - ${HALF_INDENT_PX}px)` }}>
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
                    <div
                      className={`bg-white rounded-2xl border border-[#E5E7EB] p-6 ${isParentWithHalf ? 'mb-1' : 'mb-4'} shadow-sm ${draggingId === t.id ? 'opacity-70' : ''} ${dragOverId === t.id ? 'ring-2 ring-indigo-200' : ''}`}
                      style={t.isHalf ? { marginLeft: HALF_INDENT_PX, width: `calc(100% - ${HALF_INDENT_PX}px)` } : undefined}
                      draggable={!t.isHalf}
                      onDragStart={(e) => {
                        if (t.isHalf) { e.preventDefault(); return; }
                        setDraggingId(t.id);
                        e.dataTransfer.setData('text/plain', t.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        // If hovering over half, highlight parent instead
                        const targetId = t.isHalf ? (ticketTypes.find((x: any) => x.id === t.parentId)?.id || t.id) : t.id;
                        setDragOverId(targetId);
                      }}
                      onDragLeave={() => setDragOverId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = draggingId || e.dataTransfer.getData('text/plain');
                        setDragOverId(null);
                        setDraggingId(null);
                        if (!sourceId || sourceId === t.id) return;
                        // Determine groups
                        const src = groupOf(ticketTypes, sourceId);
                        if (src.startIdx < 0 || src.count === 0) return;
                        const list = [...ticketTypes];
                        const moved = list.splice(src.startIdx, src.count);
                        // Determine target index as start of target group (parent if half)
                        let targetIdx = list.findIndex((x) => x.id === (t.isHalf ? t.parentId : t.id));
                        if (targetIdx < 0) targetIdx = 0;
                        // If source was before target, after removing, adjust target index
                        if (src.startIdx < targetIdx) targetIdx = Math.max(0, targetIdx - src.count);
                        list.splice(targetIdx, 0, ...moved);
                        reorderTickets(list);
                      }}
                    >
                      <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        {!t.isHalf && (
                          <div className="mt-0.5 text-gray-400 cursor-grab select-none" title="Arraste para reordenar">
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-lg font-bold text-[#091747]">{displayName}</div>
                          {t.isHalf && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[12px]">Meia-entrada</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span className="text-emerald-600 font-medium">À venda</span>
                        </div>
                        {(t.salesStart || t.salesEnd) && (
                          <div className="text-xs text-indigo-900/70 mb-2">
                            {(() => {
                              try {
                                const startStr = t.salesStart ? formatDateTimeShort(new Date(t.salesStart)) : null;
                                const endStr = t.salesEnd ? formatDateTimeShort(new Date(t.salesEnd)) : null;
                                if (startStr && endStr) return <>Vendas: {startStr} — {endStr}</>;
                                if (startStr) return <>A partir de {startStr}</>;
                                if (endStr) return <>Até {endStr}</>;
                              } catch (_) {}
                              return null;
                            })()}
                          </div>
                        )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[#EF4118] text-lg font-bold mr-1">{Number(t.price || 0) === 0 ? 'Gratuito' : formatBRL(Number(t.price || 0))}</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-indigo-700" aria-label="Ações do ingresso">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem disabled={!!t.isHalf} onClick={() => {
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
                            <DropdownMenuItem className="text-red-600 focus:text-red-700" disabled={!!t.isHalf} onSelect={() => setDeleteId(t.id)}>
                              <Trash className="w-4 h-4 mr-2" /> Apagar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <hr className={`border-gray-100 ${isParentWithHalf ? 'my-2' : 'my-4'}`} />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#091747] font-semibold">Vendido <span className="font-bold">0/{t.maxQuantity}</span></span>
                      {Number(t.price || 0) > 0 && (
                        <>
                          <span className="text-[#EF4118] font-semibold">Você recebe <span className="font-bold">{formatBRL(receive)}</span></span>
                          <span className="text-[#EF4118] font-semibold">Taxa <span className="font-bold">{formatBRL(fee)}</span></span>
                        </>
                      )}
                    </div>
                    </div>
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
                      className="group bg-white rounded-xl shadow p-6 flex items-center gap-4 w-full transition-all duration-150 border border-transparent hover:border-indigo-200 hover:shadow-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 text-[26px] font-regular group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-all">+</span>
                      <span className="font-semibold text-indigo-950 group-hover:text-indigo-700 transition-colors">Criar novos ingressos</span>
                    </button>
                  </DrawerTrigger>
                )}
                <DrawerContent>
                  <DrawerHeader className="p-6 pb-2 border-b border-gray-100">
                    <DrawerTitle className="text-xl font-bold text-indigo-950">{editingId ? 'Editar ingresso' : 'Configurar ingresso'}</DrawerTitle>
                    <DrawerDescription>Defina o período de vendas e as informações do ingresso.</DrawerDescription>
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
                    <Input placeholder="Nome do ingresso" value={ticketName} onChange={e => setTicketName(e.target.value)} />
                    <Label>Quantidade máxima de ingressos</Label>
                    <Input placeholder="Quantidade máxima de ingressos" type="number" min={1} value={maxTickets} onChange={e => setMaxTickets(e.target.value)} />
                    {!isFree && (
                      <>
                        <Label>Preço</Label>
                        <Input placeholder="Preço" type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} />
                      </>
                    )}
                    <div className="flex items-center justify-between text-sm mt-1 mb-2">
                      <span className="text-[#091747] font-medium">Total do comprador: {formatBRL(isFree ? 0 : Number(price || 0) + (isAbsorbFee ? 0 : Number(price || 0) * (serviceFeePercent ?? 0)))}</span>
                      <a href="#" className="text-indigo-700 font-medium hover:underline">Ver detalhes</a>
                    </div>
                    <div className="flex items-center gap-3 bg-indigo-50 rounded-lg px-4 py-3">
                      <span className="text-[#091747] text-sm flex-1">Absorver o valor da taxa, ou seja, o cliente não pagará pela taxa de serviço da Fauves.</span>
                      <Switch checked={isAbsorbFee} onCheckedChange={setIsAbsorbFee} disabled={isFree} />
                    </div>
                    {/* Janela de vendas (data e hora lado a lado em cada grupo) */}
                    <div className="flex flex-col gap-4 mt-2 w-full">
                      <div className="w-full">
                        <Label className="mb-1 block">Início das vendas</Label>
                        <div className="flex gap-2 w-full">
                          <Input
                            className="flex-1"
                            type="date"
                            value={salesStartDate}
                            min={todayYmd}
                            onFocus={e => { (e.currentTarget as any).showPicker?.(); }}
                            onChange={e => {
                              let v = e.target.value;
                              if (v && v < todayYmd) v = todayYmd;
                              // Se término já existir e for anterior ao início, alinhar
                              if (salesEndDate && v && salesEndDate < v) {
                                setSalesEndDate(v);
                              }
                              // Se o início for hoje e hora anterior ao agora, ajustar
                              setSalesStartDate(v);
                            }}
                          />
                          <Input
                            className="flex-1"
                            type="time"
                            value={salesStartTime}
                            min={startTimeMin}
                            disabled={!salesStartDate}
                                onChange={e => setSalesStartTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="w-full">
                        <Label className="mb-1 block">Término das vendas</Label>
                        <div className="flex gap-2 w-full">
                          <Input
                            className="flex-1"
                            type="date"
                            value={salesEndDate}
                            min={endDateMin}
                            onFocus={e => { (e.currentTarget as any).showPicker?.(); }}
                            onChange={e => {
                              let v = e.target.value;
                              const min = endDateMin;
                              if (v && min && v < min) v = min as string;
                              setSalesEndDate(v);
                              // Se mesmo dia do início e hora do término menor, alinhar
                              if (v && v === salesStartDate && salesStartTime && salesEndTime && salesEndTime < salesStartTime) {
                                setSalesEndTime(salesStartTime);
                              }
                            }}
                          />
                          <Input
                            className="flex-1"
                            type="time"
                            value={salesEndTime}
                            min={endTimeMin}
                            disabled={!salesEndDate}
                            onChange={e => setSalesEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Meia-entrada automática 40/60 */}
                    <div className="flex items-center gap-2 mt-2">
                      <Switch checked={createHalf} onCheckedChange={setCreateHalf} disabled={isFree || !!editingId} />
                      <span className="text-indigo-900/90 text-sm">Criar automaticamente meia-entrada (40%) para este ingresso (60% inteira). Não editável individualmente.</span>
                    </div>
                    <div className="font-semibold text-indigo-950 mt-2 mb-1">Configurações avançadas</div>
                    <Label>Descrição</Label>
                    <Textarea placeholder="Explique para os participantes mais sobre esse ingresso." className="resize-none" value={description} onChange={e => setDescription(e.target.value)} />
                    <div className="text-xs text-indigo-900/80 mt-1 mb-2">A quantidade mínima por compra deste ingresso é definida em 1. Abaixo, a quantidade máxima que o usuário pode comprar deste ingresso.</div>
                    <Label>Quantidade máxima por usuário</Label>
                    <Input placeholder="Ex.: 4" type="number" min={1} value={perUserLimit} onChange={e => setPerUserLimit(e.target.value)} />
                    <div className="flex items-center gap-2 mt-2">
                      <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                      <span className="text-indigo-900/90 text-sm flex items-center gap-1">
                        <span className="inline-block"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M17 17.5V17.5C17 15.0147 14.9853 13 12.5 13H11.5C9.01472 13 7 15.0147 7 17.5V17.5" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="9" r="3" stroke="#6366F1" strokeWidth="1.5"/></svg></span>
                        Ingresso privado
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 bg-[#FFF4F0] border border-[#FFBCA3] rounded-xl px-4 py-3">
                      <Switch checked={isFacePass} onCheckedChange={setIsFacePass} />
                      <span className="flex flex-col">
                        <span className="text-[#EF4118] font-semibold flex items-center gap-1">FacePass by Fauves</span>
                        <span className="text-[#EF4118] text-xs">Ative o FacePass para que esse ingresso seja validado nessa modalidade.</span>
                      </span>
                    </div>
                  </div>
                  <DrawerFooter className="flex flex-row gap-4 justify-between p-6 border-t border-gray-100">
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
      {/* Botão fixo Continuar para publicar (mesmo estilo do CreateEditEvent) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={goToPublish}
          className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-[45px] w-[180px] rounded-md shadow-lg"
        >
          Continuar para publicar
        </Button>
      </div>
      <StepFlowOverlay visible={flowVisible} activeStep={flowStep} subtitle={flowStep === 2 ? "Preparando criação de ingressos…" : undefined} />
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
                try {
                  setDeleteLoading(true);
                  await fetchApi(`/api/ticket-type/${deleteId}`, { method: 'DELETE' });
                  await fetchTickets();
                } finally {
                  setDeleteLoading(false);
                  setDeleteId(null);
                }
              }}
            >
              {deleteLoading ? 'Apagando…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CreateTickets;
