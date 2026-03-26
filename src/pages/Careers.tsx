import React from 'react';
import AppShell from '@/components/AppShell';
import { 
    Briefcase, Coffee, Monitor, Globe, 
    Star, ArrowRight, Code, Palette, 
    Megaphone, CheckCircle2, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

import heroImage from '../assets/sYaqnAulNpthnSGgV4i6ZjOE2XQ.avif';

const Careers = () => {
    const departments = [
        {
            name: 'Engenharia & Produto',
            icon: <Code className="text-blue-500" />,
            roles: ['Senior Fullstack Developer', 'Product Designer (UI/UX)', 'QA Engineer']
        },
        {
            name: 'Marketing & Growth',
            icon: <Megaphone className="text-orange-500" />,
            roles: ['Community Manager', 'Performance Specialist']
        },
        {
            name: 'Operações & Suporte',
            icon: <Briefcase className="text-green-500" />,
            roles: ['Customer Success Specialist', 'SDR - Sales Development']
        }
    ];

    const benefits = [
        { icon: <Monitor size={20} />, title: 'Remote First', desc: 'Trabalhe de onde preferir, com flexibilidade total.' },
        { icon: <Coffee size={20} />, title: 'Cultura Ágil', desc: 'Processos leves e foco em resultados reais.' },
        { icon: <Star size={20} />, title: 'Stock Options', desc: 'Seja dono de uma parte do que estamos construindo.' },
        { icon: <Globe size={20} />, title: 'Impacto Real', desc: 'Suas ideias chegam a milhares de usuários.' }
    ];

    return (
        <AppShell>
            <div className="bg-white dark:bg-slate-950">
                
                {/* Hero Section */}
                <section className="relative min-h-[700px] flex items-center py-24 px-6 overflow-hidden">
                    {/* Background Image with Gradient Overlay */}
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={heroImage} 
                            alt="Fauves Culture" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#091747] via-[#091747]/60 to-transparent" />
                        <div className="absolute inset-0 bg-[#091747]/20" />
                    </div>
                    
                    <div className="max-w-[1352px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                        <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                            <h1 className="text-4xl md:text-7xl font-black leading-tight text-white">
                                Transforme o <span className="text-orange-500">entretenimento</span> conosco.
                            </h1>
                            <p className="text-lg md:text-xl text-slate-300 max-w-xl leading-relaxed">
                                Estamos construindo a próxima geração da economia de eventos no Brasil. 
                                Buscamos pessoas inquietas, criativas e que amam resolver problemas complexos.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="#vagas" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all text-lg shadow-lg">
                                    Ver Vagas Abertas
                                    <ArrowRight size={20} />
                                </a>
                                <div className="flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                                    <Users size={20} className="text-orange-500" />
                                    <span className="text-sm font-medium text-slate-200">Time Remote-first mundial</span>
                                </div>
                            </div>
                        </div>

                        {/* Visual balance on the right - Stats grid as in version 1 but glassmorphic */}
                        <div className="hidden lg:grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right duration-1000">
                            <div className="space-y-4 pt-12">
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                                    <p className="text-3xl font-bold text-white">100%</p>
                                    <p className="text-sm text-slate-400 font-medium">Remote-First</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                                    <p className="text-3xl font-bold text-white">+50k</p>
                                    <p className="text-sm text-slate-400 font-medium">Ingressos/Mês</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-orange-600 p-8 rounded-2xl shadow-2xl flex flex-col justify-end min-h-[160px]">
                                    <p className="text-3xl font-bold text-white">Agi</p>
                                    <p className="text-sm text-white/80 font-medium">Metodologia Ágil</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                                    <p className="text-3xl font-bold text-white">Focus</p>
                                    <p className="text-sm text-slate-400 font-medium">Cultura de Produto</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-10 left-10 animate-bounce opacity-30">
                        <div className="w-1 h-12 bg-gradient-to-b from-white to-transparent rounded-full" />
                    </div>
                </section>

                {/* Benefits */}
                <section className="py-24 px-6 border-b border-gray-100 dark:border-slate-800">
                    <div className="max-w-[1352px] mx-auto text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#091747] dark:text-white mb-4">Por que trabalhar na Fauves?</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Criamos um ambiente onde você tem autonomia para criar e espaço para crescer.</p>
                    </div>
                    
                    <div className="max-w-[1352px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex flex-col items-center text-center space-y-4 group">
                                <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                                    {b.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{b.title}</h3>
                                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Open Roles */}
                <section id="vagas" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
                    <div className="max-w-[1352px] mx-auto">
                        <div className="mb-16">
                            <h2 className="text-3xl font-bold text-[#091747] dark:text-white mb-2 text-center lg:text-left">Canteiros de Obras</h2>
                            <p className="text-gray-500 text-center lg:text-left">Selecione uma área para ver as posições disponíveis.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {departments.map((dept, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                            {React.cloneElement(dept.icon as React.ReactElement, { size: 24 })}
                                        </div>
                                        <h3 className="text-xl font-bold text-[#091747] dark:text-white">{dept.name}</h3>
                                    </div>
                                    <ul className="space-y-4">
                                        {dept.roles.map((role, j) => (
                                            <li key={j}>
                                                <button className="w-full text-left p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-900 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-all group flex items-center justify-between">
                                                    <span className="font-semibold text-gray-700 dark:text-slate-300 group-hover:text-orange-600">{role}</span>
                                                    <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 p-10 bg-[#091747] rounded-3xl text-center text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Não encontrou a sua vaga?</h3>
                                <p className="text-slate-300 mb-8 max-w-xl mx-auto">Sempre queremos conhecer pessoas boas. Mande seu currículo para nosso Banco de Talentos!</p>
                                <button className="px-8 py-3 bg-white text-[#091747] font-bold rounded-xl hover:bg-gray-100 transition-all">
                                    Candidatura Espontânea
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        </div>
                    </div>
                </section>

                {/* Hiring Process */}
                <section className="py-24 px-6">
                    <div className="max-w-[1352px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-3xl font-bold text-[#091747] dark:text-white">Como é o nosso processo?</h2>
                            <div className="space-y-6">
                                {[
                                    { step: '01', title: 'Triagem e Contato', desc: 'Analisamos seu perfil e entramos em contato para um papo inicial.' },
                                    { step: '02', title: 'Entrevista Técnica/Prática', desc: 'Hora de mostrar suas habilidades em um desafio ou conversa técnica.' },
                                    { step: '03', title: 'Papo com Liderança', desc: 'Alinhamento de cultura e expectativas com quem toca o dia a dia.' },
                                    { step: '04', title: 'Proposta e Onboarding', desc: 'Se rolar o match, você recebe nossa proposta e começa sua jornada!' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <span className="text-2xl font-black text-orange-200 dark:text-orange-950/40 tabular-nums leading-none pt-1">{item.step}</span>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-[40px] relative">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center shadow-xl rotate-12">
                                <span className="text-white text-xs font-black uppercase text-center leading-tight">Join the<br />Pride</span>
                            </div>
                            <h3 className="text-2xl font-bold text-[#091747] dark:text-white mb-6">Pronto para rugir?</h3>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-gray-600 dark:text-slate-300">
                                    <CheckCircle2 className="text-orange-600" size={18} />
                                    Ambiente de alto crescimento
                                </li>
                                <li className="flex items-center gap-3 text-gray-600 dark:text-slate-300">
                                    <CheckCircle2 className="text-orange-600" size={18} />
                                    Autonomia e voz ativa
                                </li>
                                <li className="flex items-center gap-3 text-gray-600 dark:text-slate-300">
                                    <CheckCircle2 className="text-orange-600" size={18} />
                                    Sem burocracias inúteis
                                </li>
                            </ul>
                            <Link to="/" className="block w-full text-center py-4 bg-[#091747] dark:bg-white dark:text-[#091747] text-white font-bold rounded-2xl hover:brightness-110 transition-all">
                                Voltar para o Início
                            </Link>
                        </div>
                    </div>
                </section>

            </div>
        </AppShell>
    );
};

export default Careers;
