import React from 'react';
import AppShell from '@/components/AppShell';
import { 
    ShieldCheck, Scale, CreditCard, RefreshCcw, 
    UserCheck, AlertTriangle, HelpCircle, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfUse = () => {
    const sections = [
        {
            title: '1. Objeto e Aceitação',
            icon: <ShieldCheck className="text-blue-500" />,
            content: 'Estes Termos de Uso regem a utilização da plataforma Fauves para venda e gerenciamento de ingressos. Ao utilizar nossos serviços, você concorda integralmente com estas condições.'
        },
        {
            title: '2. Cadastro de Usuário',
            icon: <UserCheck className="text-orange-500" />,
            content: 'Para adquirir ingressos, o usuário deve ser maior de idade e fornecer dados verídicos. A segurança da senha é de inteira responsabilidade do usuário.'
        },
        {
            title: '3. Compra e Pagamento',
            icon: <CreditCard className="text-green-500" />,
            content: 'As compras são processadas por parceiros de pagamento. A Fauves cobra uma taxa de conveniência que é claramente discriminada antes da finalização do pedido.'
        },
        {
            title: '4. Cancelamentos e Reembolsos',
            icon: <RefreshCcw className="text-red-500" />,
            content: 'Conforme o Código de Defesa do Consumidor, o arrependimento pode ser exercido em até 7 dias após a compra, desde que em até 48h antes do início do evento.'
        },
        {
            title: '5. Responsabilidade da Plataforma',
            icon: <Scale className="text-indigo-500" />,
            content: 'A Fauves atua como intermediária entre o Produtor e o Consumidor. A realização, qualidade e segurança do evento são de responsabilidade exclusiva do Organizador.'
        },
        {
            title: '6. Propriedade Intelectual',
            icon: <AlertTriangle className="text-yellow-600" />,
            content: 'Todo o conteúdo da plataforma (logos, textos, software) é de propriedade da Fauves ou de seus licenciadores, sendo proibida a reprodução sem autorização.'
        }
    ];

    return (
        <AppShell>
            <div className="bg-white dark:bg-slate-950 min-h-screen pb-24">
                
                {/* Hero Header */}
                <header className="bg-slate-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 py-20 px-6">
                    <div className="max-w-[1352px] mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-black text-[#091747] dark:text-white mb-6 tracking-tight">
                            Termos de <span className="text-orange-500 underline decoration-slate-200 decoration-4 underline-offset-8">Uso</span>
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                            Leia com atenção as regras de utilização da plataforma Fauves. 
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
                                    href={`#section-${i}`}
                                    className="block p-4 rounded-xl text-sm font-bold text-gray-500 hover:text-[#091747] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border border-transparent hover:border-slate-100"
                                >
                                    {s.title}
                                </a>
                            ))}
                        </nav>
                        
                        <div className="mt-8 p-6 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                            <h4 className="font-bold text-orange-800 dark:text-orange-400 mb-2 flex items-center gap-2">
                                <HelpCircle size={16} />
                                Precisa de ajuda?
                            </h4>
                            <p className="text-xs text-orange-700 dark:text-orange-500 leading-relaxed mb-4">
                                Se tiver dúvidas sobre os termos, entre em contato com nosso jurídico.
                            </p>
                            <Link to="/ajuda" className="text-xs font-black uppercase tracking-widest text-[#091747] dark:text-white hover:underline">
                                Central de Suporte
                            </Link>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-9 space-y-12">
                        {sections.map((s, i) => (
                            <section key={i} id={`#section-${i}`} className="scroll-mt-24 group">
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

                        <div className="bg-[#091747] rounded-[2rem] p-10 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Aceitação dos Termos</h3>
                                <p className="text-slate-300 mb-8 max-w-2xl">
                                    Ao clicar em "Comprar" ou criar uma conta em nossa plataforma, você confirma que leu 
                                    e aceita integralmente todos os termos acima descritos.
                                </p>
                                <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg">
                                    Conhecer Eventos
                                    <ArrowRight size={20} />
                                </Link>
                            </div>
                            <ShieldCheck className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12" />
                        </div>
                    </main>

                </div>
            </div>
        </AppShell>
    );
};

export default TermsOfUse;
