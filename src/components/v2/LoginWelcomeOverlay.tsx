import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { resolveImageUrl } from '@/lib/apiBase';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';

type Palette = { primary: string; secondary: string; tertiary: string };

const hashHue = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = value.charCodeAt(index) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

const fallbackPalette = (key: string): Palette => {
  const hue = hashHue(key || 'fauves');
  return {
    primary: `hsl(${hue} 72% 58%)`,
    secondary: `hsl(${(hue + 48) % 360} 70% 56%)`,
    tertiary: `hsl(${(hue + 318) % 360} 66% 52%)`,
  };
};

const rgbToHsl = (red: number, green: number, blue: number) => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  if (max !== min) {
    const delta = max - min;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  return hue;
};

const paletteFromImage = (source: string, fallback: Palette, onPalette: (palette: Palette) => void) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;
      for (let index = 0; index < pixels.length; index += 16) {
        const alpha = pixels[index + 3];
        const brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
        if (alpha < 150 || brightness < 22 || brightness > 238) continue;
        red += pixels[index];
        green += pixels[index + 1];
        blue += pixels[index + 2];
        count += 1;
      }
      if (!count) return;
      const hue = rgbToHsl(red / count, green / count, blue / count);
      onPalette({
        primary: `hsl(${hue} 72% 58%)`,
        secondary: `hsl(${(hue + 44) % 360} 68% 57%)`,
        tertiary: `hsl(${(hue + 322) % 360} 66% 53%)`,
      });
    } catch {
      onPalette(fallback);
    }
  };
  image.src = source;
};

export default function LoginWelcomeOverlay() {
  const { loginWelcomeUser, dismissLoginWelcome } = useAuth();
  const reduceMotion = useReducedMotion();
  const userKey = loginWelcomeUser?.id || loginWelcomeUser?.email || 'fauves';
  const [palette, setPalette] = React.useState<Palette>(() => fallbackPalette(userKey));
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const rawAvatar = loginWelcomeUser?.photoUrl;
  const avatar = rawAvatar?.startsWith('/avatars/') ? rawAvatar : resolveImageUrl(rawAvatar);

  React.useEffect(() => setAvatarFailed(false), [avatar]);

  React.useEffect(() => {
    if (!loginWelcomeUser) return;
    const nextFallback = fallbackPalette(userKey);
    setPalette(nextFallback);
    if (avatar) paletteFromImage(avatar, nextFallback, setPalette);
  }, [loginWelcomeUser, userKey, avatar]);

  React.useEffect(() => {
    if (!loginWelcomeUser) return;
    const timer = window.setTimeout(dismissLoginWelcome, reduceMotion ? 1800 : 3300);
    return () => window.clearTimeout(timer);
  }, [loginWelcomeUser, dismissLoginWelcome, reduceMotion]);

  React.useEffect(() => {
    if (!loginWelcomeUser) return;
    return acquireDocumentScrollLock();
  }, [loginWelcomeUser]);

  const firstName = loginWelcomeUser?.name?.trim().split(/\s+/)[0]
    || loginWelcomeUser?.email?.split('@')[0]
    || 'Você';

  const itemMotion = (delay: number, y = 18) => ({
    initial: { opacity: 0, y, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: reduceMotion ? { duration: 0.15 } : { delay, duration: 0.62, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <AnimatePresence>
      {loginWelcomeUser && (
        <motion.div
          className="login-welcome-overlay"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.72, ease: 'easeInOut' }}
        >
          <style>{`
            .login-welcome-overlay { position:fixed; inset:0; z-index:30000; display:grid; place-items:center; overflow:hidden; isolation:isolate; background:rgba(16,18,18,.91); color:#fff; font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; backdrop-filter:blur(7px) saturate(.82); -webkit-backdrop-filter:blur(7px) saturate(.82); }
            .login-welcome-vignette { position:absolute; inset:0; z-index:-1; pointer-events:none; background:radial-gradient(circle at center,transparent 13%,rgba(4,6,7,.18) 58%,rgba(3,5,6,.48) 100%); }
            .login-welcome-stain { position:absolute; z-index:-2; width:min(640px,82vw); aspect-ratio:1; border-radius:44% 56% 61% 39% / 51% 43% 57% 49%; opacity:.72; filter:blur(40px) saturate(1.12); will-change:transform,border-radius; }
            .login-welcome-stain::before,.login-welcome-stain::after { content:""; position:absolute; inset:0; border-radius:inherit; }
            .login-welcome-stain::before { background:radial-gradient(circle at 45% 43%,${palette.primary} 0%,color-mix(in srgb,${palette.primary} 68%,transparent) 24%,transparent 63%); }
            .login-welcome-stain::after { inset:9% -6% -7% 7%; background:radial-gradient(circle at 62% 55%,${palette.secondary} 0%,color-mix(in srgb,${palette.secondary} 52%,transparent) 27%,transparent 67%),radial-gradient(circle at 26% 64%,${palette.tertiary} 0%,transparent 58%); mix-blend-mode:screen; }
            .login-welcome-content { display:flex; flex-direction:column; align-items:center; text-align:center; transform:translateY(-1vh); }
            .login-welcome-avatar { width:76px; height:76px; display:grid; place-items:center; overflow:hidden; margin-bottom:25px; border:2px solid rgba(255,255,255,.55); border-radius:50%; background:linear-gradient(145deg,${palette.primary},${palette.secondary}); box-shadow:0 14px 38px rgba(0,0,0,.28),0 0 42px color-mix(in srgb,${palette.primary} 42%,transparent); color:#fff; font-size:27px; font-weight:500; }
            .login-welcome-avatar img { width:100%; height:100%; object-fit:cover; }
            .login-welcome-title { margin:0; font-size:clamp(1.35rem,2.1vw,1.7rem); line-height:1.2; letter-spacing:-.026em; font-weight:600; text-shadow:0 2px 18px rgba(0,0,0,.2); }
            .login-welcome-name { margin-top:10px; color:rgba(255,255,255,.68); font-size:1.05rem; line-height:1.35; font-weight:400; letter-spacing:-.012em; }
            @media (max-width:640px) { .login-welcome-stain { width:126vw; } .login-welcome-avatar { width:70px; height:70px; margin-bottom:22px; } }
            @media (prefers-reduced-motion:reduce) { .login-welcome-stain { filter:blur(44px); } }
          `}</style>

          <motion.div
            className="login-welcome-stain"
            animate={reduceMotion ? undefined : {
              rotate: [0, 48, 118, 205, 292, 360],
              scale: [0.94, 1.04, 0.98, 1.06, 0.94],
              borderRadius: [
                '44% 56% 61% 39% / 51% 43% 57% 49%',
                '59% 41% 46% 54% / 43% 61% 39% 57%',
                '39% 61% 55% 45% / 58% 42% 58% 42%',
                '53% 47% 38% 62% / 47% 55% 45% 53%',
                '44% 56% 61% 39% / 51% 43% 57% 49%',
              ],
            }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          />
          <div className="login-welcome-vignette" />

          <div className="login-welcome-content">
            <motion.div className="login-welcome-avatar" {...itemMotion(0.16, 24)}>
              {avatar && !avatarFailed
                ? <img src={avatar} alt="" onError={() => setAvatarFailed(true)} />
                : <span>{firstName.charAt(0).toUpperCase()}</span>}
            </motion.div>
            <motion.h2 className="login-welcome-title" {...itemMotion(0.38, 17)}>Bem-vindo à Fauves</motion.h2>
            <motion.div className="login-welcome-name" {...itemMotion(0.58, 14)}>{firstName}</motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
