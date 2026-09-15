import type { LucideIcon } from 'lucide-react';
import {
  Activity, Baby, BadgeDollarSign, Beer, Bike, Binary, Bitcoin, BookOpen, Bot,
  BrainCircuit, BriefcaseBusiness, Building2, CakeSlice, CalendarDays, Camera,
  ChefHat, Church, Circle, Clapperboard, Clock3, CloudSun, Code2, Coffee, Coins,
  Compass, CookingPot, Cpu, Crown, Database, Dices, Disc3, Drama, Dumbbell,
  Film, Footprints, Gamepad2, Gem, GraduationCap, Guitar, HandHeart, Headphones,
  Heart, HeartPulse, IceCreamBowl, Image as ImageIcon, Languages, Laptop, Leaf,
  Library, Lightbulb, Map as MapIcon, MapPin, Medal, Megaphone, Mic2, Mountain,
  Music, Music2, Paintbrush, Palette, PartyPopper, PawPrint, PenTool,
  PersonStanding, Pizza, Plane, Puzzle, Radio, Rocket, School, ShoppingBag,
  Smartphone, Smile, Sparkles, Star, Store, Sun, Target, TentTree, Theater,
  Ticket, Trophy, UserRound, Users, Utensils, Volume2, Waves, Wifi, Wine, Zap,
} from 'lucide-react';

