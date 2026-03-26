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
        document.title = `O que fazer em ${cityName} | Fauves`;
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

    const upcomingEvents = [...events].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const renderEventsSection = (title: string, evList: Event[], emptyMsg: string) => (
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
                    <p className="text-[#64748b] text-base">{emptyMsg}</p>
                </div>
            )}
        </section>
    );

    return (
        <div className="min-h-screen bg-white">
            <Header />
            
            <main className="max-w-[1352px] mx-auto px-4 py-12">
                <div className="mb-16 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#091747] mb-6 leading-tight">
                        O que fazer em {cityName}
                    </h1>
                    <p className="text-lg text-[#4b5563] leading-relaxed">
                        Descubra os melhores eventos, festas e experiências acontecendo em {cityName}. 
                        Encontre opções para hoje, fim de semana e próximos dias de forma rápida e segura na Fauves.
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
                            `Nenhum evento cadastrado para hoje em ${cityName}. Confira as opções de fim de semana!`
                        )}

                        {renderEventsSection(
                            `Eventos este fim de semana em ${cityName}`, 
                            weekendEvents, 
                            `Ainda não há eventos confirmados para este fim de semana em ${cityName}.`
                        )}

                        {renderEventsSection(
                            `Próximos eventos em ${cityName}`, 
                            upcomingEvents, 
                            `Em breve, novos eventos serão anunciados em ${cityName}. Fique atento!`
                        )}
                    </>
                )}

                <LeadCapture source="city-page" />
            </main>

            <Footer />
        </div>
    );
};

export default WhatToDoCity;
