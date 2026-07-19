import * as React from "react";
import { X, CheckCircle, Circle, FileText, Ticket, Eye, BarChart2, Users, UserCog, Link as LinkIcon, Target, ClipboardCheck, UserCheck, ListChecks, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoSquare from "@/assets/logo-square-fauves-blue.svg";

interface EventMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  eventId: string;
  eventName?: string;
  eventDate?: string;
  eventStatus?: string;
  hasTickets?: boolean;
  isPublished?: boolean;
}

const EventMobileDrawer: React.FC<EventMobileDrawerProps> = ({
  isOpen,
  onClose,
  currentPath,
  eventId,
  eventName,
  eventDate,
  eventStatus,
  hasTickets = false,
  isPublished = false
}) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  if (!isOpen) return null;

  // Menu structure matching the EventDetailsSidebar
  const menuSections = [
    {
      title: "Etapas",
      items: [
        {
          key: 'editar',
          label: 'Editar página do evento',
          icon: FileText,
          route: `/create?eventId=${eventId}`,
          completed: true // sempre marcado como completo se o evento existe
        },
        {
          key: 'ingressos',
          label: 'Configurar ingresso',
          icon: Ticket,
          route: `/create-tickets?eventId=${eventId}`,
          completed: hasTickets
        },
        {
          key: 'publicar',
          label: 'Publicar',
          icon: Eye,
          route: `/publish-details?eventId=${eventId}`,
          completed: isPublished
        },
      ]
    },
    {
      title: "Painel",
      items: [
        {
          key: 'painel',
          label: 'Painel',
          icon: BarChart2,
          route: `/event/manage/${eventId}`
        },
        {
          key: 'analytics',
          label: 'Analytics',
          icon: TrendingUp,
          route: `/event/manage/${eventId}/analytics`
        },
      ]
    },
    {
      title: "Marketing",
      items: [
        {
          key: 'link-rastreamento',
          label: 'Link de rastreamento',
          icon: LinkIcon,
          route: `/marketing/link-rastreamento/${eventId}`
        },
        {
          key: 'pixels',
          label: 'Pixels',
          icon: Target,
          route: `/marketing/pixels/${eventId}`
        },
        {
          key: 'embaixadores',
          label: 'Embaixadores',
          icon: Users,
          route: `/marketing/embaixadores/${eventId}`
        },
        {
          key: 'pesquisa',
          label: 'Pesquisa de satisfação',
          icon: ClipboardCheck,
          route: `/pesquisa-satisfacao/${eventId}`
        },
      ]
    },
    {
      title: "Participantes",
      items: [
        {
          key: 'participantes',
          label: 'Participantes/Pedidos',
          icon: Users,
          route: `/participantes/pedidos/${eventId}`
        },
        {
          key: 'lista-convidados',
          label: 'Lista de convidados',
          icon: ListChecks,
          route: `/participantes/lista/${eventId}`
        },
        {
          key: 'checkin',
          label: 'Check-in',
          icon: UserCheck,
          route: `/participantes/checkin/${eventId}`
        },
      ]
    },
    {
      title: "Gerenciar equipe",
      items: [
        {
          key: 'equipe',
          label: 'Gerenciar equipe',
          icon: UserCog,
          route: `/gerenciar-equipe/${eventId}`
        },
      ]
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="hidden max-sm:block fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
        style={{
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 300ms'
        }}
      />

      {/* Drawer */}
      <div
        className="hidden max-sm:block fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-[#0b0b0b] z-50 shadow-xl overflow-y-auto"
        style={{
          transform: isClosing ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 300ms',
          willChange: 'transform'
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-1 border-b border-[#E5E7EB] dark:border-[#1F1F1F]">
          <div className="flex items-center gap-3">
            <img src={logoSquare} alt="Fauves" className="h-14 w-14" />
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#1F1F1F] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#091747] dark:text-white" />
          </button>
        </div>

        {/* Event info section */}
        {eventName && (
          <div className="p-4 border-b border-[#E5E7EB] dark:border-[#1F1F1F]">
            <div className="font-semibold text-sm text-[#091747] dark:text-white mb-1 truncate">
              {eventName}
            </div>
            {eventDate && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {eventDate}
              </div>
            )}
            {eventStatus && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-[#1F1F1F] text-xs font-medium text-gray-700 dark:text-gray-300">
                {eventStatus}
              </div>
            )}
          </div>
        )}

        {/* Navigation menu */}
        <nav className="p-4">
          {menuSections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? 'mt-6' : ''}>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.route || currentPath.startsWith(item.route);
                  const hasCompletion = 'completed' in item;

                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavigation(item.route)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                        }`}
                    >
                      {hasCompletion ? (
                        item.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Back to events link */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#1F1F1F]">
            <button
              onClick={() => handleNavigation('/organizer-events')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
            >
              <span className="font-medium text-sm">← Voltar para eventos</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default EventMobileDrawer;
