import React from 'react';
import AppShell from '@/components/AppShell';
import { 
    Lock, Eye, Database, Share2, 
    UserCheck, ShieldAlert, Mail, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    const sections = [
        {
            title: '1. Compromisso com a Privacidade',
            icon: <Lock className="text-blue-500" />,
            content: 'Na Fauves, a privacidade e a segurança dos seus dados são prioridades absolutas. Esta política explica como coletamos, usamos e protegemos suas informações de acordo com a LGPD.'
        },
        {
            title: '2. Dados que Coletamos',
            icon: <Database className="text-orange-500" />,
            content: 'Coletamos informações necessárias para a emissão de ingressos e prevenção de fraudes, incluindo: nome completo, e-mail, telefone, CPF e dados de navegação (cookies).'
        },
        {
            title: '3. Finalidade do Tratamento',
            icon: <Eye className="text-green-500" />,
            content: 'Seus dados são utilizados para: processar pagamentos, enviar seus ingressos, fornecer suporte ao cliente e enviar comunicações de marketing (apenas se você autorizar).'
        },
        {
            title: '4. Compartilhamento de Dados',
            icon: <Share2 className="text-indigo-500" />,
            content: 'Compartilhamos dados essenciais com os Organizadores dos eventos para controle de acesso. Também compartilhamos com processadores de pagamento e autoridades legais, quando exigido.'
        },
        {
            title: '5. Seus Direitos (LGPD)',
            icon: <UserCheck className="text-red-500" />,
            content: 'Você tem direito de acessar, corrigir, anonimizar ou excluir seus dados a qualquer momento. Também pode revogar seu consentimento para comunicações de marketing.'
        },
        {
            title: '6. Segurança das Informações',
            icon: <ShieldAlert className="text-yellow-600" />,
            content: 'Utilizamos criptografia (SSL), firewalls e práticas rigorosas de segurança para impedir acessos não autorizados e garantir a integridade dos seus dados.'
        }
    ];

    return (
        <AppShell>
            <div className="bg-white dark:bg-slate-950 min-h-screen pb-24">
                
                {/* Hero Header */}
                <header className="bg-slate-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 py-20 px-6">
                    <div className="max-w-[1352px] mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-500/20">
                            <Lock size={14} />
                            Proteção de Dados (LGPD)
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-[#091747] dark:text-white mb-6 tracking-tight">
                            Política de <span className="text-blue-600 underline decoration-slate-200 decoration-4 underline-offset-8">Privacidade</span>
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                            Saiba como cuidamos das suas informações com transparência e segurança. 
                            Última atualização: Março de 2026.
                        </p>
                    </div>
                </header>

                <div className="max-w-[1352px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
                    
                    {/* Navigation Sidebar (Desktop) */}
                    <aside className="hidden lg:block lg:col-span-3 sticky top-24 h-fit">
                        <nav className="space-y-1">
                            {sections.map((s, i) => (
                                <a 
                                    key={i} 
                                    href={`#policy-section-${i}`}
                                    className="block p-4 rounded-xl text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border border-transparent hover:border-slate-100"
                                >
                                    {s.title}
                                </a>
                            ))}
                        </nav>
                        
                        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                                <ShieldAlert size={16} />
                                Dados Seguros
                            </h4>
                            <p className="text-xs text-blue-700 dark:text-blue-500 leading-relaxed mb-4">
                                Se tiver qualquer dúvida sobre privacidade, entre em contato com nosso DPO.
                            </p>
                            <a href="mailto:privacidade@fauves.com" className="text-xs font-black uppercase tracking-widest text-[#091747] dark:text-white hover:underline flex items-center gap-2">
                                <Mail size={12} />
                                Enviar E-mail
                            </a>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-9 space-y-12">
                        {sections.map((s, i) => (
                            <section key={i} id={`#policy-section-${i}`} className="scroll-mt-24 group">
                                <div className="flex items-start gap-6">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        {React.cloneElement(s.icon as React.ReactElement, { size: 28 })}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-[#091747] dark:text-white mb-4">
                                            {s.title}
                                        </h2>
                                        <div className="prose prose-slate dark:prose-invert max-w-none">
                                            <p className="text-gray-600 dark:text-slate-400 leading-loose text-lg">
                                                {s.content}
                                            </p>
                                            <div className="h-px bg-gradient-to-r from-gray-100 to-transparent dark:from-slate-800 mt-8" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}

                        <div className="bg-blue-600 rounded-[2rem] p-10 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Gerencie seu Consentimento</h3>
                                <p className="text-blue-100 mb-8 max-w-2xl text-lg">
                                    Você pode ajustar suas preferências de privacidade e marketing a qualquer momento nas 
                                    configurações do seu perfil ou seguindo as instruções em nossos e-mails.
                                </p>
                                <Link to="/profile" className="inline-flex items-center gap-2 px-8 py-4 bg-[#091747] text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg">
                                    Meu Perfil
                                    <ArrowRight size={20} />
                                </Link>
                            </div>
                            <Lock className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 rotate-12" />
                        </div>
                    </main>

                </div>
            </div>
        </AppShell>
    );
};

export default PrivacyPolicy;
