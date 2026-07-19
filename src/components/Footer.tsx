import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import { 
    Instagram, Linkedin, Twitter, MessageCircle, 
    MapPin, ExternalLink, Building2, Palmtree, 
    Sun, Mountain, TreePine, Anchor, Flower2, 
    Wind, Music, Leaf,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const Footer: React.FC = () => {
    const { isDark } = useTheme();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const toggleSection = (id: string) => {
        setOpenSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

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

    const FooterSection = ({ title, id, children }: { title: string, id: string, children: React.ReactNode }) => {
        const isOpen = openSections[id];
        return (
            <div className="space-y-4 md:space-y-6">
                <button 
                    onClick={() => toggleSection(id)}
                    className="flex items-center justify-between w-full md:cursor-default md:pointer-events-none group"
                >
                    <h3 className={`text-sm font-black uppercase tracking-[0.15em] ${isDark ? 'text-white' : 'text-[#091747]'}`}>
                        {title}
                    </h3>
                    <div className="md:hidden">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </button>
                <div className={`${isOpen ? 'block' : 'hidden md:block'} animate-in fade-in slide-in-from-top-2 duration-300`}>
                    <ul className="space-y-4 text-sm font-bold">
                        {children}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <footer className={`w-full pt-16 pb-12 border-t border-gray-100 dark:border-[#1A1A1A] ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-white text-gray-500'}`}>
            <div className="max-w-[1352px] mx-auto px-6">
                
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    
                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="w-40">
                            <LogoFauves width={160} className={isDark ? 'logo-fauves-white' : 'logo-fauves-mono'} />
                        </div>
                        <p className="text-sm leading-relaxed max-w-sm font-semibold italic opacity-80">
                            A Fauves é a plataforma completa para descoberta e gestão de eventos. 
                            Conectamos pessoas a experiências únicas através de tecnologia e conveniência.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Instagram, Linkedin, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className={`p-3 rounded-2xl ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-[#091747]'} hover:bg-orange-500 hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm`}>
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns with Accordion (Mobile) */}
                    <FooterSection title="Institucional" id="inst">
                        <li><Link to="/quem-somos" className="hover:text-orange-600 transition-colors">Quem Somos</Link></li>
                        <li><Link to="/create" className="text-[#2A2AD7] font-black hover:underline">Venda seus Ingressos</Link></li>
                        <li><Link to="/" className="hover:text-orange-600 transition-colors">Blog Fauves</Link></li>
                        <li><Link to="/carreiras" className="hover:text-orange-600 transition-colors">Carreiras</Link></li>
                    </FooterSection>

                    <FooterSection title="Suporte" id="sup">
                        <li><Link to="/ajuda" className="hover:text-orange-600 transition-colors">Central de Ajuda</Link></li>
                        <li><Link to="/ajuda/tickets/novo" className="hover:text-orange-600 transition-colors">Fale Conosco</Link></li>
                        <li><Link to="/ajuda" className="hover:text-orange-600 transition-colors">Trocas e Cancelamentos</Link></li>
                        <li className="pt-2">
                            <Link to="/ajuda/tickets/novo" className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2A2AD7] text-white rounded-full font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                                <MessageCircle size={16} /> Suporte ao vivo
                            </Link>
                        </li>
                    </FooterSection>

                    <FooterSection title="Legal" id="legal">
                        <li><Link to="/lei-da-meia-entrada" className="hover:text-orange-500 transition-colors">Lei da Meia-Entrada</Link></li>
                        <li><Link to="/termos-de-uso" className="hover:text-orange-500 transition-colors">Termos de Uso</Link></li>
                        <li><Link to="/politica-de-privacidade" className="hover:text-orange-500 transition-colors">Política de Privacidade</Link></li>
                    </FooterSection>
                </div>

                {/* Cities dynamic section */}
                <div className={`pt-12 pb-12 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h3 className={`text-xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#091747]'}`}>
                                <MapPin size={22} className="text-orange-600" />
                                Estaremos lá também
                            </h3>
                            <p className="text-sm font-bold text-gray-400 mt-1">Descubra o melhor da sua cidade com a Fauves.</p>
                        </div>
                        <Link to="/search" className="text-orange-600 text-sm font-black hover:underline flex items-center gap-1.5 uppercase tracking-wider bg-orange-50 dark:bg-orange-950/20 px-4 py-2 rounded-full">
                            Tudo <ArrowRight size={14} />
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-8">
                        {cities.map((city) => (
                            <Link 
                                key={city.slug} 
                                to={`/${city.slug}`}
                                className="group flex items-center gap-4 text-sm hover:text-orange-600 transition-all"
                            >
                                <span className={`flex items-center justify-center w-11 h-11 rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-gray-50'} group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm`}>
                                    {city.icon}
                                </span>
                                <span className="font-bold tracking-tight">{city.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="pt-12 border-t border-gray-100 dark:border-[#1A1A1A] flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center md:text-left">
                            © 2025 Fauves Entretenimento LTDA • CNPJ 00.000.000/0000-00
                        </p>
                        <div className="flex items-center gap-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                            {['visa', 'mastercard', 'pix'].map(pay => (
                                <img key={pay} src={`https://img.icons8.com/color/48/${pay}.png`} alt={pay} className="h-6" />
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 py-2 bg-gray-50 dark:bg-slate-900 rounded-full">
                         Brasil <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Fortaleza, CE
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Auxiliary Arrow component if not imported
const ArrowRight = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

export default Footer;
