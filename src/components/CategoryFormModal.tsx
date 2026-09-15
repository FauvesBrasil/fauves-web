import React, { useEffect, useMemo, useState } from 'react';
import { slugify } from '@/lib/slugify';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { CATEGORY_ICON_OPTIONS, getCategoryIcon } from '@/lib/categoryIcons';

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export default function CategoryFormModal({ open, onClose, onSave, initial }: any) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [selectedIcon, setSelectedIcon] = useState(initial?.icon || 'Music');
  const [iconSearch, setIconSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(initial?.name || '');
    setSlug(initial?.slug || '');
    setSelectedIcon(initial?.icon || 'Music');
    setIconSearch('');
  }, [initial]);

  const submit = async () => {
    if (!name) {
      return toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome da categoria',
        variant: 'destructive'
      });
    }
    setLoading(true);
    try {
      const payload = {
        name,
        slug: slug || slugify(name),
        icon: selectedIcon
      };
      await onSave(payload);
      onClose();
    } catch (e: any) {
      // no-op
      toast({
        title: 'Erro',
        description: e?.message || 'Falha ao salvar',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const SelectedIconComponent = getCategoryIcon(selectedIcon);
  const groupedIcons = useMemo(() => {
    const query = normalize(iconSearch.trim());
    const filtered = query
      ? CATEGORY_ICON_OPTIONS.filter((option) => normalize(`${option.label} ${option.name} ${option.group} ${option.keywords || ''}`).includes(query))
      : CATEGORY_ICON_OPTIONS;
    return filtered.reduce<Record<string, typeof CATEGORY_ICON_OPTIONS>>((groups, option) => {
      (groups[option.group] ||= []).push(option);
      return groups;
    }, {});
  }, [iconSearch]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar' : 'Criar'} categoria</DialogTitle>
          <DialogDescription>
            Preencha as informações da categoria. O ícone será usado na interface.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              placeholder="Ex: Música, Teatro, Gastronomia..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-base"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (opcional)</Label>
            <Input
              id="slug"
              placeholder="Ex: musica, teatro (auto-gerado se vazio)"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Identificador único para URL. Se deixar vazio, será gerado automaticamente.
            </p>
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900">
                <SelectedIconComponent className="w-6 h-6 text-teal-700 dark:text-teal-300" />
              </div>
              <div>
                <p className="font-medium text-sm">Ícone selecionado:</p>
                <p className="text-xs text-gray-500">{selectedIcon}</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={iconSearch}
                onChange={(event) => setIconSearch(event.target.value)}
                placeholder="Buscar ícone: família, livros, jogos, tecnologia..."
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[320px] w-full border rounded-lg p-3">
              {Object.keys(groupedIcons).length ? Object.entries(groupedIcons).map(([group, options]) => (
                <div className="mb-4 last:mb-0" key={group}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{group}</p>
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                    {options.map(({ name: iconName, label, Icon }) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`group relative flex aspect-square w-full items-center justify-center rounded-md transition-all hover:scale-105 ${
                          selectedIcon === iconName
                            ? 'border-2 border-teal-600 bg-teal-100 shadow-sm dark:bg-teal-900'
                            : 'border border-gray-300 bg-gray-100 hover:border-teal-400 dark:border-gray-700 dark:bg-gray-800'
                        }`}
                        title={label}
                        aria-label={`Selecionar ícone ${label}`}
                      >
                        <Icon className={`h-5 w-5 ${selectedIcon === iconName ? 'text-teal-700 dark:text-teal-300' : 'text-gray-600 dark:text-gray-400'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )) : <p className="py-12 text-center text-sm text-gray-500">Nenhum ícone encontrado.</p>}
            </ScrollArea>
            <p className="text-xs text-gray-500">
              {CATEGORY_ICON_OPTIONS.length} opções organizadas por tema
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
