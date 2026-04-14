import * as React from "react";
import { X, Home, Calendar, ClipboardList, BarChart2, Banknote, Settings, HelpCircle, ChevronDown, User, LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoSquare from "@/assets/logo-square-fauves-blue.svg";
import { getFirstName, getDisplayName } from '@/lib/user';
import ProducerJourneyBadge from '@/components/ProducerJourneyBadge';
import { useFetchProducerJourney } from '@/hooks/useFetchProducerJourney';
import { useAuth } from '@/context/AuthContext';
import { apiUrl } from '@/lib/apiBase';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  organizations?: any[];
  selectedOrg?: any;
  selectOrganization?: (orgId: string) => void;
  user?: any;
}

const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({
  isOpen,
  onClose,
  currentPath,
  organizations,
  selectedOrg,
  selectOrganization,
  user
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isClosing, setIsClosing] = React.useState(false);
  const [orgSelectorOpen, setOrgSelectorOpen] = React.useState(false);

  // Fetch producer journey data
  const { data: journeyData, loading: loadingJourney } = useFetchProducerJourney(selectedOrg?.id);

  // User display name
  const _rawName = (getFirstName(user) || getDisplayName(user) || 'Visitante') as string;
  const _token = String(_rawName).trim().split(/[\s._\-+@]/)[0] || 'Visitante';
  const userName = _token.charAt(0).toUpperCase() + _token.slice(1).toLowerCase();

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

        {/* User section */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#1F1F1F]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border border-indigo-200 dark:border-indigo-900/50">
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl.startsWith('http') ? user.photoUrl : apiUrl(user.photoUrl.startsWith('/') ? user.photoUrl : '/' + user.photoUrl)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{userName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#091747] dark:text-white truncate">{userName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-[#1F1F1F] mb-4" />

          {/* Organization selector */}
          {organizations && organizations.length > 0 && selectOrganization && (
            <div className="relative">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Organização
              </label>
              <button
                onClick={() => setOrgSelectorOpen(!orgSelectorOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md"
              >
                {/* Organization Logo/Avatar */}
                {selectedOrg?.logoUrl ? (
                  <img
                    src={selectedOrg.logoUrl}
                    alt={selectedOrg.name}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {selectedOrg?.name?.charAt(0)?.toUpperCase() || 'O'}
                  </div>
                )}

                {/* Organization Name */}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate flex-1 text-left">
                  {selectedOrg?.name || 'Selecione organização'}
                </span>

                {/* Dropdown indicator */}
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${orgSelectorOpen ? 'rotate-180' : ''}`} />
              </button>

              {orgSelectorOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#242424] rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-10">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        selectOrganization(org.id);
                        setOrgSelectorOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors flex items-center gap-2 ${selectedOrg?.id === org.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-[#091747] dark:text-white'
                        }`}
                    >
                      {/* Organization Logo in dropdown */}
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {org.name?.charAt(0)?.toUpperCase() || 'O'}
                        </div>
                      )}
                      <span className="truncate">{org.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Producer Journey Badge - Mobile */}
          {selectedOrg && (
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Sua Jornada
              </label>
              <ProducerJourneyBadge {...journeyData} loading={loadingJourney} />
            </div>
          )}
        </div>

        {/* Navigation menu */}
        <nav className="p-4">
          <div className="space-y-1">
            <button
              onClick={() => handleNavigation('/organizer-dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentPath === '/organizer-dashboard'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => handleNavigation('/organizer-events')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentPath === '/organizer-events'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Eventos</span>
            </button>

            <button
              onClick={() => handleNavigation('/organizer-orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentPath === '/organizer-orders'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Pedidos</span>
            </button>

            <button
              onClick={() => handleNavigation('/organizer-reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentPath === '/organizer-reports'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span className="font-medium">Relatórios</span>
            </button>

            <button
              onClick={() => handleNavigation('/organizer-finances')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentPath === '/organizer-finances'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="font-medium">Financeiro</span>
            </button>

            <button
              onClick={() => handleNavigation('/organizer-settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentPath === '/organizer-settings'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F]'
                }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Configurações</span>
            </button>
          </div>

          {/* Help section */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#1F1F1F]">
            <button
              onClick={() => handleNavigation('/help')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Ajuda</span>
            </button>
          </div>

          {/* User menu section */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#1F1F1F]">
            <button
              onClick={() => handleNavigation('/')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar para participante</span>
            </button>

            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#091747] dark:text-white hover:bg-gray-100 dark:hover:bg-[#1F1F1F] transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Configurações de conta</span>
            </button>

            <button
              onClick={async () => {
                await logout();
                handleNavigation('/');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileDrawerMenu;
