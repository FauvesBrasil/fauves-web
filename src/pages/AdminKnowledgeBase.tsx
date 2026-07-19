import { Link } from 'react-router-dom';
import { BookOpen, FolderOpen, TrendingUp, Eye } from 'lucide-react';

const AdminKnowledgeBase = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Central de Ajuda</h1>
                <p className="text-sm text-slate-600">Gerencie categorias e artigos da base de conhecimento</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">0</div>
                            <div className="text-xs text-slate-600">Artigos Publicados</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FolderOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">0</div>
                            <div className="text-xs text-slate-600">Categorias</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Eye className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">0</div>
                            <div className="text-xs text-slate-600">Visualizações Totais</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to="/admin/helpdesk/knowledge-base/categories"
                    className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <FolderOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-slate-900 mb-1">
                                Gerenciar Categorias
                            </div>
                            <div className="text-sm text-slate-600">
                                Organize os artigos em categorias
                            </div>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/admin/helpdesk/knowledge-base/articles"
                    className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                            <BookOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-slate-900 mb-1">
                                Gerenciar Artigos
                            </div>
                            <div className="text-sm text-slate-600">
                                Crie e edite artigos de ajuda
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Popular Articles */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Artigos Mais Visualizados</h3>
                <div className="text-center py-8 text-slate-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhum artigo publicado ainda</p>
                </div>
            </div>
        </div>
    );
};

export default AdminKnowledgeBase;
