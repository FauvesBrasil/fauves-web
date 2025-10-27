import React, { useEffect } from 'react';
import { slugify } from '@/lib/slugify';
import { useToast } from '@/hooks/use-toast';

export default function CategoryFormModal({ open, onClose, onSave, initial }: any){
  const [name, setName] = React.useState(initial?.name || '');
  const [slug, setSlug] = React.useState(initial?.slug || '');
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  useEffect(()=>{ setName(initial?.name || ''); setSlug(initial?.slug || ''); },[initial]);

  const submit = async ()=>{
    if(!name) return toast({ title: 'Nome obrigatório', description: 'Informe o nome da categoria', variant: 'destructive' });
    setLoading(true);
    try{
      const payload = { name, slug: slug || slugify(name) };
      await onSave(payload);
      toast({ title: 'Salvo', description: 'Categoria salva com sucesso' });
      onClose();
    }catch(e:any){ console.error(e); toast({ title: 'Erro', description: e?.message || 'Falha ao salvar', variant: 'destructive' }); }
    finally{ setLoading(false); }
  };

  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)'}}>
      <div style={{width:640,background:'#fff',padding:20,borderRadius:8}}>
        <h3>{initial ? 'Editar' : 'Criar'} categoria</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Slug (opcional)" value={slug} onChange={e=>setSlug(e.target.value)} />
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button onClick={onClose}>Cancelar</button>
            <button onClick={submit} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
