import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    MessageSquare, Send, Users, X, User, Mail, Phone, ShoppingBag,
    Ticket, Clock, Tag, StickyNote, UserPlus, Filter, Search,
    Star, Plus, Trash2, Menu, Settings, Bell, LogOut, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
    id: string;
    userName: string;
    message: string;
    timestamp: Date;
    isStaff: boolean;
}

interface Note {
    id: string;
    note: string;
    createdAt: Date;
    user: {
        id: string;
        name: string;
    };
}

interface ActiveChat {
    conversationId: string;
    userId?: string;
    userName: string;
    userEmail: string;
    guestPhone?: string;
    startedAt: Date;
    messageCount: number;
    lastMessage?: Message;
    tags?: string[];
    assignedTo?: string;
    rating?: number;
}

interface UserInfo {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isGuest: boolean;
    totalOrders: number;
    totalTickets: number;
    transferredTickets?: number;
    lastPurchase?: string | Date;
    lastOrder?: {
        id: string;
        eventName: string;
        eventImage?: string;
        totalAmount: number;
        code: string;
    };
}

interface AdminMember {
    id: string;
    name: string;
    email: string;
}

const TAG_COLORS: Record<string, string> = {
    'Bug': 'bg-red-100 text-red-700 border-red-200',
    'Dúvida': 'bg-blue-100 text-blue-700 border-blue-200',
    'Reclamação': 'bg-orange-100 text-orange-700 border-orange-200',
    'Elogio': 'bg-green-100 text-green-700 border-green-200',
    'Urgente': 'bg-purple-100 text-purple-700 border-purple-200',
};

const PREDEFINED_TAGS = ['Bug', 'Dúvida', 'Reclamação', 'Elogio', 'Urgente'];

