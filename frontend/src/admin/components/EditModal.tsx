import React, { useEffect, useRef } from 'react';

export default function EditModal({ open, title, fields, values, onChange, onSave, onClose }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    // focus first input when modal opens
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 0);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' && dialogRef.current) {
        // Simple focus trap: keep focus inside dialog
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          (last as HTMLElement).focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (first as HTMLElement).focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        className="bg-white p-8 rounded-lg min-w-[320px] shadow-lg"
      >
        <h3 id="edit-modal-title" className="mt-0 mb-4">{title}</h3>
        <form onSubmit={e => { e.preventDefault(); onSave(); }}>
          {fields.map((f, idx) => (
            <div key={f.name} className="mb-4">
              <label className="font-semibold">{f.label}</label>
              <input
                ref={idx === 0 ? firstInputRef : undefined}
                type={f.type || 'text'}
                value={values[f.name] || ''}
                onChange={e => onChange(f.name, e.target.value)}
                className="w-full p-2 rounded-md border border-slate-100 mt-1"
              />
            </div>
          ))}
          <div className="flex gap-3 mt-4">
            <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded">Salvar</button>
            <button type="button" className="px-4 py-2 bg-slate-100 rounded" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
