import React from 'react';
import AppShell from '@/components/AppShell';
import { 
    Info, Users, GraduationCap, Heart, 
    Gem, FileText, CheckCircle2, ChevronRight, 
    AlertCircle, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HalfPriceLaw = () => {
    const categories = [
        {
            title: 'Estudantes',
            icon: <GraduationCap className="text-blue-500" />,
            description: 'Alunos da educação básica e superior (presencial ou EAD).',
            documents: ['Carteira de Identificação Estudantil (CIE) emitida pela ANPG, UNE, UBES ou entidades filiadas.', 'O modelo deve ser o padrão nacional, com certificação digital.'],
            law: 'Lei Federal 12.933/2013'
        },
        {
            title: 'Idosos',
            icon: <Users className="text-orange-500" />,
            description: 'Pessoas com idade igual ou superior a 60 anos.',
            documents: ['Documento de identidade oficial com foto (RG, CNH, Passaporte).', 'Apresentação obrigatória no momento da compra e do acesso ao evento.'],
            law: 'Lei Federal 10.741/2003 (Estatuto do Idoso)'
        },
        {
            title: 'Pessoas com Deficiência (PCD)',
            icon: <Heart className="text-red-500" />,
            description: 'E seus acompanhantes, quando necessário.',
            documents: ['Cartão de Benefício de Prestação Continuada (BPC).', 'Documento emitido pelo INSS que ateste a aposentadoria.', 'Laudo médico com CID (conforme decretos municipais/estaduais).'],
            law: 'Lei Federal 13.146/2015'
        },
        {
            title: 'Jovens de Baixa Renda',
            icon: <Gem className="text-green-500" />,
            description: 'Jovens de 15 a 29 anos inscritos no CadÚnico.',
            documents: ['Identidade Jovem (ID Jovem) acompanhada de documento de identidade oficial com foto.'],
            law: 'Lei Federal 12.852/2013'
        }
    ];

    const faqs = [
        {
            q: 'A meia-entrada vale para todos os setores?',
            a: 'Sim, a lei garante 40% do total de ingressos em todas as categorias (pista, cadeira, camarote, etc.), exceto em serviços de camarotes com "Open Bar/Food", onde a meia incide apenas sobre o valor do ingresso.'
        },
        {
            q: 'Posso comprar com boleto ou cartão de terceiros?',
            a: 'O benefício é pessoal e intransferível. A comprovação do direito deve ser feita pelo titular do benefício no momento da compra (se presencial) e obrigatoriamente no acesso ao evento.'
        },
        {
            q: 'Documentos digitais são aceitos?',
            a: 'Sim, desde que emitidos por órgãos oficiais e possuam mecanismos de validação (como QR Code) previstos em lei.'
        }
    ];

    return (
        <AppShell>
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
                
                {/* Hero Section */}
                <section className="bg-[#091747] text-white py-20 px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 text-orange-400 text-sm font-bold animate-fade-in">
                            <Info size={16} />
                            Informativo Oficial
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                            Lei da <span className="text-orange-500">Meia-Entrada</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            A Fauves garante o cumprimento integral das legislações federais, estaduais e municipais vigentes. 
                            Confira quem tem direito e como comprovar.
                        </p>
                    </div>
                </section>

                <div className="max-w-5xl mx-auto px-6 -mt-10 pb-24">
                    
                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                        {categories.map((cat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                                        {React.cloneElement(cat.icon as React.ReactElement, { size: 32 })}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#091747] dark:text-white leading-tight">{cat.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">{cat.law}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 dark:text-slate-300 mb-6 font-medium">
                                    {cat.description}
                                </p>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#091747] dark:text-slate-500">Comprovação Necessária:</h4>
                                    <ul className="space-y-3">
                                        {cat.documents.map((doc, j) => (
                                            <li key={j} className="flex gap-3 text-sm text-gray-500 dark:text-slate-400">
                                                <div className="min-w-[20px] pt-0.5">
                                                    <CheckCircle2 size={16} className="text-green-500" />
                                                </div>
                                                {doc}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legal Context */}
                    <section className="bg-orange-50 dark:bg-orange-950/20 rounded-[40px] p-8 md:p-12 mb-16 border border-orange-100 dark:border-orange-900/30">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="p-3 bg-orange-600 w-fit rounded-2xl text-white">
                                    <FileText size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-[#091747] dark:text-white leading-tight">Legislação de Referência</h2>
                                <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                                    A cota de 40% de ingressos destinados à meia-entrada é regida nacionalmente, 
                                    porém leis estaduais e municipais podem ampliar o benefício (ex: Doadores de Sangue, Professores).
                                </p>
                                <div className="flex flex-wrap gap-3 pt-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold text-gray-700 dark:text-slate-200 border border-orange-100 dark:border-orange-900/30">
                                        Lei Federal 12.933/2013
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold text-gray-700 dark:text-slate-200 border border-orange-100 dark:border-orange-900/30">
                                        Decreto 8.537/2015
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl space-y-4 border border-orange-100 dark:border-orange-900/30">
                                <AlertCircle className="text-orange-600 mb-2" size={32} />
                                <h3 className="text-xl font-bold text-[#091747] dark:text-white">Atenção ao Acesso</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                                    A falsificação de documentos é crime previsto no Artigo 298 do Código Penal Brasileiro. 
                                    A Fauves e os produtores de eventos reservam-se o direito de recusar o acesso caso o documento 
                                    não seja apresentado ou seja inválido.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <div className="max-w-3xl mx-auto space-y-8">
                        <h2 className="text-2xl font-black text-center text-[#091747] dark:text-white underline decoration-orange-500 decoration-4 underline-offset-8">Dúvidas Frequentes</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                                    <h4 className="font-bold text-[#091747] dark:text-white mb-2 flex items-center justify-between">
                                        {faq.q}
                                        <ChevronRight size={18} className="text-orange-500" />
                                    </h4>
                                    <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                                        {faq.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Link */}
                    <div className="mt-20 text-center">
                        <p className="text-gray-500 mb-6">Ainda tem dúvidas sobre o seu benefício?</p>
                        <Link 
                            to="/ajuda" 
                            className="inline-flex items-center gap-2 text-orange-600 font-bold hover:gap-4 transition-all"
                        >
                            Acesse nossa Central de Ajuda
                            <ExternalLink size={18} />
                        </Link>
                    </div>

                </div>
            </div>
        </AppShell>
    );
};

export default HalfPriceLaw;
