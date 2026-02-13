import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import SmartphoneIcon from '../assets/smartphone.svg';
import QrCodeIcon from '../assets/qr-code.svg';
import DoubleCheckIcon from '../assets/double-check.svg';

type PixPayload = {
  qrBase64?: string; // base64 encoded image (png/svg)
  copyPaste?: string; // payload string for copy/paste
  expiresAt?: string; // ISO timestamp
  amount?: number; // amount in full currency units
};

type Props = {
  open: boolean;
  payload: PixPayload | null;
  onClose: () => void;
  onCancel?: () => void;
};

function formatExpires(expiresAt?: string) {
  if (!expiresAt) return '';
  try {
    const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  } catch (e) {
    return '';
  }
}

export default function PixQrModal({ open, payload, onClose, onCancel }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setCopyBusy(false);
    }
  }, [open]);

  const expiresText = useMemo(() => formatExpires(payload?.expiresAt), [payload]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setQrDataUrl(null);
    if (payload?.qrBase64) {
      setQrDataUrl(`data:image/png;base64,${payload.qrBase64}`);
    } else if (payload?.copyPaste) {
      QRCode.toDataURL(String(payload.copyPaste), { margin: 0, width: 240 })
        .then((d) => {
          if (mounted) setQrDataUrl(d);
        })
        .catch(() => {
          if (mounted) setQrDataUrl(null);
        });
    }
    return () => {
      mounted = false;
    };
  }, [payload]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!payload?.copyPaste) return;
    try {
      setCopyBusy(true);
      await navigator.clipboard.writeText(payload.copyPaste);
      setCopied(true);
    } catch (err) {
      // fallback: select text
      const el = document.getElementById('pix-copy-text') as HTMLTextAreaElement | null;
      if (el) {
        el.select();
        document.execCommand('copy');
        setCopied(true);
      }
    } finally {
      setCopyBusy(false);
      setTimeout(() => setCopied(false), 2500);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[500px] rounded-2xl bg-white p-10 shadow-xl"
      >
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-lg">
            <span className="text-orange-500 font-semibold">Falta só mais um pouco.</span>{' '}
            <span className="font-semibold text-slate-800">Realize o pagamento de {payload?.amount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload.amount) : 'R$100,00'} para finalizar sua compra e receber seus ingressos.</span>
          </h3>
          <p className="mt-2 text-sm text-gray-500">Após o pagamento, os ingressos serão enviados para o e-mail de cada participante inserido na etapa anterior.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: QR */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center rounded-xl border border-gray-100 p-4 shadow-sm bg-white">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-lg bg-gray-50 p-3">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code Pix" className="max-h-full max-w-full" />
                ) : (
                  <div className="text-center text-sm text-gray-400">QR não disponível</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: code + actions */}
          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-700 shadow-sm">
                <textarea
                  id="pix-copy-text"
                  readOnly
                  value={payload?.copyPaste ?? ''}
                  className="w-full resize-none bg-transparent text-sm outline-none"
                  rows={6}
                />
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3">
              <button
                onClick={handleCopy}
                disabled={copyBusy || !payload?.copyPaste}
                className="flex items-center justify-center gap-3 rounded-lg bg-[#4C1D95] px-4 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    d="M16 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 12H16"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {copyBusy ? 'Copiando…' : copied ? 'Copiado!' : 'Copie o código'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions full-width */}
        <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4 shadow-sm">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="pt-0">
                <img src={SmartphoneIcon} alt="smartphone" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Abra o app do seu banco e entre na Área PIX.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="pt-0">
                <img src={QrCodeIcon} alt="qr code" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Confirme as informações do pagamento e finalize a compra.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="pt-0">
                <img src={DoubleCheckIcon} alt="double check" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Escolha a opção pagar com QR Code e escaneie o código acima.</p>
              </div>
            </div>
          </div>
        </div>

        {/* close x */}
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
