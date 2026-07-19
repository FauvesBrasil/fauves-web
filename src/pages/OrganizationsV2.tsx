import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, X } from 'lucide-react';
import HeaderV2 from '@/components/v2/HeaderV2';
import FooterV2 from '@/components/v2/FooterV2';
import { useAuth } from '@/context/AuthContext';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { useSEO } from '@/hooks/useSEO';
import explainerWelcome from '@/assets/explainer-welcome.svg';
import explainerTeam from '@/assets/explainer-team.svg';
import explainerPage from '@/assets/explainer-page.svg';
import explainerNewsletter from '@/assets/explainer-newsletter.svg';
import explainerHighlight from '@/assets/explainer-highlight.svg';

type UpcomingEvent = {
  id: string;
  name: string;
  slug?: string | null;
  startDate: string;
};

type Organization = {
  id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  subscriberCount?: number;
  events?: UpcomingEvent[];
};

const slides = [
  {
    title: 'Bem-vindo ao Fauves Calendar',
    description: 'O Fauves Calendar permite que você compartilhe e gerencie seus eventos com facilidade. Todo evento no Fauves faz parte de um calendário. Veja como eles funcionam.',
    image: explainerWelcome,
  },
  {
    title: 'Trabalhe com Seu Time',
    description: 'Adicione facilmente seus colegas como administradores do calendário. Eles terão acesso para gerenciar os eventos do calendário.',
    image: explainerTeam,
  },
  {
    title: 'Compartilhe Sua Página de Calendário',
    description: 'Personalize e compartilhe seu calendário com os próximos eventos em destaque.',
    image: explainerPage,
  },
  {
    title: 'Enviar Newsletters',
    description: 'À medida que os convidados seguem seu calendário, você pode enviar newsletters para mantê-los informados.',
    image: explainerNewsletter,
  },
  {
    title: 'Destaque Eventos da Comunidade',
    description: 'Seu calendário pode exibir eventos de outros calendários, inclusive os hospedados em outros sites.',
    image: explainerHighlight,
  },
];

const formatEventDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '');
  const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date).replace('.', '');
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
  return `${weekday}, ${dayMonth}, ${time}`;
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

const CalendarLogo: React.FC<{ organization: Organization }> = ({ organization }) => {
  const logo = resolveImageUrl(organization.logoUrl);
  return logo ? <img src={logo} alt="" /> : <span>{initials(organization.name)}</span>;
};

