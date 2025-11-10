import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import LogoFauves from '@/components/LogoFauves';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { fetchApi } from '@/lib/apiBase';

type Ratings = {
  overall: number;
  lineup: number;
  sound: number;
  venue: number;
  security: number;
  accessibility: number;
};

const StarPicker: React.FC<{
  value: number;
  onChange: (n: number) => void;
  size?: number;
}> = ({ value, onChange, size = 32 }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="text-zinc-400 hover:text-amber-400 transition"
          aria-label={`${n} estrelas`}
        >
          <Star className={n <= value ? 'fill-amber-400 text-amber-400' : ''} width={size} height={size} />
        </button>
      ))}
    </div>
  );
};

export default function PublicSatisfactionForm() {
  const { id } = useParams();
  const eventId = id || null;
  const uid = useMemo(() => {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('uid');
    } catch {
      return null;
    }
  }, []);
  const { toast } = useToast();

  const [eventName, setEventName] = useState<string>('seu evento');
  const [alreadyAnswered, setAlreadyAnswered] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ratings, setRatings] = useState<Ratings>({ overall: 0, lineup: 0, sound: 0, venue: 0, security: 0, accessibility: 0 });
  const [comment, setComment] = useState<string>('');
  const readSurveyActive = (ev: any): boolean => {
    if (typeof ev?.surveyIsActive === 'boolean') return ev.surveyIsActive;
    if (typeof ev?.survey_is_active === 'boolean') return ev.survey_is_active;
    if (typeof ev?.survey_active === 'boolean') return ev.survey_active;
    return true;
  };
  const [surveyActive, setSurveyActive] = useState<boolean>(true);
  const showForm = surveyActive || loading;

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!eventId) return;
      setLoading(true);
      try {
        // Try combined endpoint that returns event + existing answer
        const qs = uid ? `?uid=${encodeURIComponent(uid)}` : '';
        let r = await fetchApi(`/api/surveys/event/${eventId}${qs}`);
        if (!r?.ok) {
          // Fallback to legacy event endpoint
          r = await fetchApi(`/api/event/${eventId}`);
          if (r?.ok) {
            const ev = await r.json();
            if (!mounted) return;
            setEventName(ev?.name || ev?.title || 'seu evento');
            setSurveyActive(readSurveyActive(ev));
          }
        } else {
          const payload = await r.json();
          if (!mounted) return;
          const ev = payload?.event || payload;
          setEventName(ev?.name || 'seu evento');
          setSurveyActive(readSurveyActive(ev));
          const ans = payload?.answer;
          if (ans) {
            setRatings({
              overall: Number(ans.overall) || 0,
              lineup: Number(ans.lineup) || 0,
              sound: Number(ans.sound) || 0,
              venue: Number(ans.venue) || 0,
              security: Number(ans.security) || 0,
              accessibility: Number(ans.accessibility) || 0,
            });
            setComment(ans.comment || '');
            setAlreadyAnswered(true);
          }
        }
      } catch {}
      finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const canSubmit = useMemo(() => ratings.overall > 0 && !alreadyAnswered && surveyActive, [ratings, alreadyAnswered, surveyActive]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        eventId,
        ratings,
        comment: comment.trim() || null,
        userId: uid || undefined,
      };
      const headers: any = { 'Content-Type': 'application/json' };
      if (uid) headers['x-user-id'] = uid;
      const r = await fetchApi('/api/surveys/answers', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!r?.ok) {
        const txt = await r.text().catch(() => '');
        toast({ title: 'Falha ao enviar', description: txt || 'Tente novamente em instantes.', variant: 'destructive' as any });
        return;
      }
      toast({ title: 'Obrigado pelo feedback!', description: 'Sua resposta foi registrada com sucesso.' });
      setAlreadyAnswered(true);
      setComment('');
      setRatings({ overall: 0, lineup: 0, sound: 0, venue: 0, security: 0, accessibility: 0 });
    } catch {
      toast({ title: 'Falha ao enviar', description: 'Tente novamente em instantes.', variant: 'destructive' as any });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <LogoFauves width={100} className="logo-fauves-mono" />

        {showForm ? (
          <>
            <h1 className="mt-12 text-4xl font-extrabold tracking-tight">Então, como foi <span className="border-b-2 border-zinc-300">{eventName}</span>?</h1>
            <p className="mt-6 text-zinc-600">Se quiser alterar sua resposta, volte ao email que enviamos.</p>

            <hr className="my-8 border-zinc-200" />

            <div className="text-zinc-600 text-sm">Agora, como você avaliaria...</div>

            <div className="mt-6 space-y-12">
              <div>
                <div className="flex items-center gap-2 text-2xl font-semibold"><span>⭐</span> Satisfação geral</div>
                <div className="text-zinc-600 mt-1">No geral, qual a sua satisfação com o evento?</div>
                <div className="mt-2"><StarPicker value={ratings.overall} onChange={(n) => setRatings((s) => ({ ...s, overall: n }))} /></div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-2xl font-semibold"><span>🎸</span> O Lineup</div>
                <div className="text-zinc-600 mt-1">Quanto você curtiu os artistas?</div>
                <div className="mt-2"><StarPicker value={ratings.lineup} onChange={(n) => setRatings((s) => ({ ...s, lineup: n }))} /></div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-2xl font-semibold"><span>🔊</span> O Sound System</div>
                <div className="text-zinc-600 mt-1">Como estava o sistema de som?</div>
                <div className="mt-2"><StarPicker value={ratings.sound} onChange={(n) => setRatings((s) => ({ ...s, sound: n }))} /></div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-2xl font-semibold"><span>🎪</span> O Local</div>
                <div className="text-zinc-600 mt-1">Cenografia, estrutura, capacidade...</div>
                <div className="mt-2"><StarPicker value={ratings.venue} onChange={(n) => setRatings((s) => ({ ...s, venue: n }))} /></div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-2xl font-semibold"><span>🛡️</span> A Segurança</div>
                <div className="text-zinc-600 mt-1">Quão seguro(a) você se sentiu?</div>
                <div className="mt-2"><StarPicker value={ratings.security} onChange={(n) => setRatings((s) => ({ ...s, security: n }))} /></div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-2xl font-semibold"><span>📍</span> Acessibilidade (localização)</div>
                <div className="text-zinc-600 mt-1">Foi fácil chegar até lá?</div>
                <div className="mt-2"><StarPicker value={ratings.accessibility} onChange={(n) => setRatings((s) => ({ ...s, accessibility: n }))} /></div>
              </div>
            </div>

            <hr className="my-8 border-zinc-200" />

            <div>
              <div className="text-2xl font-semibold">Mais algum comentário que gostaria de compartilhar?</div>
              <div className="text-zinc-600 text-sm">O microfone é seu 🎤😊</div>
              <textarea
                className="mt-3 w-full min-h-[120px] rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 p-3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva aqui"
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="text-zinc-600 text-sm">
                {alreadyAnswered ? 'Você já enviou sua resposta.' : 'Obrigado pelo feedback!'}
              </div>
              <Button disabled={!canSubmit || submitting} onClick={handleSubmit} className="bg-black hover:bg-zinc-800 text-white">
                {submitting ? 'Enviando...' : alreadyAnswered ? 'Enviado' : 'Enviar'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <hr className="my-8 border-zinc-200" />

            <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <img
                  src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif"
                  alt="Emoji animado pensativo"
                  className="h-16 w-16"
                  loading="lazy"
                />
                <div>
                  <p className="text-xl font-semibold text-amber-900">Pesquisa indisponível</p>
                  <p className="mt-1 text-sm text-amber-800">
                    Este evento ainda não liberou o formulário de feedback. Volte mais tarde ou aguarde um novo convite.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