const AdminLiveChat = () => {
    const navigate = useNavigate();
    const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
    const [closedChats, setClosedChats] = useState<ActiveChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newNote, setNewNote] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [adminTeam, setAdminTeam] = useState<AdminMember[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const socketRef = useRef<Socket | null>(null);
    const selectedChatRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Connect to Socket.io server
        const socket = io('http://localhost:4000');
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join-as-admin');
            socket.emit('get-admin-team');
            socket.emit('get-closed-chats');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('active-chats', (chats: ActiveChat[]) => {
            setActiveChats(chats);
        });

        socket.on('new-chat', (chat: ActiveChat) => {
            setClosedChats(prev => prev.filter(c => c.conversationId !== chat.conversationId));
            setActiveChats(prev => {
                const exists = prev.some(c => c.conversationId === chat.conversationId);
                return exists ? prev : [chat, ...prev];
            });
            playNotificationSound();
        });

        socket.on('closed-chats', (chats: ActiveChat[]) => {
            setClosedChats(chats);
        });

        socket.on('new-message', (data: any) => {
            console.log('📨 Admin received new-message:', {
                conversationId: data.conversationId,
                selectedChat: selectedChatRef.current,
                willAdd: selectedChatRef.current === data.conversationId,
                message: data.message
            });

            // Converter timestamp para Date
            const messageWithDate = {
                ...data,
                timestamp: new Date(data.timestamp || data.createdAt),
            };

            setActiveChats(prev =>
                prev.map(chat =>
                    chat.conversationId === data.conversationId
                        ? {
                            ...chat,
                            // Only increment count for user messages, not admin messages
                            messageCount: data.isStaff ? chat.messageCount : chat.messageCount + 1,
                            lastMessage: messageWithDate
                        }
                        : chat
                )
            );

            if (selectedChatRef.current === data.conversationId) {
                // Avoid duplicates - check if message already exists
                setMessages(prev => {
                    const exists = prev.some(m =>
                        m.id === messageWithDate.id ||
                        (m.message === messageWithDate.message &&
                            Math.abs(new Date(m.timestamp).getTime() - new Date(messageWithDate.timestamp).getTime()) < 1000)
                    );
                    if (exists) {
                        console.log('⚠️ Duplicate message detected in admin, skipping');
                        return prev;
                    }
                    return [...prev, messageWithDate];
                });
            } else {
                playNotificationSound();
            }
        });

        socket.on('chat-ended', (data: { conversationId: string }) => {
            setActiveChats(prev => {
                const chatToClose = prev.find(chat => chat.conversationId === data.conversationId);
                if (chatToClose) {
                    setClosedChats(closed => [chatToClose, ...closed]);
                    return prev.filter(chat => chat.conversationId !== data.conversationId);
                }
                return prev; // Chat not found in active list
            });

            if (selectedChat === data.conversationId) {
                // Determine if we keep it selected (read-only) or deselect.
                // Generally clearer to deselect or show as closed. 
                // For now, let's keep it selected but user logic might need refresh
                // setSelectedChat(null); // Optional: Keep looking at it
            }
        });

        socket.on('chat-history', (data: any) => {
            console.log('📜 Chat history received:', data);
            // Converter timestamps de string para Date
            const messagesWithDates = (data.messages || []).map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.createdAt || msg.timestamp),
                status: 'read',
            }));
            setMessages(messagesWithDates);
            setNotes(data.notes || []);
        });

        socket.on('user-stats', (stats: any) => {
            setUserInfo(prev => {
                // Only update if we have user info and the stats match the current user
                if (prev && prev.id === stats.userId) {
                    return {
                        ...prev,
                        totalOrders: stats.totalOrders,
                        totalTickets: stats.totalTickets,
                        transferredTickets: stats.transferredTickets,
                        lastPurchase: stats.lastPurchase,
                        lastOrder: stats.lastOrder,
                    };
                }
                return prev;
            });
        });

        socket.on('admin-team', (team: AdminMember[]) => {
            setAdminTeam(team);
        });

        socket.on('conversation-assigned', (data: { conversationId: string; assignedTo: string }) => {
            setActiveChats(prev =>
                prev.map(chat =>
                    chat.conversationId === data.conversationId
                        ? { ...chat, assignedTo: data.assignedTo }
                        : chat
                )
            );
        });

        socket.on('tags-updated', (data: { conversationId: string; tags: string[] }) => {
            setActiveChats(prev =>
                prev.map(chat =>
                    chat.conversationId === data.conversationId
                        ? { ...chat, tags: data.tags }
                        : chat
                )
            );
        });

        socket.on('note-added', (data: { conversationId: string; note: Note }) => {
            if (selectedChat === data.conversationId) {
                setNotes(prev => [data.note, ...prev]);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []); // Only run once on mount

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const playNotificationSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };

    const handleSelectChat = async (conversationId: string) => {
        setSelectedChat(conversationId);
        selectedChatRef.current = conversationId; // Update ref for event listeners
        setMessages([]);
        setNotes([]);

        // Reset unread count for this chat
        setActiveChats(prev =>
            prev.map(chat =>
                chat.conversationId === conversationId
                    ? { ...chat, messageCount: 0 }
                    : chat
            )
        );

        if (socketRef.current) {
            console.log('📤 Admin joining chat:', conversationId);
            socketRef.current.emit('admin-join-chat', { conversationId });
        }

        const chat = activeChats.find(c => c.conversationId === conversationId);
        if (chat) {
            const info: UserInfo = {
                id: chat.userId,
                name: chat.userName,
                email: chat.userEmail,
                phone: chat.guestPhone,
                isGuest: !chat.userId,
                totalOrders: 0,
                totalTickets: 0,
            };
            setUserInfo(info);

            if (chat.userId && socketRef.current) {
                socketRef.current.emit('get-user-stats', { userId: chat.userId });
            }
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current || !selectedChat) return;

        socketRef.current.emit('send-message', {
            conversationId: selectedChat,
            message: newMessage,
            isStaff: true,
            userName: 'Equipe de Suporte',
        });

        setNewMessage('');
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !socketRef.current || !selectedChat) return;

        socketRef.current.emit('add-note', {
            conversationId: selectedChat,
            userId: 'current-admin-id',
            note: newNote,
        });

        setNewNote('');
    };

    const handleAssignTo = (adminId: string) => {
        if (!socketRef.current || !selectedChat) return;

        socketRef.current.emit('assign-conversation', {
            conversationId: selectedChat,
            assignedTo: adminId,
        });

        setShowAssignDropdown(false);
    };

    const handleToggleTag = (tag: string) => {
        if (!socketRef.current || !selectedChat) return;

        const chat = activeChats.find(c => c.conversationId === selectedChat);
        const currentTags = chat?.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];

        socketRef.current.emit('update-tags', {
            conversationId: selectedChat,
            tags: newTags,
        });
    };

    const handleEndChat = (conversationId: string) => {
        if (socketRef.current && confirm('Tem certeza que deseja encerrar este chat?')) {
            socketRef.current.emit('end-chat', { conversationId });
        }
    };

    const filteredChats = activeChats.filter(chat => {
        const matchesSearch = chat.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'assigned' && chat.assignedTo) ||
            (filterStatus === 'unassigned' && !chat.assignedTo);
        return matchesSearch && matchesFilter;
    });

    const selectedChatData = activeChats.find(chat => chat.conversationId === selectedChat);

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Top Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Voltar ao painel"
                    >
                        <Home className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">Live Chat</h1>
                            <p className="text-xs text-slate-500">
                                {isConnected ? (
                                    <span className="text-green-600">● Online</span>
                                ) : (
                                    <span className="text-red-600">● Offline</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">{filteredChats.length} ativo(s)</span>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Bell className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Settings className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Chat List */}
                <div className={`${showSidebar ? 'w-80' : 'w-0'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-hidden`}>
                    {/* Search and Filter */}
                    <div className="p-4 border-b border-slate-200 space-y-3 flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar conversas..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">Todas as conversas</option>
                            <option value="assigned">Atribuídas</option>
                            <option value="unassigned">Não atribuídas</option>
                        </select>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Active Chats Section */}
                        {filteredChats.length > 0 && (
                            <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-y border-slate-100 sticky top-0 z-10">
                                Conversas Ativas ({filteredChats.length})
                            </div>
                        )}

                        {filteredChats.length === 0 && closedChats.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Nenhuma conversa encontrada</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredChats.map((chat) => (
                                    <button
                                        key={chat.conversationId}
                                        onClick={() => handleSelectChat(chat.conversationId)}
                                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${selectedChat === chat.conversationId ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                                    {chat.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-slate-900 truncate">{chat.userName}</div>
                                                    <div className="text-xs text-slate-500 truncate">{chat.userEmail}</div>
                                                </div>
                                            </div>
                                            {chat.messageCount > 0 && (
                                                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2">
                                                    {chat.messageCount}
                                                </span>
                                            )}
                                        </div>

                                        {chat.tags && chat.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {chat.tags.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className={`text-xs px-2 py-0.5 rounded border ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {chat.lastMessage && (
                                            <div className="text-sm text-slate-600 truncate mb-2">
                                                {chat.lastMessage.message}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span>{new Date(chat.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            {chat.assignedTo && (
                                                <div className="flex items-center gap-1 text-indigo-600">
                                                    <UserPlus className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Closed Chats Section */}
                        {closedChats.length > 0 && (
                            <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border-y border-slate-100 sticky top-0 z-10">
                                Encerradas ({closedChats.length})
                            </div>
                        )}
                        <div className="divide-y divide-slate-100 opacity-60 bg-slate-50">
                            {closedChats.map((chat) => (
                                <button
                                    key={chat.conversationId}
                                    onClick={() => handleSelectChat(chat.conversationId)}
                                    className={`w-full p-4 text-left hover:bg-slate-100 transition-colors ${selectedChat === chat.conversationId ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-8 h-8 bg-zinc-400 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                                {chat.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-700 truncate">{chat.userName}</div>
                                                <div className="text-xs text-slate-500 truncate">{chat.userEmail}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>{new Date(chat.startedAt).toLocaleDateString()}</span>
                                        <span className="text-zinc-500">Encerrado</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center - Chat Messages */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedChat && selectedChatData ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
                                    >
                                        <Menu className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                        {selectedChatData.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{selectedChatData.userName}</h3>
                                        <p className="text-sm text-slate-500">{selectedChatData.userEmail}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Tags */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowTagDropdown(!showTagDropdown)}
                                            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Tag className="w-4 h-4" />
                                            <span>Tags</span>
                                        </button>
                                        {showTagDropdown && (
                                            <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-10 min-w-[200px]">
                                                {PREDEFINED_TAGS.map((tag) => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => handleToggleTag(tag)}
                                                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedChatData.tags?.includes(tag) ? 'bg-slate-100' : ''
                                                            }`}
                                                    >
                                                        <span className={TAG_COLORS[tag] || 'text-slate-700'}>{tag}</span>
                                                        {selectedChatData.tags?.includes(tag) && (
                                                            <span className="text-indigo-600">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Assignment */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                                            className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            <span>{selectedChatData.assignedTo ? 'Reatribuir' : 'Atribuir'}</span>
                                        </button>
                                        {showAssignDropdown && (
                                            <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-10 min-w-[200px]">
                                                {adminTeam.map((admin) => (
                                                    <button
                                                        key={admin.id}
                                                        onClick={() => handleAssignTo(admin.id)}
                                                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="font-medium">{admin.name}</div>
                                                        <div className="text-xs text-slate-500">{admin.email}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleEndChat(selectedChat)}
                                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>Encerrar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                {messages.map((msg, index) => {
                                    const prevMsg = messages[index - 1];
                                    const isSequence = prevMsg &&
                                        prevMsg.userName === msg.userName &&
                                        prevMsg.isStaff === msg.isStaff &&
                                        (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 60000 * 5); // 5 min threshold

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.isStaff ? 'justify-end' : 'justify-start'} ${isSequence ? 'mt-1' : 'mt-4'} animate-fadeIn`}
                                        >
                                            <div
                                                className={`max-w-[70%] px-4 py-3 ${msg.isStaff
                                                    ? 'bg-indigo-600 text-white rounded-2xl' + (isSequence ? ' rounded-tr-md' : '')
                                                    : 'bg-white border border-slate-200 text-slate-900 shadow-sm rounded-2xl' + (isSequence ? ' rounded-tl-md' : '')
                                                    }`}
                                            >
                                                {!msg.isStaff && !isSequence && (
                                                    <div className="text-xs font-medium mb-1 text-slate-500">
                                                        {msg.userName}
                                                    </div>
                                                )}
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                                <div className={`text-[10px] opacity-75 mt-1 text-right ${msg.isStaff ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                                    >
                                        <Send className="w-4 h-4" />
                                        Enviar
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            <div className="text-center">
                                <MessageSquare className="w-20 h-20 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium text-slate-600">Selecione uma conversa</p>
                                <p className="text-sm text-slate-500 mt-1">Escolha um chat da lista para começar</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - User Info */}
                {selectedChat && userInfo && (
                    <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
                        {/* User Header */}
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-slate-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                                    {userInfo.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="font-semibold text-slate-900 text-lg">{userInfo.name}</h3>
                                <p className="text-sm text-slate-600 mt-1">{userInfo.email}</p>
                                <div className="mt-3 flex gap-2">
                                    {userInfo.isGuest ? (
                                        <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                                            Visitante
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                            Cliente
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="p-6 border-b border-slate-200">
                            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Contato</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <span className="text-sm text-slate-700 break-all">{userInfo.email}</span>
                                </div>
                                {userInfo.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <span className="text-sm text-slate-700">{userInfo.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Stats */}
                        {!userInfo.isGuest && (
                            <div className="p-6 border-b border-slate-200">
                                <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Atividade</h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Pedidos</div>
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="w-4 h-4 text-indigo-500" />
                                                <div className="text-xl font-bold text-slate-900">{userInfo.totalOrders}</div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Ingressos</div>
                                            <div className="flex items-center gap-2">
                                                <Ticket className="w-4 h-4 text-purple-500" />
                                                <div className="text-xl font-bold text-slate-900">{userInfo.totalTickets}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {(userInfo.transferredTickets || 0) > 0 && (
                                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                                            </div>
                                            <div>
                                                <div className="text-orange-900 font-semibold text-xs uppercase tracking-wide">Transferências</div>
                                                <div className="text-orange-700 text-xs">{userInfo.transferredTickets} ingresso(s) recebidos</div>
                                            </div>
                                        </div>
                                    )}

                                    {userInfo.lastOrder && (
                                        <div className="mt-2">
                                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Última Compra</h5>
                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                                {userInfo.lastOrder.eventImage && (
                                                    <div className="h-24 w-full bg-slate-100 relative overflow-hidden">
                                                        <img
                                                            src={userInfo.lastOrder.eventImage}
                                                            alt={userInfo.lastOrder.eventName}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                        <div className="absolute bottom-2 left-3 right-3 text-white">
                                                            <div className="text-[10px] font-medium opacity-90 uppercase tracking-wide">Evento</div>
                                                            <div className="font-semibold text-sm truncate">{userInfo.lastOrder.eventName}</div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="p-3">
                                                    {!userInfo.lastOrder.eventImage && (
                                                        <div className="font-semibold text-slate-900 mb-1 truncate text-sm">
                                                            {userInfo.lastOrder.eventName}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-500 uppercase">Código</span>
                                                            <span className="font-mono text-xs text-slate-700">#{userInfo.lastOrder.code}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] text-slate-500 uppercase">Valor</span>
                                                            <span className="font-bold text-indigo-600 text-sm">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(userInfo.lastOrder.totalAmount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Internal Notes */}
                        <div className="p-6">
                            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                                <StickyNote className="w-4 h-4" />
                                Notas Internas
                            </h4>

                            <form onSubmit={handleAddNote} className="mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Adicionar nota..."
                                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newNote.trim()}
                                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {notes.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-8">Nenhuma nota ainda</p>
                                ) : (
                                    notes.map((note) => (
                                        <div key={note.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-sm text-slate-900 mb-2">{note.note}</p>
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span className="font-medium">{note.user.name}</span>
                                                <span>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default AdminLiveChat;
