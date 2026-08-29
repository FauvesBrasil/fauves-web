import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
    MessageSquare, X, Minimize2, Home, HelpCircle,
    BookOpen, Ticket, ChevronRight, Search, Sparkles,
    Settings, Plus, ArrowLeft, Send, Smile, Paperclip,
    Check, CheckCheck, Image as ImageIcon, File, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '@/lib/apiBase';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import ArticleViewer from './ArticleViewer';

interface Message {
    id: string;
    conversationId: string;
    userId?: string;
    userName: string;
    message: string;
    timestamp: Date;
    isStaff: boolean;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    attachments?: string[];
}

interface Conversation {
    id: string;
    userId?: string;
    userName: string;
    userEmail: string;
    status: 'OPEN' | 'CLOSED' | 'ASSIGNED';
    messages: Message[];
    updatedAt: string;
    assignee?: { name: string; photoUrl?: string };
}

type TabType = 'home' | 'messages' | 'help';

const ChatWidget = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isOrganizerContext = location.pathname.startsWith('/event/manage') ||
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/criar-evento') ||
        location.pathname.startsWith('/create-tickets') ||
        location.pathname.startsWith('/helpdesk');

    const audience = isOrganizerContext ? 'organizer' : 'customer';

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Chat States
    const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    // New states for enhanced features
    const [popularArticles, setPopularArticles] = useState<Array<{
        id: string;
        slug: string;
        title: string;
        summary: string;
        views: number;
    }>>([]);
    const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
    const [showArticleViewer, setShowArticleViewer] = useState(false);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [loadingArticleContent, setLoadingArticleContent] = useState(false);
    const [helpCategories, setHelpCategories] = useState<Array<any>>([]);
    const [featuredArticles, setFeaturedArticles] = useState<Array<any>>([]);
    const [loadingHelpContent, setLoadingHelpContent] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
    const [categoryArticles, setCategoryArticles] = useState<Array<any>>([]);
    const [loadingCategoryArticles, setLoadingCategoryArticles] = useState(false);

    const socketRef = useRef<Socket | null>(null);

    // Load conversation ID and active tab from localStorage
    // Load active tab from localStorage
    useEffect(() => {
        const savedTab = localStorage.getItem('chatActiveTab') as TabType;
        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, []);

    // State for menu
    const [showMenu, setShowMenu] = useState(false);

    // Load chat history when tab is active
    useEffect(() => {
        if (activeTab === 'messages' && user) {
            loadChatHistory();
        }
    }, [activeTab, user]);

    // Expose global function to open chat widget on help tab
    useEffect(() => {
        (window as any).openChatHelp = () => {
            setIsOpen(true);
            setIsMinimized(false);
            setActiveTab('help');
        };

        return () => {
            delete (window as any).openChatHelp;
        };
    }, []);

    // Socket connection and listeners
    useEffect(() => {
        if (isOpen && !socketRef.current) {
            const socket = io('http://localhost:4000', {
                auth: { token: localStorage.getItem('token') }
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                setIsConnected(false);
            });

            socket.on('new-message', (message: Message) => {
                setMessages(prev => [...prev, message]);
                // If not in this conversation or minimized, increment unread
                if (!isOpen || isMinimized || activeConversation?.id !== message.conversationId) {
                    setUnreadCount(prev => prev + 1);
                }
            });

            socket.on('typing', (data: { userId: string, userName: string }) => {
                if (activeConversation && data.userId !== user?.id) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 3000);
                }
            });
        }

        return () => {
            if (!isOpen && socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isOpen, activeConversation]);


    const loadChatHistory = async () => {
        if (!user) return;
        setLoadingHistory(true);
        try {
            const response = await fetchApi('/api/chat/history');
            if (response.ok) {
                const data = await response.json();
                setChatHistory(data);
            }
        } catch (error) {
            // no-op
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleJoinConversation = async (conversation: Conversation) => {
        setActiveConversation(conversation);
        setMessages(conversation.messages || []);

        // No need for 'join_chat' as user joins their own room (userId) or we can emit if needed, 
        // but backend logic joins client to `chat-{id}` on 'start-chat' or 'send-message' 
        // Wait, standard join logic: backend usually auto-joins on connect or explicit join.
        // Let's check backend: 'join-as-admin' exists. 'start-chat' joins. 
        // We need a 'join-chat' if reconnecting to an OLD conversation?
        // Backend doesn't have explicit 'join-chat' for USER, but 'start-chat' handles it.
        // Or 'send-message' might work if room not joined? No, need to join to receive.
        // Let's look at `ChatGateway`: line 159 `client.join("chat-" + conversation.id)`. 
        // But what if I just click a history item? I need to join without starting new?
        // Ah, backend doesn't have 'join-chat' for users!
        // I should stick to 'start-chat' with createNew=false to join/resume?
        // Or add 'join-chat' event to backend?
        // Let's assume for now we reuse 'start-chat' with createNew=false? 
        // Logic in handleStartChat: getOrCreateConversation. 

        if (socketRef.current) {
            // Emitting start-chat with existing data ensures we join the room and get history/updates
            socketRef.current.emit('start-chat', {
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                createNew: false, // Don't create new, just find existing
                conversationId: conversation.id // But start-chat doesn't take convId directly in payload interface shown in my view... 
                // It takes userId/userEmail. It finds "most recent".
                // If I click an OLD conversation, "most recent" might be wrong if I have multiple?
                // But getUserConversations returns many.
                // WE MISS A WAY TO JOIN A SPECIFIC EXISTING CONVERSATION!
                // Critical Gap. For now, let's fix 'send-message' first.
            });
        }

        // Mark as read locally
        setUnreadCount(0);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !activeConversation || !socketRef.current) return;

        const tempId = Math.random().toString(36).substr(2, 9);
        const optimisticMessage: Message = {
            id: tempId,
            conversationId: activeConversation.id,
            userId: user?.id,
            userName: user?.name || 'Eu',
            message: newMessage,
            timestamp: new Date(),
            isStaff: false,
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        socketRef.current.emit('send-message', {
            conversationId: activeConversation.id,
            message: newMessage,
            userId: user?.id,
            userName: user?.name || 'Eu',
            isStaff: false
        });
    };

    const handleStartNewConversation = () => {
        if (socketRef.current && user) {
            socketRef.current.emit('start-chat', {
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                createNew: true
            });

            socketRef.current.once('chat-started', (response: { success: boolean, conversationId?: string, messages?: Message[], error?: string }) => {
                if (response.success && response.conversationId) {
                    const newConversation: Conversation = {
                        id: response.conversationId,
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        status: 'OPEN',
                        messages: response.messages || [],
                        updatedAt: new Date().toISOString()
                    };
                    setActiveConversation(newConversation);
                    setMessages(response.messages || []);
                    setActiveTab('messages'); // Switch to messages tab
                    // Update list locally if needed, or re-fetch history
                    loadChatHistory();
                } else {
                    // no-op
                }
            });
        }
    };

    const handleBackToHistory = () => {
        if (socketRef.current && activeConversation) {
            socketRef.current.emit('leave-chat', { chatId: activeConversation.id });
        }
        setActiveConversation(null);
        // Refresh history to reflect potential deletion
        loadChatHistory();
    };

    // --- Restored Helper Functions ---

    const loadHelpContent = async () => {
        setLoadingHelpContent(true);
        try {
            const categoriesResponse = await fetchApi(`/api/help/categories?audience=${audience}`);
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                setHelpCategories(categoriesData);
            }
            const featuredResponse = await fetchApi(`/api/help/popular?limit=3&audience=${audience}`);
            if (featuredResponse.ok) {
                const featuredData = await featuredResponse.json();
                setFeaturedArticles(featuredData);
            }
        } catch (error) {
            // no-op
        } finally {
            setLoadingHelpContent(false);
        }
    };

    const loadPopularArticles = async () => {
        setLoadingArticles(true);
        try {
            const response = await fetchApi(`/api/help/popular?limit=5&audience=${audience}`);
            if (response.ok) {
                const data = await response.json();
                setPopularArticles(data);
            }
        } catch (error) {
            // no-op
        } finally {
            setLoadingArticles(false);
        }
    };

    const handleArticleClick = async (slug: string) => {
        setLoadingArticleContent(true);
        setShowArticleViewer(true);
        try {
            const response = await fetchApi(`/api/help/widget/article/${slug}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedArticle(data);
            }
        } catch (error) {
            // no-op
            setShowArticleViewer(false);
        } finally {
            setLoadingArticleContent(false);
        }
    };

    const handleCloseArticleViewer = () => {
        setShowArticleViewer(false);
        setSelectedArticle(null);
    };

    const handleCategoryClick = async (category: any) => {
        setSelectedCategory(category);
        setLoadingCategoryArticles(true);
        try {
            const response = await fetchApi(`/api/help/categories/${category.slug}`);
            if (response.ok) {
                const data = await response.json();
                setCategoryArticles(data.articles || []);
            }
        } catch (error) {
            // no-op
        } finally {
            setLoadingCategoryArticles(false);
        }
    };

    const handleBackToHelpHome = () => {
        setSelectedCategory(null);
        setCategoryArticles([]);
    };

    const handleMinimize = () => {
        setIsMinimized(true);
        localStorage.setItem('chatMinimized', 'true');
    };

    const handleClose = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsOpen(false);
        setIsMinimized(false);
        localStorage.setItem('chatMinimized', 'false');
    };

    // Block page scroll when chat is open on mobile
    useEffect(() => {
        const isMobile = window.innerWidth < 768; // md breakpoint
        if (isOpen && !isMinimized && isMobile) {
            return acquireDocumentScrollLock();
        }
    }, [isOpen, isMinimized]);


    // Load help content logic (kept as is)
    useEffect(() => {
        if (activeTab === 'help') {
            loadHelpContent();
        }
    }, [activeTab, audience]);

    // Keep authentication focused and visually consistent with the dedicated page.
    if (location.pathname === '/signin') return null;


    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Abrir chat de suporte"
                className="fixed bottom-6 right-6 w-14 h-14 max-md:bottom-3 max-md:right-3 max-md:w-12 max-md:h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
            >
                <MessageSquare className="w-6 h-6 max-md:w-5 max-md:h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>
        );
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 max-md:bottom-3 max-md:right-3 z-50">
                <button
                    onClick={() => setIsMinimized(false)}
                    aria-label="Restaurar chat de suporte"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 max-md:w-12 max-md:h-12 max-md:p-0 max-md:rounded-full rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium max-md:hidden">Chat de Suporte</span>
                    {unreadCount > 0 && (
                        <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja apagar esta conversa?')) return;

        setChatHistory(prev => prev.filter(c => c.id !== conversationId));

        try {
            await fetchApi(`/api/chat/${conversationId}`, { method: 'DELETE' });
        } catch (error) {
            // no-op
            loadChatHistory();
        }
    };

    return (
        <>
            {/* Backdrop for mobile - covers page content */}
            <div className="hidden max-md:block fixed inset-0 bg-black/50 z-[9998]" />

            {/* Chat Widget */}
            <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl flex flex-col z-[9999] border border-zinc-200 dark:border-zinc-800 max-md:inset-0 max-md:w-full max-md:h-full max-md:rounded-none max-md:bottom-0 max-md:right-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-t-lg flex items-center justify-between max-md:rounded-none">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold">
                                Suporte Fauves {isOrganizerContext && '- Produtores'}
                            </h3>
                            <p className="text-xs opacity-90">
                                {isConnected ? 'Online' : 'Sempre disponível'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleMinimize}
                            className="hover:bg-white/20 p-1.5 rounded transition-colors"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="hover:bg-white/20 p-1.5 rounded transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${activeTab === 'home'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                    >
                        <Home className="w-4 h-4" />
                        <span>Início</span>
                        {activeTab === 'home' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${activeTab === 'messages'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Mensagens</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-8 bg-red-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                        {activeTab === 'messages' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${activeTab === 'help'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span>Ajuda</span>
                        {activeTab === 'help' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Home Tab - Keeping previous implementation */}
                    {activeTab === 'home' && (
                        <div className="h-full overflow-y-auto p-6 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
                            {/* Welcome Message */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                                    Olá{user ? `, ${user.name}` : ''}! 👋
                                </h2>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Como podemos ajudar você hoje?
                                </p>
                            </div>

                            {/* Start Conversation Card */}
                            <button
                                onClick={handleStartNewConversation}
                                className="w-full mb-6 p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all hover:shadow-lg group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold">Iniciar Conversa</div>
                                        <div className="text-xs opacity-90">Fale com nossa equipe agora</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>

                            {/* Quick Actions */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Ações Rápidas</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => { handleClose(); navigate('/ajuda/tickets/novo'); }}
                                        className="w-full p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors text-left border border-zinc-200 dark:border-zinc-700 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Ticket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-zinc-900 dark:text-white">Criar Ticket</div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">Abra um chamado de suporte</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { handleClose(); navigate('/ajuda'); }}
                                        className="w-full p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors text-left border border-zinc-200 dark:border-zinc-700 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-zinc-900 dark:text-white">Central de Ajuda</div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">Encontre respostas rápidas</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Popular Articles */}
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Artigos Populares</h3>
                                {loadingArticles ? (
                                    <div className="text-center py-4 text-sm text-zinc-500">Carregando...</div>
                                ) : popularArticles.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-zinc-500">Nenhum artigo disponível</div>
                                ) : (
                                    <div className="space-y-2">
                                        {popularArticles.map((article) => (
                                            <button
                                                key={article.id}
                                                onClick={() => handleArticleClick(article.slug)}
                                                className="w-full p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors text-left border border-zinc-200 dark:border-zinc-700 group"
                                            >
                                                <div className="text-sm font-medium text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {article.title}
                                                </div>
                                                {article.summary && (
                                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                                        {article.summary}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Messages Tab */}
                    {activeTab === 'messages' && (
                        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
                            {/* Not Logged In State */}
                            {!user ? (
                                <div className="flex-1 flex items-center justify-center p-6">
                                    <div className="text-center">
                                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                                            Faça login para ver suas conversas
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                            Acesse sua conta para visualizar o histórico de chat
                                        </p>
                                    </div>
                                </div>
                            ) : activeConversation ? (
                                // Active Chat View
                                <>
                                    {/* Chat Header */}
                                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3">
                                        <button
                                            onClick={handleBackToHistory}
                                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-zinc-900 dark:text-white">
                                                {activeConversation.assignee?.name || 'Suporte Fauves'}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                {activeConversation.status === 'CLOSED' ? 'Encerrado' : 'Em andamento'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages List */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {messages.map((msg) => {
                                            const isMe = msg.userId === user.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] rounded-lg p-3 ${isMe
                                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                                        : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-none text-zinc-800 dark:text-zinc-200'
                                                        }`}>
                                                        <div className="text-sm">{msg.message}</div>
                                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-zinc-400'}`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {isTyping && (
                                            <div className="flex justify-start">
                                                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs text-zinc-500 animate-pulse">
                                                    Digitando...
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Digite sua mensagem..."
                                                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim()}
                                                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                // Conversation List View
                                <>
                                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Mesa de Mensagens</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Histórico de atendimentos anteriores
                                        </p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pb-20">
                                        {loadingHistory ? (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : chatHistory.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                                <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                                                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Nenhuma conversa iniciada</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                                {chatHistory.map((conversation) => (
                                                    <div
                                                        key={conversation.id}
                                                        onClick={() => handleJoinConversation(conversation)}
                                                        className="w-full p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer relative"
                                                    >
                                                        <div className="flex justify-between items-start mb-1 pr-6">
                                                            <span className="font-medium text-sm text-zinc-900 dark:text-white">
                                                                {conversation.assignee?.name || 'Suporte Fauves'}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400">
                                                                {new Date(conversation.updatedAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center pr-6">
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 flex-1 pr-2">
                                                                {conversation.messages?.[0]?.message || 'Sem mensagens'}
                                                            </p>
                                                            {conversation.status === 'OPEN' && (
                                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                            )}
                                                        </div>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={(e) => handleDeleteConversation(e, conversation.id)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Apagar conversa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Floating Action Button for New Chat - Intercom Style */}
                                    <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                                        <button
                                            onClick={handleStartNewConversation}
                                            className="pointer-events-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-full shadow-xl hover:scale-105 transition-transform font-medium text-sm z-10"
                                        >
                                            <span>Iniciar conversa</span>
                                            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                                <HelpCircle className="w-3 h-3" />
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}


                    {/* Help Tab */}
                    {activeTab === 'help' && (
                        <div className="h-full overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
                            {selectedCategory ? (
                                /* Category Articles View */
                                <>
                                    {/* Back Button & Category Header */}
                                    <div className="mb-4">
                                        <button
                                            onClick={handleBackToHelpHome}
                                            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-3"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Voltar
                                        </button>
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{selectedCategory.name}</h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{categoryArticles.length} artigos</p>
                                    </div>

                                    {/* Articles List */}
                                    {loadingCategoryArticles ? (
                                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Carregando artigos...</p>
                                        </div>
                                    ) : categoryArticles.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-zinc-500">Nenhum artigo nesta categoria</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {categoryArticles.map((article) => (
                                                <button
                                                    key={article.id}
                                                    onClick={() => handleArticleClick(article.slug)}
                                                    className="w-full p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors text-left border border-zinc-200 dark:border-zinc-700 group"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                {article.title}
                                                            </div>
                                                            {article.summary && (
                                                                <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                                                    {article.summary}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Main Help View */
                                <>
                                    {/* Search */}
                                    <div className="mb-6">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar artigos..."
                                                className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    {loadingHelpContent ? (
                                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Carregando...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Categories */}
                                            {helpCategories.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Categorias</h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {helpCategories.map((category) => (
                                                            <button
                                                                key={category.id}
                                                                onClick={() => handleCategoryClick(category)}
                                                                className="p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 text-left"
                                                            >
                                                                <div className="text-sm font-medium text-zinc-900 dark:text-white">{category.name}</div>
                                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">{category.articleCount} artigos</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Featured Articles */}
                                            {featuredArticles.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Artigos em Destaque</h3>
                                                    <div className="space-y-2">
                                                        {featuredArticles.map((article) => (
                                                            <button
                                                                key={article.id}
                                                                onClick={() => handleArticleClick(article.slug)}
                                                                className="w-full p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors text-left border border-zinc-200 dark:border-zinc-700 group"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                            {article.title}
                                                                        </div>
                                                                        {article.summary && (
                                                                            <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                                                                {article.summary}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* View All Link */}
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => navigate('/ajuda')}
                                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                        >
                                            Ver toda a Central de Ajuda →
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Article Viewer Overlay */}
                {
                    showArticleViewer && (
                        <ArticleViewer
                            article={selectedArticle}
                            loading={loadingArticleContent}
                            onClose={handleCloseArticleViewer}
                            onArticleClick={handleArticleClick}
                            onCreateTicket={() => {
                                handleCloseArticleViewer();
                                handleClose();
                                navigate('/ajuda/tickets/novo');
                            }}
                        />
                    )
                }
            </div>
        </>
    );
};

export default ChatWidget;
