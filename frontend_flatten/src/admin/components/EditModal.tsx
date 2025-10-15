import React from 'react';

export default function EditModal({ open, title, fields, values, onChange, onSave, onClose }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.25)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div style={{background:'#fff',padding:32,borderRadius:12,minWidth:320,boxShadow:'0 2px 16px rgba(0,0,0,0.15)'}}>
        <h3 style={{marginTop:0}}>{title}</h3>
        <form onSubmit={e=>{e.preventDefault();onSave();}}>
          {fields.map(f=>(
            <div key={f.name} style={{marginBottom:16}}>
              <label style={{fontWeight:600}}>{f.label}</label>
              <input
                type={f.type||'text'}
                value={values[f.name]||''}
                onChange={e=>onChange(f.name, e.target.value)}
                style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #eee',marginTop:4}}
              />
            </div>
          ))}
          <div style={{display:'flex',gap:12,marginTop:16}}>
            <button type="submit" style={{padding:'8px 20px',background:'#0ea5e9',color:'#fff',border:'none',borderRadius:6}}>Salvar</button>
            <button type="button" style={{padding:'8px 20px',background:'#eee',border:'none',borderRadius:6}} onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
