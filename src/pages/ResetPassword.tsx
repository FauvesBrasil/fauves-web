import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { MultiStateButton } from '@/components/MultiStateButton';
import { fetchApi } from '@/lib/apiBase';
import LogoSquare from '@/assets/logo-square-fauves.svg?react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Token inválido. Por favor, solicite um novo link de recuperação.');
        }
    }, [token]);

    const handleSubmit = async () => {
        setError(null);

        // Validation
        if (!newPassword || newPassword.length < 8) {
            throw new Error('A senha deve ter pelo menos 8 caracteres');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('As senhas não coincidem');
        }

        if (!token) {
            throw new Error('Token inválido');
        }

        // Submit to backend
        const response = await fetchApi('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Token inválido ou expirado');
        }

        setSuccess(true);

        // Redirect to home after 2 seconds
        setTimeout(() => {
            navigate('/');
        }, 2000);
    };

    return (
        <AppShell hideSearchOnMobile>
            <div className="min-h-screen flex items-center justify-center px-4 bg-background py-12">
                <div className="w-full max-w-md">
                    <div className="bg-card dark:bg-[#0b0b0b] rounded-2xl shadow-brand-lg p-8">
                        {/* Logo */}
                        <div className="flex flex-col items-center mb-8">
                            <LogoSquare className="w-16 h-16 mb-4" />
                            <h1 className="text-2xl font-bold text-card-foreground dark:text-white text-center">
                                {success ? 'Senha Redefinida!' : 'Nova Senha'}
                            </h1>
                            <p className="text-sm text-muted-foreground dark:text-slate-400 text-center mt-2">
                                {success
                                    ? 'Sua senha foi atualizada com sucesso'
                                    : 'Digite sua nova senha abaixo'}
                            </p>
                        </div>

                        {success ? (
                            /* Success State */
                            <div className="flex flex-col items-center py-6">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-4xl">✓</span>
                                </div>
                                <p className="text-center text-foreground dark:text-zinc-300 mb-4">
                                    Você será redirecionado para a página inicial...
                                </p>
                            </div>
                        ) : error ? (
                            /* Error State */
                            <div className="flex flex-col items-center py-6">
                                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-4xl">✕</span>
                                </div>
                                <p className="text-center text-red-600 dark:text-red-400 mb-4">
                                    {error}
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                                >
                                    Voltar ao início
                                </button>
                            </div>
                        ) : (
                            /* Form */
                            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
                                {/* New Password */}
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Nova senha"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 pr-10"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    >
                                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>

                                {/* Confirm Password */}
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Confirmar nova senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full border border-border dark:border-[#1F1F1F] bg-input dark:bg-[#242424] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 rounded-lg px-3 py-3 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                                        aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                                    >
                                        {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>

                                {/* Password Strength Hint */}
                                <p className="text-xs text-muted-foreground dark:text-slate-400">
                                    Use no mínimo 8 caracteres. Recomendamos incluir letras, números e símbolos.
                                </p>

                                {/* Submit Button */}
                                <MultiStateButton
                                    type="submit"
                                    onClick={handleSubmit}
                                    idleText="Redefinir Senha"
                                    loadingText="Salvando..."
                                    successText="Senha Salva!"
                                    errorText="Erro"
                                    className="w-full mt-6"
                                />
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

export default ResetPassword;
