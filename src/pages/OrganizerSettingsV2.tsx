import React from 'react';
import TextLink from '@/components/TextLink';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import { useOrganization } from '@/context/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Share2, ExternalLink, PenLine, ImagePlus, Instagram, Youtube, MessageCircle, Info, QrCode, Lock, CheckCircle2, Copy, Globe, Phone, Mail, MapPin, Star, UserCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/apiBase';
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import { getOrganizationPath } from '@/lib/eventUrl';

// --- Subcomponente: Modal de Identidade ---
const EditIdentityModal = ({ open, onOpenChange, initialName, initialSlug, onSave, loading }) => {
  const [name, setName] = React.useState(initialName);
  const [slug, setSlug] = React.useState(initialSlug);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Nome & Link</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Organização</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Fauves Brasil" />
          </div>
          <div className="space-y-2">
            <Label>URL Personalizada (Slug)</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="fauves-brasil" />
            <div className="text-[10px] text-slate-500">Apenas letras, números e hífens.</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave({ name, slug })} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Subcomponente: Painel de Cards de Ação ---
const ActionCards = ({ onEdit }) => {
  const cards = [
    { id: 'about', label: 'Sobre & Tags', icon: <PenLine size={20}/>, desc: 'Bio, descrição e hashtags' },
    { id: 'visuals', label: 'Capa & Logo', icon: <ImagePlus size={20}/>, desc: 'Identidade visual da página' },
    { id: 'links', label: 'Redes Sociais', icon: <Instagram size={20}/>, desc: 'Instagram, YouTube, Site' },
    { id: 'general', label: 'Contato & Local', icon: <MapPin size={20}/>, desc: 'Email, Telefone, Endereço' },
    { id: 'featured', label: 'Destaque', icon: <Star size={20}/>, desc: 'Evento no topo da página' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {cards.map(c => (
        <button key={c.id} onClick={() => onEdit(c.id)} className="flex items-start gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121212] hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-all text-left group">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">{c.icon}</div>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{c.label}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{c.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default function OrganizerSettingsV2() {
  const { selectedOrg, orgs, setSelectedOrgById } = useOrganization();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = React.useState('pagina');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [extendedOrg, setExtendedOrg] = React.useState<any>(null);
  const [loadingFresh, setLoadingFresh] = React.useState(false);

  // Estados de Modais
  const [editModal, setEditModal] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Estados Temporários de Edição (para preencher os modais)
  const [tempData, setTempData] = React.useState<any>({});

  // Estados Efí Bank (Onboarding)
  const [efiAccountStatus, setEfiAccountStatus] = React.useState<string>('NONE');
  const [onboardingType, setOnboardingType] = React.useState<'individual' | 'legal'>('individual');
  const [onboardingTaxId, setOnboardingTaxId] = React.useState('');
  const [onboardingPhone, setOnboardingPhone] = React.useState('');
  const [submittingOnboarding, setSubmittingOnboarding] = React.useState(false);

  // Busca dados frescos da organizacao
  const fetchFresh = React.useCallback(async () => {
    if (!selectedOrg?.id) return;
    setLoadingFresh(true);
    try {
      const res = await fetchApi(`/api/organization/${selectedOrg.id}`);
      const data = await res.json();
      setExtendedOrg(data);
      if (data.efiAccountStatus) setEfiAccountStatus(data.efiAccountStatus);
    } catch { toast({ variant: 'destructive', title: 'Falha ao carregar dados' }); }
    finally { setLoadingFresh(false); }
  }, [selectedOrg?.id, toast]);

  React.useEffect(() => { fetchFresh(); }, [fetchFresh]);

  const org = extendedOrg || selectedOrg;
  const orgUrl = org ? `${window.location.origin}${getOrganizationPath(org)}` : '';

  const handleOnboarding = async () => {
    if (!selectedOrg?.id) return;
    setSubmittingOnboarding(true);
    try {
      const res = await fetchApi(`/api/organization/${selectedOrg.id}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: onboardingType, taxId: onboardingTaxId, phone: onboardingPhone })
      });
      if (res.ok) {
        setEfiAccountStatus('PENDING');
        toast({ title: 'Enviado para análise', description: 'Seus dados estão sendo processados pela Efí Bank.' });
      } else {
        throw new Error();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao enviar dados', description: 'Verifique as informações e tente novamente.' });
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  const saveGeneric = async (data: any) => {
    if (!selectedOrg?.id) return;
    setSaving(true);
    try {
      const res = await fetchApi(`/api/organization/${selectedOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Sucesso', description: 'Alterações salvas com sucesso.' });
      setEditModal(null);
      fetchFresh();
    } catch { toast({ variant: 'destructive', title: 'Erro ao salvar' }); }
    finally { setSaving(false); }
  };

  const handleEdit = (id: string) => {
    setTempData({ ...org });
    setEditModal(id);
  };

  if (!selectedOrg) return <div className="p-12 text-center text-slate-500">Selecione uma organização...</div>;

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:from-[#050505] dark:via-[#0b0b0b] dark:to-[#0d0d0d]">
      <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileDrawerMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentPath={location.pathname} organizations={orgs} selectedOrg={selectedOrg} selectOrganization={setSelectedOrgById} user={user} />
      <SidebarMenu activeKeyOverride="ajustes" />

      <div className="relative w-full lg:pl-24">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12">
          <AppHeader />
          <div className="space-y-6 mt-8">
            
            {/* Header com Branding */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white px-7 py-6 shadow-sm dark:border-zinc-800 dark:bg-[#0f0f0f]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 text-left">
                  <div className="h-16 w-16 rounded-2xl border bg-zinc-50 flex items-center justify-center overflow-hidden">
                    {org?.logoUrl ? <img src={org.logoUrl} className="h-full w-full object-cover" /> : <UserCircle2 className="text-zinc-300" size={32} />}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                       {org?.name || 'Carregando...'}
                       <button onClick={() => handleEdit('identity')} className="hover:text-indigo-600 transition-colors"><PenLine size={16}/></button>
                    </h1>
                    <div className="text-sm text-slate-500">Configurações da Organização</div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(orgUrl); toast({title:'Copiado'}); }}><Copy size={16} className="mr-1"/> Link</Button>
                   <Button size="sm" onClick={() => window.open(orgUrl, '_blank')}><ExternalLink size={16} className="mr-1"/> Ver Página</Button>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-white dark:bg-[#111] p-1 rounded-xl">
                <TabsTrigger value="pagina">Minha Página</TabsTrigger>
                <TabsTrigger value="express">Bilheteria Express</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
              </TabsList>

              <TabsContent value="pagina" className="space-y-6">
                <ActionCards onEdit={handleEdit} />
                
                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f0f0f]">
                   <h3 className="text-lg font-bold mb-4">Código do Widget (Embed)</h3>
                   <div className="text-sm text-slate-500 mb-4">Embuta sua bilheteria no seu site oficial.</div>
                   <textarea readOnly value={`<iframe src="${window.location.origin}/org/${org?.slug || org?.id}?embedded=1" allow="payment" style="width:100%; height:800px; border:0;"></iframe>\n<script src="${window.location.origin}/widget.js"></script>`} 
                             className="w-full h-32 bg-zinc-50 dark:bg-zinc-900 border rounded-xl p-4 text-xs font-mono" />
                </div>

                <div className="p-5 rounded-xl border border-red-200 bg-red-50/20 dark:bg-red-900/5 flex items-center justify-between">
                   <div>
                      <div className="font-bold text-red-600">Área Crítica</div>
                      <div className="text-xs text-red-500/80">Exclusão permanente da organização.</div>
                   </div>
                   <Button variant="destructive" size="sm" onClick={() => handleEdit('delete')}>Excluir Organização</Button>
                </div>
              </TabsContent>

              <TabsContent value="express">
                <div className="text-center p-12 bg-white dark:bg-[#121212] rounded-2xl border">
                   <QrCode size={48} className="mx-auto mb-4 text-indigo-600"/>
                   <h2 className="text-xl font-bold">Venda na Porta</h2>
                   <p className="text-slate-500 max-w-sm mx-auto mb-6">Seus clientes podem comprar ingressos lendo o código abaixo diretamente na portaria.</p>
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/venues/' + (org?.slug || org?.id) + '/door')}`} className="mx-auto w-40 border-8 rounded-2xl mb-4" />
                   <Button variant="outline" onClick={() => window.open(window.location.origin + '/venues/' + (org?.slug || org?.id) + '/door', '_blank')}>Abrir URL Express</Button>
                </div>
              </TabsContent>

              <TabsContent value="banking">
                 {efiAccountStatus === 'NONE' || efiAccountStatus === 'REJECTED' ? (
                   <div className="max-w-xl mx-auto rounded-2xl border bg-white dark:bg-[#121212] overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-8 text-white">
                         <h2 className="text-2xl font-bold">Ative sua Conta Digital Efí</h2>
                         <p className="opacity-90">Receba via Pix e Cartão com split automático.</p>
                      </div>
                      <div className="p-8 space-y-6">
                         <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <button onClick={() => setOnboardingType('individual')} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${onboardingType === 'individual' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>CPF</button>
                            <button onClick={() => setOnboardingType('legal')} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${onboardingType === 'legal' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>CNPJ</button>
                         </div>
                         <div className="space-y-4">
                            <div>
                               <Label className="text-xs text-slate-500 mb-1 block">{onboardingType === 'individual' ? 'CPF' : 'CNPJ'}</Label>
                               <Input value={onboardingTaxId} onChange={e => setOnboardingTaxId(e.target.value)} placeholder={onboardingType === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'} className="h-12" />
                            </div>
                            <div>
                               <Label className="text-xs text-slate-500 mb-1 block">WhatsApp de Contato</Label>
                               <Input value={onboardingPhone} onChange={e => setOnboardingPhone(e.target.value)} placeholder="(00) 00000-0000" className="h-12" />
                            </div>
                         </div>
                         <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={handleOnboarding} disabled={submittingOnboarding}>
                            {submittingOnboarding ? 'Enviando Dados...' : 'Criar Conta Digital'}
                         </Button>
                         <p className="text-[10px] text-center text-slate-400">Ao criar a conta, você concorda com os termos da Efí Bank e autoriza o split de recebíveis da Fauves.</p>
                      </div>
                   </div>
                 ) : efiAccountStatus === 'PENDING' ? (
                   <div className="max-w-xl mx-auto p-12 text-center bg-white dark:bg-[#121212] rounded-2xl border shadow-sm">
                      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info size={32} className="text-amber-500 animate-pulse" />
                      </div>
                      <h2 className="text-xl font-bold">Conta em Análise</h2>
                      <p className="text-slate-500 mt-2">A Efí Bank está processando seus documentos. Isso geralmente leva de 1 a 3 dias úteis.</p>
                   </div>
                 ) : (
                   <div className="max-w-xl mx-auto bg-white dark:bg-[#121212] p-8 rounded-2xl border text-center shadow-sm">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                      </div>
                      <h2 className="text-xl font-bold">Conta Digital Ativa</h2>
                      <p className="text-slate-500 text-sm mt-2">Sua conta está integrada e pronta para receber pagamentos e realizar saques.</p>
                      <Button className="mt-8 w-full h-12" onClick={() => navigate('/organizer-finances')}>Acessar Painel Financeiro</Button>
                   </div>
                 )}
              </TabsContent>
            </Tabs>

            {/* MODAIS DE EDIÇÃO (RESTORED) */}
            <EditIdentityModal open={editModal === 'identity'} onOpenChange={() => setEditModal(null)} initialName={org?.name} initialSlug={org?.slug} onSave={saveGeneric} loading={saving} />

            <Dialog open={editModal === 'about'} onOpenChange={() => setEditModal(null)}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>Sobre a Organização</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Descrição Curta (Bio)</Label>
                    <Input value={tempData.description || ''} onChange={e => setTempData({...tempData, description: e.target.value})} maxLength={120} placeholder="Uma frase que define você" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio Completa</Label>
                    <Textarea value={tempData.bio || ''} onChange={e => setTempData({...tempData, bio: e.target.value})} rows={4} placeholder="Conte mais sobre sua trajetória..." />
                  </div>
                </div>
                <DialogFooter><Button onClick={() => saveGeneric({ bio: tempData.bio, description: tempData.description })} disabled={saving}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editModal === 'visuals'} onOpenChange={() => setEditModal(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Identidade Visual</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="space-y-2">
                      <Label>URL do Logo</Label>
                      <Input value={tempData.logoUrl || ''} onChange={e => setTempData({...tempData, logoUrl: e.target.value})} placeholder="https://..." />
                   </div>
                   <div className="space-y-2">
                      <Label>URL da Capa</Label>
                      <Input value={tempData.coverUrl || ''} onChange={e => setTempData({...tempData, coverUrl: e.target.value})} placeholder="https://..." />
                   </div>
                </div>
                <DialogFooter><Button onClick={() => saveGeneric({ logoUrl: tempData.logoUrl, coverUrl: tempData.coverUrl })} disabled={saving}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editModal === 'links'} onOpenChange={() => setEditModal(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Redes Sociais</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                   <div className="space-y-2"><Label>Instagram</Label><Input value={tempData.instagram || ''} onChange={e => setTempData({...tempData, instagram: e.target.value})} /></div>
                   <div className="space-y-2"><Label>Website</Label><Input value={tempData.website || ''} onChange={e => setTempData({...tempData, website: e.target.value})} /></div>
                   <div className="space-y-2"><Label>YouTube</Label><Input value={tempData.youtube || ''} onChange={e => setTempData({...tempData, youtube: e.target.value})} /></div>
                   <div className="space-y-2"><Label>WhatsApp</Label><Input value={tempData.whatsapp || ''} onChange={e => setTempData({...tempData, whatsapp: e.target.value})} /></div>
                </div>
                <DialogFooter><Button onClick={() => saveGeneric({ instagram: tempData.instagram, website: tempData.website, youtube: tempData.youtube, whatsapp: tempData.whatsapp })} disabled={saving}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editModal === 'delete'} onOpenChange={() => setEditModal(null)}>
               <DialogContent>
                  <DialogHeader><DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle></DialogHeader>
                  <div className="py-4 text-sm text-slate-500">Tem certeza que deseja excluir esta organização? Esta ação removerá permanentemente todos os acessos e configurações.</div>
                  <DialogFooter>
                     <Button variant="outline" onClick={() => setEditModal(null)}>Cancelar</Button>
                     <Button variant="destructive" onClick={async () => {
                        setSaving(true);
                        try {
                           await fetchApi(`/api/organization/${selectedOrg.id}`, { method: 'DELETE' });
                           toast({ title: 'Excluído' });
                           window.location.reload();
                        } catch { toast({ variant:'destructive', title: 'Falha' }); }
                        finally { setSaving(false); }
                     }} disabled={saving}>Excluir permanentemente</Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>

          </div>
        </div>
      </div>
    </div>
  );
}
