import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api/category';
import CategoryFormModal from '@/components/CategoryFormModal';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';

export default function AdminCategories() {
  const { token } = useAuth();
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removingCategory, setRemovingCategory] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getCategories(token);
      setCats(data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Falha ao carregar categorias', variant: 'destructive' });
    } finally { setLoading(false); }
  }

  useEffect(() => { load() }, []);

  const openCreateModal = () => { setEditing(null); setModalOpen(true); };
  const openEditModal = (c: any) => { setEditing(c); setModalOpen(true); };

  const save = async (payload: any) => {
    try {
      if (editing) {
        await updateCategory(editing.id, payload, token);
      } else {
        await createCategory(payload, token);
      }
      await load();
      setEditing(null);
      setModalOpen(false);
      toast({ title: 'Salvo', description: 'Categoria salva com sucesso' });
    } catch (e: any) { console.error(e); toast({ title: 'Erro', description: 'Falha ao salvar categoria', variant: 'destructive' }); }
  };

  const removeCat = async (c: any) => {
    setRemovingCategory(c);
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    if (!removingCategory) return;
    try {
      await deleteCategory(removingCategory.id, token);
      await load();
      toast({ title: 'Removido', description: 'Categoria desativada' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Erro ao remover', variant: 'destructive' });
    } finally {
      setShowRemoveConfirm(false);
      setRemovingCategory(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Categorias"
        description="Gerencie as categorias de eventos disponíveis na plataforma."
        actions={
          <Button onClick={openCreateModal} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Nova Categoria
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
                  <TableHead className="w-[300px]">Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-[100px]">Ordem</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                      Nenhuma categoria encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  cats.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-zinc-900">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-zinc-500 font-mono text-xs">
                        {c.slug}
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {c.sortOrder ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.isActive ? "default" : "secondary"}
                          className={c.isActive ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"}
                        >
                          {c.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-600">
                              <span className="sr-only">Menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(c)} className="gap-2 cursor-pointer">
                              <Pencil className="w-4 h-4 text-zinc-500" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => removeCat(c)} className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                              Desativar
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

      <CategoryFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={save} initial={editing} />

      <ConfirmDialog
        open={showRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        title="Desativar categoria"
        description={`Tem certeza que deseja desativar a categoria "${removingCategory?.name || ''}"?`}
        confirmText="Sim, desativar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmRemove}
      />
    </div>
  );
}
