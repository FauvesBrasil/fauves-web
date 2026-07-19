import React from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Users, 
  Ticket, 
  BarChart3, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HowItWorks = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,65,24,0.15),rgba(0,0,0,0))]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Vive o ritmo. <span className="text-[#EF4118]">Cria o teu.</span>
            </h1>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              A Fauves é a plataforma definitiva para transformar as tuas ideias em eventos memoráveis. Simples, potente e focada no que importa: a experiência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <Button size="lg" className="bg-[#EF4118] hover:bg-[#d13511] text-white px-8 rounded-full h-14 text-lg">
                  Criar meu Evento
                </Button>
              </Link>
              <Link to="/ajuda">
                <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-white/5 px-8 rounded-full h-14 text-lg bg-transparent">
                  Central de Ajuda
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* For Producers */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-card p-10 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-8">
                <Rocket className="text-[#EF4118] w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-6">Para Organizadores</h2>
              <ul className="space-y-4 mb-10">
                {[
                  'Criação intuitiva de eventos em minutos',
                  'Gestão financeira transparente e rápida',
                  'Dashboard completo com dados em tempo real',
                  'Ferramentas de marketing integradas'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground text-lg">
                    <Zap className="w-5 h-5 text-[#EF4118] mt-1 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/create">
                <Button variant="link" className="text-[#EF4118] p-0 h-auto text-lg font-bold group">
                  Começar agora <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* For Public */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-card p-10 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8">
                <Users className="text-blue-600 w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-6">Para o Público</h2>
              <ul className="space-y-4 mb-10">
                {[
                  'Descoberta personalizada de eventos',
                  'Compra segura e sem complicações',
                  'Acesso fácil aos ingressos no telemóvel',
                  'Suporte dedicado ao cliente'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground text-lg">
                    <Zap className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/">
                <Button variant="link" className="text-blue-600 p-0 h-auto text-lg font-bold group">
                  Explorar eventos <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">O Teu Sucesso em 3 Passos</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-8 h-8 text-[#EF4118]" />,
                title: 'Cadastra e Planeia',
                desc: 'Define o local, data e tipos de ingressos. Personaliza a página do teu evento.'
              },
              {
                icon: <Ticket className="w-8 h-8 text-[#EF4118]" />,
                title: 'Vende e Promove',
                desc: 'Usa os nossos links de rastreio e ferramentas de marketing para impulsionar as tuas vendas.'
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-[#EF4118]" />,
                title: 'Realiza e Lucra',
                desc: 'Faz o check-in na porta e recebe o teu pagamento de forma segura e rápida.'
              }
            ].map((step, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-background p-8 rounded-2xl border border-border relative"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#EF4118] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {i + 1}
                </div>
                <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/20 rounded-full flex items-center justify-center mx-auto mb-6 mt-2">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-[#EF4118] to-orange-400 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">
                Pronto para entrar no ritmo?
              </h2>
              <p className="text-xl text-orange-50 mb-12 max-w-2xl mx-auto">
                Junta-te a centenas de organizadores que já confiam na Fauves para elevar os seus eventos ao próximo nível.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center font-bold">
                <Link to="/create">
                  <Button size="lg" className="bg-white text-[#EF4118] hover:bg-orange-50 px-10 rounded-full h-16 text-xl shadow-xl hover:scale-105 transition-transform">
                    Criar meu Evento Gratis
                  </Button>
                </Link>
                <Link to="/ajuda/organizador" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <HelpCircle className="w-6 h-6" /> Suporte ao Organizador
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
