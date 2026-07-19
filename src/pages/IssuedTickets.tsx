import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search } from 'lucide-react';
import TicketDetailsModal from '../components/TicketDetailsModal';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import EventDetailsSidebar from '@/components/EventDetailsSidebar';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { useLayoutOffsets } from '@/context/LayoutOffsetsContext';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useOrganization } from '@/context/OrganizationContext';

interface Ticket {
    id: string;
    code: string;
    ticketTypeName: string;
    userName?: string;
    userEmail?: string;
    status: string;
    isCourtesy: boolean;
    issuedBy?: string;
    pricePaid?: number;
    createdAt: string;
    used: boolean;
}

interface Stats {
    totalIssued: number;
    courtesies: number;
    sold: number;
    checkedIn: number;
}

const IssuedTickets: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { token, user } = useAuth();
    const { totalLeft } = useLayoutOffsets();
    const navigate = useNavigate();
    const location = useLocation();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [event, setEvent] = useState<any>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [courtesyFilter, setCourtesyFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Mobile menu states
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [eventMenuOpen, setEventMenuOpen] = useState(false);
    const { selectedOrg, orgs: organizations, setSelectedOrgById: selectOrganization } = useOrganization();




    const loadEvent = async () => {
        try {
            const response = await fetch(`/api/event/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEvent(data);
            }
        } catch (error) {
            // no-op
        }
    };

    const loadTickets = async () => {
        if (!token || !eventId) return;
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '50',
                search,
                status: statusFilter,
                courtesy: courtesyFilter
            });
            const response = await fetch(`/api/ticket/event/${eventId}/tickets?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTickets(data.tickets);
                setStats(data.stats);
                setTotal(data.total);
            }
        } catch (error) {
            // no-op
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadTickets();
    };

    useEffect(() => {
        if (!eventId) return;
        loadEvent();
        loadTickets();
    }, [eventId, token, page, statusFilter, courtesyFilter]);

    const getStatusBadge = (status: string, used: boolean) => {
        if (used) return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded dark:bg-green-900/30 dark:text-green-400">Check-in ✓</span>;
        if (status === 'ISSUED') return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded dark:bg-blue-900/30 dark:text-blue-400">Emitido</span>;
        if (status === 'CANCELED') return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded dark:bg-red-900/30 dark:text-red-400">Cancelado</span>;
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded dark:bg-gray-700 dark:text-gray-300">{status}</span>;
    };

    const getStatusLabel = (status: string | undefined): string => {
        switch (status) {
            case 'draft': return 'Rascunho';
            case 'published': return 'Publicado';
            case 'completed': return 'Encerrado';
            case 'paused': return 'Pausado';
            case 'deleted': return 'Excluído';
            default: return status || 'Desconhecido';
        }
    };

    return (
        <div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b]">
            {/* Mobile Main Menu */}
            <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
            <MobileDrawerMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                currentPath={location.pathname}
                organizations={organizations}
                selectedOrg={selectedOrg}
                selectOrganization={selectOrganization}
                user={user}
            />

            {/* Mobile Event Menu */}
            <EventMobileTopBar
                title="Ingressos Emitidos"
                onMenuOpen={() => setEventMenuOpen(true)}
            />
            <EventMobileDrawer
                isOpen={eventMenuOpen}
                onClose={() => setEventMenuOpen(false)}
                currentPath={location.pathname}
                eventId={eventId || ''}
                eventName={event?.name}
                eventDate={event?.startDate ? new Date(event.startDate).toLocaleDateString('pt-BR') : undefined}
                eventStatus={getStatusLabel(event?.status)}
            />

            {/* Fixed main sidebar */}
            <div className="hidden lg:block">
                <SidebarMenu />
            </div>

            {/* Fixed event details sidebar */}
            <div className="hidden lg:block">
                <EventDetailsSidebar
                    eventName={event?.name}
                    eventDate={event?.startDate ? new Date(event.startDate).toLocaleString('pt-BR') : undefined}
                    eventStatus={getStatusLabel(event?.status)}
                    onBack={() => navigate('/organizer-events')}
                    eventIdOverride={eventId || null}
                    panelRoute={`/event/manage/${eventId}`}
                    fixed
                    fixedLeft={70}
                    fixedWidth={300}
                    fixedTop={0}
                />
            </div>

            {/* Global header */}
            <AppHeader />

            {/* Content with left margin for both sidebars */}
            <OrganizerLayout>
                <div style={{ marginLeft: totalLeft, transition: 'margin-left 200ms' }} className="flex flex-col px-4 sm:px-6 lg:px-8 min-h-screen relative pb-24 pt-24 max-md:pt-4">
                    <div className="max-w-[1200px] w-full mx-auto">
                        {/* Header com Estatísticas */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Ingressos Emitidos
                            </h1>

                            {stats && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Emitidos</div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalIssued}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Cortesias</div>
                                        <div className="text-2xl font-bold text-purple-600">{stats.courtesies}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Vendidos</div>
                                        <div className="text-2xl font-bold text-green-600">{stats.sold}</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Check-ins</div>
                                        <div className="text-2xl font-bold text-blue-600">{stats.checkedIn}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtros */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por código, nome ou email..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Todos os Status</option>
                                    <option value="ISSUED">Emitidos</option>
                                    <option value="CANCELED">Cancelados</option>
                                </select>

                                <select
                                    value={courtesyFilter}
                                    onChange={(e) => setCourtesyFilter(e.target.value)}
                                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Todos os Tipos</option>
                                    <option value="true">Cortesias</option>
                                    <option value="false">Vendidos</option>
                                </select>

                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                >
                                    Buscar
                                </button>
                            </form>
                        </div>

                        {/* Tabela de Ingressos */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Código
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Usuário
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Tipo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Cortesia
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Data
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                    Carregando...
                                                </td>
                                            </tr>
                                        ) : tickets.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                    Nenhum ingresso encontrado
                                                </td>
                                            </tr>
                                        ) : (
                                            tickets.map((ticket) => (
                                                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                        {ticket.code}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                        {ticket.userName && ticket.userName !== ticket.userEmail ? (
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">{ticket.userName}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.userEmail}</div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-500 dark:text-gray-400">{ticket.userEmail || '-'}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                        {ticket.ticketTypeName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {getStatusBadge(ticket.status, ticket.used)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {ticket.isCourtesy ? (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded dark:bg-purple-900/30 dark:text-purple-400">Sim</span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded dark:bg-gray-700 dark:text-gray-300">Não</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => setSelectedTicket(ticket)}
                                                            className="text-orange-600 hover:text-orange-700 font-medium"
                                                        >
                                                            Ver Detalhes
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Paginação */}
                        {total > 50 && (
                            <div className="mt-4 flex justify-center gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 dark:border-gray-600 dark:text-white"
                                >
                                    Anterior
                                </button>
                                <span className="px-4 py-2 dark:text-white">
                                    Página {page} de {Math.ceil(total / 50)}
                                </span>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= Math.ceil(total / 50)}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 dark:border-gray-600 dark:text-white"
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </OrganizerLayout>

            {/* Modal */}
            {selectedTicket && (
                <TicketDetailsModal
                    ticketId={selectedTicket.id}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </div>
    );
};

export default IssuedTickets;
