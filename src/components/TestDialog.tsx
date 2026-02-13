import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';

const TestDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 40 }}>
      <button onClick={() => setOpen(true)} style={{ padding: 16, fontSize: 18, background: '#2A2AD7', color: 'white', borderRadius: 8 }}>
        Abrir Dialog de Teste
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent hideClose>
          <div style={{ color: 'green', fontWeight: 'bold', fontSize: 28 }}>DIALOG FUNCIONANDO</div>
          <button onClick={() => setOpen(false)} style={{ marginTop: 24, padding: 12, background: '#eee', borderRadius: 6 }}>Fechar</button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestDialog;