const OrganizationsV2: React.FC = () => {
  const { user } = useAuth();
  const [myOrgs, setMyOrgs] = useState<Organization[]>([]);
  const [followingOrgs, setFollowingOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [welcomeSlide, setWelcomeSlide] = useState(0);
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('fauves:calendar-welcome-dismissed') !== 'true');

  useSEO({ title: 'Calendários · Fauves', description: 'Seus calendários e calendários seguidos na Fauves.' });

  useEffect(() => {
    document.documentElement.style.setProperty('--page-max-width', '790px');
    return () => { document.documentElement.style.removeProperty('--page-max-width'); };
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [mineResponse, followingResponse] = await Promise.all([
          fetchApi('/api/organization/list'),
          fetchApi('/api/organization/following'),
        ]);
        const [mine, following] = await Promise.all([mineResponse.json(), followingResponse.json()]);
        setMyOrgs(Array.isArray(mine) ? mine : []);
        setFollowingOrgs(Array.isArray(following) ? following : []);
      } catch (error) {
        console.error('Error loading calendars:', error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const dismissWelcome = () => {
    localStorage.setItem('fauves:calendar-welcome-dismissed', 'true');
    setShowWelcome(false);
  };

  const advanceWelcome = () => {
    if (welcomeSlide < slides.length - 1) setWelcomeSlide((slide) => slide + 1);
    else dismissWelcome();
  };

  const currentSlide = slides[welcomeSlide];

  return (
    <div className="calendars-page dark dark-mode">
      <HeaderV2 transparent fixed theme="dark" />

      <main className="calendars-container" data-header-align>
        <h1>Calendários</h1>

        {showWelcome && (
          <section className="calendars-welcome">
            <button className="calendars-welcome-close" type="button" onClick={dismissWelcome} aria-label="Fechar"><X size={16} /></button>
            <div className="calendars-welcome-art"><img src={currentSlide.image} alt="" /></div>
            <div className="calendars-welcome-content">
              <div>
                <h2>{currentSlide.title}</h2>
                <p>{currentSlide.description}</p>
              </div>
              <div className="calendars-welcome-footer">
                <div className="calendars-welcome-steps">
                  {slides.map((_, index) => (
                    <button key={index} type="button" className={index === welcomeSlide ? 'is-active' : ''} onClick={() => setWelcomeSlide(index)} aria-label={`Etapa ${index + 1}`} />
                  ))}
                </div>
                <button className="calendars-next" type="button" onClick={advanceWelcome}>{welcomeSlide === slides.length - 1 ? 'Concluir' : 'Próximo'}</button>
              </div>
            </div>
          </section>
        )}

        <section className="calendars-section calendars-mine">
          <header>
            <h2>Meus Calendários</h2>
            <Link className="v2-secondary-action" to="/organizations/create-calendar"><Plus size={15} />Criar</Link>
          </header>

          {loading ? (
            <div className="calendars-own-grid"><span className="calendar-skeleton" /><span className="calendar-skeleton" /></div>
          ) : myOrgs.length ? (
            <div className="calendars-own-grid">
              {myOrgs.map((organization) => (
                <Link className="calendar-own-card" to={`/calendar/manage/cal-${organization.id}`} key={organization.id}>
                  <span className="calendar-logo"><CalendarLogo organization={organization} /></span>
                  <strong>{organization.name}</strong>
                  <small>{organization.subscriberCount || 0} {(organization.subscriberCount || 0) === 1 ? 'Contato' : 'Contatos'}</small>
                </Link>
              ))}
            </div>
          ) : (
            <p className="calendars-empty">Você ainda não gerencia nenhum calendário.</p>
          )}
        </section>

        <section className="calendars-section calendars-following">
          <header><h2>Seguindo</h2></header>
          {loading ? (
            <span className="calendar-skeleton is-wide" />
          ) : followingOrgs.length ? (
            <div className="calendars-following-list">
              {followingOrgs.map((organization) => (
                <article className="calendar-following-card" key={organization.id}>
                  <div className="calendar-following-info">
                    <span className="calendar-logo"><CalendarLogo organization={organization} /></span>
                    <strong>{organization.name}</strong>
                    <Link className="v2-secondary-action" to={`/${organization.slug || organization.id}`}>Ver Calendário <ArrowRight size={15} /></Link>
                  </div>
                  <div className="calendar-upcoming">
                    <span>Próximos Eventos</span>
                    {organization.events?.length ? organization.events.map((event) => (
                      <Link to={`/${event.slug || event.id}`} key={event.id}>
                        <strong>{event.name}</strong>
                        <time>{formatEventDate(event.startDate)}</time>
                      </Link>
                    )) : <small>Nenhum evento próximo.</small>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="calendars-empty">Você não está seguindo nenhum calendário.</p>
          )}
        </section>
      </main>

      <FooterV2 maxWidth="960px" />
      <style>{calendarStyles}</style>
    </div>
  );
};

const calendarStyles = `
  .calendars-page { min-height: 100vh; color: #f4f4f5; background: #121416; }
  .calendars-container { width: min(100% - 32px, 790px); margin: 0 auto; padding: var(--page-top-spacing) 0 74px; }
  .calendars-container > h1 { margin: 0 0 38px; color: #fff; font-size: 1.75rem; font-weight: 600; letter-spacing: -.025em; }
  .calendars-welcome { position: relative; display: grid; grid-template-columns: 145px 1fr; min-height: 176px; margin-bottom: 21px; overflow: hidden; border: 1px solid rgba(255,255,255,.08); border-radius: 13px; background: #202224; }
  .calendars-welcome-close { position: absolute; z-index: 2; top: 12px; right: 12px; padding: 4px; border: 0; color: rgba(255,255,255,.48); background: none; cursor: pointer; }
  .calendars-welcome-close:hover { color: #fff; }
  .calendars-welcome-art { display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.08); }
  .calendars-welcome-art img { width: 116px; height: 116px; object-fit: contain; }
  .calendars-welcome-content { display: flex; flex-direction: column; justify-content: space-between; min-width: 0; padding: 21px 18px 16px 20px; }
  .calendars-welcome h2 { margin: 0 0 7px; color: #fff; font-size: 1rem; font-weight: 600; }
  .calendars-welcome p { max-width: 510px; margin: 0; color: rgba(255,255,255,.55); font-size: .8125rem; font-weight: 500; line-height: 1.5; }
  .calendars-welcome-footer { display: flex; align-items: center; justify-content: space-between; }
  .calendars-welcome-steps { display: flex; gap: 4px; }
  .calendars-welcome-steps button { width: 25px; height: 5px; padding: 0; border: 0; border-radius: 99px; background: rgba(255,255,255,.12); cursor: pointer; }
  .calendars-welcome-steps button.is-active { background: rgba(255,255,255,.8); }
  .calendars-next { height: 31px; padding: 0 13px; border: 0; border-radius: 8px; color: #17191b; background: #fff; cursor: pointer; font: inherit; font-size: .8125rem; font-weight: 600; }
  .calendars-section > header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .calendars-section h2 { margin: 0; color: #fff; font-size: 1.125rem; font-weight: 600; }
  .calendars-section > header > a { height: 31px; }
  .calendars-own-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .calendar-own-card { min-height: 130px; padding: 17px; border: 1px solid rgba(255,255,255,.075); border-radius: 12px; color: #fff; background: #202224; text-decoration: none; transition: border-color .15s ease; }
  .calendar-own-card:hover { border-color: rgba(255,255,255,.24); }
  .calendar-logo { display: flex; width: 40px; height: 40px; overflow: hidden; align-items: center; justify-content: center; border-radius: 9px; color: #151719; background: linear-gradient(135deg,#a7efc1,#f6c36c); font-size: .75rem; font-weight: 700; }
  .calendar-logo img { width: 100%; height: 100%; object-fit: cover; }
  .calendar-own-card > strong { display: block; margin-top: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 1rem; font-weight: 600; }
  .calendar-own-card > small { display: block; margin-top: 4px; color: rgba(255,255,255,.48); font-size: .8125rem; font-weight: 500; }
  .calendars-following { margin-top: 32px; padding-top: 31px; border-top: 1px solid rgba(255,255,255,.09); }
  .calendars-following-list { display: grid; gap: 16px; }
  .calendar-following-card { display: grid; grid-template-columns: 190px 1fr; min-height: 171px; padding: 17px; border: 1px solid rgba(255,255,255,.075); border-radius: 12px; background: #202224; }
  .calendar-following-info { display: flex; flex-direction: column; align-items: flex-start; }
  .calendar-following-info > strong { max-width: 170px; margin-top: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; font-size: 1rem; font-weight: 600; }
  .calendar-following-info > a { height: 31px; margin-top: auto; }
  .calendar-upcoming { padding: 2px 0 0 21px; }
  .calendar-upcoming > span { display: block; margin-bottom: 16px; color: rgba(255,255,255,.45); font-size: .8125rem; font-weight: 600; }
  .calendar-upcoming > a { display: block; margin-bottom: 15px; color: inherit; text-decoration: none; }
  .calendar-upcoming > a strong { display: block; overflow: hidden; color: #fff; text-overflow: ellipsis; white-space: nowrap; font-size: .875rem; font-weight: 600; }
  .calendar-upcoming > a time { display: block; margin-top: 5px; color: rgba(255,255,255,.45); font-size: .8125rem; font-weight: 500; }
  .calendar-upcoming > small, .calendars-empty { color: rgba(255,255,255,.43); font-size: .8125rem; }
  .calendars-empty { margin: 0; padding: 22px; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; background: #202224; }
  .calendar-skeleton { display: block; height: 130px; border-radius: 12px; background: rgba(255,255,255,.06); animation: calendars-pulse 1.4s ease-in-out infinite; }
  .calendar-skeleton.is-wide { height: 171px; }
  @keyframes calendars-pulse { 50% { opacity: .55; } }
  @media (max-width: 700px) {
    .calendars-container { padding-top: var(--page-top-spacing-mobile); }
    .calendars-welcome { grid-template-columns: 1fr; }
    .calendars-welcome-art { display: none; }
    .calendars-welcome-content { min-height: 176px; }
    .calendars-own-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .calendar-following-card { grid-template-columns: 145px 1fr; }
  }
  @media (max-width: 480px) {
    .calendars-own-grid { grid-template-columns: 1fr; }
    .calendar-following-card { grid-template-columns: 1fr; }
    .calendar-following-info > a { margin-top: 16px; }
    .calendar-upcoming { margin-top: 20px; padding: 18px 0 0; border-top: 1px solid rgba(255,255,255,.07); }
  }
`;

export default OrganizationsV2;
