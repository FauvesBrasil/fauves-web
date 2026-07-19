import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/apiBase';
import { useToast } from '@/hooks/use-toast';
import { SectionCard } from '@/components/SectionCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Plus, Pencil, Trash2, Image, Globe, MapPin } from 'lucide-react';

// Lista de UFs brasileiras
const UF_LIST = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
    'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

interface Slide {
    id: string;
    title: string;
    imageUrl: string;
    linkType: string;
    linkUrl?: string;
    eventId?: string;
    targetUf?: string;
    isActive: boolean;
    showTitle?: boolean;
    order: number;
    startDate?: string;
    endDate?: string;
    event?: { id: string; name: string; slug: string };
}

export default function AdminSlides() {
    const { token } = useAuth();
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Slide | null>(null);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        linkType: 'none',
        linkUrl: '',
        eventId: '',
        targetUf: '',
        isActive: true,
        showTitle: true,
        order: 0,
    });

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingSlide, setDeletingSlide] = useState<Slide | null>(null);

    // Events for select with search
    const [events, setEvents] = useState<any[]>([]);
    const [eventSearch, setEventSearch] = useState('');
    const [eventSearchLoading, setEventSearchLoading] = useState(false);

    async function loadSlides() {
        setLoading(true);
        try {
            const res = await fetchApi('/api/admin/slides', { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Erro ao carregar slides');
            const data = await res.json();
            setSlides(Array.isArray(data) ? data : []);
        } catch (e) {
            // no-op
            toast({ title: 'Erro', description: 'Falha ao carregar slides', variant: 'destructive' });
        } finally { setLoading(false); }
    }

    async function searchEvents(query: string) {
        setEventSearchLoading(true);
        try {
            const url = query
                ? `/api/admin/events?page=1&perPage=20&search=${encodeURIComponent(query)}`
                : '/api/admin/events?page=1&perPage=20';
            const res = await fetchApi(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const data = await res.json();
            // Handle both array and paginated object responses
            let eventsList: any[] = [];
            if (Array.isArray(data)) {
                eventsList = data;
            } else if (data && typeof data === 'object') {
                eventsList = data.data || data.events || data.items || [];
            }
            setEvents(Array.isArray(eventsList) ? eventsList : []);
        } catch (e) {
            // no-op
            setEvents([]);
        } finally { setEventSearchLoading(false); }
    }

    useEffect(() => { loadSlides(); searchEvents(''); }, []);

    const openCreateModal = () => {
        setEditing(null);
        setFormData({ title: '', imageUrl: '', linkType: 'none', linkUrl: '', eventId: '', targetUf: '', isActive: true, showTitle: true, order: 0 });
        setModalOpen(true);
    };

    const openEditModal = (slide: Slide) => {
        setEditing(slide);
        setFormData({
            title: slide.title,
            imageUrl: slide.imageUrl,
            linkType: slide.linkType,
            linkUrl: slide.linkUrl || '',
            eventId: slide.eventId || '',
            targetUf: slide.targetUf || '',
            isActive: slide.isActive,
            showTitle: slide.showTitle !== false,
            order: slide.order,
        });
        setModalOpen(true);
    };

    const saveSlide = async () => {
        try {
            const payload = {
                ...formData,
                targetUf: formData.targetUf || null,
                eventId: formData.linkType === 'event' ? formData.eventId : null,
                linkUrl: formData.linkType === 'external' ? formData.linkUrl : null,
            };

            const url = editing ? `/api/admin/slides/${editing.id}` : '/api/admin/slides';
            const method = editing ? 'PUT' : 'POST';

            const res = await fetchApi(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());

            await loadSlides();
            setModalOpen(false);
            toast({ title: 'Salvo', description: 'Slide salvo com sucesso' });
        } catch (e: any) {
            // no-op
            toast({ title: 'Erro', description: 'Falha ao salvar slide', variant: 'destructive' });
        }
    };

    const deleteSlide = async () => {
        if (!deletingSlide) return;
        try {
            await fetchApi(`/api/admin/slides/${deletingSlide.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            await loadSlides();
            toast({ title: 'Removido', description: 'Slide excluído' });
        } catch (e) {
            // no-op
            toast({ title: 'Erro', description: 'Erro ao excluir', variant: 'destructive' });
        } finally {
            setShowDeleteConfirm(false);
            setDeletingSlide(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetchApi('/api/upload', { method: 'POST', body: fd });
            if (!res.ok) throw new Error('Upload falhou');
            const json = await res.json();
            setFormData(prev => ({ ...prev, imageUrl: json.url }));
            toast({ title: 'Upload', description: 'Imagem enviada com sucesso' });
        } catch (e) {
            toast({ title: 'Erro', description: 'Falha no upload', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <SectionCard
                title="Slides da Homepage"
                description="Gerencie os slides do carrossel da página inicial. Configure slides universais ou específicos para cada estado."
                actions={
                    <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Plus className="w-4 h-4" />
                        Novo Slide
                    </Button>
                }
            >
                {loading ? (
                    <div className="flex items-center justify-center p-12 text-zinc-500">
                        Carregando...
                    </div>
                ) : (
                    <div className="rounded-md border border-zinc-200 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                    <TableHead className="w-[80px]">Preview</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead className="w-[100px]">Estado</TableHead>
                                    <TableHead className="w-[100px]">Tipo Link</TableHead>
                                    <TableHead className="w-[80px]">Ordem</TableHead>
                                    <TableHead className="w-[80px]">Status</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {slides.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                                            Nenhum slide encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    slides.map((slide) => (
                                        <TableRow key={slide.id}>
                                            <TableCell>
                                                {slide.imageUrl ? (
                                                    <img src={slide.imageUrl} alt="" className="w-16 h-10 object-cover rounded" />
                                                ) : (
                                                    <div className="w-16 h-10 bg-zinc-100 rounded flex items-center justify-center">
                                                        <Image className="w-4 h-4 text-zinc-400" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium text-zinc-900">
                                                {slide.title}
                                                {slide.event && (
                                                    <div className="text-xs text-zinc-500 mt-0.5">→ {slide.event.name}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {slide.targetUf ? (
                                                    <Badge variant="outline" className="gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {slide.targetUf}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        Universal
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-zinc-500 text-sm">
                                                {slide.linkType === 'event' ? 'Evento' : slide.linkType === 'external' ? 'Externo' : 'Nenhum'}
                                            </TableCell>
                                            <TableCell className="text-zinc-500">{slide.order}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={slide.isActive ? "default" : "secondary"}
                                                    className={slide.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}
                                                >
                                                    {slide.isActive ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-600">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditModal(slide)} className="gap-2 cursor-pointer">
                                                            <Pencil className="w-4 h-4 text-zinc-500" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => { setDeletingSlide(slide); setShowDeleteConfirm(true); }}
                                                            className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </SectionCard>

            {/* Modal de criação/edição */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Slide' : 'Novo Slide'}</DialogTitle>
                        <DialogDescription>
                            Configure as propriedades do slide do carrossel.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título (interno)</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Promoção Verão 2024"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Imagem do Slide</Label>
                            {formData.imageUrl && (
                                <img src={formData.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                            )}
                            <div className="flex gap-2">
                                <Input
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                                    placeholder="URL da imagem"
                                    className="flex-1"
                                />
                                <label className="cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                    <Button type="button" variant="outline" asChild>
                                        <span>Upload</span>
                                    </Button>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Estado (UF)</Label>
                                <Select
                                    value={formData.targetUf || 'universal'}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, targetUf: v === 'universal' ? '' : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Universal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="universal">🌐 Universal (todos)</SelectItem>
                                        {UF_LIST.map(uf => (
                                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Ordem</Label>
                                <Input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo de Link</Label>
                            <Select
                                value={formData.linkType}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, linkType: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem link</SelectItem>
                                    <SelectItem value="event">Link para Evento</SelectItem>
                                    <SelectItem value="external">Link Externo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.linkType === 'event' && (
                            <div className="space-y-2">
                                <Label>Buscar Evento</Label>
                                <Input
                                    value={eventSearch}
                                    onChange={(e) => {
                                        setEventSearch(e.target.value);
                                        searchEvents(e.target.value);
                                    }}
                                    placeholder="Digite para buscar..."
                                />
                                {eventSearchLoading && (
                                    <div className="text-sm text-zinc-500">Buscando...</div>
                                )}
                                {events.length > 0 && (
                                    <div className="border rounded-md max-h-48 overflow-y-auto">
                                        {events.map(ev => (
                                            <div
                                                key={ev.id}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, eventId: ev.id }));
                                                    setEventSearch(ev.name);
                                                }}
                                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-zinc-100 ${formData.eventId === ev.id ? 'bg-indigo-50 text-indigo-700' : ''}`}
                                            >
                                                {ev.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {formData.eventId && !eventSearch && (
                                    <div className="text-sm text-indigo-600">
                                        Evento selecionado: {events.find(e => e.id === formData.eventId)?.name || editing?.event?.name || formData.eventId}
                                    </div>
                                )}
                            </div>
                        )}

                        {formData.linkType === 'external' && (
                            <div className="space-y-2">
                                <Label>URL Externa</Label>
                                <Input
                                    value={formData.linkUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))}
                                />
                                <Label>Slide ativo</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={formData.showTitle}
                                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, showTitle: v }))}
                                />
                                <Label>Exibir título</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={saveSlide} className="bg-indigo-600 hover:bg-indigo-700">
                            {editing ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Excluir slide"
                description={`Tem certeza que deseja excluir o slide "${deletingSlide?.title || ''}"?`}
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={deleteSlide}
            />
        </div>
    );
}