export type CategoryIconOption = {
  name: string;
  label: string;
  group: string;
  keywords?: string;
  Icon: LucideIcon;
};

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { name: 'Music', label: 'Música', group: 'Entretenimento', Icon: Music },
  { name: 'Music2', label: 'Notas musicais', group: 'Entretenimento', Icon: Music2 },
  { name: 'Guitar', label: 'Guitarra', group: 'Entretenimento', Icon: Guitar },
  { name: 'Headphones', label: 'Fones', group: 'Entretenimento', Icon: Headphones },
  { name: 'Mic2', label: 'Microfone', group: 'Entretenimento', keywords: 'show canto comédia', Icon: Mic2 },
  { name: 'Radio', label: 'Rádio', group: 'Entretenimento', Icon: Radio },
  { name: 'Disc3', label: 'Disco', group: 'Entretenimento', keywords: 'dj eletrônica', Icon: Disc3 },
  { name: 'Film', label: 'Cinema', group: 'Entretenimento', Icon: Film },
  { name: 'Clapperboard', label: 'Filmagem', group: 'Entretenimento', Icon: Clapperboard },
  { name: 'Theater', label: 'Teatro', group: 'Entretenimento', Icon: Theater },
  { name: 'Drama', label: 'Espetáculo', group: 'Entretenimento', Icon: Drama },
  { name: 'PartyPopper', label: 'Festa', group: 'Entretenimento', Icon: PartyPopper },
  { name: 'Volume2', label: 'Áudio', group: 'Entretenimento', Icon: Volume2 },

  { name: 'Palette', label: 'Arte', group: 'Arte e educação', Icon: Palette },
  { name: 'Paintbrush', label: 'Pintura', group: 'Arte e educação', Icon: Paintbrush },
  { name: 'Camera', label: 'Fotografia', group: 'Arte e educação', Icon: Camera },
  { name: 'Image', label: 'Exposição', group: 'Arte e educação', keywords: 'galeria imagem', Icon: ImageIcon },
  { name: 'BookOpen', label: 'Livros', group: 'Arte e educação', Icon: BookOpen },
  { name: 'Library', label: 'Biblioteca', group: 'Arte e educação', Icon: Library },
  { name: 'GraduationCap', label: 'Educação', group: 'Arte e educação', Icon: GraduationCap },
  { name: 'School', label: 'Curso', group: 'Arte e educação', Icon: School },
  { name: 'Languages', label: 'Idiomas', group: 'Arte e educação', Icon: Languages },
  { name: 'PenTool', label: 'Design', group: 'Arte e educação', Icon: PenTool },

  { name: 'Utensils', label: 'Comida e bebida', group: 'Gastronomia', Icon: Utensils },
  { name: 'CookingPot', label: 'Culinária', group: 'Gastronomia', Icon: CookingPot },
  { name: 'ChefHat', label: 'Chef', group: 'Gastronomia', Icon: ChefHat },
  { name: 'Coffee', label: 'Café', group: 'Gastronomia', Icon: Coffee },
  { name: 'Wine', label: 'Vinho', group: 'Gastronomia', Icon: Wine },
  { name: 'Beer', label: 'Cerveja', group: 'Gastronomia', Icon: Beer },
  { name: 'CakeSlice', label: 'Confeitaria', group: 'Gastronomia', Icon: CakeSlice },
  { name: 'Pizza', label: 'Pizza', group: 'Gastronomia', Icon: Pizza },
  { name: 'IceCreamBowl', label: 'Sobremesa', group: 'Gastronomia', Icon: IceCreamBowl },

  { name: 'Trophy', label: 'Esportes', group: 'Esporte e movimento', Icon: Trophy },
  { name: 'Medal', label: 'Competição', group: 'Esporte e movimento', Icon: Medal },
  { name: 'Dumbbell', label: 'Fitness', group: 'Esporte e movimento', Icon: Dumbbell },
  { name: 'Bike', label: 'Ciclismo', group: 'Esporte e movimento', Icon: Bike },
  { name: 'Footprints', label: 'Corrida', group: 'Esporte e movimento', keywords: 'caminhada', Icon: Footprints },
  { name: 'PersonStanding', label: 'Movimento', group: 'Esporte e movimento', Icon: PersonStanding },
  { name: 'Activity', label: 'Atividade', group: 'Esporte e movimento', Icon: Activity },
  { name: 'Waves', label: 'Esportes aquáticos', group: 'Esporte e movimento', Icon: Waves },
  { name: 'Mountain', label: 'Aventura', group: 'Esporte e movimento', Icon: Mountain },

  { name: 'Laptop', label: 'Tecnologia', group: 'Tecnologia', Icon: Laptop },
  { name: 'Code2', label: 'Programação', group: 'Tecnologia', Icon: Code2 },
  { name: 'Cpu', label: 'Hardware', group: 'Tecnologia', Icon: Cpu },
  { name: 'Smartphone', label: 'Mobile', group: 'Tecnologia', Icon: Smartphone },
  { name: 'Bot', label: 'Robótica', group: 'Tecnologia', Icon: Bot },
  { name: 'BrainCircuit', label: 'Inteligência artificial', group: 'Tecnologia', keywords: 'ia ai', Icon: BrainCircuit },
  { name: 'Binary', label: 'Dados digitais', group: 'Tecnologia', Icon: Binary },
  { name: 'Database', label: 'Dados', group: 'Tecnologia', Icon: Database },
  { name: 'Wifi', label: 'Internet', group: 'Tecnologia', Icon: Wifi },
  { name: 'Rocket', label: 'Inovação', group: 'Tecnologia', keywords: 'startup', Icon: Rocket },

  { name: 'Users', label: 'Comunidade', group: 'Pessoas e bem-estar', Icon: Users },
  { name: 'Baby', label: 'Família', group: 'Pessoas e bem-estar', keywords: 'crianças infantil', Icon: Baby },
  { name: 'UserRound', label: 'Pessoas', group: 'Pessoas e bem-estar', Icon: UserRound },
  { name: 'Heart', label: 'Bem-estar', group: 'Pessoas e bem-estar', Icon: Heart },
  { name: 'HeartPulse', label: 'Saúde', group: 'Pessoas e bem-estar', Icon: HeartPulse },
  { name: 'HandHeart', label: 'Solidariedade', group: 'Pessoas e bem-estar', Icon: HandHeart },
  { name: 'PawPrint', label: 'Pets', group: 'Pessoas e bem-estar', Icon: PawPrint },
  { name: 'Church', label: 'Espiritualidade', group: 'Pessoas e bem-estar', keywords: 'religião', Icon: Church },
  { name: 'Smile', label: 'Diversão', group: 'Pessoas e bem-estar', Icon: Smile },

  { name: 'BriefcaseBusiness', label: 'Negócios', group: 'Negócios e finanças', Icon: BriefcaseBusiness },
  { name: 'Building2', label: 'Empresas', group: 'Negócios e finanças', Icon: Building2 },
  { name: 'Coins', label: 'Finanças', group: 'Negócios e finanças', Icon: Coins },
  { name: 'Bitcoin', label: 'Cripto', group: 'Negócios e finanças', Icon: Bitcoin },
  { name: 'BadgeDollarSign', label: 'Investimentos', group: 'Negócios e finanças', Icon: BadgeDollarSign },
  { name: 'ShoppingBag', label: 'Compras', group: 'Negócios e finanças', Icon: ShoppingBag },
  { name: 'Store', label: 'Comércio', group: 'Negócios e finanças', Icon: Store },
  { name: 'Target', label: 'Marketing', group: 'Negócios e finanças', Icon: Target },
  { name: 'Lightbulb', label: 'Ideias', group: 'Negócios e finanças', Icon: Lightbulb },
  { name: 'Megaphone', label: 'Comunicação', group: 'Negócios e finanças', Icon: Megaphone },

  { name: 'Plane', label: 'Viagens', group: 'Viagem e natureza', Icon: Plane },
  { name: 'Map', label: 'Passeios', group: 'Viagem e natureza', Icon: MapIcon },
  { name: 'MapPin', label: 'Local', group: 'Viagem e natureza', Icon: MapPin },
  { name: 'Compass', label: 'Explorar', group: 'Viagem e natureza', Icon: Compass },
  { name: 'TentTree', label: 'Camping', group: 'Viagem e natureza', Icon: TentTree },
  { name: 'Sun', label: 'Ar livre', group: 'Viagem e natureza', Icon: Sun },
  { name: 'CloudSun', label: 'Clima', group: 'Viagem e natureza', Icon: CloudSun },
  { name: 'Leaf', label: 'Sustentabilidade', group: 'Viagem e natureza', Icon: Leaf },

  { name: 'CalendarDays', label: 'Agenda', group: 'Geral', Icon: CalendarDays },
  { name: 'Clock3', label: 'Horário', group: 'Geral', Icon: Clock3 },
  { name: 'Ticket', label: 'Ingressos', group: 'Geral', Icon: Ticket },
  { name: 'Dices', label: 'Jogos', group: 'Geral', Icon: Dices },
  { name: 'Gamepad2', label: 'Games', group: 'Geral', Icon: Gamepad2 },
  { name: 'Puzzle', label: 'Atividades', group: 'Geral', Icon: Puzzle },
  { name: 'Zap', label: 'Destaque', group: 'Geral', Icon: Zap },
  { name: 'Crown', label: 'Premium', group: 'Geral', Icon: Crown },
  { name: 'Star', label: 'Favoritos', group: 'Geral', Icon: Star },
  { name: 'Gem', label: 'Especial', group: 'Geral', Icon: Gem },
  { name: 'Sparkles', label: 'Novidades', group: 'Geral', Icon: Sparkles },
  { name: 'Circle', label: 'Genérico', group: 'Geral', Icon: Circle },
];

const categoryIconsByName = new Map<string, LucideIcon>(CATEGORY_ICON_OPTIONS.map((option) => [option.name, option.Icon]));
categoryIconsByName.set('Mic', Mic2);
categoryIconsByName.set('Volume', Volume2);
categoryIconsByName.set('Disc', Disc3);
categoryIconsByName.set('Code', Code2);
categoryIconsByName.set('Briefcase', BriefcaseBusiness);

export const getCategoryIcon = (name?: string | null, fallback: LucideIcon = Sparkles): LucideIcon => (
  categoryIconsByName.get(String(name || '')) || fallback
);
