import React from 'react';

const safeGet = (key: string) => {
  try { return (window as any)[key] || null; } catch { return null; }
};

const DevDiagnostics: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [apiDiag, setApiDiag] = React.useState<any[]>([]);
  const [orgDiag, setOrgDiag] = React.useState<any>(null);

  const refresh = React.useCallback(() => {
    setApiDiag(safeGet('__API_REQ_DIAG__') || []);
    setOrgDiag(safeGet('__ORG_LAST_FETCH_DIAG__') || null);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [open, refresh]);

  const copy = async (obj: any) => {
    try {
      const s = JSON.stringify(obj, null, 2);
      await navigator.clipboard.writeText(s);
      // eslint-disable-next-line no-alert
      alert('Diagnostics copied to clipboard');
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Copy failed: ' + String(e));
    }
  };

  if (import.meta.env.PROD) return null;

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{position:'fixed',right:12,bottom:12,zIndex:9999,background:'#0ea5e9',color:'white',border:'none',padding:'10px 12px',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>
        {open ? 'Fechar DIAG' : 'Abrir DIAG'}
      </button>
      {open && (
        <div style={{position:'fixed',right:12,bottom:64,zIndex:9999,width:520,maxHeight:'60vh',overflow:'auto',background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',padding:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <strong>Dev Diagnostics</strong>
            <div style={{display:'flex',gap:8}}>
              <button onClick={() => { refresh(); }} style={{padding:'6px 8px'}}>Refresh</button>
              <button onClick={() => copy({ apiDiag, orgDiag })} style={{padding:'6px 8px'}}>Copy All</button>
              <button onClick={() => copy(apiDiag)} style={{padding:'6px 8px'}}>Copy API</button>
              <button onClick={() => copy(orgDiag)} style={{padding:'6px 8px'}}>Copy ORG</button>
            </div>
          </div>
          <div style={{fontSize:12,marginBottom:8}}><strong>API Requests (recent)</strong></div>
          <pre style={{background:'#f8fafc',padding:8,borderRadius:6,whiteSpace:'pre-wrap',fontSize:11}}>{JSON.stringify(apiDiag, null, 2)}</pre>
          <div style={{height:12}} />
          <div style={{fontSize:12,marginBottom:8}}><strong>Organization fetch batch (last)</strong></div>
          <pre style={{background:'#f8fafc',padding:8,borderRadius:6,whiteSpace:'pre-wrap',fontSize:11}}>{JSON.stringify(orgDiag, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DevDiagnostics;
