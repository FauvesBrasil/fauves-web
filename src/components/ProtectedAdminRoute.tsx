import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

interface ProtectedAdminRouteProps {
    children: ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!user || !user.isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
                    <p className="text-slate-600 mb-6">Você precisa ser administrador para acessar esta área.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
