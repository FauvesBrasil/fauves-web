import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import HelpHeader from '@/components/HelpHeader';
import { fetchApi } from '@/lib/apiBase';

interface Event {
    id: string;
    name: string;
}

const CreateTicket = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'GENERAL',
        eventId: '',
        priority: 'MEDIUM',
    });

    useEffect(() => {
        // TODO: Load user's events
        // For now, empty list
        setEvents([]);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetchApi('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    eventId: formData.eventId || undefined,
                }),
            });

            if (response.ok) {
                const ticket = await response.json();
                navigate(`/ajuda/tickets/${ticket.id}`);
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao criar ticket');
            }
        } catch (error) {
            // no-op
            alert('Erro ao criar ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0b0b0b] dark:via-indigo-950/10 dark:to-purple-950/10">
            <HelpHeader />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
                {/* Back button */}
                <button
                    onClick={() => navigate('/ajuda/tickets')}
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para meus tickets
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Criar Novo Ticket
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Descreva seu problema e nossa equipe irá ajudá-lo
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                        {/* Subject */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                                Assunto *
                            </label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Descreva brevemente o problema"
                                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                                Categoria *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="GENERAL">Geral</option>
                                <option value="TECHNICAL">Técnico</option>
                                <option value="BILLING">Financeiro</option>
                                <option value="EVENT">Evento</option>
                                <option value="ACCOUNT">Conta</option>
                            </select>
                        </div>

                        {/* Event (optional) */}
                        {events.length > 0 && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                                    Relacionado a um evento? (opcional)
                                </label>
                                <select
                                    value={formData.eventId}
                                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Nenhum evento</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Priority */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                                Prioridade
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="LOW">Baixa</option>
                                <option value="MEDIUM">Média</option>
                                <option value="HIGH">Alta</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                                Descrição *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descreva detalhadamente o problema..."
                                rows={8}
                                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                required
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                Quanto mais detalhes você fornecer, mais rápido poderemos ajudá-lo
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                            {loading ? 'Criando...' : 'Criar Ticket'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/ajuda/tickets')}
                            className="px-6 py-3 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicket;
