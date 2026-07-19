import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MultiStateButton } from './MultiStateButton';
import { fetchApi } from '@/lib/apiBase';

interface ForgotPasswordModalProps {
    open: boolean;
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!email || !email.includes('@')) {
            throw new Error('Email inválido');
        }

        const response = await fetchApi('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar email de recuperação');
        }

        setIsSubmitted(true);
        setTimeout(() => {
            onClose();
            setIsSubmitted(false);
            setEmail('');
        }, 3000);
    };

    const handleClose = () => {
        setIsSubmitted(false);
        setEmail('');
        onClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="relative w-[320px] sm:w-[480px] max-w-[95vw] bg-card dark:bg-[#0b0b0b] rounded-2xl shadow-brand-lg p-6 max-md:w-full max-md:h-full max-md:rounded-none max-md:flex max-md:flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-card-foreground dark:text-white">
                        {isSubmitted ? 'Email Enviado!' : 'Recuperar Senha'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground dark:text-slate-400 hover:bg-card dark:hover:bg-[#1a1a1a]"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSubmitted ? (
                    /* Success Message */
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">✓</span>
                        </div>
                        <p className="text-base text-foreground dark:text-zinc-300 mb-2">
                            Enviamos um link de recuperação para:
                        </p>
                        <p className="text-sm font-semibold text-card-foreground dark:text-white mb-4">
                            {email}
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">
                            Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                        </p>
                    </div>
                ) : (
                    /* Form */
                    <div>
                        <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6">
                            Digite seu email para receber um link de recuperação de senha.
                        </p>

                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 mb-6"
                            autoFocus
                        />

                        <MultiStateButton
                            type="submit"
                            onClick={handleSubmit}
                            idleText="Enviar Link"
                            loadingText="Enviando..."
                            successText="Enviado!"
                            errorText="Erro ao enviar"
                            className="w-full"
                        />

                        <p className="text-xs text-muted-foreground dark:text-slate-400 text-center mt-4">
                            Lembrou sua senha?{' '}
                            <button
                                onClick={handleClose}
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                            >
                                Voltar ao login
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
