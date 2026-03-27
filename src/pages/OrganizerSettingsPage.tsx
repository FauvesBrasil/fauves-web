import React, { useState } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useOrganization } from '@/context/OrganizationContext';
import AppHeader from '@/components/AppHeader';
import SidebarMenu from '@/components/SidebarMenu';
import { apiUrl, fetchApi } from '@/lib/apiBase';
import { getOrganizationPath } from '@/lib/eventUrl';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerFooter, DrawerClose, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Facebook, X as XIcon, Instagram, Percent, TrendingDown, Info } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import OrgLogoUpload from '@/components/OrgLogoUpload';

const OrganizerSettingsPage: React.FC = () => {
  // Função para remover editOrgId da URL
  const removeEditOrgIdFromUrl = () => {
    const params = new URLSearchParams(location.search);
    params.delete('editOrgId');
    const newUrl = location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newUrl);
    setDrawerOpen(false);
    setSelectedOrg(null);
  };
  // ...existing code...

  // Modal de confirmação de exclusão - fora do Drawer
  const renderDeleteModal = () => showDeleteModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Excluir organização</h2>
        <p className="text-sm text-slate-600">Tem certeza que deseja excluir esta organização? Essa ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={()=>setShowDeleteModal(false)} className="px-4 py-2 rounded-lg border border-zinc-300 text-slate-600 hover:bg-zinc-100 text-sm font-medium">Cancelar</button>
          <button onClick={async()=>{ setShowDeleteModal(false); await handleDelete(); }} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold">Excluir</button>
        </div>
      </div>
    </div>
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<any | null>(null);
  const location = useLocation();
  const { orgs, refresh, loading } = useOrganization && useOrganization() || { orgs: [], refresh: () => {}, loading: false };
  // Abrir modal automaticamente se editOrgId estiver na URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editOrgId = params.get('editOrgId');
    if (editOrgId && orgs.length > 0) {
      const org = orgs.find(o => String(o.id) === String(editOrgId));
      // Só abre se não estiver aberto para esse org
      if (org && (!drawerOpen || !selectedOrg || String(selectedOrg.id) !== String(editOrgId))) {
        openEdit(org);
      }
    }
    // Se editOrgId foi removido, fecha o modal
    if (!editOrgId && drawerOpen) {
      setDrawerOpen(false);
      setSelectedOrg(null);
    }
    // eslint-disable-next-line
  }, [location.search, orgs]);

  const [selectedOrg, setSelectedOrg] = useState<any|null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<any>({});
  const [showDomainSuggest, setShowDomainSuggest] = useState(false);
  const [domainSuggestValue, setDomainSuggestValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const formatDateTime = (value?: string) => {
    if (!value) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--';
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Abrir modal automaticamente se editOrgId estiver na URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editOrgId = params.get('editOrgId');
    if (editOrgId && orgs.length > 0) {
      const org = orgs.find(o => String(o.id) === String(editOrgId));
      if (org) openEdit(org);
    }
    // eslint-disable-next-line
  }, [location.search, orgs]);

  const openEdit = (org: any) => {
    setSelectedOrg(org);
    setIsNew(false);
    setForm({ ...org });
    setDrawerOpen(true);
  };

  const openNew = () => {
    setSelectedOrg(null);
    setIsNew(true);
    setForm({ name: '', site: '', bio: '', description: '', facebook: '', twitter: '', instagram: '', logoUrl: '' });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      let logoUrl = form.logoUrl;
      // Se for base64, faz upload antes de salvar
      if (logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('data:image')) {
        // Converter base64 para blob
        const arr = logoUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){ u8arr[n] = bstr.charCodeAt(n); }
        const file = new Blob([u8arr], { type: mime });
        const formData = new FormData();
        formData.append('file', file, 'logo.png');
        const uploadRes = await fetchApi('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          logoUrl = data.url;
        } else {
          setSaveError('Erro ao enviar imagem');
          setSaving(false);
          return;
        }
      }
      const payload = { ...form, logoUrl };
      if (!form || (!isNew && !form.id)) {
        setSaveError('Organização não definida. Tente novamente ou selecione uma organização.');
        setSaving(false);
        return;
      }
      const res = await fetchApi(isNew ? '/api/organization' : `/api/organization/${form.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(()=>null);
        setSaveError(data?.error || data?.message || 'Erro ao salvar organização');
        setSaving(false);
        return;
      }
      setDrawerOpen(false);
      await refresh();
    } catch (e: any) {
      setSaveError(e?.message || 'Erro ao salvar organização');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = deleteTargetId || selectedOrg?.id;
    if (!id) {
      setSaveError('Organização não definida. Tente novamente.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      console.debug('[OrganizerSettings] Deleting org id=', id);
      const res = await fetchApi(`/api/organization/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(()=>null);
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch(e) { /* not json */ }
        console.error('[OrganizerSettings] Delete failed', { status: res.status, data, text });
        setSaveError(data?.error || data?.message || text || 'Erro ao excluir organização');
        setSaving(false);
        return;
      }
      // success: clear selection / url and refresh list
      setDeleteTargetId(null);
      setSelectedOrg(null);
      removeEditOrgIdFromUrl();
      setDrawerOpen(false);
      await refresh();
    } catch (e: any) {
      console.error('[OrganizerSettings] Delete exception', e);
      setSaveError(e?.message || 'Erro ao excluir organização');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0b0b0b] flex justify-center items-start">
      {renderDeleteModal()}
      <SidebarMenu />
      <div className="rounded-3xl w-[1352px] bg-white dark:bg-[#0b0b0b] max-md:p-5 max-md:w-full max-md:max-w-screen-lg max-md:h-auto max-sm:p-4">
        <AppHeader />
        <div className="flex absolute flex-col gap-6 left-[167px] top-[99px] w-[1018px] max-md:relative max-md:top-0 max-md:left-0 max-md:w-full max-md:py-5 max-sm:py-4 pb-[100px] mb-[100px]">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white max-sm:text-3xl">Configurações do organizador</h1>
          
          {/* Minha Taxa Section */}
          {orgs && orgs.length > 0 && orgs[0] && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 rounded-2xl border-2 border-teal-300 dark:border-teal-700 p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-xl">
                    <Percent className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Minha Taxa</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Taxa da plataforma negociada</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">
                    {orgs[0].platformFeePercent || 15}%
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">por evento</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-teal-200 dark:border-teal-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>Essa é sua taxa negociada com a Fauves.</strong> Todos os eventos criados pela sua organização terão essa taxa aplicada sobre o valor bruto das vendas.
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <TrendingDown className="w-4 h-4 text-green-600" />
                        <span>Você recebe: <strong className="text-slate-900 dark:text-white">{100 - (orgs[0].platformFeePercent || 15)}%</strong> do valor bruto</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Percent className="w-4 h-4 text-teal-600" />
                        <span>Taxa padrão: 15% • Você tem uma negociação especial ✨</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                Dúvidas sobre sua taxa? Entre em contato com o suporte da Fauves.
              </p>
            </div>
          )}
          
          <h2 className="text-lg font-bold text-[#091747] dark:text-white mb-2">Perfis de organizador</h2>
          <p className="text-[#091747] dark:text-slate-300 mb-6">Cada perfil descreve um organizador exclusivo e mostra todos os seus eventos em uma página. Ter um perfil completo pode incentivar os participantes a segui-lo.</p>
          <div className="flex flex-col gap-4 mt-4">
            {loading || (!orgs || orgs.length === 0) ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white dark:bg-[#242424] rounded-xl shadow border px-6 py-4 relative border dark:border-[#1F1F1F] animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-[#1F1F1F]" />
                    <div className="h-5 w-32 bg-zinc-200 dark:bg-[#1F1F1F] rounded" />
                  </div>
                  <div className="h-8 w-16 bg-zinc-200 dark:bg-[#1F1F1F] rounded" />
                </div>
              ))
            ) : (
              orgs.map(org => {
                const pagePath = getOrganizationPath(org);
                const pageUrl = (typeof window !== 'undefined' ? window.location.origin : '') + pagePath;
                const lastUpdated = formatDateTime(org.updatedAt || org.createdAt);
                return (
                  <div
                    key={org.id}
                    className="flex items-center justify-between bg-white dark:bg-[#242424] rounded-xl shadow border px-6 py-4 transition-all duration-150 relative border dark:border-[#1F1F1F]"
                  >
                    <div className="flex items-center gap-4">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt="logo" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-[#242424] flex items-center justify-center font-bold text-indigo-700 dark:text-white">{org.name?.[0]}</div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-lg text-[#091747] dark:text-white">{org.name}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Página pública:</span>
                            <a href={pagePath} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-300 hover:underline break-all">
                              {pageUrl}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Última atualização:</span>
                            <span>{lastUpdated}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-[#091747] dark:text-white">
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-current"><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/><circle cx="5" cy="12" r="2" fill="currentColor"/></svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
                        <DropdownMenuItem onClick={() => openEdit(org)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedOrg(org); setDeleteTargetId(org.id); setShowDeleteModal(true); }} className="text-red-600">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#242424] rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 border dark:border-[#1F1F1F]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Excluir organização</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Tem certeza que deseja excluir esta organização? Essa ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={()=>{ setShowDeleteModal(false); removeEditOrgIdFromUrl(); }} className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-[#1F1F1F] text-slate-600 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#111827] text-sm font-medium">Cancelar</button>
              <button onClick={async()=>{ setShowDeleteModal(false); await handleDelete(); }} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}
            <DrawerHeader className="p-6 pb-2 border-b border-gray-100">
              <DrawerTitle className="text-xl font-bold text-indigo-950 dark:text-white">{isNew ? 'Adicionar perfil do organizador' : 'Editar o perfil do organizador'}</DrawerTitle>
              <DrawerDescription className="dark:text-slate-300">Preencha as informações da organização para criar ou editar seu perfil.</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              <div>
                <label className="font-bold text-[#091747] dark:text-white">Imagem do perfil do organizador</label>
                <p className="text-sm text-[#091747] dark:text-slate-300 mb-2">Esta é a primeira imagem que os seus participantes verão no início do seu perfil. Use uma imagem quadrada de alta qualidade.</p>
                <div className="mt-2 mb-2">
                  <OrgLogoUpload
                    logoUrl={form.logoUrl}
                    onSelect={file => {
                      const reader = new FileReader();
                      reader.onload = e => {
                        setForm(f => ({ ...f, logoUrl: e.target?.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-[#091747] dark:text-white">Sobre o organizador</label>
                <p className="text-sm text-[#091747] dark:text-slate-300 mb-2">Informe aos participantes sobre quem está organizando os eventos. <a href="#" className="text-indigo-700 dark:text-white underline">Saiba mais</a></p>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do organizador" className="mb-2" />
                <div className="relative mb-2">
                  <div className="absolute left-0 top-0 h-full flex items-center pl-4 pointer-events-none select-none text-gray-400 font-mono text-sm">https://</div>
                  <Input
                    value={typeof form.site === 'string' && form.site.startsWith('https://') ? form.site.slice(8) : (form.site || '')}
                    onChange={e => {
                      let v = e.target.value;
                      setForm(f => ({ ...f, site: 'https://' + v }));
                      // Sugestão aparece ao digitar qualquer coisa
                      if (v.length > 0) {
                        setShowDomainSuggest(true);
                        setDomainSuggestValue(v);
                      } else {
                        setShowDomainSuggest(false);
                      }
                    }}
                    placeholder="O seu site"
                    className="pl-20"
                    onBlur={() => setShowDomainSuggest(false)}
                  />
                  {showDomainSuggest && (
                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#242424] border border-gray-200 dark:border-[#1F1F1F] rounded shadow z-10 w-full text-sm">
                      {[".com", ".com.br", ".net", ".org", ".io"].map(ext => (
                        <div
                          key={ext}
                          className="px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-[#1F1F1F]"
                          onMouseDown={() => {
                            setForm(f => ({ ...f, site: 'https://' + domainSuggestValue + ext }));
                            setShowDomainSuggest(false);
                          }}
                        >
                          {domainSuggestValue + ext}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Bio do organizador" className="mb-2" />
              </div>
              <div>
                <label className="font-bold text-[#091747] dark:text-white">Descrição para páginas de eventos</label>
                <p className="text-sm text-[#091747] dark:text-slate-300 mb-2">Escreva uma breve descrição desse organizador para ser exibida em todas as suas páginas de eventos.</p>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição para páginas de eventos" />
              </div>
              <div>
                <label className="font-bold text-[#091747] dark:text-white">Mídias sociais e marketing</label>
                <p className="text-sm text-[#091747] dark:text-slate-300 mb-2">Informe aos participantes como eles poderão se conectar com você</p>
                <div className="relative mb-2">
                  <div className="absolute left-0 top-0 h-full flex items-center gap-2 pl-4 pointer-events-none select-none text-gray-400 font-mono text-sm">
                    <Facebook className="w-5 h-5 text-[#1877F2]" />
                    <span className="text-gray-500">facebook.com/</span>
                  </div>
                  <Input
                    value={form.facebook?.startsWith('facebook.com/') ? form.facebook.slice(13) : (form.facebook || '')}
                    onChange={e => {
                      let v = e.target.value;
                      setForm(f => ({ ...f, facebook: 'facebook.com/' + v }));
                    }}
                    placeholder="ID do Facebook"
                    className="pl-36"
                  />
                </div>
                <div className="relative mb-2">
                  <div className="absolute left-0 top-0 h-full flex items-center gap-2 pl-4 pointer-events-none select-none text-gray-400 font-mono text-sm">
                    <XIcon className="w-5 h-5 text-black dark:text-white" />
                    <span className="text-gray-500">@</span>
                  </div>
                  <Input
                    value={form.twitter?.startsWith('@') ? form.twitter.slice(1) : (form.twitter || '')}
                    onChange={e => {
                      let v = e.target.value;
                      setForm(f => ({ ...f, twitter: '@' + v }));
                    }}
                    placeholder="Seu usuário X (Twitter)"
                    className="pl-16"
                  />
                </div>
                <div className="relative mb-2">
                  <div className="absolute left-0 top-0 h-full flex items-center gap-2 pl-4 pointer-events-none select-none text-gray-400 font-mono text-sm">
                    <Instagram className="w-5 h-5 text-[#E4405F]" />
                    <span className="text-gray-500">@</span>
                  </div>
                  <Input
                    value={form.instagram?.startsWith('@') ? form.instagram.slice(1) : (form.instagram || '')}
                    onChange={e => {
                      let v = e.target.value;
                      setForm(f => ({ ...f, instagram: '@' + v }));
                    }}
                    placeholder="Seu usuário Instagram"
                    className="pl-16"
                  />
                </div>
              </div>
            </div>
            <DrawerFooter className="flex flex-row gap-4 justify-between p-6 border-t border-gray-100">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1" onClick={() => { setDrawerOpen(false); removeEditOrgIdFromUrl(); }}>Cancelar</Button>
              </DrawerClose>
              <Button className="flex-1 bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white font-bold" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : (isNew ? 'Criar' : 'Salvar')}
              </Button>
            </DrawerFooter>
            {saving && <div className="text-center text-indigo-700 font-bold mt-2">Salvando...</div>}
            {saveError && <div className="text-center text-red-600 font-bold mt-2">{saveError}</div>}

            {/* Danger Zone */}
            {!isNew && (
              <div className="mt-8 p-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-[#2a0909] flex flex-col items-center">
                <div className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</div>
                <div className="text-sm text-red-700 dark:text-red-300 mb-4 text-center">Excluir esta organização é uma ação permanente. Todos os dados serão removidos e não poderão ser recuperados.</div>
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold w-full" onClick={() => { setSelectedOrg(selectedOrg); setDeleteTargetId(selectedOrg.id); setShowDeleteModal(true); }}>
                  Excluir organização
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>
        {/* Botão flutuante de adicionar perfil com texto no hover */}
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
          <div className="relative group">
            <button
              onClick={openNew}
              className="w-16 h-16 rounded-full bg-[#EF4118] shadow-lg flex items-center justify-center hover:bg-[#d12c0f] transition-all"
              aria-label="Adicionar perfil do organizador"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#EF4118" />
                <path d="M16 10v12M10 16h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="absolute right-20 top-1/2 -translate-y-1/2 bg-white dark:bg-[#242424] text-[#EF4118] dark:text-white font-bold px-4 py-2 rounded-xl shadow text-base opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Criar uma organização</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerSettingsPage;
