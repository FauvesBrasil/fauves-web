import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerFooter, DrawerClose, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import OrgLogoUpload from '@/components/OrgLogoUpload';

export default function OrganizerEditDrawer({ open, onOpenChange, org, isNew, onSave, saving, saveError, form, setForm }) {
  const [showDomainSuggest, setShowDomainSuggest] = useState(false);
  const [domainSuggestValue, setDomainSuggestValue] = useState('');
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="p-6 pb-2 border-b border-gray-100">
          <DrawerTitle className="text-xl font-bold text-indigo-950">{isNew ? 'Adicionar perfil do organizador' : 'Editar o perfil do organizador'}</DrawerTitle>
          <DrawerDescription>Preencha as informações da organização para criar ou editar seu perfil.</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          <div>
            <label className="font-bold text-[#091747]">Imagem do perfil do organizador</label>
            <p className="text-sm text-[#091747] mb-2">Esta é a primeira imagem que os seus participantes verão no início do seu perfil. Use uma imagem quadrada de alta qualidade.</p>
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
            <label className="font-bold text-[#091747]">Sobre o organizador</label>
            <p className="text-sm text-[#091747] mb-2">Informe aos participantes sobre quem está organizando os eventos. <a href="#" className="text-indigo-700 underline">Saiba mais</a></p>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do organizador" className="mb-2" />
            <div className="relative mb-2">
              <div className="absolute left-0 top-0 h-full flex items-center pl-4 pointer-events-none select-none text-gray-400 font-mono text-sm">https://</div>
              <Input
                value={typeof form.site === 'string' && form.site.startsWith('https://') ? form.site.slice(8) : (form.site || '')}
                onChange={e => {
                  let v = e.target.value;
                  setForm(f => ({ ...f, site: 'https://' + v }));
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
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow z-10 w-full text-sm">
                  {[".com", ".com.br", ".net", ".org", ".io"].map(ext => (
                    <div
                      key={ext}
                      className="px-4 py-2 cursor-pointer hover:bg-indigo-50"
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
            <label className="font-bold text-[#091747]">Descrição para páginas de eventos</label>
            <p className="text-sm text-[#091747] mb-2">Escreva uma breve descrição desse organizador para ser exibida em todas as suas páginas de eventos.</p>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição para páginas de eventos" />
          </div>
          <div>
            <label className="font-bold text-[#091747]">Mídias sociais e marketing</label>
            <p className="text-sm text-[#091747] mb-2">Informe aos participantes como eles poderão se conectar com você</p>
            <Input value={form.facebook?.startsWith('facebook.com/') ? form.facebook.slice(13) : (form.facebook || '')} onChange={e => setForm(f => ({ ...f, facebook: 'facebook.com/' + e.target.value }))} placeholder="ID do Facebook" className="pl-36 mb-2" />
            <Input value={form.twitter?.startsWith('@') ? form.twitter.slice(1) : (form.twitter || '')} onChange={e => setForm(f => ({ ...f, twitter: '@' + e.target.value }))} placeholder="Seu usuário X (Twitter)" className="pl-16 mb-2" />
            <Input value={form.instagram?.startsWith('@') ? form.instagram.slice(1) : (form.instagram || '')} onChange={e => setForm(f => ({ ...f, instagram: '@' + e.target.value }))} placeholder="Seu usuário Instagram" className="pl-16" />
          </div>
        </div>
        <DrawerFooter className="flex flex-row gap-4 justify-between p-6 border-t border-gray-100">
          <DrawerClose asChild>
            <button className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 text-slate-600 hover:bg-zinc-100 text-sm font-medium" onClick={() => onOpenChange(false)}>Cancelar</button>
          </DrawerClose>
          <button className="flex-1 bg-[#2A2AD7] hover:bg-[#1E1EBE] text-white font-bold px-4 py-2 rounded-lg" onClick={onSave} disabled={saving}>
            {saving ? 'Salvando...' : (isNew ? 'Criar' : 'Salvar')}
          </button>
        </DrawerFooter>
        {saving && <div className="text-center text-indigo-700 font-bold mt-2">Salvando...</div>}
        {saveError && <div className="text-center text-red-600 font-bold mt-2">{saveError}</div>}
      </DrawerContent>
    </Drawer>
  );
}
