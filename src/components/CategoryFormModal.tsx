import React, { useEffect, useState } from 'react';
import { slugify } from '@/lib/slugify';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Music, Film, Palette, Utensils, Plane, Heart, Briefcase, GraduationCap,
  Mic2, PartyPopper, Trophy, Users, Code, Dumbbell, ShoppingBag, Camera,
  BookOpen, Coffee, Star, Sparkles, Zap, Rocket, Crown, Target,
  Music2, Guitar, Headphones, Radio, Volume2, Disc3
} from 'lucide-react';

// Icon options for categories
const ICON_OPTIONS = [
  { name: 'Music', icon: Music },
  { name: 'Music2', icon: Music2 },
  { name: 'Guitar', icon: Guitar },
  { name: 'Headphones', icon: Headphones },
  { name: 'Mic', icon: Mic2 },
  { name: 'Radio', icon: Radio },
  { name: 'Volume', icon: Volume2 },
  { name: 'Disc', icon: Disc3 },
  { name: 'Film', icon: Film },
  { name: 'Palette', icon: Palette },
  { name: 'Utensils', icon: Utensils },
  { name: 'Plane', icon: Plane },
  { name: 'Heart', icon: Heart },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'PartyPopper', icon: PartyPopper },
  { name: 'Trophy', icon: Trophy },
  { name: 'Users', icon: Users },
  { name: 'Code', icon: Code },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Camera', icon: Camera },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Coffee', icon: Coffee },
  { name: 'Star', icon: Star },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Zap', icon: Zap },
  { name: 'Rocket', icon: Rocket },
  { name: 'Crown', icon: Crown },
  { name: 'Target', icon: Target },
];

export default function CategoryFormModal({ open, onClose, onSave, initial }: any) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [selectedIcon, setSelectedIcon] = useState(initial?.icon || 'Music');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(initial?.name || '');
    setSlug(initial?.slug || '');
    setSelectedIcon(initial?.icon || 'Music');
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

  const SelectedIconComponent = ICON_OPTIONS.find(opt => opt.name === selectedIcon)?.icon || Music;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
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

            <ScrollArea className="h-[200px] w-full border rounded-lg p-2">
              <div className="grid grid-cols-6 gap-2">
                {ICON_OPTIONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`
                      flex items-center justify-center w-full aspect-square rounded-md
                      transition-all hover:scale-105
                      ${selectedIcon === name
                        ? 'bg-teal-100 dark:bg-teal-900 border-2 border-teal-600 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-teal-400'
                      }
                    `}
                    title={name}
                  >
                    <Icon className={`w-5 h-5 ${selectedIcon === name ? 'text-teal-700 dark:text-teal-300' : 'text-gray-600 dark:text-gray-400'}`} />
                  </button>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-gray-500">
              Clique em um ícone para selecioná-lo
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
