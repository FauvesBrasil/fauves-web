import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api/category';
import CategoryFormModal from '@/components/CategoryFormModal';
import { useToast } from '@/hooks/use-toast';
import { SectionCard } from '@/components/SectionCard';

export default function AdminCategories(){
  const { token } = useAuth();
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any|null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  async function load(){
    setLoading(true);
    try{
      const data = await getCategories(token);
      setCats(data || []);
    }catch(e){
      console.error(e);
      toast({ title: 'Erro', description: 'Falha ao carregar categorias', variant: 'destructive' });
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ load() },[]);

  const openCreateModal = ()=>{ setEditing(null); setModalOpen(true); };
  const openEditModal = (c:any)=>{ setEditing(c); setModalOpen(true); };

  const save = async (payload:any)=>{
    try{
      if(editing){
        await updateCategory(editing.id, payload, token);
      } else {
        await createCategory(payload, token);
      }
      await load();
      setEditing(null);
      setModalOpen(false);
      toast({ title: 'Salvo', description: 'Categoria salva com sucesso' });
    }catch(e:any){ console.error(e); toast({ title: 'Erro', description: 'Falha ao salvar categoria', variant: 'destructive' }); }
  };

  const removeCat = async (c:any)=>{
    if(!confirm('Desativar categoria?')) return;
    try{ await deleteCategory(c.id, token); await load(); toast({ title: 'Removido', description: 'Categoria desativada' }); }catch(e){ console.error(e); toast({ title: 'Erro', description: 'Erro ao remover', variant: 'destructive' }); }
  };

  return (
    <div>
      <SectionCard title="Categorias" description="Gerencie categorias do seu catálogo" actions={<div style={{display:'flex',gap:8}}><button onClick={openCreateModal} style={{padding:'8px 10px',background:'#0ea5a9',color:'#fff',borderRadius:8}}>Criar categoria</button><button onClick={load} style={{padding:'8px 10px',borderRadius:8}}>Atualizar</button></div>}>
        {loading ? <div>Carregando...</div> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
            {cats.map(c=> (
              <div key={c.id} style={{background:'#fff',padding:12,borderRadius:10,display:'flex',flexDirection:'column',gap:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700}}>{c.name}</div>
                    <div style={{fontSize:12,color:'#64748b'}}>{c.slug}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
                    <div style={{fontSize:12,color:c.isActive? '#10b981' : '#ef4444',fontWeight:700}}>{c.isActive? 'Ativa' : 'Inativa'}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>openEditModal(c)} style={{padding:'6px 10px',borderRadius:8}}>Editar</button>
                  <button onClick={()=>removeCat(c)} style={{padding:'6px 10px',borderRadius:8,color:'#fff',background:'#ef4444'}}>Desativar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <CategoryFormModal open={modalOpen} onClose={()=>setModalOpen(false)} onSave={save} initial={editing} />
    </div>
  );
}
