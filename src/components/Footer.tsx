import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import { 
    Instagram, Linkedin, Twitter, MessageCircle, 
    MapPin, ExternalLink, Building2, Palmtree, 
    Sun, Mountain, TreePine, Anchor, Flower2, 
    Wind, Music, Leaf 
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const Footer: React.FC = () => {
    const { isDark } = useTheme();

    const cities = [
        { name: 'São Paulo', slug: 'sao-paulo', icon: <Building2 size={14} /> },
        { name: 'Rio de Janeiro', slug: 'rio-de-janeiro', icon: <Palmtree size={14} /> },
        { name: 'Fortaleza', slug: 'fortaleza', icon: <Sun size={14} /> },
        { name: 'Belo Horizonte', slug: 'belo-horizonte', icon: <Mountain size={14} /> },
        { name: 'Curitiba', slug: 'curitiba', icon: <TreePine size={14} /> },
        { name: 'Recife', slug: 'recife', icon: <Anchor size={14} /> },
        { name: 'Goiânia', slug: 'goiania', icon: <Flower2 size={14} /> },
        { name: 'Porto Alegre', slug: 'porto-alegre', icon: <Wind size={14} /> },
        { name: 'Salvador', slug: 'salvador', icon: <Music size={14} /> },
        { name: 'Manaus', slug: 'manaus', icon: <Leaf size={14} /> },
    ];

    return (
        <footer className={`w-full pt-16 pb-8 border-t border-gray-100 ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-white text-gray-600'}`}>
            <div className="max-w-[1352px] mx-auto px-6">
                
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    
                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="w-40">
                            <LogoFauves width={160} className={isDark ? 'logo-fauves-white' : 'logo-fauves-mono'} />
                        </div>
                        <p className="text-sm leading-relaxed max-w-sm">
                            A Fauves é a plataforma completa para descoberta e gestão de eventos. 
                            Conectamos pessoas a experiências únicas através de tecnologia e conveniência.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://instagram.com/fauves" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-50 dark:bg-slate-900 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300">
                                <Instagram size={20} />
                            </a>
                            <a href="https://linkedin.com/company/fauves" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-50 dark:bg-slate-900 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300">
                                <Linkedin size={20} />
                            </a>
                            <a href="https://twitter.com/fauves" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gray-50 dark:bg-slate-900 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="space-y-6">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Institucional</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link to="/quem-somos" className="hover:text-orange-600 transition-colors">Quem Somos</Link></li>
                            <li><Link to="/jornada-produtor" className="hover:text-orange-600 transition-colors font-bold text-orange-600">Venda seus Ingressos</Link></li>
                            <li><Link to="/" className="hover:text-orange-600 transition-colors">Blog Fauves</Link></li>
                            <li><Link to="/carreiras" className="hover:text-orange-600 transition-colors">Carreiras</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Suporte</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link to="/ajuda" className="hover:text-orange-600 transition-colors">Central de Ajuda</Link></li>
                            <li><Link to="/ajuda/tickets/novo" className="hover:text-orange-600 transition-colors">Fale Conosco</Link></li>
                            <li><Link to="/ajuda" className="hover:text-orange-600 transition-colors">Trocas e Cancelamentos</Link></li>
                            <li>
                                <Link to="/ajuda/tickets/novo" className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-all w-fit">
                                    <MessageCircle size={16} />
                                    Suporte ao vivo
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>Legal</h3>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link to="/lei-da-meia-entrada" className="hover:text-orange-500 transition-colors">Lei da Meia-Entrada</Link></li>
                            <li><Link to="/termos-de-uso" className="hover:text-orange-500 transition-colors">Termos de Uso</Link></li>
                            <li><Link to="/politica-de-privacidade" className="hover:text-orange-500 transition-colors">Política de Privacidade</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Cities dynamic section - Focus on SEO */}
                <div className={`pt-12 pb-12 border-t border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#091747]'}`}>
                                <MapPin size={20} className="text-orange-600" />
                                O que fazer nas principais cidades
                            </h3>
                            <p className="text-sm mt-1">Encontre os melhores eventos próximos a você em todo o Brasil.</p>
                        </div>
                        <Link to="/search" className="text-orange-600 text-sm font-bold hover:underline flex items-center gap-1">
                            Ver todas as cidades
                            <ExternalLink size={14} />
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-8">
                        {cities.map((city) => (
                            <Link 
                                key={city.slug} 
                                to={`/o-que-fazer-em/${city.slug}`}
                                className="group flex items-center gap-3 text-sm hover:text-orange-600 transition-all"
                            >
                                <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'} group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors duration-300`}>
                                    {city.icon}
                                </span>
                                <span className="font-medium">{city.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500 font-medium">
                        © 2025 Fauves Plataforma de Eventos LTDA. 
                        <span className="mx-2 hidden md:inline">|</span>
                        <br className="md:hidden" />
                        CNPJ: 00.000.000/0000-00 
                    </p>
                    <div className="flex items-center gap-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                        <img src="https://logodownload.org/wp-content/uploads/2014/07/visa-logo-1.png" alt="Visa" className="h-4" />
                        <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo.png" alt="Mastercard" className="h-6" />
                        <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-logo-1.png" alt="Pix" className="h-4" />
                    </div>
                    <div className="text-xs text-gray-500 font-medium text-right">
                        Fortaleza - CE, Brasil
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
