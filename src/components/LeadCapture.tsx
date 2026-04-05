import React, { useState } from 'react';
import { fetchApi } from '@/lib/apiBase';
import { CheckCircle2, Mail, Send } from 'lucide-react';

interface LeadCaptureProps {
  source?: string;
  title?: string;
  subtitle?: string;
}

const LeadCapture: React.FC<LeadCaptureProps> = ({ 
  source = 'home',
  title = "Não perca os melhores eventos",
  subtitle = "Receba novidades e eventos direto no seu WhatsApp ou email"
}) => {
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const isPhoneNumber = (val: string) => {
    const raw = val.replace(/\D/g, '');
    return raw.length > 0 && /^\d+$/.test(raw) && !val.includes('@');
  };

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length <= 10) {
      return raw.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
               .replace(/(\d{2})(\d{4})/, '($1) $2')
               .replace(/(\d{2})/, '($1');
    }
    return raw.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
             .replace(/(\d{2})(\d{5})/, '($1) $2')
             .replace(/(\d{2})/, '($1');
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const raw = val.replace(/\D/g, '');
    
    // If it looks like a phone number (start with digits and no @)
    if (raw.length > 0 && !val.includes('@') && /^\d/.test(val.replace(/[()-\s]/g, ''))) {
      val = formatPhone(val);
      if (val.length > 15) val = val.substring(0, 15);
    }
    
    setContact(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;

    // Check localStorage
    const lastSubmit = localStorage.getItem(`fauves_lead_submit_${source}`);
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < 24 * 60 * 60 * 1000) {
       setStatus('success');
       setMessage('Você já está cadastrado para receber alertas!');
       return;
    }

    setStatus('loading');
    try {
      const res = await fetchApi('/api/event-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim(), source })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao cadastrar');
      }

      setStatus('success');
      setMessage('Cadastro realizado com sucesso! Em breve você receberá as novidades.');
      localStorage.setItem(`fauves_lead_submit_${source}`, Date.now().toString());
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Ocorreu um erro. Tente novamente.');
    }
  };

  if (status === 'success') {
    return (
      <div className="w-full max-w-[1352px] mx-auto px-[156px] py-12 max-md:px-5 max-sm:px-4">
        <div className="bg-gradient-to-r from-[#2A2AD7] to-[#FF3F00] rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <CheckCircle2 size={64} className="text-white animate-bounce mb-2" />
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{message}</h2>
          </div>
        </div>
      </div>
    );
  }

  const showPhoneIcon = isPhoneNumber(contact);

  return (
    <div className="w-full max-w-[1352px] mx-auto px-[156px] py-12 max-md:px-5 max-sm:px-4">
      <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 rounded-3xl p-12 max-md:p-8 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
        {/* Background accent */}
        <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-[#2A2AD7]/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-[#2A2AD7]/10 transition-colors"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-[400px] h-[400px] bg-[#FF3F00]/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#FF3F00]/10 transition-colors"></div>

        <div className="flex-1 relative z-10 text-left">
          <h2 className="text-4xl max-md:text-3xl font-black text-[#091747] dark:text-white uppercase tracking-tighter leading-tight mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
            {subtitle}
          </p>
        </div>

        <div className="w-full max-w-[460px] relative z-10">
          <form onSubmit={handleSubmit} className="relative flex flex-col gap-3">
            <div className="relative">
              {showPhoneIcon ? (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in duration-300">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
              ) : (
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 animate-in zoom-in duration-300" size={20} />
              )}
              <input
                type="text"
                placeholder="E-mail ou WhatsApp"
                value={contact}
                onChange={handleContactChange}
                required
                disabled={status === 'loading'}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-5 pl-12 pr-4 text-lg focus:outline-none focus:ring-4 focus:ring-[#2A2AD7]/20 transition-all font-semibold"
              />
            </div>
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-gradient-to-r from-[#2A2AD7] to-[#4F46E5] text-white py-5 rounded-2xl text-lg font-black uppercase tracking-widest shadow-lg shadow-[#2A2AD7]/30 hover:shadow-[#2A2AD7]/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
            >
              {status === 'loading' ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Quero receber</span>
                  <Send size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            {status === 'error' && (
              <p className="text-red-500 text-sm font-bold mt-2 text-center">{message}</p>
            )}
          </form>
          <p className="text-[10px] text-gray-400 mt-4 text-center dark:text-gray-500 uppercase tracking-widest font-bold">
            🔒 Seus dados estão seguros conosco. Não enviamos spam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadCapture;
