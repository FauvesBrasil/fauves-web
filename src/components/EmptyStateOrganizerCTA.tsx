import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Assets Fauves
import guitarristaImg from '@/assets/guitarrista.png';
import raioImg from '@/assets/raio.png';

interface EmptyStateOrganizerCTAProps {
    selectedUf?: string | null;
}

// Mapeamento de UF para nome do estado
const UF_NAMES: Record<string, string> = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapá',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceará',
    DF: 'Distrito Federal',
    ES: 'Espírito Santo',
    GO: 'Goiás',
    MA: 'Maranhão',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Pará',
    PB: 'Paraíba',
    PR: 'Paraná',
    PE: 'Pernambuco',
    PI: 'Piauí',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondônia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'São Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins',
};

const EmptyStateOrganizerCTA: React.FC<EmptyStateOrganizerCTAProps> = ({ selectedUf }) => {
    const navigate = useNavigate();
    const stateName = selectedUf ? UF_NAMES[selectedUf] || selectedUf : null;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#FFF8F6] dark:bg-[#1a1a1a] border border-[#FFE5DF] dark:border-[#2a2a2a] p-8 md:p-12 my-8">
            {/* Guitarrista - canto direito */}
            <img
                src={guitarristaImg}
                alt=""
                className="absolute -right-4 -bottom-4 w-48 md:w-64 opacity-100 pointer-events-none select-none"
            />

            {/* Raio - decorativo */}
            <img
                src={raioImg}
                alt=""
                className="absolute top-8 right-8 w-10 md:w-14 opacity-100 pointer-events-none select-none"
            />

            {/* Content */}
            <div className="relative z-10 max-w-xl">
                {/* Location badge */}
                {stateName && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2a2ad8] text-white text-sm font-semibold mb-5">
                        <MapPin size={14} />
                        <span>{stateName}</span>
                    </div>
                )}

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-[#091747] dark:text-white mb-4 leading-tight">
                    {stateName ? (
                        <>Seja o primeiro a criar eventos em {stateName}</>
                    ) : (
                        <>Nenhum evento por aqui ainda</>
                    )}
                </h2>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400 text-base mb-6 max-w-md">
                    {stateName ? (
                        <>Ainda não temos eventos em {stateName}. Traga sua produção para cá!</>
                    ) : (
                        <>Seja um organizador Fauves e comece a vender ingressos hoje.</>
                    )}
                </p>

                {/* Benefits - simple list */}
                <ul className="space-y-2.5 mb-8 text-slate-700 dark:text-slate-300 text-sm">
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#64cc9d]" />
                        <span>Taxa de apenas 10% por ingresso</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2a2ad8]" />
                        <span>Crie seu evento em poucos minutos</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f9c900]" />
                        <span>Receba via Pix em até 24h</span>
                    </li>
                </ul>

                {/* CTA Button */}
                <Button
                    size="lg"
                    className="bg-[#ef4118] hover:bg-[#d63614] text-white px-6 font-semibold group"
                    onClick={() => navigate('/create')}
                >
                    <span>Criar meu evento</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Secondary link */}
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    Já tem conta?{' '}
                    <button
                        onClick={() => navigate('/organizer-events')}
                        className="text-[#2a2ad8] hover:underline font-medium"
                    >
                        Acesse seu painel
                    </button>
                </p>
            </div>
        </div>
    );
};

export default EmptyStateOrganizerCTA;
