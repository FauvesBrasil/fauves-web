import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import LogoFauves from '@/components/LogoFauves';

interface PixIntent {
  id: string;
  orderId: string;
  provider: string;
  code: string;
  status: string;
  expiresAt: string;
}

interface OrderSummary {
  id: string;
  code: string;
  eventId: string;
  eventName?: string | null;
  eventStartDate?: string | null;
  totalAmount: number;
  paymentStatus: string;
}

const formatBRL = (n: number) => `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function Countdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const r = new Date(expiresAt).getTime() - Date.now();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(id);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);
  if (remaining <= 0) return <span>00:00</span>;
  const totalSec = Math.floor(remaining / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2,'0');
  const s = String(totalSec % 60).padStart(2,'0');
  return <span>{m}:{s}</span>;
}

export default function CheckoutPix() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId') || '';
  const expParam = params.get('exp');
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [intent, setIntent] = useState<PixIntent | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copyOk, setCopyOk] = useState(false);
  const [expired, setExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(expParam || null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      setOrder({
        id: json.id,
        code: json.code,
        eventId: json.eventId,
        eventName: json.eventName,
        eventStartDate: json.eventStartDate,
        totalAmount: json.totalAmount,
        paymentStatus: json.paymentStatus,
      });
      if (json.paymentStatus === 'PAID') {
        setPolling(false);
      }
      // Fallback expiration: if no exp param and we still don't have it, derive from createdAt + window (15m default)
      if (!expParam && !expiresAt && json.createdAt) {
        const windowMinutes = parseInt(import.meta.env.VITE_RESERVATION_MINUTES || '15', 10);
        const derived = new Date(new Date(json.createdAt).getTime() + windowMinutes * 60_000).toISOString();
        setExpiresAt(derived);
      }
    } catch (e:any) {
      setError(e.message);
    }
  }, [orderId, expParam, expiresAt]);

  const fetchIntent = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/pix-intent`, { method: 'POST' });
      if (!res.ok) {
        setError(`Falha intent PIX HTTP ${res.status}`);
        return;
      }
      const json: PixIntent = await res.json();
      setIntent(json);
      const url = await QRCode.toDataURL(json.code, { margin: 0, width: 240 });
      setQrDataUrl(url);
      // Caso expParam exista preferimos ele, senão usamos expiresAt da intent se vier
      if (!expParam && !expiresAt && json.expiresAt) {
        setExpiresAt(json.expiresAt);
      }
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, expParam, expiresAt]);

  // Initial load
  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    fetchOrder();
    fetchIntent();
  }, [orderId, fetchOrder, fetchIntent, navigate]);

  // Polling payment status
  useEffect(() => {
    if (!polling || !orderId || expired) return;
    const id = setInterval(async () => {
      await fetchOrder();
    }, 5000);
    return () => clearInterval(id);
  }, [polling, orderId, expired, fetchOrder]);

  const onExpire = () => {
    setExpired(true);
    setPolling(false);
  };

  const copyCode = async () => {
    if (!intent) return;
    try {
      await navigator.clipboard.writeText(intent.code);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {}
  };

  const paid = order?.paymentStatus === 'PAID';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans">
      {/* Left summary column */}
      <div className="w-1/2 h-full overflow-y-auto bg-[#2A2AD7] px-12 py-10 text-white flex flex-col items-end">
        <LogoFauves variant="white" width={140} className="self-end" />
        <div className="mt-10 bg-white text-indigo-950 rounded-2xl shadow-sm p-6 w-full max-w-md text-right">
          <div className="h-40 bg-zinc-300 rounded-xl mb-4" />
          <div className="space-y-1">
            <div className="font-semibold truncate" title={order?.eventName}>{order?.eventName || 'Evento'}</div>
            <div className="text-sm opacity-90">{order?.eventStartDate ? new Date(order.eventStartDate).toLocaleDateString('pt-BR') : 'Data indefinida'}</div>
          </div>
          <div className="border-t border-zinc-200 my-5" />
            <div className="text-[10px] tracking-wider font-medium text-indigo-950/70 text-left">RESUMO</div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="mr-4 flex-1 text-left">Total</span>
              <span className="min-w-20 text-right">{order ? formatBRL(order.totalAmount) : 'R$0,00'}</span>
            </div>
          <div className="mt-6 bg-yellow-50 text-yellow-800 rounded-xl p-4 text-xs leading-relaxed text-left">
            {expired ? 'Tempo expirado' : 'Pague dentro do tempo para garantir seus ingressos'}
          </div>
          {error && <div className="mt-5 text-sm text-red-600 bg-red-50 rounded-md p-3 text-left">{error}</div>}
          {paid && <div className="mt-5 text-sm text-green-700 bg-green-50 rounded-md p-3 text-left">Pagamento confirmado</div>}
          <div className="mt-auto" />
        </div>
        <div className="mt-auto pt-10 pb-4 text-xs opacity-70 text-right w-full">&copy; Fauves</div>
      </div>
      {/* Right payment column */}
      <div className="w-1/2 h-full overflow-hidden bg-white flex flex-col items-start">
        <div className="h-full w-full max-w-xl ml-0 py-10 pl-12 pr-16 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-indigo-950">Pagamento PIX</h1>
            <p className="text-sm text-indigo-900 mt-2 font-medium">Finalize copiando o código ou escaneando o QR.</p>
          </div>
          {expiresAt && !paid && !expired && (
            <div className="mb-6 rounded-md bg-yellow-50 text-yellow-800 p-4 text-xs">
              Reservado por <Countdown expiresAt={expiresAt} onExpire={onExpire} />.
            </div>
          )}
          {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
          {expired && !paid && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">Tempo expirado. Refaça a compra.</div>
          )}
          {paid && (
            <div className="mb-6 p-4 rounded-md bg-green-50 text-green-700 text-sm font-medium">Pagamento confirmado! Seus ingressos serão enviados.</div>
          )}
          <div className="flex gap-6 mb-10">
            <div className="w-56 h-56 rounded-xl bg-white border border-zinc-200 flex items-center justify-center">
              {qrDataUrl && !paid && !expired && <img src={qrDataUrl} alt="QR PIX" className="w-52 h-52" />}
              {(paid || expired) && <div className="text-xs text-indigo-950 px-2 text-center">{paid ? 'Confirmado' : 'Expirado'}</div>}
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-semibold mb-2 text-indigo-900">Chave / Código PIX</label>
              <textarea
                readOnly
                value={intent?.code || ''}
                className="w-full h-40 p-3 text-xs bg-zinc-100 rounded-md resize-none border border-zinc-200 focus:outline-none"
              />
              <div className="mt-2">
                <Button type="button" disabled={!intent || paid || expired} onClick={copyCode} className="text-xs px-3 py-2 h-8">
                  {copyOk ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />} {copyOk ? 'Copiado' : 'Copiar código'}
                </Button>
              </div>
            </div>
          </div>
          {!paid && !expired && (
            <div className="mb-8 rounded-md bg-indigo-950/5 p-5 text-xs text-indigo-950 leading-relaxed space-y-3">
              <div className="flex items-start gap-2"><span className="mt-0.5">📱</span><span>Abra o app do banco e entre na área PIX.</span></div>
              <div className="flex items-start gap-2"><span className="mt-0.5">💠</span><span>Escolha pagar com QR Code e escaneie.</span></div>
              <div className="flex items-start gap-2"><span className="mt-0.5">🔑</span><span>Ou copie o código e use "Pix Copia e Cola".</span></div>
            </div>
          )}
          <div className="flex gap-2.5 items-center justify-center px-4 py-2 mt-auto w-full text-[11px] rounded-md bg-indigo-950/5 min-h-[34px] text-indigo-900">
            <Shield className="w-3 h-3" />
            <div>Pagamento seguro e criptografado (simulação)</div>
          </div>
          {(expired || paid) && (
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={()=>navigate('/')}>Início</Button>
              {expired && <Button onClick={()=>navigate('/')}>Refazer compra</Button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
