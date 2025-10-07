import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEventPath } from '@/lib/eventUrl';
import { apiUrl, ensureApiBase } from '@/lib/apiBase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TicketSelectionModal from '../components/TicketSelectionModal';
import EventPageSkeleton from "@/components/skeletons/EventPageSkeleton";

// Modal de denúncia
function ReportModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (reason: string, email: string, description: string) => void }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('Listas de eventos fraudulentos ou golpes');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const reasons = [
    'Listas de eventos fraudulentos ou golpes',
    'Conteúdo nocivo',
    'Conteúdo ou atividades regulamentadas',
    'Spam',
    'Conteúdo sexualmente explícito',
    'Conteúdo odioso',
    'Violência ou extremismo',
    'Evento cancelado',
    'Solicitar reembolso',
    'Violação de direitos autorais ou marcas comerciais',
  ];
  const handleSend = () => {
    setError('');
    if (!email.trim() || !description.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    onSubmit(reason, email, description);
    setStep(1);
    setEmail('');
    setDescription('');
    setReason(reasons[0]);
  };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div
        className="backdrop-blur-lg bg-white/60 border border-white/40 shadow-2xl rounded-2xl p-8 max-w-[540px] w-full relative"
        style={{ boxSizing: 'border-box' }}
      >
        <h2 className="text-center text-xl font-semibold text-indigo-950 mb-6">Denunciar evento</h2>
        {step === 1 ? (
          <>
            <div className="text-gray-700 text-base leading-relaxed mb-8">
              <p className="mb-4">Nossas Diretrizes da Comunidade descrevem o tipo de conteúdo que proibimos na Fauves. Se suspeitar que um evento pode estar violando as regras, você poderá denunciá-lo para que possamos investigar.</p>
              <p className="mb-4">Se você tiver alguma dúvida sobre um evento, precisar resolver uma disputa ou quiser solicitar um reembolso, recomendamos que, primeiramente, você entre em contato diretamente com o organizador.</p>
              <p>Se você ou outra pessoa estiver em perigo iminente devido à publicação de um evento, entre em contato com as autoridades locais para obter ajuda.</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white text-base font-semibold rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ minWidth: 180 }}
              >
                Iniciar relatório
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <div className="text-gray-700 text-base leading-relaxed mb-6">
              Ajude a Fauves a investigar este evento fornecendo informações sobre o motivo pelo qual você o está informando.
            </div>
            <div className="mb-5">
              <div className="font-semibold text-indigo-950 mb-2">Razão para denunciar</div>
              <div className="flex flex-col gap-1">
                {reasons.map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer text-base text-gray-800">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-indigo-700 w-4 h-4"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-indigo-950 mb-1">
                Endereço de email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-indigo-950 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3}
                placeholder="Por que você acredita que esta listagem de eventos é fraudulenta ou não autorizada? Descreva sua relação com o evento e/ou forneça um link para o site autorizado de venda de ingressos."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <div className="flex gap-4 mt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white text-base font-semibold rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ minWidth: 180 }}
              >
                Enviar relatório
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white border border-indigo-200 text-indigo-700 text-base font-semibold rounded-lg shadow-sm hover:bg-indigo-50 transition-all"
              >
                Voltar
              </button>
            </div>
          </form>
        )}
        <button
          onClick={() => { setStep(1); onClose(); }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

const Event: React.FC = () => {
  // Efeito blur/degradê no topo da tela será definido após checar loading/error/event
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  // Importante: hooks precisam ficar antes de qualquer return condicional para não mudar a ordem entre renders
  const [mainImgErrored, setMainImgErrored] = useState(false);

  // Carregar ticket types reais quando evento carregado
  useEffect(() => {
    if (!event?.id) return;
    let abort = false;
    const loadTickets = async () => {
      setTicketsLoading(true);
      setTicketsError('');
      try {
        await ensureApiBase();
        const attemptUrls: string[] = [];
        attemptUrls.push(apiUrl(`/api/ticket-type/event/${event.id}/with-stats`));
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem('eventsApiBase') : null;
        if (stored) attemptUrls.push(`${stored.replace(/\/$/, '')}/api/ticket-type/event/${event.id}/with-stats`);
        // Sempre garante localhost:4000 como último fallback
        attemptUrls.push(`http://localhost:4000/api/ticket-type/event/${event.id}/with-stats`);
        let data: any = null;
        for (const url of attemptUrls) {
          if (data) break;
          try {
            const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (!r.ok) continue;
            const json = await r.json();
            if (Array.isArray(json)) data = json;
          } catch {}
        }
        if (!data) throw new Error('Falha ao carregar tipos de ingresso');
        if (!abort) {
          const norm = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            price: Number(t.price) || 0,
            available: typeof t.available === 'number' ? t.available : Math.max((t.maxQuantity ?? 0) - (t.sold ?? 0), 0),
            maxQuantity: t.maxQuantity,
            sold: t.sold,
            isHalf: t.isHalf,
            description: t.description,
          }));
          setTicketTypes(norm);
        }
      } catch (e: any) {
        if (!abort) setTicketsError('Não foi possível carregar ingressos agora. Tente novamente mais tarde.');
      } finally {
        if (!abort) setTicketsLoading(false);
      }
    };
    loadTickets();
    return () => { abort = true; };
  }, [event?.id]);

  useEffect(() => {
    const load = async () => {
      if (!slugOrId) return;
      setLoading(true);
      setError('');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      try {
        await ensureApiBase();
        const attempts: { label: string; url: string; skip404?: boolean }[] = [];
        if (!isUUID) attempts.push({ label: 'slug', url: apiUrl(`/api/event/slug/${encodeURIComponent(slugOrId)}`), skip404: true });
        attempts.push({ label: 'id', url: apiUrl(`/api/event/${encodeURIComponent(slugOrId)}`) });
        const storedBase = typeof window !== 'undefined' ? window.localStorage.getItem('eventsApiBase') : null;
        if (storedBase) attempts.push({ label: 'stored', url: `${storedBase.replace(/\/$/, '')}/api/event/${encodeURIComponent(slugOrId)}` });
        attempts.push({ label: 'localhost', url: `http://localhost:4000/api/event/${encodeURIComponent(slugOrId)}` });
        let data: any = null;
        for (const att of attempts) {
          if (data) break;
          try {
            const r = await fetch(att.url, { headers: { 'Accept': 'application/json' } });
            if (r.status === 404 && att.skip404) continue;
            if (!r.ok) continue;
            data = await r.json();
          } catch {}
        }
        if (!data) throw new Error('Evento não encontrado ou indisponível');
        setEvent(data);
        try { document.title = `${data.name || 'Evento'} | Fauves`; } catch {}
      } catch (e: any) {
        setError('Não foi possível carregar o evento. Verifique se o link está correto.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slugOrId]);

  const handleReport = (reason: string) => {
    setShowReport(false);
    setReportSent(true);
    setTimeout(() => setReportSent(false), 2500);
  };

  const handlePurchase = (selectedTickets: any[]) => {
    setShowTicketModal(false);
    // Here you would typically redirect to a payment page or handle the purchase
    console.log('Selected tickets:', selectedTickets);
    // For demo purposes, just show a success message
    setReportSent(true);
    setTimeout(() => setReportSent(false), 2500);
  };

  if (loading) return <EventPageSkeleton />;
  if (error || !event) {
    return (
      <div className="flex overflow-hidden flex-col pb-20 bg-white rounded-3xl min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-red-600 mb-4">{error || 'Evento não encontrado.'}</span>
            <a href="/" className="text-blue-600 underline">Voltar para a página inicial</a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Definir blurImage após garantir que event existe
  const FALLBACK_EVENT_IMAGE = '/fallback-event-banner.png'; // coloque um asset estático em /public
  let blurImage = 'https://api.builder.io/api/v1/image/assets/657d21e1d95a46adb49d1f36995debd1/0bfdd4b68cd20daf45d03327e505218f46fc94ad?placeholderIfAbsent=true';
  if (event?.image) {
    if (/^\/uploads\//.test(event.image)) {
      blurImage = apiUrl(event.image);
    } else {
      blurImage = event.image;
    }
  }
  const eventMainImage = mainImgErrored ? FALLBACK_EVENT_IMAGE : (event?.image && /^\/uploads\//.test(event.image) ? apiUrl(event.image) : (event?.image || blurImage));

  let content: React.ReactNode = null;
  try {
  content = (
    <div
      className="flex overflow-hidden flex-col pb-20 bg-white rounded-3xl relative min-h-screen"
      style={{ position: 'relative', zIndex: 0 }}
    >
      {/* Efeito blur/degradê só no topo, usando um div absoluto */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 320,
          zIndex: 0,
          background: `linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, #fff 90%), url(${blurImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          filter: 'blur(24px) brightness(0.97)',
          pointerEvents: 'none',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header />
        <div className="flex flex-col items-center mx-auto mt-5 max-w-[1000px] max-md:max-w-full" style={{ marginBottom: 100 }}>
          <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <img
              src={eventMainImage}
              onError={(e) => { if (!mainImgErrored) setMainImgErrored(true); }}
              className="object-cover self-stretch w-full rounded-3xl aspect-[2.86] max-md:max-w-full"
              alt={event.name || 'Imagem do evento'}
            />
          </div>
          <div className="flex flex-row gap-8 w-full mt-10 max-md:flex-col max-md:gap-0">
            {/* Coluna Esquerda */}
            <div className="flex flex-col w-[62%] max-md:w-full">
              <div className="flex flex-col justify-center px-2.5 py-0.5 text-xs font-bold text-white bg-orange-600 rounded-[100px] w-fit">
                <div>Festas e Shows</div>
              </div>
              <div className="mt-2.5 text-4xl font-bold text-indigo-950">
                {event.name || "Nome do evento"}
              </div>
              <div className="text-lg font-medium text-indigo-950">
                {event.subtitle || "Subtítulo do evento"}
              </div>
              {/* Data e hora + Localização lado a lado */}
              <div className="flex flex-row gap-4 mt-8 mb-4 w-full max-md:flex-col">
                {/* Data e hora */}
                <div className="flex flex-col items-start justify-start flex-1 p-6 rounded-xl text-indigo-950 bg-white/40 backdrop-blur-md border border-white/30 shadow-md">
                  <span className="mb-2">
                    {/* Ícone calendário */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" fill="#6366f1" fillOpacity="0.12"/><rect x="3" y="5" width="18" height="16" rx="3" stroke="#6366f1" strokeWidth="1.5"/><path d="M16 3v4M8 3v4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/><path d="M3 9h18" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </span>
                  <div className="text-base font-bold mb-1">Data e hora</div>
                  <div className="text-lg mb-0.5">
                    {event.startDate
                      ? `${new Date(event.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às ${new Date(event.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : '17 Janeiro 2025 às 20:00'}
                  </div>
                </div>
                {/* Localização */}
                <div className="flex flex-col items-start justify-start flex-1 p-6 text-base rounded-xl text-indigo-950 bg-white/40 backdrop-blur-md border border-white/30 shadow-md">
                  <span className="mb-2">
                    {/* Ícone localização */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 21c4.418 0 8-5.373 8-10A8 8 0 0 0 4 11c0 4.627 3.582 10 8 10Z" fill="#f59e42" fillOpacity="0.12"/><path d="M12 21c4.418 0 8-5.373 8-10A8 8 0 0 0 4 11c0 4.627 3.582 10 8 10Z" stroke="#f59e42" strokeWidth="1.5"/><circle cx="12" cy="11" r="3" stroke="#f59e42" strokeWidth="1.5"/></svg>
                  </span>
                  <div className="font-bold mb-1">Localização</div>
                  <div className="text-lg">{event.location || "Rua do Endereço, bairro do endereço, cidade, estado."}</div>
                </div>
              </div>
              {/* Sobre este evento */}
              <div className="mt-8 text-2xl font-bold text-indigo-950">
                Sobre este evento
              </div>
              <div className="mt-5 text-base text-indigo-950 w-full max-w-[600px] max-md:max-w-full">
                {event.description || (
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ullamcorper, tellus vel suscipit lobortis, tortor urna eleifend felis, at aliquam sapien felis a metus. Mauris porta nunc eu gravida ullamcorper. Sed faucibus rhoncus tortor non consequat. Vivamus volutpat tempor eros. Nullam hendrerit sed nunc quis scelerisque. Phasellus cursus finibus est non facilisis. Aliquam sed eros ac arcu vestibulum venenatis. Proin fringilla consectetur neque, sit amet tincidunt ligula accumsan non.\n\nAliquam ornare ipsum sit amet felis maximus, sed consectetur sapien consequat. Nulla facilisi. Aliquam erat volutpat. Nullam in lorem leo. Vestibulum at risus molestie, ornare velit nec, sagittis urna. Quisque non suscipit diam, in tristique leo.\n\nUt semper ex eu urna luctus, quis laoreet urna tempor. Aenean sit amet tincidunt odio. Vestibulum efficitur interdum magna, non porttitor augue suscipit ut. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Duis luctus et ex id bibendum. Aliquam lacinia neque commodo blandit lacinia. Morbi bibendum libero orci, et ultrices neque blandit eget. Nullam a enim felis. Nam id risus leo. Maecenas ac aliquam ex. Integer lobortis ante et ligula gravida fringilla. Sed a porta quam. Suspendisse ullamcorper nunc eu velit mattis, ac maximus orci blandit. Mauris luctus pharetra ultrices.'
                )}
              </div>
              {/* Organizador */}
              <div className="flex flex-wrap gap-10 p-5 mt-7 rounded-xl bg-white/40 backdrop-blur-md border border-white/30 shadow-md">
                <div className="flex flex-auto gap-5 text-[16px] font-medium text-indigo-950">
                  <div className="flex shrink-0 rounded-full bg-zinc-300 h-[50px] w-[50px]" />
                  <div className="flex-auto my-auto">
                    Por Fauves Entretenimento • 1.2k seguidores
                  </div>
                </div>
                <div className="flex flex-col justify-center px-4 py-2 my-auto text-base font-bold text-white whitespace-nowrap bg-[#2A2AD7] rounded-md transition-all duration-200 hover:bg-[#2A2AD7] hover:shadow-2xl hover:-translate-y-1 cursor-pointer">
                  <div>Seguir</div>
                </div>
              </div>
              {/* Denunciar evento */}
              <button 
                onClick={() => setShowReport(true)}
                className="flex gap-2.5 px-6 py-2 mt-10 mx-auto text-[14px] font-medium bg-white rounded-md shadow-lg text-indigo-950 transition-all duration-200 hover:bg-red-50 hover:shadow-2xl hover:-translate-y-1 hover:text-red-700 max-md:px-5 justify-center"
                style={{ outline: 'none' }}
              >
                <img
                  src="https://api.builder.io/api/v1/image/assets/657d21e1d95a46adb49d1f36995debd1/a76370e49ec4dc6530794cf1bb5a0053e6c60993?placeholderIfAbsent=true"
                  className="object-contain shrink-0 my-auto aspect-[0.93] w-[13px]"
                  alt=""
                />
                <div className="basis-auto">Denunciar este evento</div>
              </button>
            </div>
            {/* Coluna Direita */}
            <div className="flex flex-col w-[38%] max-md:w-full ml-5 max-md:ml-0">
              <div className="flex flex-col p-5 w-full rounded-xl border max-md:mt-8 bg-white/40 backdrop-blur-md border-white/30 shadow-md sticky top-10 z-20">
                <div className="self-center text-lg text-indigo-950 min-h-[28px] flex items-center">
                  {ticketsLoading && 'Carregando ingressos...'}
                  {!ticketsLoading && ticketsError && <span className="text-red-600 text-sm">{ticketsError}</span>}
                  {!ticketsLoading && !ticketsError && ticketTypes.length === 0 && 'Nenhum ingresso disponível'}
                  {!ticketsLoading && !ticketsError && ticketTypes.length > 0 && `Ingressos a partir de R$${(Math.min(...ticketTypes.map(t => t.price)) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </div>
                <button
                  onClick={() => { console.log('Abrir modal de ingressos'); setShowTicketModal(true); }}
                  className="flex justify-center px-16 py-3.5 mt-5 text-base font-bold text-white bg-[#2A2AD7] rounded-md max-md:px-5 transition-all duration-200 hover:bg-[#2A2AD7] hover:shadow-2xl hover:-translate-y-1 cursor-pointer w-full"
                  disabled={ticketsLoading || (!!ticketsError && ticketTypes.length === 0)}
                >
                  <div>{ticketsLoading ? 'Aguarde...' : 'Selecionar ingressos'}</div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} onSubmit={handleReport} />
        <TicketSelectionModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          eventName={event.name || "Nome do evento"}
          eventDate={event.startDate
            ? `${new Date(event.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} · ${new Date(event.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : '15 janeiro 2025 · 13:00'
          }
          eventImage={event.image}
          ticketTypes={ticketTypes}
          onPurchase={handlePurchase}
          debug={showTicketModal}
        />
        {reportSent && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#22c55e', color: 'white', padding: '12px 24px', borderRadius: 8, zIndex: 2000 }}>
            Denúncia enviada com sucesso!
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
  } catch(err:any){
    console.error('[Event render] falhou', err);
    return <div style={{padding:40}}><h2>Erro ao renderizar evento</h2><p>Tente recarregar a página.</p></div>;
  }
  return content as any;
};

export default Event;
