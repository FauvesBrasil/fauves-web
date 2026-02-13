import { useState, useEffect } from 'react';
import { Plus, Edit2, Check, X, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getApiBase } from '@/lib/apiBase';

interface EmailTemplate {
    id: string;
    slug: string;
    subject: string;
    active: boolean;
    updatedAt: string;
}

export default function AdminEmails() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${getApiBase()}/api/admin/emails/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (e) {
            console.error('Failed to fetch templates', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando templates...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Templates de Email</h1>
                    <p className="text-slate-500 mt-2">Gerencie os emails transacionais do sistema.</p>
                </div>
                <Button onClick={() => navigate('/admin/emails/new')} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Template
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Templates Cadastrados</CardTitle>
                    <CardDescription>
                        Lista de todos os templates de email ativos e inativos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Slug (Identificador)</TableHead>
                                <TableHead>Assunto</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Última Atualização</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium font-mono text-xs">{template.slug}</TableCell>
                                    <TableCell>{template.subject}</TableCell>
                                    <TableCell>
                                        <Badge variant={template.active ? 'default' : 'secondary'} className={template.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                                            {template.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-sm">
                                        {new Date(template.updatedAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/emails/${template.id}`)}>
                                            <Edit2 className="w-4 h-4 text-indigo-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {templates.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                                        Nenhum template encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
