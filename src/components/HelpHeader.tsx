import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import HelpUserDropdown from '@/components/HelpUserDropdown';
import { HelpCircle } from 'lucide-react';
import logoFauves from '@/assets/logo-fauves.svg';

const HelpHeader: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#0b0b0b] border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Help Title */}
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={logoFauves}
                                alt="Fauves"
                                className="h-8"
                            />
                        </button>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-6 bg-zinc-300 dark:bg-zinc-700" />

                        {/* Help Center Label */}
                        <button
                            onClick={() => navigate('/ajuda')}
                            className="hidden sm:flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <HelpCircle className="w-5 h-5" />
                            <span className="font-medium">Central de Ajuda</span>
                        </button>
                    </div>

                    {/* Right side - Theme toggle and User */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* User dropdown or Login */}
                        {user ? (
                            <HelpUserDropdown
                                userName={user.name || user.email || 'Usuário'}
                                userEmail={user.email || ''}
                            />
                        ) : (
                            <button
                                onClick={() => navigate('/profile')}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                                Entrar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HelpHeader;
