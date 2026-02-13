import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/context/OrganizationContext';
import { useFetchProducerJourney } from '@/hooks/useFetchProducerJourney';
import { ProducerJourneyCard } from '@/components/ProducerJourneyCard';
import { ProducerJourneyHistory } from '@/components/ProducerJourneyHistory';
import { ActiveMissions } from '@/components/ActiveMissions';
import { ProducersRanking } from '@/components/ProducersRanking';
import { ProducerLevelBadge } from '@/components/ProducerLevelBadge';
import { ArrowLeft, TrendingUp, Calendar, Award } from 'lucide-react';

// Level details and benefits
const LEVEL_INFO: Record<string, { benefits: string[]; nextGoal?: string }> = {
    'EXPLORADOR': {
        benefits: [
            'Acesso à plataforma Fauves',
            'Criação ilimitada de eventos',
            'Dashboard básico de vendas',
        ],
        nextGoal: 'Venda 25.000 ingressos para alcançar Influente ⚡',
    },
    'INFLUENTE': {
        benefits: [
            'Todos benefícios anteriores',
            'Destaque na página inicial (1x/mês)',
            'Suporte prioritário',
            'Analytics avançados',
        ],
        nextGoal: 'Venda 75.000 ingressos para alcançar Visionário 🌟',
    },
    'VISIONARIO': {
        benefits: [
            'Todos benefícios anteriores',
            'Gerente de conta dedicado',
            'Destaque semanal',
            'Acesso antecipado a novos recursos',
        ],
        nextGoal: 'Venda 250.000 ingressos para alcançar Ícone 👑',
    },
    'ICONE': {
        benefits: [
            'Todos benefícios anteriores',
            'Featured producer badge',
            'Entrevistas e cases de sucesso',
            'Eventos em destaque',
        ],
        nextGoal: 'Venda 1.000.000 ingressos para alcançar Lenda 🏆',
    },
    'LENDA': {
        benefits: [
            'Todos benefícios anteriores',
            'Hall da fama Fauves',
            'Taxas especiais personalizadas',
            'Acesso VIP a eventos Fauves',
            'Networking exclusivo',
        ],
    },
};

export default function ProducerJourneyPage() {
    const navigate = useNavigate();
    const { selectedOrg } = useOrganization();
    const { data: journey, loading } = useFetchProducerJourney(selectedOrg?.id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!selectedOrg) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Selecione uma organização para ver a jornada</p>
                    <button
                        onClick={() => navigate('/organizer-dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const levelInfo = LEVEL_INFO[journey?.currentLevel?.id || 'EXPLORADOR'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0b0b0b] dark:to-[#121212]">
            {/* Header */}
            <div className="bg-white dark:bg-[#1F1F1F] border-b dark:border-[#2A2A2A] shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <button
                        onClick={() => navigate('/organizer-dashboard')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar ao Dashboard
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Jornada do Produtor</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe sua evolução e conquistas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl p-6 h-64 animate-pulse" />
                            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl p-6 h-96 animate-pulse" />
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl p-6 h-80 animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Current Status Card */}
                            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl border border-gray-200 dark:border-[#2A2A2A] p-6">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Seu Nível Atual</h2>
                                            {/* Badge só no mobile ao lado do título */}
                                            {journey?.currentLevel && (
                                                <div className="sm:hidden">
                                                    <ProducerLevelBadge
                                                        levelId={journey.currentLevel.id}
                                                        levelName={journey.currentLevel.title}
                                                        size="sm"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                            {journey?.currentLevel && (
                                                <div className="hidden sm:block">
                                                    <ProducerLevelBadge
                                                        levelId={journey.currentLevel.id}
                                                        levelName={journey.currentLevel.title}
                                                        size="lg"
                                                    />
                                                </div>
                                            )}
                                            <div className="max-sm:ml-0">
                                                <div className="text-2xl font-semibold text-gray-800 dark:text-white leading-none">
                                                    {journey?.sold?.toLocaleString() || 0}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ingressos vendidos</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full sm:w-auto">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full w-full sm:w-auto justify-center sm:justify-start">
                                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                                                {journey?.achievedAt
                                                    ? `Desde ${new Date(journey.achievedAt).toLocaleDateString('pt-BR')}`
                                                    : 'Novo produtor'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress to Next Level */}
                                {journey?.nextLevel && (
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Progresso para {journey.nextLevel.title}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {journey.progressPercent}%
                                            </span>
                                        </div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                                                style={{ width: `${journey.progressPercent}%` }}
                                            />
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            Faltam <span className="font-bold text-gray-800 dark:text-white">
                                                {(journey.nextLevel.threshold - journey.sold).toLocaleString()}
                                            </span> ingressos para o próximo nível
                                        </div>
                                    </div>
                                )}

                                {/* Benefits */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <h3 className="font-bold text-gray-800 dark:text-white">Benefícios Ativos</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {levelInfo?.benefits.map((benefit, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {levelInfo?.nextGoal && (
                                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30">
                                            <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                                                🎯 {levelInfo.nextGoal}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Missions */}
                            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl border border-gray-200 dark:border-[#2A2A2A] p-6">
                                <ActiveMissions organizationId={selectedOrg.id} />
                            </div>

                            {/* History */}
                            <div className="bg-white dark:bg-[#1F1F1F] rounded-xl border border-gray-200 dark:border-[#2A2A2A] p-6">
                                <ProducerJourneyHistory organizationId={selectedOrg.id} />
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            {/* Journey Card (Compact) */}
                            <ProducerJourneyCard
                                currentLevel={journey?.currentLevel}
                                sold={journey?.sold}
                                progressPercent={journey?.progressPercent}
                                nextLevel={journey?.nextLevel}
                            />

                            {/* Ranking */}
                            <ProducersRanking currentOrgId={selectedOrg.id} />
                        </div>
                    </div>
                )}
                <div className="h-24" /> {/* Spacer for floating elements */}
            </div>
        </div>
    );
}
