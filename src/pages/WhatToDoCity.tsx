import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import { fetchApi } from '@/lib/apiBase';
import { Loader2, Search, Calendar, PartyPopper, Music, LayoutGrid } from 'lucide-react';
import LeadCapture from '../components/LeadCapture';
import AppShell from '../components/AppShell';

interface Event {
    id: string;
    name: string;
    startDate: string;
    endDate?: string | null;
    location?: string | null;
    bannerUrl?: string | null;
    banner?: string | null;
    image?: string | null;
    slug?: string | null;
    locationCity?: string;
    locationUf?: string;
    categories?: any[];
}

const WhatToDoCity = () => {
    const { citySlug } = useParams<{ citySlug: string }>();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'weekend' | 'festas' | 'shows'>('all');

    // Função para converter slug em nome legível
    const slugToCityName = (slug: string) => {
        const specialCases: Record<string, string> = {
            'sao-paulo': 'São Paulo',
            'vitoria': 'Vitória',
            'maceio': 'Maceió',
            'belem': 'Belém',
            'florianopolis': 'Florianópolis',
            'goiania': 'Goiânia',
            'cuiaba': 'Cuiabá',
            'sao-luis': 'São Luís',
            'ribeirao-preto': 'Ribeirão Preto',
            'sao-jose-dos-campos': 'São José dos Campos'
        };

        if (specialCases[slug.toLowerCase()]) return specialCases[slug.toLowerCase()];

        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const cityName = slugToCityName(citySlug || '');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Busca eventos e filtra pela cidade
                const res = await fetchApi('/events?limit=200');
                if (res.ok) {
                    const data = await res.json();
                    const list = data.events || [];
                    
                    const filtered = list.filter((ev: any) => 
                        ev.locationCity?.toLowerCase() === cityName.toLowerCase() ||
                        ev.locationCity?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === 
                        cityName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
                    );
                    setEvents(filtered);
                }
            } catch (err) {
                console.error(`Falha ao carregar eventos para ${cityName}:`, err);
            } finally {
                setLoading(false);
            }
        };
        load();
        
        // SEO: Meta Tags
        document.title = `O que fazer em ${cityName} hoje | Eventos, festas e shows | Fauves`;
        
        // Adiciona/Atualiza Meta Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', `Descubra os melhores eventos em ${cityName}. Festas, shows e experiências atualizadas diariamente na Fauves.`);

    }, [citySlug, cityName]);

    const now = new Date();
    const todayStr = now.toDateString();

    const todayEventsRaw = events.filter(ev => {
        if (!ev.startDate) return false;
        return new Date(ev.startDate).toDateString() === todayStr;
    });

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    const endOfSunday = new Date(today);
    endOfSunday.setDate(today.getDate() + daysUntilSunday);
    endOfSunday.setHours(23, 59, 59, 999);

    const weekendEventsRaw = events.filter(ev => {
        if (!ev.startDate) return false;
        const evDate = new Date(ev.startDate);
        return evDate >= now && evDate <= endOfSunday;
    });

    const upcomingEventsRaw = events.filter(ev => {
        if (!ev.startDate) return false;
        return new Date(ev.startDate) > endOfSunday;
    }).sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Logic for filtering based on activeFilter
    const getFilteredEvents = (baseEvents: Event[]) => {
        if (activeFilter === 'all') return baseEvents;
        if (activeFilter === 'today') return baseEvents.filter(ev => new Date(ev.startDate).toDateString() === todayStr);
        if (activeFilter === 'weekend') return baseEvents.filter(ev => {
            const d = new Date(ev.startDate);
            return d >= now && d <= endOfSunday;
        });
        if (activeFilter === 'festas') return baseEvents.filter(ev => 
            ev.name.toLowerCase().includes('festa') || 
            ev.categories?.some((c: any) => c.name?.toLowerCase().includes('festa'))
        );
        if (activeFilter === 'shows') return baseEvents.filter(ev => 
            ev.name.toLowerCase().includes('show') || 
            ev.categories?.some((c: any) => c.name?.toLowerCase().includes('show'))
        );
        return baseEvents;
    };

    const renderEventsSection = (title: string, evList: Event[], emptyMsg?: React.ReactNode) => {
        const filtered = getFilteredEvents(evList);
        
        // Don't render empty upcoming sections if we are not at "All" or if it would be redundant
        if (filtered.length === 0 && !emptyMsg) return null;

        return (
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-[#091747] dark:text-white mb-6 flex items-center gap-2">
                    {title}
                </h2>
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filtered.map(ev => (
                            <EventCard 
                                key={ev.id}
                                id={ev.id}
                                title={ev.name}
                                image={ev.bannerUrl || ev.banner || (ev.image && typeof ev.image === 'string' && ev.image.length > 5 ? ev.image : '/no-image.svg')}
                                date={new Date(ev.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                location={ev.locationCity && ev.locationUf ? `${ev.locationCity} - ${ev.locationUf}` : (ev.location || `${cityName} - CE`)}
                                slug={ev.slug}
                                size="large"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#f8f9fc] dark:bg-white/5 border border-dashed border-[#cbd5e1] dark:border-white/10 rounded-2xl py-12 px-6 text-center">
                        <div className="text-[#64748b] dark:text-gray-400 text-base leading-relaxed max-w-2xl mx-auto">
                            {emptyMsg || (
                                <>
                                    Atualmente não há eventos cadastrados para este período, mas novos eventos são adicionados diariamente. 
                                    Explore outras datas ou categorias.
                                </>
                            )}
                        </div>
                    </div>
                )}
            </section>
        );
    };

    const getCityImage = (slug: string, name: string) => {
        const cityImages: Record<string, string> = {
            'fortaleza': 'https://images.trvl-media.com/place/6142832/917c6b31-1da4-4e62-9869-79b2c991dec8.jpg',
            'sao-paulo': 'https://visitesaopaulo.com/wp-content/uploads/2023/05/banner-i.jpg',
            'rio-de-janeiro': '1483729558449-99ef05a13d9f',
            'salvador': '1591461537233-0443fe0364d0',
            'belo-horizonte': '1593995863951-b79bc19599ba',
            'curitiba': '1596464716127-f2a829d4de30',
            'brasilia': '1595111090623-11f845d47053',
            'recife': '1594911776510-7e18987d6056',
            'florianopolis': '1593021151203-01e4f62629b3'
        };

        const val = cityImages[slug.toLowerCase()];
        
        // Se houver mapeamento específico
        if (val) {
            if (val.startsWith('http')) return val;
            return `https://images.unsplash.com/photo-${val}?q=80&w=2000&auto=format&fit=crop`;
        }
        
        // Fallback dinâmico: busca automática por nome da cidade (+ pontos turísticos para ser mais preciso)
        return `https://images.unsplash.com/featured/?${encodeURIComponent(name)},brazil,sightseeing,landmark,tourism`;
    };

    const heroImage = getCityImage(citySlug || '', cityName);

    return (
        <AppShell>
            {/* Hero Section */}
            <div className="relative w-full h-[460px] max-md:h-[400px] overflow-hidden">
                <img 
                    src={heroImage} 
                    alt={cityName}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1463620910506-d0458143143e?q=80&w=2000';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                <div className="absolute inset-0 flex flex-col items-start justify-center text-left px-6 pointer-events-none">
                    <div className="max-w-[1352px] w-full mx-auto px-6 md:px-[156px] pointer-events-auto">
                        <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {cityName}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-medium max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                            Eventos, festas e experiências acontecendo agora
                        </p>
                        
                        <div className="mt-8 relative max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                type="text"
                                placeholder={`Buscar eventos em ${cityName}...`}
                                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-4 pl-12 pr-6 text-white placeholder:text-white/60 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all pointer-events-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1352px] mx-auto pt-12 pb-20">
                {/* Intro SEO Text */}
                <div className="px-6 md:px-[156px] max-md:px-5 max-sm:px-4 mb-12">
                    <div className="p-8 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl">
                        <p className="text-lg text-[#4b5563] dark:text-gray-300 leading-relaxed italic">
                            "Se você está procurando o que fazer em {cityName} hoje, aqui você encontra os melhores eventos, 
                            festas, shows e experiências acontecendo na cidade. A Fauves reúne opções atualizadas diariamente 
                            para você aproveitar ao máximo {cityName}."
                        </p>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="px-6 md:px-[156px] max-md:px-5 max-sm:px-4 mb-12 flex flex-wrap gap-3 items-center">
                    <FilterButton 
                        active={activeFilter === 'all'} 
                        onClick={() => setActiveFilter('all')}
                        icon={<LayoutGrid size={18} />}
                        label="Todos"
                    />
                    <FilterButton 
                        active={activeFilter === 'today'} 
                        onClick={() => setActiveFilter('today')}
                        icon={<Calendar size={18} />}
                        label="Hoje"
                    />
                    <FilterButton 
                        active={activeFilter === 'weekend'} 
                        onClick={() => setActiveFilter('weekend')}
                        icon={<Calendar size={18} />}
                        label="Fim de semana"
                    />
                    <FilterButton 
                        active={activeFilter === 'festas'} 
                        onClick={() => setActiveFilter('festas')}
                        icon={<PartyPopper size={18} />}
                        label="Festas"
                    />
                    <FilterButton 
                        active={activeFilter === 'shows'} 
                        onClick={() => setActiveFilter('shows')}
                        icon={<Music size={18} />}
                        label="Shows"
                    />
                </div>

                <div className="px-6 md:px-[156px] max-md:px-5 max-sm:px-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-[#2A2AD7] mb-4" />
                            <p className="text-gray-500 font-medium">Buscando os melhores eventos em {cityName}...</p>
                        </div>
                    ) : (
                        <>
                            {renderEventsSection(`Eventos hoje em ${cityName}`, todayEventsRaw)}
                            {renderEventsSection(`Neste fim de semana em ${cityName}`, weekendEventsRaw)}
                            {renderEventsSection(`Próximos eventos em ${cityName}`, upcomingEventsRaw)}
                        </>
                    )}
                </div>

                <LeadCapture source="city-page" />

                {/* SEO Footer Content */}
                <div className="px-6 md:px-[156px] max-md:px-5 max-sm:px-4 mt-16">
                    <div className="border-t border-gray-100 dark:border-white/5 pt-16">
                        <h2 className="text-2xl font-bold text-[#091747] dark:text-white mb-8">Programação Cultural em {cityName}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[#4b5563] dark:text-gray-400 leading-relaxed text-sm">
                            <div className="space-y-4">
                                <p>
                                    {cityName} se destaca como um dos principais pólos de entretenimento e cultura do Brasil. 
                                    A cidade oferece uma agenda vibrante que atende a todos os gostos, desde shows de grandes 
                                    artistas nacionais a festas conceituais e eventos alternativos.
                                </p>
                                <p>
                                    Para quem busca <strong>o que fazer em {cityName} hoje</strong>, a diversidade é a palavra-chave. 
                                    Seja explorando a orla, os centros culturais ou as casas de show mais badaladas, sempre 
                                    há uma experiência esperando por você.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <p>
                                    A Fauves é sua aliada na hora de planejar sua diversão. Reunimos as melhores opções de 
                                    lazer de forma organizada para que você não perca nada do que acontece em {cityName}.
                                </p>
                                <p>
                                    Acompanhe nossa plataforma regularmente para descobrir novos eventos e aproveitar o 
                                    melhor de {cityName} com praticidade e segurança.
                                </p>
                                <div className="pt-4 flex flex-wrap gap-4">
                                    <a href="/events" className="text-[#2A2AD7] dark:text-indigo-400 font-bold hover:underline">Ver tudo</a>
                                    <a href={`/o-que-fazer-em/${citySlug}`} className="text-[#2A2AD7] dark:text-indigo-400 font-bold hover:underline">Recarregar página</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </AppShell>
    );
};

const FilterButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${
            active 
            ? 'bg-[#091747] text-white dark:bg-white dark:text-[#091747] shadow-lg shadow-indigo-500/20' 
            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 dark:bg-white/5 dark:text-gray-300 dark:border-white/10 hover:dark:border-white/20'
        }`}
    >
        {icon}
        {label}
    </button>
);

export default WhatToDoCity;
