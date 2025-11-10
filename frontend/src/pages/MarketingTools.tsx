import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/lib/apiBase';

type Coupon = {
  id: string;
  code: string;
  type: 'percent' | 'amount';
  amount: number;
  maxUses: number | null;
  used?: number;
  startDate?: string | null;
  endDate?: string | null;
  eventId?: string | null;
  active?: boolean;
};

type NewCoupon = {
  code: string;
  type: 'percent' | 'amount';
  amount: number;
  maxUses: number | null;
  startDate: string | null;
  endDate: string | null;
  eventId: string | null;
};

const emptyNewCoupon: NewCoupon = {
  code: '',
  type: 'percent',
  amount: 0,
  maxUses: null,
  startDate: null,
  endDate: null,
  eventId: null,
};

export default function MarketingTools() {
  const { toast } = useToast();
  const pushToast = (message: string, kind?: 'success' | 'error' | 'info') => {
    toast({
      title: kind === 'error' ? 'Erro' : kind === 'success' ? 'Sucesso' : 'Aviso',
      description: message,
      variant: (kind === 'error' ? 'destructive' : 'default') as any,
    });
  };

  const [tab, setTab] = React.useState<'coupons'>('coupons');
  const [loading, setLoading] = React.useState(false);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState<NewCoupon>({ ...emptyNewCoupon });
  const [codeStatus, setCodeStatus] = React.useState<'idle' | 'ok' | 'error'>('idle');

  const loadCoupons = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchApi('/api/coupons');
      if (!r.ok) throw new Error('Falha ao buscar cupons');
      const data = await r.json();
      const raw: any[] = Array.isArray(data)
        ? data
        : (data?.items || data?.data || data?.rows || []);
      const mapped: Coupon[] = raw.map((c: any) => ({
        id: String(c.id),
        code: String(c.code || ''),
        type: String(c.type).toUpperCase() === 'PERCENT' ? 'percent' : 'amount',
        amount: Number(c.value ?? c.amount ?? 0),
        maxUses: c.maxUses ?? null,
        used: c.used ?? 0,
        startDate: c.startsAt ?? c.startDate ?? null,
        endDate: c.endsAt ?? c.endDate ?? null,
        eventId: c.eventId ?? null,
        active: (c.status ?? 'ACTIVE') === 'ACTIVE',
      }));
      setCoupons(mapped);
    } catch (e) {
      pushToast('Não foi possível carregar os cupons', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCoupons().catch(() => {});
  }, [loadCoupons]);

  const onChangeCode = (v: string) => {
    const norm = v
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setForm((f) => ({ ...f, code: norm }));
    if (!norm) setCodeStatus('idle');
    else if (/^[A-Z0-9-]{3,}$/.test(norm)) setCodeStatus('ok');
    else setCodeStatus('error');
  };

  const submitCoupon = async () => {
    try {
      if (!form.code.trim()) {
        pushToast('Informe o código do cupom', 'error');
        return;
      }
      if (!form.eventId) {
        pushToast('Selecione ou informe o evento do cupom', 'error');
        return;
      }
      const payload: any = {
        eventId: form.eventId,
        code: form.code.trim().toUpperCase(),
        type: form.type === 'percent' ? 'PERCENT' : 'FIXED',
        value: Number(form.amount) || 0,
        maxUses: form.maxUses ?? null,
        startsAt: form.startDate || null,
        endsAt: form.endDate || null,
      };
      const r = await fetchApi('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        pushToast('Falha ao criar o cupom' + (t ? `: ${t}` : ''), 'error');
        return;
      }
      pushToast('Cupom criado com sucesso', 'success');
      setCreateOpen(false);
      setForm({ ...emptyNewCoupon });
      await loadCoupons();
    } catch (e) {
      pushToast('Erro ao criar o cupom', 'error');
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const r = await fetchApi(`/api/coupons/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      setCoupons((cs) => cs.filter((c) => c.id !== id));
      pushToast('Cupom excluído', 'success');
    } catch {
      pushToast('Falha ao excluir o cupom', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Cupons</h1>
        <div className="flex items-center gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="default">Criar cupom</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Novo cupom</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" value={form.code} onChange={(e) => onChangeCode(e.target.value)} placeholder="EXEMPLO10" />
                  {form.code && (
                    <div className={`mt-1 text-sm ${codeStatus === 'error' ? 'text-red-600' : codeStatus === 'ok' ? 'text-green-600' : 'text-slate-500'}`}>
                      {codeStatus === 'ok' ? 'Código válido' : codeStatus === 'error' ? 'Use letras, números ou hífen (mín. 3)' : 'O código aparecerá em maiúsculas'}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as 'percent' | 'amount' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentual (%)</SelectItem>
                      <SelectItem value="amount">Valor (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{form.type === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}</Label>
                  <Input
                    type="number"
                    value={String(form.amount)}
                    onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                    min={0}
                  />
                </div>

                <div>
                  <Label>Usos máximos</Label>
                  <Input
                    type="number"
                    value={form.maxUses == null ? '' : String(form.maxUses)}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setForm((f) => ({ ...f, maxUses: v === '' ? null : Math.max(0, Number(v)) }));
                    }}
                    placeholder="Ilimitado"
                  />
                </div>

                <div>
                  <Label>Início</Label>
                  <Input type="datetime-local" value={form.startDate || ''} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value || null }))} />
                </div>

                <div>
                  <Label>Fim</Label>
                  <Input type="datetime-local" value={form.endDate || ''} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || null }))} />
                </div>

                <div className="sm:col-span-2">
                  <Label>Evento</Label>
                  <Input value={form.eventId || ''} onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value || null }))} placeholder="ID do evento" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button onClick={submitCoupon} disabled={!form.code.trim()}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs placeholder for future expansion */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
          <button className={`px-3 py-1 rounded-md ${tab === 'coupons' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'}`} onClick={() => setTab('coupons')}>Cupons</button>
        </div>
      </div>

      {/* Coupons content */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212]">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-slate-900 dark:text-white text-[18px] font-semibold">Nenhum cupom criado</div>
            <div className="text-slate-500 dark:text-slate-400 text-[14px] mt-1">Crie seu primeiro cupom para oferecer descontos.</div>
            <div className="mt-4">
              <Button onClick={() => setCreateOpen(true)}>Criar cupom</Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {coupons.map((c) => {
              const active = c.active ?? true;
              const usos = `${c.used ?? 0}/${c.maxUses != null ? c.maxUses : '-'}`;
              const janela = [c.startDate ? new Date(c.startDate).toLocaleString('pt-BR') : null, c.endDate ? new Date(c.endDate).toLocaleString('pt-BR') : null]
                .filter(Boolean)
                .join(' - ');
              return (
                <div key={c.id} className="p-5 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-[#191919] transition">
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-slate-900 dark:text-white">{c.code}</div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400">
                      {c.type === 'percent' ? `${c.amount}%` : `R$ ${Number(c.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} • Usos: {usos}
                      {janela ? ` • ${janela}` : ''}
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-700'}`}>{active ? 'Ativo' : 'Inativo'}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => pushToast('Edição ainda não implementada')}>Editar</Button>
                    <Button variant="destructive" onClick={() => deleteCoupon(c.id)}>Excluir</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

