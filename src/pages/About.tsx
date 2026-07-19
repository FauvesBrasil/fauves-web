import React from 'react';
import AppShell from '@/components/AppShell';
import { Users, ShieldCheck, Zap, Rocket, Heart, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <AppShell>
            <div className="bg-white dark:bg-slate-950">
                
                {/* Hero Section */}
                <section className="relative py-24 px-6 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ff5a1f,transparent_70%)]" />
                    </div>
                    
                    <div className="max-w-[1352px] mx-auto text-center relative z-10">
                        <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider uppercase text-orange-600 bg-orange-50 dark:bg-orange-950/30 rounded-full">
                            Nossa Essência
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-[#091747] dark:text-white mb-8 leading-tight max-w-4xl mx-auto">
                            Conectando pessoas através de <span className="text-orange-600">experiências inesquecíveis</span>.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            A Fauves nasceu da paixão por eventos e da vontade de simplificar como as pessoas 
                            descobrem, vivem e gerenciam momentos únicos.
                        </p>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50">
                    <div className="max-w-[1352px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-[#091747] dark:text-white">Nossa Missão</h2>
                            <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
                                Democratizar o acesso à tecnologia para produtores de todos os tamanhos, 
                                enquanto oferecemos aos usuários a maneira mais fluida e segura de garantir sua presença 
                                nos melhores eventos do Brasil.
                            </p>
                            <div className="flex flex-col gap-4 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-orange-600">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Tecnologia de Ponta</h4>
                                        <p className="text-sm text-gray-500">Sistemas rápidos e intuitivos.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-orange-600">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Segurança Total</h4>
                                        <p className="text-sm text-gray-500">Transações e dados protegidos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-video bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-2xl overflow-hidden relative group">
                                <img 
                                    src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Events atmosphere" 
                                    className="w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-8 bottom-8">
                                    <p className="text-white font-bold text-xl italic leading-tight">
                                        "Não vendemos apenas ingressos, vendemos a entrada para novas histórias."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Grid */}
                <section className="py-24 px-6">
                    <div className="max-w-[1352px] mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-[#091747] dark:text-white mb-4">Nossos Valores</h2>
                            <p className="text-gray-500 max-w-xl mx-auto">O que nos guia todos os dias para entregar a melhor plataforma de eventos.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: <Users />, title: 'Comunidade', desc: 'Focamos nas pessoas que constroem a cultura.' },
                                { icon: <Rocket />, title: 'Inovação', desc: 'Sempre buscando novas formas de facilitar o acesso.' },
                                { icon: <Heart />, title: 'Paixão', desc: 'Amamos o que fazemos e a energia dos eventos.' },
                                { icon: <Globe />, title: 'Escalabilidade', desc: 'Prontos para conectar o Brasil inteiro.' }
                            ].map((value, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-900 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        {React.cloneElement(value.icon as React.ReactElement, { size: 28 })}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                                    <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{value.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-20 px-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-[#091747] dark:text-white mb-10">Nossa História</h2>
                        <div className="space-y-6 text-gray-600 dark:text-slate-400 text-lg leading-relaxed text-left">
                            <p>
                                A Fauves começou com uma percepção simples: a tecnologia para eventos deveria ser invisível. 
                                O foco deve estar na música, na arte, no encontro e na experiência — não na dificuldade de comprar um ingresso 
                                ou na burocracia de gerenciar uma bilheteria.
                            </p>
                            <p>
                                Deixando de ser apenas um sistema de vendas, evoluímos para um ecossistema completo que integra 
                                inteligência de dados para produtores e descoberta personalizada para os fãs. Hoje, somos 
                                a escolha de quem busca transparência, agilidade e resultados.
                            </p>
                            <p className="font-semibold text-[#091747] dark:text-orange-500">
                                Somos a Fauves. A gente se vê no evento.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-6 bg-orange-600 relative overflow-hidden">
                    <div className="max-w-[1352px] mx-auto text-center relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8">Pronto para a sua próxima experiência?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/" className="px-10 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all text-lg shadow-lg">
                                Explorar Eventos
                            </Link>
                            <Link to="/jornada-produtor" className="px-10 py-4 bg-[#091747] text-white font-bold rounded-xl hover:bg-[#0d1e5c] transition-all text-lg shadow-lg">
                                Sou um Produtor
                            </Link>
                        </div>
                    </div>
                    {/* Abstract circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#091747]/20 rounded-full -ml-24 -mb-24 blur-3xl" />
                </section>

            </div>
        </AppShell>
    );
};

export default About;
