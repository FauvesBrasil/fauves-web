import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Search, Scan, Check, RotateCcw, X, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/apiBase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ParticipantesCheckin() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  // Event & Participants state
  const [eventName, setEventName] = useState('Carregando...');
  const [eventDate, setEventDate] = useState('');
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'checkedin'>('all');

  // Scanner Simulator Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [processingScan, setProcessingScan] = useState(false);

  // Load Event Details
  useEffect(() => {
    let mounted = true;
    async function loadEvent() {
      if (!eventId) return;
      try {
        const res = await fetchApi(`/api/event/${eventId}`);
        if (!res?.ok) return;
        const ev = await res.json();
        if (!mounted) return;
        setEventName(ev?.name || ev?.title || 'Evento');
        if (ev?.startDate) {
          const d = new Date(ev.startDate);
          const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const timePart = d.toTimeString().slice(0, 5);
          setEventDate(`${datePart}, ${timePart} BRT`);
        }
      } catch { }
    }
    loadEvent();
    return () => { mounted = false; };
  }, [eventId]);

  // Load Participants/Tickets from Database
  const loadParticipantes = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const ticketsRes = await fetchApi(`/api/ticket/event/${eventId}`);
      if (!ticketsRes?.ok) return;
      const tickets = await ticketsRes.json();

      const mapped = tickets.map((t: any) => ({
        id: t.id,
        code: t.code || '',
        nome: t.user?.name || t.guestName || t.guestEmail?.split('@')[0] || 'Participante',
        email: t.user?.email || t.guestEmail || '-',
        ingresso: t.ticketType?.name || t.ticketTypeName || 'Ingresso',
        used: t.used || false,
      }));
      setParticipantes(mapped);
    } catch (e) {
      toast.error('Erro ao carregar lista de participantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipantes();
  }, [eventId]);

  // Perform toggle checkin in Database
  const handleToggleCheckin = async (ticketId: string, used: boolean) => {
    // Optimistic UI Update
    setParticipantes(prev => prev.map(p =>
      p.id === ticketId ? { ...p, used } : p
    ));

    try {
      const res = await fetchApi(`/api/ticket/${ticketId}/toggle-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ used }),
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar check-in no servidor');
      }

      toast.success(used ? 'Check-in realizado!' : 'Check-in desfeito!');
    } catch (err) {
      // Revert Optimistic Update on failure
      setParticipantes(prev => prev.map(p =>
        p.id === ticketId ? { ...p, used: !used } : p
      ));
      toast.error('Falha ao sincronizar check-in com o servidor');
    }
  };

  // Scanner Simulator Submission
  const handleSimulatedScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;

    setProcessingScan(true);
    try {
      // Find matching participant by code
      const codeClean = scanCode.trim().toLowerCase();
      const participant = participantes.find(p => p.code.toLowerCase() === codeClean || p.id.toLowerCase() === codeClean);

      if (!participant) {
        toast.error('Ingresso não encontrado ou inválido para este evento.');
        setProcessingScan(false);
        return;
      }

      if (participant.used) {
        toast.warning('Este ingresso já foi utilizado para Check-in!');
        setProcessingScan(false);
        return;
      }

      // Check-in the participant
      await handleToggleCheckin(participant.id, true);
      toast.success(`Check-in de ${participant.nome} realizado com sucesso!`);
      setScanCode('');
      setIsScannerOpen(false);
    } catch (e) {
      toast.error('Erro ao validar código');
    } finally {
      setProcessingScan(false);
    }
  };

  // Filter & Search Logic
  const filteredParticipants = participantes.filter(p => {
    // Search query
    const searchClean = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchClean || 
      p.nome.toLowerCase().includes(searchClean) || 
      p.email.toLowerCase().includes(searchClean) || 
      p.code.toLowerCase().includes(searchClean);

    if (!matchesSearch) return false;

    // Tabs filter
    if (activeTab === 'checkedin') return p.used;
    // For "all" and "confirmed", we show all ticket holders
    return true;
  });

  const checkedCount = participantes.filter(p => p.used).length;
  const totalCount = participantes.length;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* 100% Width Sticky Header - Content is centered inside to [820px] */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="w-full max-w-[820px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors mr-3 text-zinc-600 dark:text-zinc-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-[17px] text-zinc-900 dark:text-white leading-tight">
                {eventName}
              </h1>
              <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
                {eventDate}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsScannerOpen(true)} 
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full py-1.5 px-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Scan className="w-3.5 h-3.5 text-zinc-500" />
            Escanear
          </button>
        </div>
      </header>

      {/* 100% Width Search Input Bar - Input elements are centered to [820px] */}
      <section className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="w-full max-w-[820px] mx-auto px-6 py-3.5 flex items-center gap-3">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Buscar um convidado..." 
            className="bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 w-full text-[14.5px] font-medium"
          />
        </div>
      </section>

      {/* 100% Width Tab Filter bar - Tab elements are centered to [820px] */}
      <nav className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/50 select-none">
        <div className="w-full max-w-[820px] mx-auto px-6 flex gap-6 pt-2">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'all' 
                ? 'text-zinc-900 dark:text-white font-semibold' 
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
            }`}
          >
            Todos os Convidados
            {activeTab === 'all' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('confirmed')} 
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'confirmed' 
                ? 'text-zinc-900 dark:text-white font-semibold' 
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
            }`}
          >
            Confirmado <span className="opacity-75 font-normal ml-0.5">{totalCount}</span>
            {activeTab === 'confirmed' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('checkedin')} 
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'checkedin' 
                ? 'text-zinc-900 dark:text-white font-semibold' 
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
            }`}
          >
            Check-in realizado <span className="opacity-75 font-normal ml-0.5">{checkedCount}</span>
            {activeTab === 'checkedin' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
        </div>
      </nav>

      {/* Main Content Area - Centered to [820px] with perfect borders alignment */}
      <main className="w-full flex-1 bg-white dark:bg-zinc-900">
        <div className="w-full max-w-[820px] mx-auto px-6 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mb-4" />
              <p className="text-zinc-400 font-medium text-sm">Carregando participantes...</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            
            /* Hourglass Empty State - precisely styled to match Luma */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 text-zinc-300 dark:text-zinc-700 mb-6 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-full h-full fill-none stroke-current stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M25 15h70M25 105h70" />
                  <path d="M30 15c0 30 15 40 30 45-15 5-30 15-30 45" />
                  <path d="M90 15c0 30-15 40-30 45 15 5 30 15 30 45" />
                  
                  <circle cx="45" cy="28" r="3.5" className="fill-current opacity-30" />
                  <circle cx="60" cy="35" r="3.5" className="fill-current opacity-30" />
                  <circle cx="75" cy="28" r="3.5" className="fill-current opacity-30" />
                  <circle cx="53" cy="22" r="3" className="fill-current opacity-20" />
                  <circle cx="67" cy="22" r="3" className="fill-current opacity-20" />

                  <line x1="60" y1="52" x2="60" y2="92" className="stroke-current opacity-40" strokeDasharray="3 3" />
                  
                  <path d="M42 98c5-6 13-10 18-10s13 4 18 10Z" className="fill-current opacity-25" />
                </svg>
              </div>
              <h3 className="text-[17px] font-semibold text-zinc-950 dark:text-zinc-100 mb-1">
                Nenhum Convidado Encontrado
              </h3>
              <p className="text-[13px] text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed font-medium">
                {searchQuery 
                  ? 'Nenhum convidado corresponde à sua busca neste filtro.' 
                  : 'Compartilhe a página do seu evento para coletar inscrições.'}
              </p>
            </div>
          ) : (
            
            /* Custom Premium Guest List - borderless rows aligned perfectly with tabs and header */
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredParticipants.map((p) => {
                const initial = p.nome ? p.nome.charAt(0).toUpperCase() : '?';
                return (
                  <div key={p.id} className="flex items-center justify-between py-4 transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    <div className="flex items-center gap-3">
                      {/* Circle Avatar with Name Initial */}
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[14px]">
                        {initial}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[14.5px] text-zinc-800 dark:text-zinc-100 leading-snug">
                          {p.nome}
                        </h4>
                        <p className="text-[12px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {p.email} • <span className="opacity-90">{p.ingresso}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      {p.used ? (
                        /* Checked-In Badge & Reset Action */
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            Check-in realizado
                          </span>
                          <button 
                            onClick={() => handleToggleCheckin(p.id, false)} 
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all"
                            title="Desfazer Check-in"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        /* Perform Check-In Button */
                        <button 
                          onClick={() => handleToggleCheckin(p.id, true)} 
                          className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg py-1.5 px-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm hover:shadow transition-all"
                        >
                          Check-in
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Interactive Scan Simulator Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsScannerOpen(false)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 text-white rounded-[24px] border border-zinc-800 p-6 w-full max-w-[420px] shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setIsScannerOpen(false)} 
                className="absolute top-4 right-4 p-1.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mt-3">
                <h3 className="text-lg font-bold">Simulador de Scanner</h3>
                <p className="text-xs text-zinc-400 mt-1">Insira o código do ingresso para realizar o check-in instantâneo.</p>
              </div>

              {/* Animated camera viewport simulator */}
              <div className="relative w-full aspect-video rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center my-6 overflow-hidden shadow-inner">
                {/* Scanning green/red line animation */}
                <motion.div 
                  animate={{ y: ["0%", "180px", "0%"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10 top-0"
                />
                
                {/* Camera reticle overlay lines */}
                <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-zinc-400" />
                <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-zinc-400" />
                <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-zinc-400" />
                <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-zinc-400" />

                <div className="text-center p-4">
                  <Scan className="w-10 h-10 text-zinc-500 mx-auto animate-pulse" />
                  <span className="text-[11px] text-zinc-500 font-medium block mt-2 uppercase tracking-widest">Câmera ativa</span>
                </div>
              </div>

              <form onSubmit={handleSimulatedScan} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="scan-code-input" className="block text-xs font-semibold text-zinc-400 mb-1.5">Código do Ingresso (ou nome)</label>
                  <input 
                    id="scan-code-input"
                    type="text" 
                    value={scanCode} 
                    onChange={(e) => setScanCode(e.target.value)} 
                    placeholder="Ex: d7b8a3e9" 
                    className="w-full h-11 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all font-medium"
                    autoFocus
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={processingScan || !scanCode.trim()}
                  className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-[14.5px] mt-2"
                >
                  {processingScan ? "Validando..." : "Sinalizar Leitura de QR"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
