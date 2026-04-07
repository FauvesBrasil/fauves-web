import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import { fetchApi } from '@/lib/apiBase';
import { Loader2 } from 'lucide-react';
import LeadCapture from '../components/LeadCapture';

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
}

const WhatToDoCity = () => {
    const { citySlug } = useParams<{ citySlug: string }>();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

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
        metaDesc.setAttribute('content', `Descubra os melhores eventos em ${cityName} hoje. Encontre festas, shows e experiências atualizadas diariamente na Fauves.`);

    }, [citySlug, cityName]);

    const now = new Date();
    const todayStr = now.toDateString();

    const todayEvents = events.filter(ev => {
        if (!ev.startDate) return false;
        return new Date(ev.startDate).toDateString() === todayStr;
    });

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    const endOfSunday = new Date(today);
    endOfSunday.setDate(today.getDate() + daysUntilSunday);
    endOfSunday.setHours(23, 59, 59, 999);

    const weekendEvents = events.filter(ev => {
        if (!ev.startDate) return false;
        const evDate = new Date(ev.startDate);
        return evDate >= now && evDate <= endOfSunday;
    });

    const upcomingEvents = events.filter(ev => {
        if (!ev.startDate) return false;
        return new Date(ev.startDate) > endOfSunday;
    }).sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const renderEventsSection = (title: string, evList: Event[], emptyMsg: React.ReactNode) => (
        <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#091747] mb-6 flex items-center gap-2">
                {title}
            </h2>
            {evList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {evList.map(ev => (
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
                <div className="bg-[#f8f9fc] border border-dashed border-[#cbd5e1] rounded-2xl py-12 px-6 text-center">
                    <div className="text-[#64748b] text-base leading-relaxed max-w-2xl mx-auto">
                        {emptyMsg}
                    </div>
                </div>
            )}
        </section>
    );

    return (
        <div className="min-h-screen bg-white">
            <Header />
            
            <main className="max-w-[1352px] mx-auto px-4 py-12">
                <div className="mb-16 max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#091747] mb-6 leading-tight">
                        O que fazer em {cityName} hoje: eventos, festas e shows atualizados
                    </h1>
                    <p className="text-lg text-[#4b5563] leading-relaxed">
                        Se você está procurando o que fazer em {cityName} hoje, aqui você encontra os melhores eventos, 
                        festas, shows e experiências acontecendo na cidade. A Fauves reúne opções atualizadas diariamente 
                        para você aproveitar ao máximo {cityName}, seja durante a semana ou no fim de semana.
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[#2A2AD7] mb-4" />
                        <p className="text-gray-500 font-medium">Buscando os melhores eventos em {cityName}...</p>
                    </div>
                ) : (
                    <>
                        {renderEventsSection(
                            `Eventos hoje em ${cityName}`, 
                            todayEvents, 
                            <>
                                Atualmente não há eventos cadastrados para hoje em {cityName}, mas você pode conferir os 
                                <strong> próximos eventos disponíveis</strong> ou explorar opções para o 
                                <strong> fim de semana</strong>. Novos eventos são adicionados diariamente.
                            </>
                        )}

                        {renderEventsSection(
                            `Eventos este fim de semana em ${cityName}`, 
                            weekendEvents, 
                            <>
                                Ainda não há eventos confirmados para este fim de semana em {cityName}, mas você pode 
                                explorar os <strong>próximos eventos</strong> ou voltar em breve para novas atualizações.
                            </>
                        )}

                        {renderEventsSection(
                            `Próximos eventos em ${cityName}`, 
                            upcomingEvents, 
                            <>
                                Em breve, novos eventos serão anunciados em {cityName}. 
                                Fique atento para descobrir o que fazer na cidade nos próximos dias!
                            </>
                        )}
                    </>
                )}

                {/* SEO Footer Content */}
                <div className="mt-20 border-t border-gray-100 pt-16 pb-12">
                    <div className="max-w-4xl">
                        <h2 className="text-xl font-bold text-[#091747] mb-6">Programação Cultural em {cityName}</h2>
                        <div className="space-y-4 text-[#4b5563] leading-relaxed">
                            <p>
                                {cityName} é um dos principais destinos de entretenimento do Brasil, com uma agenda intensa 
                                de eventos ao longo de todo o ano. Entre festas, shows, eventos culturais e experiências 
                                gastronômicas, sempre há algo acontecendo na cidade.
                            </p>
                            <p>
                                Se você está em dúvida sobre o que fazer em {cityName} hoje ou no fim de semana, a Fauves 
                                facilita sua busca reunindo os melhores eventos em um só lugar, de forma prática e atualizada.
                            </p>
                            <p>
                                Acompanhe esta página para descobrir novos eventos, planejar sua programação e aproveitar 
                                tudo o que {cityName} tem a oferecer.
                            </p>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <a href="/events" className="text-[#2A2AD7] font-semibold hover:underline text-sm flex items-center gap-1.5">
                                Ver todos os eventos
                            </a>
                            <a href={`/o-que-fazer-em/${citySlug}`} className="text-[#2A2AD7] font-semibold hover:underline text-sm flex items-center gap-1.5">
                                Explorar mais eventos em {cityName}
                            </a>
                        </div>
                    </div>
                </div>

                <LeadCapture source="city-page" />
            </main>

            <Footer />
        </div>
    );
};

export default WhatToDoCity;
