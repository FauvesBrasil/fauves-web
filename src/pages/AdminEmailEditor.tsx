import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Mail } from 'lucide-react';
import { apiUrl } from '@/lib/apiBase';
import { toast } from 'sonner';

export default function AdminEmailEditor() {
    const { id } = useParams<{ id: string }>();
    const isNew = !id;
    const navigate = useNavigate();
    const { token } = useAuth();

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        slug: '',
        subject: '',
        htmlBody: '',
        active: true
    });

    useEffect(() => {
        if (!isNew && id) {
            fetchTemplate(id);
        }
    }, [id, isNew]);

    const fetchTemplate = async (templateId: string) => {
        try {
            const res = await fetch(apiUrl(`/api/admin/emails/templates/${templateId}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    slug: data.slug,
                    subject: data.subject,
                    htmlBody: data.htmlBody,
                    active: data.active
                });
            } else {
                toast.error('Erro ao carregar template');
                navigate('/admin/emails');
            }
        } catch (e) {
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = isNew
                ? apiUrl('/api/admin/emails/templates')
                : apiUrl(`/api/admin/emails/templates/${id}`);

            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(isNew ? 'Template criado!' : 'Template atualizado!');
                navigate('/admin/emails');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Erro ao salvar template');
            }
        } catch (e) {
            toast.error('Erro de conexão ao salvar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    // Sample data for preview
    const sampleData: Record<string, string> = {
        name: 'João Silva',
        orderId: 'ORD-2024-001',
        eventName: 'Festival de Música 2024',
        totalAmount: 'R$ 250,00',
        paymentLink: 'https://fauves.app/payment/123',
        ticketCount: '2',
        ticketLink: 'https://fauves.app/tickets/123',
    };

    // Replace variables in preview
    const getPreviewHtml = () => {
        let preview = formData.htmlBody;
        for (const [key, value] of Object.entries(sampleData)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            preview = preview.replace(regex, value);
        }
        return preview;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-[1800px] mx-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/admin/emails')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isNew ? 'Novo Template' : `Editar: ${formData.slug}`}
                    </h1>
                </div>

                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Left Side - Form */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Detalhes do Email</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug (Identificador Único)</Label>
                                        <Input
                                            id="slug"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                            disabled={!isNew}
                                            placeholder="ex: order-confirmation"
                                            required
                                        />
                                        <p className="text-xs text-gray-500">Usado no código para identificar este email.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="active">Status</Label>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch
                                                id="active"
                                                checked={formData.active}
                                                onCheckedChange={checked => setFormData({ ...formData, active: checked })}
                                            />
                                            <Label htmlFor="active" className="cursor-pointer">{formData.active ? 'Ativo (Usa DB)' : 'Inativo (Usa Arquivo)'}</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Assunto do Email</Label>
                                    <Input
                                        id="subject"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="ex: Seu pedido #{{orderId}} foi confirmado!"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="htmlBody">Conteúdo HTML</Label>
                                        <span className="text-xs text-gray-500">Suporta variáveis {'{{'} variable {'}}'}</span>
                                    </div>
                                    <Textarea
                                        id="htmlBody"
                                        value={formData.htmlBody}
                                        onChange={e => setFormData({ ...formData, htmlBody: e.target.value })}
                                        className="font-mono text-sm h-[500px]"
                                        placeholder="<html>...</html>"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? 'Salvando...' : 'Salvar Template'}
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>

                        {/* Right Side - Preview */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-orange-500" />
                                        Preview do Email
                                    </CardTitle>
                                    <p className="text-sm text-gray-500">
                                        Visualização com dados de exemplo
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {/* Subject Preview */}
                                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 mb-1">Assunto:</p>
                                        <p className="font-semibold text-sm">
                                            {formData.subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => sampleData[key] || `{{${key}}}`)}
                                        </p>
                                    </div>

                                    {/* HTML Preview in iframe */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
                                        <iframe
                                            srcDoc={getPreviewHtml()}
                                            className="w-full h-[600px] border-0"
                                            title="Email Preview"
                                            sandbox="allow-same-origin"
                                        />
                                    </div>

                                    {/* Sample Data Legend */}
                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Dados de Exemplo:</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-800 dark:text-blue-300">
                                            {Object.entries(sampleData).map(([key, value]) => (
                                                <div key={key} className="font-mono">
                                                    <span className="text-blue-600 dark:text-blue-400">{`{{${key}}}`}</span> = {value}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
}
