import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import HeaderV2 from '../components/v2/HeaderV2';
import FooterV2 from '../components/v2/FooterV2';
import { useParams } from 'react-router-dom';
import { fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { getEventTimezoneAndCity } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';
import { sanitizeRichHtml } from '@/lib/sanitizeHtml';
import EventRegistrationCard from '@/components/v2/EventRegistrationCard';

/* ─── HELPERS E CONFIGURAÇÕES DE TEMA ────────────────── */
const THEMES = [
    { id: 'minimal', fontFamily: 'Inter, sans-serif', bgColor: '#f7f8f9', baseRgb: '19, 21, 23', textColor: '#131517', mutedColor: '#737577', accentColor: '#000000' },
    { id: 'quantum', fontFamily: '"Space Mono", monospace', bgColor: '#000000', baseRgb: '255, 255, 255', textColor: '#ffffff', mutedColor: 'rgba(255, 255, 255, 0.6)', accentColor: '#ffffff' },
    { id: 'warp', fontFamily: '"Syne", sans-serif', bgColor: '#1a0b2e', baseRgb: '255, 255, 255', textColor: '#ffffff', mutedColor: 'rgba(255, 255, 255, 0.6)', accentColor: '#f43f5e' },
    { id: 'emoji', fontFamily: '"Comic Neue", cursive, sans-serif', bgColor: '#fffbea', baseRgb: '19, 21, 23', textColor: '#333333', mutedColor: '#666666', accentColor: '#f59e0b' },
    { id: 'confetti', fontFamily: '"Playfair Display", serif', bgColor: '#fdf4ff', baseRgb: '19, 21, 23', textColor: '#4a044e', mutedColor: '#86198f', accentColor: '#d946ef' },
    { id: 'pattern', fontFamily: 'Inter, sans-serif', bgColor: '#e0f2fe', baseRgb: '255, 255, 255', textColor: '#0c4a6e', mutedColor: '#0369a1', accentColor: '#0284c7' }
];

const QUANTUM_PRESETS: Record<string, { name: string, colors: string[] }> = {
    sonhador: { name: 'Sonhador', colors: ['#b4b6f9', '#d5b2f2', '#9ce4eb'] },
    verao: { name: 'Verão', colors: ['#a5c6f9', '#9edef6', '#fce19b'] },
    melao: { name: 'Melão', colors: ['#fca5a5', '#fde293', '#9fedbc'] },
    barbie: { name: 'Barbie', colors: ['#f9a8d4', '#f5a3c7', '#fecca2'] },
    por_do_sol: { name: 'Pôr do Sol', colors: ['#fde185', '#fdb682', '#fca1a1'] },
    oceano: { name: 'Oceano', colors: ['#a3ecf4', '#9dd6fc', '#a7cbfa'] },
    floresta: { name: 'Floresta', colors: ['#adebd0', '#b0f0c9', '#a0ecdd'] },
    lavanda: { name: 'Lavanda', colors: ['#dfbef7', '#caa3f7', '#f5b6dc'] },
};

const hexToHsl = (hex: string) => {
    if (!hex || hex.length < 6) return null;
    try {
        const clean = hex.startsWith('#') ? hex.slice(1) : hex;
        const r = parseInt(clean.slice(0, 2), 16) / 255;
        const g = parseInt(clean.slice(2, 4), 16) / 255;
        const b = parseInt(clean.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    } catch { return null; }
};

const hslToRgbString = (h: number, s: number, l: number) => {
    const sFraction = s / 100;
    const lFraction = l / 100;
    const c = (1 - Math.abs(2 * lFraction - 1)) * sFraction;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lFraction - c / 2;
    let r1 = 0, g1 = 0, b1 = 0;
    if (h < 60) { r1 = c; g1 = x; }
    else if (h < 120) { r1 = x; g1 = c; }
    else if (h < 180) { g1 = c; b1 = x; }
    else if (h < 240) { g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; b1 = c; }
    else { r1 = c; b1 = x; }
    return `${Math.round((r1 + m) * 255)}, ${Math.round((g1 + m) * 255)}, ${Math.round((b1 + m) * 255)}`;
};

const deriveColorPalette = (hex: string) => {
    const hsl = hexToHsl(hex);
    if (!hsl) return null;
    const { h } = hsl;
    const sBase = Math.max(hsl.s, 40);
    const sText = Math.min(sBase * 0.7, 55);
    return {
        bg: `hsl(${h}, ${Math.min(sBase * 0.5, 35)}%, 94%)`,
        text: `hsl(${h}, ${sText}%, 22%)`,
        muted: `hsl(${h}, ${Math.min(sBase * 0.5, 45)}%, 42%)`,
        accent: `hsl(${h}, ${Math.min(sBase * 1.2, 75)}%, 48%)`,
        baseRgb: hslToRgbString(h, sText, 22),
    };
};

const getPastelColor = (hex: string) => {
    const hsl = hexToHsl(hex);
    if (!hsl) return hex;
    return `hsl(${hsl.h}, ${Math.min(hsl.s * 0.5, 35)}%, 94%)`;
};

const getDeepColor = (hex: string) => {
    const hsl = hexToHsl(hex);
    if (!hsl) return '#000000';
    return `hsl(${hsl.h}, ${Math.min(hsl.s, 80)}%, 6%)`;
};

const getThemeTextColor = (hex: string, isDark: boolean) => {
    if (isDark) return '#ffffff';
    const hsl = hexToHsl(hex);
    if (!hsl) return '#000000';
    return `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)`;
};

const getAppleEmojiUrl = (emoji: string): string => {
    try {
        const codePoints = [...emoji]
            .map(char => char.codePointAt(0)?.toString(16))
            .filter(Boolean)
            .join('-');
        return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${codePoints}.png`;
    } catch (e) {
        return '';
    }
};

const EventPageV2: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for ticket selection
  const [ticketCounts, setTicketCounts] = useState<{ [key: string]: number }>({});

  // Checkout States
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutCpf, setCheckoutCpf] = useState('');
  const [customAnswers, setCustomAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  // Luma Exclusive Checkout States
  const [isEditingName, setIsEditingName] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [tempCheckoutName, setTempCheckoutName] = useState('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCheckoutCoupon, setAppliedCheckoutCoupon] = useState<any>(null);
  const [applyingCheckoutCoupon, setApplyingCheckoutCoupon] = useState(false);
  const [checkoutCouponError, setCheckoutCouponError] = useState('');
  
  // Pix Payment States
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [pixIntent, setPixIntent] = useState<any>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  // Pre-select first ticket type when event loads
  useEffect(() => {
    if (event?.ticketTypes && event.ticketTypes.length > 0) {
      const initialCounts: { [key: string]: number } = {};
      const publicTicketTypes = event.ticketTypes.filter((ticket: any) => !ticket.isPrivate);
      publicTicketTypes.forEach((tt: any, index: number) => {
        initialCounts[tt.id] = index === 0 ? 1 : 0;
      });
      setTicketCounts(initialCounts);
    }
  }, [event]);

  // Pre-fill user profile fields if logged in
  useEffect(() => {
    if (user) {
      setCheckoutName(user.name || '');
      setCheckoutEmail(user.email || '');
      setCheckoutPhone(user.phone || '');
      setCheckoutCpf(user.cpf || '');
    }
  }, [user]);

  // Referência para o canvas de confete do tema Confetti
  const confettiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const warpCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const quantumCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const emojiCanvasRef = React.useRef<HTMLCanvasElement>(null);

  // Efeito de Animação de Confete do Tema Confete
  React.useEffect(() => {
    const themeId = event?.themeId || 'minimal';
    if (themeId !== 'confetti') return;

    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const customColor = event?.customColor || null;
    const customStyle = event?.customStyle || 'Padrão';

    const colors = (() => {
      const hex = customColor || '#d946ef';
      const hsl = hexToHsl(hex);
      if (!hsl) return [hex, '#ec4899', '#f472b6', '#db2777', '#fbcfe8'];
      const { h, s, l } = hsl;
      return [
        `hsl(${h}, ${s}%, ${l}%)`,
        `hsl(${h}, ${Math.max(s - 15, 30)}%, ${Math.min(l + 12, 75)}%)`,
        `hsl(${h}, ${Math.min(s + 15, 95)}%, ${Math.max(l - 12, 35)}%)`,
        `hsl(${(h + 20) % 360}, ${Math.min(s + 10, 90)}%, ${Math.min(l + 5, 65)}%)`,
        `hsl(${(h - 20 + 360) % 360}, ${Math.min(s + 10, 90)}%, ${Math.min(l + 5, 65)}%)`,
      ];
    })();

    interface ConfettiParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      twist: number;
      twistSpeed: number;
      opacity: number;
      gravity: number;
      shape: string;
    }

    const particles: ConfettiParticle[] = [];

    function createParticle(side: 'left' | 'right'): ConfettiParticle {
      const isLeft = side === 'left';
      const size = 32 + Math.random() * 32; 
      const shape = customStyle === 'Estrela' ? 'Estrela' :
                    customStyle === 'Coração' ? 'Coração' :
                    customStyle === 'Círculo' ? 'Círculo' : 'Festa';

      const x = isLeft 
        ? (40 + Math.random() * 120) 
        : (width - 160 - Math.random() * 120);

      const y = height + 40 + Math.random() * 140; 

      const vx = (Math.random() - 0.5) * 1.2;
      const vy = -(5.0 + Math.random() * 4.2);

      return {
        x,
        y,
        vx,
        vy,
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.025,
        twist: Math.random() * Math.PI * 2,
        twistSpeed: 0.015 + Math.random() * 0.02,
        opacity: 1,
        gravity: 0.045 + Math.random() * 0.035,
        shape
      };
    }

    function triggerBurst(side: 'left' | 'right', count: number) {
      if (document.hidden) return; // Não gera partículas em segundo plano
      if (particles.length > 300) return; // Limite defensivo para evitar travamento
      for (let k = 0; k < count; k++) {
        particles.push(createParticle(side));
      }
    }

    const runBurstCycle = () => {
      if (document.hidden) return; // Não inicia se a página estiver oculta
      triggerBurst('left', 80 + Math.floor(Math.random() * 30));
      const timeoutId = setTimeout(() => {
        if (document.hidden) return;
        triggerBurst('right', 80 + Math.floor(Math.random() * 30));
      }, 1500);
      return timeoutId;
    };

    let rightTimeoutId = runBurstCycle();

    const intervalId = setInterval(() => {
      rightTimeoutId = runBurstCycle();
    }, 7500);

    // Ouvinte de visibilidade para limpar partículas em segundo plano imediatamente
    const handleVisibilityChange = () => {
      if (document.hidden) {
        particles.length = 0; // Limpa o array de partículas liberando memória
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;
      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath();
      const d = size;
      c.moveTo(x + d / 2, y + d / 4);
      c.bezierCurveTo(x + d / 2, y, x, y, x, y + d / 2);
      c.bezierCurveTo(x, y + d * 0.75, x + d / 2, y + d, x + d / 2, y + d);
      c.bezierCurveTo(x + d / 2, y + d, x + d, y + d * 0.75, x + d, y + d / 2);
      c.bezierCurveTo(x + d, y, x + d / 2, y, x + d / 2, y + d / 4);
      c.closePath();
      c.fill();
    };

    const drawStreamer = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rot: number, tw: number) => {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.scale(Math.sin(tw), 1);
      c.beginPath();
      c.moveTo(-w / 2, -h / 2);
      c.quadraticCurveTo(w / 2, -h / 4, -w / 2, 0);
      c.quadraticCurveTo(w / 2, h / 4, -w / 2, h / 2);
      c.lineTo(w / 2, h / 2);
      c.quadraticCurveTo(-w / 2, h / 4, w / 2, 0);
      c.quadraticCurveTo(-w / 2, -h / 4, w / 2, -h / 2);
      c.closePath();
      c.fill();
      c.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += p.gravity;
        p.vx += Math.sin(p.twist) * 0.03;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.twist += p.twistSpeed;
        p.opacity -= 0.0013;

        if (p.y < -50 || p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'Círculo') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'Estrela') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          drawStar(ctx, 0, 0, 5, p.size / 2, p.size / 4);
        } else if (p.shape === 'Coração') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
        } else {
          drawStreamer(ctx, p.x, p.y, p.size * 0.4, p.size * 0.9, p.rotation, p.twist);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      clearInterval(intervalId);
      clearTimeout(rightTimeoutId);
    };
  }, [event]);


  // Polling to check payment status
  const startCheckingPayment = (orderId: string) => {
    setIsCheckingPayment(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 60) { // Stop after 5 minutes
        clearInterval(interval);
        setIsCheckingPayment(false);
        return;
      }
      
      try {
        const res = await fetchApi(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paymentStatus === 'PAID') {
            setIsPaymentSuccess(true);
            setIsCheckingPayment(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status do pagamento:', err);
      }
    }, 5000);
  };

  const validateCheckoutCoupon = async (rawCode: string) => {
    const normalizedCode = rawCode.trim().toUpperCase();
    if (!normalizedCode || !event?.id) return;
    setApplyingCheckoutCoupon(true);
    setCheckoutCouponError('');
    try {
      const response = await fetchApi('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode, eventId: event.id }),
      });
      if (!response.ok) throw new Error('Cupom inválido ou expirado.');
      const coupon = await response.json();
      setAppliedCheckoutCoupon(coupon);
      setCouponCode(coupon.code || normalizedCode);
      setIsAddingCoupon(false);
    } catch (error: any) {
      setAppliedCheckoutCoupon(null);
      setCheckoutCouponError(error.message || 'Não foi possível aplicar o cupom.');
    } finally {
      setApplyingCheckoutCoupon(false);
    }
  };

  const handleOpenCheckout = (accessCouponCode?: string) => {
    const selectedTickets = Object.entries(ticketCounts).filter(([_, qty]) => qty > 0);
    if (selectedTickets.length === 0) {
      const firstPublicTicket = event?.ticketTypes?.find((ticket: any) => !ticket.isPrivate);
      if (firstPublicTicket) {
        const firstId = firstPublicTicket.id;
        setTicketCounts({ [firstId]: 1 });
      } else {
        alert('Insira um código de acesso válido para liberar este ingresso.');
        return;
      }
    }
    
    setCheckoutError(null);
    setCreatedOrder(null);
    setPixIntent(null);
    setIsPaymentSuccess(false);
    setAgreedToTerms(false);
    setShowTermsError(false);
    setIsEditingName(false);
    setIsAddingCoupon(false);
    setCouponCode(accessCouponCode || '');
    setAppliedCheckoutCoupon(null);
    setCheckoutCouponError('');
    setIsCheckoutModalOpen(true);
    if (accessCouponCode) void validateCheckoutCoupon(accessCouponCode);
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    if (!agreedToTerms) {
      setShowTermsError(true);
      setCheckoutError('Você deve concordar com os termos do evento para continuar.');
      return;
    }
    
    if (!user) {
      if (!checkoutName.trim()) {
        setCheckoutError('Por favor, insira seu nome completo.');
        return;
      }
      if (!checkoutEmail.trim()) {
        setCheckoutError('Por favor, insira seu endereço de e-mail.');
        return;
      }
    }
    
    const phoneToUse = user?.phone || checkoutPhone;
    const cpfToUse = user?.cpf || checkoutCpf;
    
    if (!phoneToUse.trim()) {
      setCheckoutError('Por favor, insira seu celular para contato.');
      return;
    }
    if (!cpfToUse.trim()) {
      setCheckoutError('Por favor, insira seu CPF para emissão do ingresso.');
      return;
    }
    
    const questions = event.registrationForm?.customQuestions || [];
    for (const q of questions) {
      if (q.required && !customAnswers[q.id]?.trim()) {
        setCheckoutError(`Por favor, responda à pergunta: "${q.label}"`);
        return;
      }
    }
    
    setIsSubmitting(true);
    setCheckoutError(null);
    
    try {
      const items = Object.entries(ticketCounts)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketTypeId, qty]) => ({
          ticketTypeId,
          quantity: qty
        }));
        
      const payload = {
        eventId: event.id,
        purchaserName: checkoutName.trim(),
        purchaserEmail: user ? user.email : checkoutEmail.trim(),
        purchaserPhone: phoneToUse,
        purchaserCpf: cpfToUse,
        answers: customAnswers,
        items,
        paymentMethod: 'PIX',
        couponCode: couponCode.trim() || undefined
      };
      
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'x-user-id': user.id } : {})
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao criar o pedido de ingressos.');
      }
      
      const orderData = await res.json();
      setCreatedOrder(orderData);
      
      // If it's a free event, totalAmount is 0
      if (orderData.totalAmount === 0) {
        setIsPaymentSuccess(true);
        setIsSubmitting(false);
        return;
      }
      
      // Request Pix payment intent
      const pixRes = await fetchApi(`/api/orders/${orderData.id}/pix-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'x-user-id': user.id } : {})
        },
        body: JSON.stringify({
          purchaserPhone: phoneToUse,
          purchaserTaxId: cpfToUse.replace(/\D/g, ''),
          purchaserEmail: user?.email || checkoutEmail,
          purchaserName: checkoutName || user?.name
        })
      });
      
      if (!pixRes.ok) {
        const pixError = await pixRes.json().catch(() => ({}));
        throw new Error(pixError.message || 'Falha ao gerar QR Code do Pix.');
      }
      
      const pixData = await pixRes.json();
      setPixIntent(pixData);
      startCheckingPayment(orderData.id);
      
    } catch (err: any) {
      setCheckoutError(err.message || 'Ocorreu um erro ao processar sua inscrição.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId!);
        const endpoint = isUUID
          ? `/api/event/${slugOrId}`
          : `/api/event/slug/${slugOrId}`;

        // 🚀 Fetch event first (need ID for ticket-type fetch)
        let res = await fetchApi(endpoint);

        // Fallback by ID only if slug failed — single attempt, no double sequential
        if (!res.ok && !isUUID) {
          res = await fetchApi(`/api/event/${slugOrId}`);
        }

        if (!res.ok) throw new Error('Evento não encontrado');
        const data = await res.json();
        const eventId = data.id || data._id;

        // 🚀 Fetch ticket types in PARALLEL (no longer waiting after event data is ready)
        const ticketTypesPromise = fetchApi(`/api/ticket-type/event/${eventId}`)
          .then(r => r.ok ? r.json() : [])
          .catch(() => []);

        const ticketTypesList = await ticketTypesPromise;

        // Formatação de data
        const d = new Date(data.startDate);
        const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
         const info = getEventTimezoneAndCity(
            data.locationAddress || data.location || "",
            data.location === "Evento online" || data.location?.startsWith('Virtual:')
        );
        const time = `${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ${info.gmt}`;
        
        // Mapeamento para o formato esperado pelo UI
        const mappedEvent = {
          ...data,
          ticketTypes: ticketTypesList.length > 0 ? ticketTypesList : (data.ticketTypes || []),
          id: eventId,
          name: data.name,
          registrationForm: data.registrationForm ? (typeof data.registrationForm === 'string' ? JSON.parse(data.registrationForm) : data.registrationForm) : null,
          image: resolveImageUrl(data.bannerUrl || data.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'),
          host: {
            name: data.organization?.name || "Organização",
            avatar: resolveImageUrl(data.organization?.logoUrl || data.organization?.logo || "https://cdn.lu.ma/avatars-default/community_avatar_12.png"),
          },
          organizer: {
            name: data.organizer?.name || data.organization?.name || "Organizador",
            avatar: resolveImageUrl(data.organizer?.avatar || data.organization?.logoUrl || "https://cdn.lu.ma/avatars-default/avatar_25.png"),
            email: data.organizer?.email || ""
          },
          location: (() => {
            const isVirtual = data.location === "Evento online" || (data.location && data.location.startsWith("Virtual:"));
            if (isVirtual) {
              const url = data.onlineUrl || (data.location && data.location.startsWith("Virtual:") ? data.location.replace(/^Virtual:\s*/, "") : "");
              return {
                name: "Transmissão Online",
                address: url || "Link online",
                city: "Online",
                isVirtual: true
              };
            }

            // TBD (a ser anunciado)
            if (data.location === "Local será anunciado em breve" || (data.location && data.location.startsWith("Local será anunciado"))) {
              const city = data.locationCity || "";
              const uf = data.locationState || data.locationUf || "";
              const cityState = city ? (uf ? `${city} - ${uf}` : city) : "";
              return {
                name: "Local será anunciado",
                address: cityState,
                city: cityState,
                isVirtual: false
              };
            }

            // Presencial
            const rawAddress = data.locationAddress || (data.location !== "Local" ? data.location : "") || "";
            const parts = rawAddress.split(',');
            const parsedName = data.locationName || data.venue || (parts.length > 0 && parts[0] ? parts[0].trim() : "Local Presencial");
            
            let cityState = "";
            const apiCity = data.locationCity || data.city || "";
            const apiState = data.locationState || data.state || data.locationUf || data.uf || "";
            
            if (apiCity) {
              cityState = apiCity + (apiState ? ` - ${apiState}` : '');
            } else if (rawAddress) {
              const match = rawAddress.match(/([^,]+?\s*-\s*[A-Z]{2})/);
              if (match) {
                cityState = match[1].trim();
              } else {
                if (parts.length > 1) {
                  const last = parts[parts.length - 1].trim();
                  if ((last.toLowerCase() === 'brasil' || /^\d{5}/.test(last)) && parts.length > 2) {
                    cityState = parts[parts.length - 3].trim() + (parts[parts.length - 2] ? ' - ' + parts[parts.length - 2].trim() : '');
                  } else {
                    cityState = parts[parts.length - 2].trim();
                  }
                } else {
                  cityState = rawAddress.trim();
                }
              }
            }

            return {
              name: parsedName,
              address: rawAddress || "Endereço não disponível",
              city: cityState,
              isVirtual: false
            };
          })(),
          date: {
            day: d.getDate().toString(),
            month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
            weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
            time: time
          },
          latitude: data.locationLatitude || data.latitude || "-3.7196115",
          longitude: data.locationLongitude || data.longitude || "-38.530061599999996",
          description: data.descriptionHtml || data.description || data.content || ""
        };
        
        setEvent(mappedEvent);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slugOrId) loadEvent();
  }, [slugOrId]);

  useEffect(() => {
    if (!event?.id) return;
    try {
      const viewKey = `event-view:${event.id}`;
      const previousView = Number(sessionStorage.getItem(viewKey) || 0);
      if (Date.now() - previousView < 30 * 60 * 1000) return;
      sessionStorage.setItem(viewKey, String(Date.now()));

      let sessionId = localStorage.getItem('FAUVES_ANALYTICS_SESSION');
      if (!sessionId) {
        sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('FAUVES_ANALYTICS_SESSION', sessionId);
      }
      const params = new URLSearchParams(window.location.search);
      const referralCode = params.get('ref');
      let source = 'Direto';
      if (referralCode) source = 'Indicação';
      else if (document.referrer) {
        const referrer = new URL(document.referrer);
        source = referrer.hostname === window.location.hostname ? 'Fauves' : referrer.hostname.replace(/^www\./, '');
      }
      fetchApi(`/api/event-metrics/increment/${event.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          utmSource: params.get('utm_source') || (referralCode ? `ref:${referralCode}` : null),
          sessionId,
        }),
      }).catch(() => undefined);
    } catch {
      // Métricas nunca devem impedir a abertura da página pública.
    }
  }, [event?.id]);

  // 🚀 Memoize all theme/color computations — avoids recalculating on every re-render
  const pageTheme = useMemo(() => {
    const themeId = event?.themeId || 'minimal';
    const customColor = event?.customColor || null;
    const customFont = event?.customFont || null;
    const customStyle = event?.customStyle || 'Padrão';
    const customDisplay = event?.customDisplay || 'Automático';
    const selectedEmoji = event?.selectedEmoji || '🥳';

    const systemIsDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
    const isDark = (themeId === 'warp')
      ? true
      : (customDisplay === 'Escuro' ? true : (customDisplay === 'Claro' ? false : (themeId === 'seasonal' ? false : systemIsDark)));

    const selectedTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const derivedPalette = customColor ? deriveColorPalette(customColor) : null;

    const baseRgb = isDark ? '255, 255, 255'
      : (themeId === 'warp' ? '255, 255, 255'
        : (themeId === 'quantum' ? '19, 21, 23'
          : (derivedPalette ? derivedPalette.baseRgb
            : (customColor ? hslToRgbString(hexToHsl(customColor)?.h || 0, hexToHsl(customColor)?.s || 0, 22) : selectedTheme.baseRgb))));

    let bgColor = selectedTheme.bgColor;
    if (themeId === 'quantum') {
      const preset = QUANTUM_PRESETS[customStyle] || QUANTUM_PRESETS.sonhador;
      bgColor = isDark ? getDeepColor(preset.colors[0]) : '#ffffff';
    } else if (themeId === 'seasonal') {
      bgColor = customStyle === 'Floral' ? getPastelColor(customColor || selectedTheme.accentColor) : '#ffffff';
    } else if (themeId === 'warp') {
      bgColor = '#0a0a0f';
    } else if (derivedPalette) {
      bgColor = isDark ? getDeepColor(customColor || '#ffffff') : derivedPalette.bg;
    } else if (customColor) {
      bgColor = isDark ? getDeepColor(customColor) : getPastelColor(customColor);
    } else if (isDark) {
      bgColor = '#131517';
    }

    const textColor = themeId === 'warp' ? '#ffffff'
      : (themeId === 'quantum'
        ? (isDark ? '#ffffff' : (() => { const preset = QUANTUM_PRESETS[customStyle] || QUANTUM_PRESETS.sonhador; const hsl = hexToHsl(preset.colors[0]); return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)` : '#000000'; })())
        : (themeId === 'seasonal'
          ? (() => { const color = customColor || selectedTheme.accentColor; const hsl = hexToHsl(color); return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.7, 55)}%, 22%)` : '#000000'; })()
          : (isDark ? '#ffffff' : (derivedPalette ? derivedPalette.text : (customColor ? getThemeTextColor(customColor, false) : selectedTheme.textColor)))));

    const mutedColor = themeId === 'warp' ? 'rgba(255, 255, 255, 0.65)'
      : (themeId === 'quantum'
        ? (isDark ? 'rgba(255, 255, 255, 0.6)' : (() => { const preset = QUANTUM_PRESETS[customStyle] || QUANTUM_PRESETS.sonhador; const hsl = hexToHsl(preset.colors[0]); return hsl ? `hsl(${hsl.h}, ${Math.min(hsl.s * 0.5, 35)}%, 45%)` : '#666666'; })())
        : (derivedPalette ? derivedPalette.muted : (customColor ? getThemeTextColor(customColor, false) + 'A0' : selectedTheme.mutedColor)));

    const accentColor = themeId === 'quantum'
      ? (QUANTUM_PRESETS[customStyle] ? QUANTUM_PRESETS[customStyle].colors[0] : '#7b49ff')
      : (derivedPalette ? derivedPalette.accent : (customColor || selectedTheme.accentColor));

    const fontFamily = customFont || selectedTheme.fontFamily;
    const op2 = !isDark ? `rgba(${baseRgb}, 0.04)` : `rgba(${baseRgb}, 0.02)`;
    const op4 = !isDark ? `rgba(${baseRgb}, 0.08)` : `rgba(${baseRgb}, 0.04)`;
    const op8 = !isDark ? `rgba(${baseRgb}, 0.13)` : `rgba(${baseRgb}, 0.08)`;
    const op16 = !isDark ? `rgba(${baseRgb}, 0.22)` : `rgba(${baseRgb}, 0.16)`;
    const op32 = !isDark ? `rgba(${baseRgb}, 0.40)` : `rgba(${baseRgb}, 0.32)`;

    return { themeId, customColor, customFont, customStyle, customDisplay, selectedEmoji, isDark, selectedTheme, derivedPalette, baseRgb, bgColor, textColor, mutedColor, accentColor, fontFamily, op2, op4, op8, op16, op32 };
  }, [event?.themeId, event?.customColor, event?.customFont, event?.customStyle, event?.customDisplay, event?.selectedEmoji]);

  const pageThemeId = pageTheme.themeId;
  const pageCustomColor = pageTheme.customColor;
  const pageCustomFont = pageTheme.customFont;
  const pageCustomStyle = pageTheme.customStyle;
  const pageCustomDisplay = pageTheme.customDisplay;
  const pageSelectedEmoji = pageTheme.selectedEmoji;
  const pageSystemIsDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
  const pageIsDark = pageTheme.isDark;
  const pageSelectedTheme = pageTheme.selectedTheme;
  const pageDerivedPalette = pageTheme.derivedPalette;
  const pageBaseRgb = pageTheme.baseRgb;
  const pageBgColor = pageTheme.bgColor;
  const pageTextColor = pageTheme.textColor;
  const pageMutedColor = pageTheme.mutedColor;
  const pageAccentColor = pageTheme.accentColor;
  const pageFontFamily = pageTheme.fontFamily;
  const pageOp2 = pageTheme.op2;
  const pageOp4 = pageTheme.op4;
  const pageOp8 = pageTheme.op8;
  const pageOp16 = pageTheme.op16;
  const pageOp32 = pageTheme.op32;

  // Efeito de Túnel Espacial 3D Rotativo (Warp) — Arco-íris por ângulo
  React.useEffect(() => {
    if (pageThemeId !== 'warp') return;

    const canvas = warpCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const getBaseHue = (): number => {
      if (pageDerivedPalette) {
        const m = pageDerivedPalette.accent.match(/hsl\((\d+)/);
        if (m) return parseInt(m[1]);
      }
      if (pageCustomColor) {
        const hex = pageCustomColor.startsWith('#') ? pageCustomColor.slice(1) : pageCustomColor;
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max === min) return 0;
        const d = max - min;
        let h = 0;
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        return Math.round(h * 60);
      }
      return 300;
    };

    const baseHue = getBaseHue();
    const numStars = 280;

    interface Star {
      x: number;
      y: number;
      z: number;
      speed: number;
      hueOffset: number;
      history: { x: number, y: number, z: number }[];
    }

    const hasCustomColor = !!(pageCustomColor || pageDerivedPalette);
    const hueSpread = hasCustomColor ? 160 : 360;

    const stars: Star[] = [];
    for (let i = 0; i < numStars; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 450;
      const hueOffset = hasCustomColor
        ? ((angle / (Math.PI * 2)) * hueSpread) - hueSpread / 2
        : (angle / (Math.PI * 2)) * 360;
      stars.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        z: Math.random() * 1000,
        speed: 0.8 + Math.random() * 1.8,
        hueOffset,
        history: [],
      });
    }

    let globalRotation = 0;

    const animate = () => {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      const time = Date.now();
      const wave = Math.sin(time * 0.0006);
      const speedFactor = 2.4 + wave * 2.1;
      const angularSpeed = 0.00015 * speedFactor;
      globalRotation += angularSpeed;

      const cosA = Math.cos(angularSpeed);
      const sinA = Math.sin(angularSpeed);

      for (let i = 0; i < numStars; i++) {
        const star = stars[i];

        star.history.push({ x: star.x, y: star.y, z: star.z });
        if (star.history.length > 12) {
          star.history.shift();
        }

        star.z -= star.speed * speedFactor;

        const rx = star.x * cosA - star.y * sinA;
        const ry = star.x * sinA + star.y * cosA;
        star.x = rx;
        star.y = ry;

        if (star.z <= 0) {
          star.z = 1000;
          const angle = Math.random() * Math.PI * 2;
          const dist = 50 + Math.random() * 450;
          star.x = Math.cos(angle) * dist;
          star.y = Math.sin(angle) * dist;
          star.hueOffset = hasCustomColor
            ? ((angle / (Math.PI * 2)) * hueSpread) - hueSpread / 2
            : (angle / (Math.PI * 2)) * 360;
          star.history = [];
        }

        const points = [...star.history, { x: star.x, y: star.y, z: star.z }];
        
        for (let j = 0; j < points.length - 1; j++) {
          const p1 = points[j];
          const p2 = points[j + 1];

          const k1 = 140 / p1.z;
          const k2 = 140 / p2.z;

          const sx1 = cx + p1.x * k1;
          const sy1 = cy + p1.y * k1;
          const sx2 = cx + p2.x * k2;
          const sy2 = cy + p2.y * k2;

          if (
            sx1 >= 0 && sx1 <= width &&
            sy1 >= 0 && sy1 <= height &&
            sx2 >= 0 && sx2 <= width &&
            sy2 >= 0 && sy2 <= height
          ) {
            const hue = (baseHue + star.hueOffset + globalRotation * 12) % 360;
            const saturation = 85;
            const lightness = 65;

            const ratio = (j + 1) / points.length;
            const alpha = Math.min(k2 * 2.8, 0.95) * ratio;

            ctx.beginPath();
            ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
            ctx.lineWidth = Math.max(Math.min(2.5 * k2, 3.5) * ratio, 0.5);
            ctx.lineCap = 'round';
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();
          }
        }
      }

      // === EFEITO DE TV CRT ANTIGA / VÍDEO ORGÂNICO ===
      
      // 1. Ruído estático de grão analógico suave (CRT Noise)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.022)';
      for (let i = 0; i < 450; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        ctx.fillRect(rx, ry, 1.2, 1.2);
      }

      // 2. Scanlines Horizontais CRT Estilo Retrô
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Flicker Suave de Cintilação CRT a cada frame
      if (Math.random() > 0.88) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.007)';
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pageThemeId, pageCustomColor, pageDerivedPalette, pageIsDark]);

  // Efeito de Gradientes Fluidos Orgânicos (GradFlow) do Tema Quantum
  React.useEffect(() => {
    if (pageThemeId !== 'quantum') return;

    const canvas = quantumCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    let width = (canvas.width = window.innerWidth / 4);
    let height = (canvas.height = window.innerHeight / 4);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth / 4;
      height = canvas.height = window.innerHeight / 4;
    };

    window.addEventListener('resize', handleResize);

    const blobs = [
      { x: 0, y: 0, r: 90, color: '#6366f1' },
      { x: width, y: height, r: 110, color: '#ec4899' },
      { x: width / 2, y: 0, r: 95, color: '#a855f7' },
      { x: 0, y: height / 2, r: 85, color: '#2563eb' }
    ];

    const updateColors = () => {
      const presetColors = QUANTUM_PRESETS[pageCustomStyle]?.colors || ['#6366f1', '#ec4899', '#a855f7'];
      blobs[0].color = presetColors[0];
      blobs[1].color = presetColors[1] || presetColors[0];
      blobs[2].color = presetColors[2] || presetColors[0];
      blobs[3].color = presetColors[0] + '80';
    };

    const animate = () => {
      const time = Date.now();
      updateColors();

      const isDark = pageIsDark;
      const presetColors = QUANTUM_PRESETS[pageCustomStyle]?.colors || ['#6366f1', '#ec4899', '#a855f7'];
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = isDark ? getDeepColor(presetColors[0]) : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = isDark ? 'screen' : 'source-over';

      blobs.forEach((blob, idx) => {
        const angle = time * 0.0003 * (idx + 1) * 0.45;
        const radiusX = width * 0.28;
        const radiusY = height * 0.28;

        let targetX = width / 2 + Math.cos(angle) * radiusX;
        let targetY = height / 2 + Math.sin(angle * 1.3) * radiusY;

        blob.x += (targetX - blob.x) * 0.02;
        blob.y += (targetY - blob.y) * 0.02;

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, isDark ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pageThemeId, pageCustomStyle, pageIsDark]);

  // Efeito de Animação de Emojis Flutuantes do Tema Emoji
  React.useEffect(() => {
    if (pageThemeId !== 'emoji') return;

    const canvas = emojiCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const emojiToDraw = (pageSelectedEmoji && !pageSelectedEmoji.includes('í') && !pageSelectedEmoji.includes('Â')) 
        ? pageSelectedEmoji 
        : '🔥';

    const emojiCacheCanvas = document.createElement('canvas');
    const cacheSize = 64;
    emojiCacheCanvas.width = cacheSize;
    emojiCacheCanvas.height = cacheSize;
    const cacheCtx = emojiCacheCanvas.getContext('2d');

    const appleEmojiImg = new Image();
    appleEmojiImg.crossOrigin = 'anonymous';
    let isImageLoaded = false;

    appleEmojiImg.onload = () => {
      if (cacheCtx) {
        cacheCtx.clearRect(0, 0, cacheSize, cacheSize);
        cacheCtx.drawImage(appleEmojiImg, 0, 0, cacheSize, cacheSize);
        isImageLoaded = true;
      }
    };

    appleEmojiImg.src = getAppleEmojiUrl(emojiToDraw);

    const numParticles = 16;
    interface EmojiParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      scale: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      angle: number; 
      angleSpeed: number;
    }

    const particles: EmojiParticle[] = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push(createParticle(true));
    }

    function createParticle(init = false): EmojiParticle {
      const scale = 70 + Math.random() * 60;
      const opacity = 1.0;
      const rotation = Math.random() * Math.PI * 2;
      const rotationSpeed = (Math.random() - 0.5) * 0.007;
      const angle = Math.random() * Math.PI * 2;
      const angleSpeed = 0.003 + Math.random() * 0.006;

      let x = Math.random() * width;
      let y = Math.random() * height;
      let vx = (Math.random() - 0.5) * 0.38;
      let vy = (Math.random() - 0.5) * 0.38;

      if (pageCustomStyle === 'Chuva') {
        y = init ? Math.random() * height : -50;
        vy = 0.3 + Math.random() * 0.4; 
        vx = (Math.random() - 0.5) * 0.1;
      } else if (pageCustomStyle === 'Festa' || pageCustomStyle === 'Carnaval') {
        y = init ? Math.random() * height : height + 50;
        vy = -0.2 - Math.random() * 0.4; 
        vx = (Math.random() - 0.5) * 0.3;
      } else if (pageCustomStyle === 'Espiral') {
        x = width / 2;
        y = height / 2;
        const angleRad = Math.random() * Math.PI * 2;
        const speed = 0.15 + Math.random() * 0.25;
        vx = Math.cos(angleRad) * speed;
        vy = Math.sin(angleRad) * speed;
      } else {
        y = Math.random() * height;
        vx = (Math.random() - 0.5) * 0.38;
        vy = (Math.random() - 0.5) * 0.38;
      }

      return { x, y, vx, vy, scale, rotation, rotationSpeed, opacity, angle, angleSpeed };
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < numParticles; i++) {
        for (let j = i + 1; j < numParticles; j++) {
          const p1 = particles[i];
          const p2 = particles[j];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const r1 = p1.scale / 2;
          const r2 = p2.scale / 2;
          const minDist = r1 + r2;

          if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            p1.x -= nx * overlap * 0.5;
            p1.y -= ny * overlap * 0.5;
            p2.x += nx * overlap * 0.5;
            p2.y += ny * overlap * 0.5;

            const rvx = p2.vx - p1.vx;
            const rvy = p2.vy - p1.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal < 0) {
              const restitution = 0.85;
              const m1 = p1.scale;
              const m2 = p2.scale;

              let impulse = -(1 + restitution) * velAlongNormal;
              impulse /= (1 / m1 + 1 / m2);

              p1.vx -= (impulse / m1) * nx;
              p1.vy -= (impulse / m1) * ny;
              p2.vx += (impulse / m2) * nx;
              p2.vy += (impulse / m2) * ny;

              const tempRotSpeed = p1.rotationSpeed;
              p1.rotationSpeed = p2.rotationSpeed * 0.95;
              p2.rotationSpeed = tempRotSpeed * 0.95;
            }
          }
        }
      }

      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        p.rotation += p.rotationSpeed;
        p.angle += p.angleSpeed;

        if (pageCustomStyle === 'Chuva') {
          p.y += p.vy;
          p.x += p.vx + Math.sin(p.angle) * 0.15;
          if (p.y > height + 50) {
            particles[i] = createParticle(false);
            continue;
          }
        } else if (pageCustomStyle === 'Espiral') {
          p.x += p.vx;
          p.y += p.vy;
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const currentAngle = Math.atan2(p.vy, p.vx);
          const newAngle = currentAngle + 0.005; 
          p.vx = Math.cos(newAngle) * (speed * 1.002); 
          p.vy = Math.sin(newAngle) * (speed * 1.002);

          if (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50) {
            particles[i] = createParticle(false);
            continue;
          }
        } else if (pageCustomStyle === 'Festa' || pageCustomStyle === 'Carnaval') {
          p.y += p.vy;
          p.x += p.vx + Math.sin(p.angle) * 0.4;
          if (p.y < -50) {
            particles[i] = createParticle(false);
            continue;
          }
        } else {
          p.x += p.vx + Math.sin(p.angle) * 0.08;
          p.y += p.vy + Math.cos(p.angle) * 0.08;
        }

        const r = p.scale / 2;
        
        if (p.x - r < 0) {
          p.x = r;
          p.vx = -p.vx * 0.85;
        } else if (p.x + r > width) {
          p.x = width - r;
          p.vx = -p.vx * 0.85;
        }

        if (pageCustomStyle !== 'Chuva' && pageCustomStyle !== 'Festa' && pageCustomStyle !== 'Carnaval' && pageCustomStyle !== 'Espiral') {
          if (p.y - r < 0) {
            p.y = r;
            p.vy = -p.vy * 0.85;
          } else if (p.y + r > height) {
            p.y = height - r;
            p.vy = -p.vy * 0.85;
          }
        }

        if (isImageLoaded) {
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.drawImage(
            emojiCacheCanvas,
            -p.scale / 2,
            -p.scale / 2,
            p.scale,
            p.scale
          );
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pageThemeId, pageSelectedEmoji, pageCustomStyle]);

  if (loading) return (
    <div className="theme-root light" style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes shimmer { 0%,100%{opacity:.45} 50%{opacity:.85} }`}</style>
      {/* Skeleton Banner */}
      <div style={{ width: '100%', aspectRatio: '16/9', maxHeight: '420px', background: 'linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 50%, #f0f0f0 100%)', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Title skeleton */}
        <div style={{ height: '36px', width: '72%', background: '#ebebeb', borderRadius: '10px', marginBottom: '1rem', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: '20px', width: '45%', background: '#f0f0f0', borderRadius: '8px', marginBottom: '2rem', animation: 'shimmer 1.5s infinite' }} />
        {/* Date / Location row skeleton */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {[140, 180].map((w, i) => (
            <div key={i} style={{ height: '48px', width: `${w}px`, background: '#f0f0f0', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
        {/* Button skeleton */}
        <div style={{ height: '52px', width: '100%', background: '#ebebeb', borderRadius: '100px', marginBottom: '2.5rem', animation: 'shimmer 1.5s infinite' }} />
        {/* Description skeleton lines */}
        {[100, 90, 95, 80, 100, 70].map((w, i) => (
          <div key={i} style={{ height: '14px', width: `${w}%`, background: '#f4f4f4', borderRadius: '6px', marginBottom: '0.625rem', animation: 'shimmer 1.5s infinite' }} />
        ))}
      </div>
    </div>
  );

  if (error || !event) return (
    <div className="page-container flex-center" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffeff1', gap: '1rem' }}>
      <div style={{ color: '#bc3f57', fontSize: '1.25rem', fontWeight: 600 }}>{error || 'Evento não encontrado'}</div>
      <a href="/v2" className="btn lux-button" style={{ background: '#bc3f57', color: 'white', borderRadius: '30px', padding: '10px 20px', textDecoration: 'none' }}>Voltar ao início</a>
    </div>
  );

  return (
    <div 
      className={`theme-root ${pageIsDark ? 'dark dark-mode' : 'light'} jsx-65c223694556bb7f`}
      data-theme-warp={pageThemeId === 'warp' ? "true" : "false"}
      style={{
        ['--theme-bg' as any]: pageBgColor,
        ['--theme-text' as any]: pageTextColor,
        ['--theme-muted' as any]: pageMutedColor,
        ['--theme-accent' as any]: pageAccentColor,
        ['--theme-font' as any]: pageFontFamily,
        ['--black-opacity-2' as any]: pageOp2,
        ['--black-opacity-4' as any]: pageOp4,
        ['--black-opacity-8' as any]: pageOp8,
        ['--black-opacity-16' as any]: pageOp16,
        ['--black-opacity-32' as any]: pageOp32,
        fontFamily: pageFontFamily,
      }}
    >
      <HeaderV2 transparent={true} contentMaxWidth="960px" theme={pageIsDark ? 'dark' : 'light'} blueGlow={false} />

      <style>{`
        /* Override geral de acessibilidade para o Tema Warp (Sempre Escuro) */
        .theme-root[data-theme-warp="true"] {
          --black: #ffffff !important;
          --theme-text: #ffffff !important;
          --theme-muted: rgba(255, 255, 255, 0.65) !important;
          --white: #0a0a0f !important;
          --opacity-light: rgba(255, 255, 255, 0.03) !important;
          --opacity-8: rgba(255, 255, 255, 0.06) !important;
          --opacity-16: rgba(255, 255, 255, 0.10) !important;
          --opacity-32: rgba(255, 255, 255, 0.18) !important;
          
          --bg-opacity-32: rgba(255, 255, 255, 0.05) !important;
          --bg-opacity-16: rgba(255, 255, 255, 0.03) !important;
          --bg-opacity-48: rgba(255, 255, 255, 0.08) !important;
        }

        /* Garante que todos os textos herdem a cor branca e muted adequadas */
        .theme-root[data-theme-warp="true"] .event-title,
        .theme-root[data-theme-warp="true"] .row-title,
        .theme-root[data-theme-warp="true"] .presenter-name,
        .theme-root[data-theme-warp="true"] .ticket-type-btn .name,
        .theme-root[data-theme-warp="true"] .spark-content,
        .theme-root[data-theme-warp="true"] .spark-content * {
          color: #ffffff !important;
        }

        .theme-root[data-theme-warp="true"] .row-desc,
        .theme-root[data-theme-warp="true"] .title-label,
        .theme-root[data-theme-warp="true"] .presenter-label {
          color: rgba(255, 255, 255, 0.65) !important;
        }

        /* Override de alta fidelidade para o calendário no tema Warp (Branco e Glassmorphism) */
        .theme-root[data-theme-warp="true"] .calendar-card {
          border: none !important;
          background: rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: var(--backdrop-blur) !important;
          -webkit-backdrop-filter: var(--backdrop-blur) !important;
        }
        .theme-root[data-theme-warp="true"] .calendar-card .month {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        .theme-root[data-theme-warp="true"] .calendar-card .day {
          color: #ffffff !important;
        }

        /* Garante que os ícones do info rows fiquem brancos no tema Warp */
        .theme-root[data-theme-warp="true"] .event-info-rows .icon-container {
          color: #ffffff !important;
        }

        .theme-root {
          color: var(--black);
          --max-width: 820px;
          --max-width-wide-page: 960px;
          --max-width-extra-wide-page: 1080px;
          --horizontal-padding: 1rem;
          --border-radius: .5rem;
          --squircle-border-radius: 1rem;
          --card-border-radius: .75rem;
          --card-squircle-border-radius: 1.5rem;
          
          /* Luma Colors & Opacities herdadas dinamicamente */
          --white: #ffffff;
          --gray-10: #f7f8f9;
          --gray-20: #ebeced;
          --gray-30: #dee0e2;
          --gray-40: #d2d4d7;
          --gray-60: #939597;
          --gray-70: #737577;
          --black: var(--theme-text);
          --cranberry: var(--theme-accent);
          --brand-color: var(--theme-accent);
          
          --opacity-light: var(--black-opacity-2);
          --opacity-8: var(--black-opacity-8);
          --opacity-16: var(--black-opacity-16);
          --opacity-32: var(--black-opacity-32);
          
          /* No tema claro, as caixas usam fundo translúcido sutil da cor do texto */
          --bg-opacity-32: var(--black-opacity-4);
          --bg-opacity-16: var(--black-opacity-2);
          --bg-opacity-48: var(--black-opacity-8);
          
          --font: var(--theme-font);
          --title-font: var(--theme-font);
          --backdrop-blur: blur(24px);
          --card-backdrop-filter: blur(24px);
        }

        /* Overrides para o Dark Mode */
        .theme-root.dark {
          --white: #1e1f22;
          --black: #ffffff;
          --gray-10: rgba(255, 255, 255, 0.02);
          --gray-20: rgba(255, 255, 255, 0.04);
          --gray-30: rgba(255, 255, 255, 0.08);
          --gray-40: rgba(255, 255, 255, 0.12);
          --gray-60: rgba(255, 255, 255, 0.50);
          --gray-70: rgba(255, 255, 255, 0.65);
          
          --opacity-light: rgba(255, 255, 255, 0.03);
          --opacity-8: rgba(255, 255, 255, 0.06);
          --opacity-16: rgba(255, 255, 255, 0.10);
          --opacity-32: rgba(255, 255, 255, 0.18);
          
          --bg-opacity-32: rgba(255, 255, 255, 0.04);
          --bg-opacity-16: rgba(255, 255, 255, 0.02);
          --bg-opacity-48: rgba(255, 255, 255, 0.06);
        }

        /* Essential Layout Styles from Dump */
        .page-container {
          background: var(--theme-bg);
          min-height: 100vh;
          position: relative;
          padding-top: 60px;
        }

        .zm-container {
          max-width: 960px;
          margin: 0 auto;
        }

        .event-page-content-wrapper {
          display: flex;
          gap: 2rem;
          padding: 1rem;
        }

        .event-page-left {
          width: 330px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .event-page-right {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Cover Image Styles */
        .cover-with-glow {
          position: relative;
          z-index: 1;
        }

        .img-aspect-ratio {
          width: 100%;
          aspect-ratio: 1 / 1 !important;
          position: relative;
          overflow: hidden;
          border-radius: var(--card-border-radius);
        }

        .img-aspect-ratio img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        .cover-image-under {
          opacity: .2;
          filter: brightness(.8) blur(24px) saturate(1.2);
          position: absolute;
          top: 1rem;
          width: 100%;
          z-index: -1;
        }

        /* Registration Card Styles */
        .base-11-card {
          padding: 1rem;
          background-color: var(--bg-opacity-32);
          border: none;
          backdrop-filter: var(--backdrop-blur);
          border-radius: var(--card-border-radius);
          box-shadow: none;
        }

        .header {
          background-color: var(--opacity-light);
          margin: -1rem -1rem 1rem;
          padding: .5rem 1rem;
          border-top-left-radius: var(--card-border-radius);
          border-top-right-radius: var(--card-border-radius);
        }

        .title-label {
          font-family: var(--title-font) !important;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--theme-muted);
        }

        /* Ticket Button Styles */
        .ticket-type-btn {
          background-color: var(--opacity-light);
          width: 100%;
          padding: .75rem 1rem;
          border: 1px solid transparent;
          border-radius: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ticket-type-btn.selected {
          background-color: var(--bg-opacity-48);
          border-color: var(--theme-accent);
        }

        .ticket-type-btn .name {
          font-weight: 500;
          color: var(--theme-text);
        }

        /* Manage Card */
        .manage-card {
          border-radius: var(--card-border-radius);
          background-color: color-mix(in srgb, var(--theme-accent, #bc3f57) 14%, transparent) !important;
          color: color-mix(in srgb, var(--theme-accent, #bc3f57) 75%, black) !important; /* Modo claro: mistura com preto para dar contraste legível */
          border: none !important; /* Sem borda */
          backdrop-filter: var(--backdrop-blur) !important;
          -webkit-backdrop-filter: var(--backdrop-blur) !important;
          padding: .75rem .875rem;
          font-size: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .theme-root.dark .manage-card {
          color: color-mix(in srgb, var(--theme-accent, #bc3f57) 85%, white) !important; /* Modo escuro: mistura com branco */
        }

        /* Override específico do card administrativo para o tema Warp adaptado à cor de destaque */
        .theme-root[data-theme-warp="true"] .manage-card {
          background-color: color-mix(in srgb, var(--theme-accent, #bc3f57) 15%, transparent) !important;
          color: color-mix(in srgb, var(--theme-accent, #bc3f57) 85%, white) !important;
        }

        /* Hover interativo ultra-premium para o botão Gerenciar em todos os temas */
        .manage-card .lux-button {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease, opacity 0.2s ease !important;
          cursor: pointer !important;
        }
        .manage-card .lux-button:hover {
          filter: brightness(1.1) !important;
          transform: scale(1.04) !important;
        }
        .manage-card .lux-button:active {
          transform: scale(0.97) !important;
        }

        /* Main Title */
        .event-title {
          font-size: 3rem;
          font-family: var(--title-font) !important;
          font-weight: 700;
          line-height: 1.1;
          color: var(--black);
          margin: 0;
        }

        /* Visibility Pill */
        .visi-pill {
          backdrop-filter: var(--backdrop-blur);
          border-radius: .25rem;
          padding: .1875rem .625rem;
          font-size: 12px;
          font-weight: 500;
          background: linear-gradient(to right, #bc3f5721, #f39c1221);
          color: #bc3f57;
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }

        /* Rows */
        .icon-container {
          border: none;
          width: 2.5rem;
          height: 2.5rem;
          background-color: var(--bg-opacity-32);
          backdrop-filter: var(--backdrop-blur);
          -webkit-backdrop-filter: var(--backdrop-blur);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          box-shadow: none;
        }

        .row-container {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .event-info-rows {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .rounded-squircle {
          border-radius: var(--border-radius);
        }
        @supports (corner-shape: squircle) {
          .rounded-squircle {
            corner-shape: squircle;
            border-radius: var(--squircle-border-radius);
          }
        }

        .calendar-card {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          text-align: center;
        }

        .calendar-card .month {
          background-color: #bc3f5714;
          font-size: 9px;
          font-weight: 700;
          color: #bc3f57;
          text-transform: uppercase;
          white-space: nowrap;
          padding: 3px 0;
          line-height: 1;
        }

        .calendar-card .day {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 600;
          line-height: 1;
          color: var(--black);
          background: transparent;
        }

        .row-title {
          font-weight: 600;
          font-family: var(--title-font) !important;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .section-title {
          font-family: var(--title-font) !important;
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .presenter-label {
          font-family: var(--title-font) !important;
        }

        .presenter-name {
          font-family: var(--title-font) !important;
        }

        .content-card {
          margin: 0;
        }

        .event-page-content-wrapper .content-card {
          padding: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .event-page-content-wrapper .content-card > .content {
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
        }

        .content-card .card-title {
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--bg-opacity-16);
        }

        .content-card .title-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--theme-muted);
          letter-spacing: 0.01em;
        }

        .event-location-notice {
          display: flex;
          flex-direction: column;
          gap: .75rem;
          padding: .25rem 0;
          border: 0;
          border-radius: 0;
          background: transparent;
        }

        .event-location-notice.is-restricted {
          align-items: flex-start;
          justify-content: flex-start;
          min-height: 0;
          text-align: left;
        }

        .row-desc {
          color: var(--theme-muted);
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .flex-center-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fs-xxs {
          font-size: .75rem;
        }

        .text-tinted {
          color: var(--theme-muted);
        }

        .reduced-line-height {
          line-height: 1.15;
        }

        .fw-medium {
          font-weight: 500;
        }

        .text-ellipses {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ml-1 {
          margin-left: 0.25rem;
        }

        .visi-pill {
          -webkit-backdrop-filter: var(--backdrop-blur);
          backdrop-filter: var(--backdrop-blur);
          border-radius: .25rem;
          align-items: center;
          gap: .375rem;
          margin-bottom: .375rem;
          padding: .1875rem .625rem .1875rem .5rem;
          display: inline-flex;
        }

        .visi-pill.private {
          background: linear-gradient(to right, rgba(243, 26, 124, 0.1), rgba(255, 165, 0, 0.1));
          color: #f31a7c;
        }

        /* Rich Text Formatting (Spark Content) */
        .spark-content {
          font-size: 14px;
          line-height: 1.6;
          color: var(--black);
        }
        .spark-content p {
          margin-bottom: 1rem;
        }
        .spark-content p:last-child {
          margin-bottom: 0;
        }
        .spark-content ul, .spark-content ol {
          margin-left: 1.25rem;
          margin-bottom: 1rem;
        }
        .spark-content li {
          margin-bottom: 0.5rem;
        }
        .spark-content strong, .spark-content b {
          font-weight: 700;
        }
        .spark-content em, .spark-content i {
          font-style: italic;
        }

        .visi-pill.private .title {
          font-size: 13px;
          background: linear-gradient(to right, #f31a7c, #ff8a00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 600;
        }

        .visi-pill.private .icon svg {
          color: #f31a7c;
        }

        .fs-xs {
          font-size: var(--font-size-xs);
        }

        .svg-sm svg {
          width: 14px;
          height: 14px;
        }

        /* Counter */
        .count-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .count-button {
          width: 24px;
          height: 24px;
          background-color: var(--theme-accent, #bc3f57);
          color: white;
          border-radius: 4px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
          transition: opacity 0.2s, background-color 0.2s;
        }

        .count-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .count-button:disabled {
          background-color: var(--black-opacity-8, rgba(19, 21, 23, 0.08));
          color: var(--theme-muted, #707070);
          cursor: not-allowed;
          opacity: 0.4;
          box-shadow: none;
        }

        /* Primary Button */
        .lux-button.primary.solid {
          background-color: var(--theme-accent, #bc3f57);
          color: white;
          width: 100%;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          margin-top: 0.4rem;
          cursor: pointer;
        }

        @media (max-width: 650px) {
          .event-page-content-wrapper {
            flex-direction: column;
          }
          .event-page-left {
            width: 100%;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Luma Authentic Modal CSS */
        .lux-glass-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          background: rgba(247, 248, 249, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 4rem 2rem 2rem 2rem;
          overflow-y: auto;
        }

        .registration-overlay {
          background: transparent;
          width: 100%;
          max-width: 740px;
          display: flex;
          flex-direction: column;
          border: none;
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .registration-form-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          margin: 0;
        }

        .registration-overlay.two-panels .panels {
          display: flex;
          flex-direction: row-reverse;
          width: 100%;
          gap: 1.5rem;
        }

        .registration-overlay .right {
          width: 300px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          text-align: left;
        }

        .registration-overlay .left {
          flex: 1;
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .info-panel {
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          box-shadow: 0px 8px 30px rgba(19, 21, 23, 0.02), 0px 1px 3px rgba(19, 21, 23, 0.01);
          border: 1px solid rgba(19, 21, 23, 0.06);
          width: 100%;
        }

        .info-panel h2 {
          font-size: 1rem;
          font-weight: 700;
          color: #939597;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.25rem;
          margin-top: 0;
        }

        /* Input Styles Luma */
        .lux-input-wrapper {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
          width: 100%;
        }

        .lux-input-wrapper .inner-wrapper {
          background-color: rgba(19, 21, 23, 0.06);
          border-radius: 0.75rem;
          padding: 0.5rem 0.875rem;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .lux-input-wrapper .inner-wrapper:focus-within {
          background-color: white;
          border-color: var(--brand-color);
          box-shadow: 0 0 0 1px var(--brand-color);
        }

        .lux-input-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #737577;
          margin-bottom: 0.125rem;
          text-align: left;
        }

        .lux-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #131517;
          width: 100%;
          padding: 0.125rem 0;
        }

        .lux-input::placeholder {
          color: #a3a5a7;
        }

        /* Avatar */
        .avatar-wrapper {
          position: relative;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
        }

        /* Section titles */
        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #131517;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .fw-medium {
          font-weight: 500;
        }

        .text-tertiary-alpha {
          color: #737577;
        }

        .flex-row-reverse {
          flex-direction: row-reverse;
        }

        @media (max-width: 768px) {
          .lux-glass-overlay {
            padding: 2rem 1rem 1rem 1rem;
          }
          .registration-overlay.two-panels .panels {
            flex-direction: column-reverse;
            gap: 2rem;
          }
          .registration-overlay .right {
            width: 100%;
          }
        }
      `}</style>

      <div className="jsx-65c223694556bb7f page-container" style={{ position: 'relative' }}>
        {/* Padrão Geométrico se for o tema pattern */}
        {pageThemeId === 'pattern' && (
          <div className={`theme-pattern-bg pattern-${
            pageCustomStyle === 'Cruz' ? 'cross' :
            pageCustomStyle === 'Hipnótico' ? 'hypnotic' :
            pageCustomStyle === 'Plus' || pageCustomStyle === 'Padrão' ? 'plus' :
            pageCustomStyle === 'Poá' ? 'polkadot' :
            pageCustomStyle === 'Onda' ? 'wave' :
            pageCustomStyle === 'Zigzag' ? 'zigzag' :
            pageCustomStyle === 'Grade' ? 'grid' :
            pageCustomStyle === 'Diamante' ? 'diamond' : 'plus'
          }`} style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none', zIndex: 0 }} />
        )}

        {/* Efeito de Confete Canvas para o Tema Confetti */}
        <canvas 
          ref={confettiCanvasRef} 
          className="fixed inset-0 w-full h-full pointer-events-none" 
          style={{ 
            zIndex: 1,
            opacity: 1,
            display: pageThemeId === 'confetti' ? 'block' : 'none'
          }}
        />

        {/* Efeito de Warp Canvas para o Tema Warp */}
        <canvas 
          ref={warpCanvasRef} 
          className="fixed inset-0 w-full h-full pointer-events-none" 
          style={{ 
            zIndex: 1,
            opacity: 1,
            display: pageThemeId === 'warp' ? 'block' : 'none'
          }}
        />

        {/* Efeito de Quantum Canvas para o Tema Quantum */}
        <canvas 
          ref={quantumCanvasRef} 
          className="fixed inset-0 w-full h-full pointer-events-none" 
          style={{ 
            zIndex: 1,
            opacity: 1,
            display: pageThemeId === 'quantum' ? 'block' : 'none',
            filter: 'blur(60px)',
            WebkitFilter: 'blur(60px)'
          }}
        />

        {/* Efeito de Emoji Canvas para o Tema Emoji */}
        <canvas 
          ref={emojiCanvasRef} 
          className="fixed inset-0 w-full h-full pointer-events-none" 
          style={{ 
            zIndex: 1,
            opacity: 1,
            display: pageThemeId === 'emoji' ? 'block' : 'none'
          }}
        />

        <div className="jsx-3083722015 event-page-content-wrapper zm-container" style={{ position: 'relative', zIndex: 2 }}>

          {/* COLUNA ESQUERDA */}
          <div className="event-page-left">
            <div className="jsx-102428b8379b7b14 cover-with-glow" style={{ position: 'relative' }}>
              {/* Flores por trás do Cover (Estilo Floral do Tema Sazonal) */}
              {pageThemeId === 'seasonal' && (pageCustomStyle === 'Floral' || pageCustomStyle === 'Padrão') && (
                  <div className="absolute w-[460px] h-[460px] pointer-events-none z-0" style={{ transform: 'scale(1.18)', left: '-65px', top: '-65px' }}>
                      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full text-neutral-400 select-none pointer-events-none animate-fade-in">
                          {/* Grupo de Ramos e Folhas no Canto Inferior Esquerdo */}
                          <g transform="translate(60, 240) rotate(-15)">
                              <path d="M0 100 Q -30 40 -80 -10" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.25" />
                              <path d="M -30 70 C -45 60 -50 40 -35 35 C -20 30 -15 50 -30 70 Z" fill="#8fbc8f" opacity="0.75" />
                              <path d="M -50 45 C -65 35 -70 15 -55 10 C -40 5 -35 25 -50 45 Z" fill="#9bc49b" opacity="0.65" />
                              <path d="M -15 85 C -25 75 -20 55 -5 55 C 10 55 10 75 -15 85 Z" fill="#a2caa2" opacity="0.6" />
                              <circle cx="-35" cy="50" r="14" fill="var(--theme-accent, #a93fa1)" opacity="0.25" />
                              <circle cx="-35" cy="50" r="10" fill="var(--theme-accent, #a93fa1)" />
                              <circle cx="-35" cy="50" r="3" fill="#ffffff" />
                              <circle cx="-60" cy="20" r="18" fill="var(--theme-accent, #a93fa1)" opacity="0.15" />
                              <circle cx="-60" cy="20" r="13" fill="var(--theme-accent, #a93fa1)" opacity="0.8" />
                              <circle cx="-60" cy="20" r="4" fill="#fef08a" />
                          </g>
                          
                          {/* Grupo de Flores e Ramos no Canto Superior Esquerdo */}
                          <g transform="translate(85, 90) rotate(20)">
                              <path d="M0 50 Q -40 -10 -90 -40" fill="none" stroke="#6b7280" strokeWidth="2" opacity="0.25" />
                              <path d="M -30 20 C -45 10 -40 -10 -25 -10 C -10 -10 -15 10 -30 20 Z" fill="#8fbc8f" opacity="0.7" />
                              <path d="M -50 -5 C -65 -15 -60 -35 -45 -35 C -30 -35 -35 -15 -50 -5 Z" fill="#a2caa2" opacity="0.6" />
                              <g transform="translate(-15, 10)">
                                  <circle cx="0" cy="0" r="28" fill="var(--theme-accent, #a93fa1)" opacity="0.15" />
                                  <path d="M -22 0 C -22 -15 0 -22 0 -22 C 0 -22 22 -15 22 0 C 22 15 0 22 0 22 C 0 22 -22 15 -22 0 Z" fill="var(--theme-accent, #a93fa1)" opacity="0.85" transform="rotate(0)" />
                                  <path d="M -22 0 C -22 -15 0 -22 0 -22 C 0 -22 22 -15 22 0 C 22 15 0 22 0 22 C 0 22 -22 15 -22 0 Z" fill="var(--theme-accent, #a93fa1)" opacity="0.85" transform="rotate(30)" />
                              </g>
                          </g>
                      </svg>
                  </div>
              )}
              <div className="jsx-bf40f23d3e10e809 img-aspect-ratio cover-image cover-image-under">
                <img src={event.image} alt="Glow" />
              </div>
              <div className="jsx-bf40f23d3e10e809 img-aspect-ratio cover-image cover-image-rect">
                <img src={event.image} alt={event.name} />
              </div>
            </div>

            <div className="jsx-24d10356f2efd076 manage-card">
              <div className="jsx-24d10356f2efd076">Você tem acesso de gerenciamento para este evento.</div>
              <a href={`/event/manage/${event.id}`} target="_blank" className="btn lux-button small" style={{ background: 'var(--theme-accent, #bc3f57)', color: 'white', padding: '8px 16px', borderRadius: '30px', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Gerenciar
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '14px', height: '14px', display: 'inline-block', flexShrink: 0 }}>
                  <path d="M7 17 17 7M7 7h10v10"></path>
                </svg>
              </a>
            </div>

            {/* Organizado por */}
            <div className="jsx-da66ad346e2cad37 flex-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img
                className="square rounded"
                width="32"
                height="32"
                alt="Avatar"
                src={event.host.avatar}
                style={{ border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 'var(--border-radius)' }}
              />
              <div className="jsx-da66ad346e2cad37 flex-1 ml-1">
                <div className="jsx-da66ad346e2cad37 fs-xxs text-tinted reduced-line-height presenter-label">Apresentado por</div>
                <a className="title" href="#" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="jsx-da66ad346e2cad37 flex-center" style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="jsx-da66ad346e2cad37 fw-medium text-ellipses presenter-name">{event.host.name}</div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12" height="12" style={{ marginLeft: '2px' }}>
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA */}
          <div className="main-column" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div className="jsx-1013196638 top-wrapper flex-column">
              {event.privacy === 'private' && (
                <div className="jsx-ecfe64caf241c310 visi-pill fs-xs private">
                  <div className="jsx-ecfe64caf241c310 icon flex-center svg-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16">
                      <path fill="currentColor" fillRule="evenodd" d="M13.87 2.298a.24.24 0 0 0-.139-.218l-.895-.425-.41-.881a.24.24 0 0 0-.22-.14.24.24 0 0 0-.218.14l-.424.894-.88.411a.24.24 0 0 0-.14.22c0 .094.053.178.139.218l.894.424.411.881a.24.24 0 0 0 .219.14.24.24 0 0 0 .218-.14l.425-.894.88-.411a.24.24 0 0 0 .14-.219m-1.074 6.11a.87.87 0 0 0-.505-.794l-3.249-1.54L7.548 2.87a.87.87 0 0 0-.793-.506.87.87 0 0 0-.794.506l-1.54 3.25-3.2 1.494a.87.87 0 0 0-.508.795c0 .346.195.651.506.794l3.247 1.54 1.495 3.203c.146.312.45.505.794.505a.87.87 0 0 0 .793-.505l1.542-3.247 3.198-1.495a.87.87 0 0 0 .508-.795m2.75 4.689a.29.29 0 0 1 .167.263.29.29 0 0 1-.168.263l-1.06.496-.511 1.076a.29.29 0 0 1-.263.167.29.29 0 0 1-.263-.167l-.495-1.062-1.077-.51a.29.29 0 0 1-.167-.263c0-.115.064-.216.168-.264l1.06-.495.51-1.076a.29.29 0 0 1 .264-.168c.114 0 .215.065.263.168l.495 1.061z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="jsx-ecfe64caf241c310 title fw-medium">Evento Privado</div>
                </div>
              )}
              <h1 className="event-title">{event.name}</h1>

              <div className="event-info-rows">
                <div className="row-container">
                  <div className="icon-container" style={{ color: 'var(--theme-accent, #bc3f57)' }}>
                    <div className="jsx-3702817512 calendar-card">
                      <div className="jsx-3702817512 month">{event.date.month}</div>
                      <div className="jsx-3702817512 day">{event.date.day}</div>
                    </div>
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="row-title">{event.date.weekday}</div>
                    <div className="row-desc">{event.date.time}</div>
                  </div>
                </div>

                {event.restrictLocation ? (
                  <div className="row-container animate-fade-in">
                    <div className="icon-container" style={{ color: 'var(--theme-accent, #bc3f57)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <div className="flex-column">
                      <div className="row-title" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Local Privado
                      </div>
                      <div className="row-desc">{event.location.city || 'Online'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="row-container">
                    <div className="icon-container" style={{ color: 'var(--theme-accent, #bc3f57)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <div className="flex-column">
                      <div className="row-title flex-center" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {event.location.name}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                      </div>
                      <div className="row-desc">{event.location.city || 'Online'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <EventRegistrationCard
              event={event}
              ticketTypes={event.ticketTypes || []}
              quantities={ticketCounts}
              onQuantitiesChange={setTicketCounts}
              variant="event-page"
              onPrimaryAction={({ action, couponCode: accessCouponCode }) => {
                if (action !== 'closed') handleOpenCheckout(accessCouponCode);
              }}
            />

            {/* SOBRE O EVENTO */}
            {event.description && event.description.trim() !== "" && (
              <div className="content-card event-about-card">
                <div className="card-title">
                  <div className="title-label">Sobre o Evento</div>
                </div>
                <div className="content">
                  <div className="spark-content" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(event.description) }} />
                </div>
              </div>
            )}

            {/* LOCALIZAÇÃO / TRANSMISSÃO */}
            <div className="content-card event-location-card">
              <div className="card-title">
                <div className="title-label">{event.location.isVirtual ? "Transmissão" : "Localização"}</div>
              </div>
              <div className="content">
                {event.location.isVirtual ? (
                  <div className="event-location-notice">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--theme-accent, #bc3f57)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>Este evento acontecerá online</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--theme-text)' }}>
                      O link da transmissão está disponível abaixo para acesso direto:
                    </div>
                    {event.location.address && (
                      <a 
                        href={event.location.address.startsWith('http') ? event.location.address : `https://${event.location.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="lux-button primary solid"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content', textDecoration: 'none', marginTop: '0.25rem', padding: '10px 24px', borderRadius: '30px', fontWeight: 600 }}
                      >
                        Acessar Link da Transmissão
                      </a>
                    )}
                  </div>
                ) : event.restrictLocation ? (
                  <div className="event-location-notice is-restricted animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--theme-accent-pale, rgba(188, 63, 87, 0.1))', color: 'var(--theme-accent, #bc3f57)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--theme-text)' }}>Localização Oculta</div>
                    <div style={{ fontSize: '13.5px', color: 'var(--theme-muted, rgba(19, 21, 23, 0.7))', maxWidth: '340px', lineHeight: '1.45', fontFamily: 'var(--theme-font, sans-serif)' }}>
                      Este evento possui localização restrita. O endereço exato e o mapa interativo serão revelados aos convidados após a confirmação do ingresso.
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--theme-text, #131517)' }}>{event.location.name}</div>
                      <div style={{ fontSize: '14px', color: 'var(--theme-muted, rgba(19, 21, 23, 0.7))' }}>{event.location.address}</div>
                    </div>
                    <div style={{ borderRadius: '1rem', overflow: 'hidden', height: '240px', border: '1px solid var(--bg-opacity-16)' }}>
                      {/* 🚀 Lazy-load map only when it enters the viewport */}
                      {(() => {
                        const LazyMap = () => {
                          const [inView, setInView] = React.useState(false);
                          const containerRef = React.useRef<HTMLDivElement>(null);
                          React.useEffect(() => {
                            const el = containerRef.current;
                            if (!el) return;
                            const observer = new IntersectionObserver(
                              ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
                              { rootMargin: '200px' }
                            );
                            observer.observe(el);
                            return () => observer.disconnect();
                          }, []);
                          return (
                            <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'var(--gray-10, #f7f8f9)' }}>
                              {inView && (
                                <iframe
                                  src={`https://maps.google.com/maps?q=${encodeURIComponent((event.location.name || '') + ', ' + (event.location.address || ''))}&hl=pt&z=15&output=embed`}
                                  style={{ width: '100%', border: 'none', height: '100%', display: 'block' }}
                                  loading="lazy"
                                  title="Localização do evento"
                                />
                              )}
                            </div>
                          );
                        };
                        return <LazyMap />;
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
        <FooterV2 maxWidth="960px" />
      </div>

      {/* MODAL DE CHECKOUT EXPRESSO LUMA-STYLE */}
      {isCheckoutModalOpen && (() => {
        const brandColor = event?.customColor || '#bc3f57';
        const rightColumnBg = {
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))`,
          backgroundColor: event?.customColor ? `${event.customColor}05` : 'rgba(255, 255, 255, 0.1)',
        };
        const subtotalAmount = Object.entries(ticketCounts)
          .filter(([_, qty]) => qty > 0)
          .reduce((sum, [ticketTypeId, qty]) => {
            const tt = event.ticketTypes?.find((t: any) => t.id === ticketTypeId);
            return sum + (tt ? tt.price * qty : 0);
          }, 0);
        const eligibleTicketIds: string[] | null = Array.isArray(appliedCheckoutCoupon?.eligibleTicketIds)
          ? appliedCheckoutCoupon.eligibleTicketIds
          : null;
        const eligibleSubtotal = eligibleTicketIds
          ? Object.entries(ticketCounts).reduce((sum, [ticketTypeId, qty]) => {
              if (!eligibleTicketIds.includes(ticketTypeId) || qty <= 0) return sum;
              const ticket = event.ticketTypes?.find((item: any) => item.id === ticketTypeId);
              return sum + (ticket ? ticket.price * qty : 0);
            }, 0)
          : subtotalAmount;
        const couponDiscount = appliedCheckoutCoupon?.type === 'PERCENT'
          ? eligibleSubtotal * (Number(appliedCheckoutCoupon.value || 0) / 100)
          : appliedCheckoutCoupon?.type === 'FIXED'
            ? Math.min(eligibleSubtotal, Number(appliedCheckoutCoupon.value || 0))
            : 0;
        const totalAmount = Math.max(0, subtotalAmount - couponDiscount);

        return (
          <div className="jsx-3741974939 lux-glass-overlay flex-center" style={{ '--brand-color': brandColor } as React.CSSProperties}>
            {/* Botão de Fechar flutuante no canto superior direito da tela inteira */}
            <button 
              type="button"
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-6 right-8 w-10 h-10 rounded-full bg-[#131517]/5 hover:bg-[#131517]/10 flex items-center justify-center transition-colors text-[#131517] cursor-pointer shadow-none border-none z-50 animate-fade-in"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>

            <div className="jsx-2978724248 registration-overlay two-panels relative">
              <form onSubmit={handleSubmitCheckout} className="registration-form-container flex-column">
                <div className="jsx-2978724248 panels flex-row-reverse flex-1 gap-5">
                  
                  {/* PAINEL DIREITO (Resumo da Compra) */}
                  <div className="jsx-2978724248 right" style={{ background: 'transparent' }}>
                    <div className="jsx-3665495660 info-panel">
                      <div className="jsx-3665495660 info-panel-content">
                        
                        {/* Event Header */}
                        <div className="jsx-7ed2ad37e99cbb7f flex-center gap-25 event-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(19, 21, 23, 0.05)' }}>
                          <img 
                            className="flex-shrink-0 rounded-squircle" 
                            width="54" 
                            height="54" 
                            alt={event.name} 
                            src={event.image} 
                            style={{ borderRadius: '0.75rem', objectFit: 'cover' }}
                          />
                          <div className="jsx-7ed2ad37e99cbb7f flex-1" style={{ textAlign: 'left' }}>
                            <div className="jsx-7ed2ad37e99cbb7f fw-medium name reduced-line-height" style={{ fontSize: '15px', color: '#131517', lineHeight: '1.2', fontWeight: 600 }}>{event.name}</div>
                            <div className="jsx-7ed2ad37e99cbb7f text-tertiary-alpha fs-sm mt-1" style={{ fontSize: '13px', color: '#939597' }}>{event.date.day} de {event.date.month}., {event.date.time.replace(' BRT', '')}</div>
                          </div>
                        </div>

                        {/* Info Row Ingresso */}
                        <div className="jsx-fd073120d93d8690 info-row-wrapper row" style={{ borderBottom: '1px solid rgba(19, 21, 23, 0.05)', padding: '0.875rem 0' }}>
                          <div className="jsx-e44fb317f91ad842 info-row flex-center spread gap-2 clickable" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="jsx-e44fb317f91ad842 label text-tertiary-alpha mr-2" style={{ fontSize: '14px', color: '#939597', fontWeight: 500 }}>Ingresso</div>
                            <div className="jsx-e44fb317f91ad842 value flex-1 text-right fw-medium text-ellipses" style={{ textAlign: 'right', flex: 1, fontSize: '14px', color: '#131517', fontWeight: 600 }}>
                              {(() => {
                                const selected = Object.entries(ticketCounts)
                                  .filter(([_, qty]) => qty > 0)
                                  .map(([ticketTypeId, qty]) => {
                                    const tt = event.ticketTypes?.find((t: any) => t.id === ticketTypeId);
                                    return tt ? tt.name : '';
                                  })
                                  .filter(Boolean);
                                return selected.join(', ') || 'Nenhum';
                              })()}
                            </div>
                            <div className="jsx-e44fb317f91ad842 text-tertiary-alpha chevron" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div className="jsx-a429b04a7d46eb93 chevron animated" style={{ transform: 'rotate(-90deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="12" height="12" style={{ color: '#b3b5b7' }}>
                                  <path d="m6 9 6 6 6-6"></path>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Seção de Preços / Cupom / Total */}
                        <div className="jsx-6798717d5536d220 pricing-section row" style={{ marginTop: '0.875rem' }}>
                          {totalAmount > 0 && (
                            <div className="jsx-c9565716a7e002ac flex-center spread py-1" style={{ marginBottom: '0.875rem' }}>
                              {isAddingCoupon ? (
                                <div className="flex gap-2 items-center pt-1 pb-1 animate-fade-in" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', marginTop: '0.25rem' }}>
                                  <div className="lux-input-wrapper flex-1" style={{ marginBottom: 0 }}>
                                    <div className="inner-wrapper" style={{ padding: '0.45rem 0.875rem', backgroundColor: 'rgba(19, 21, 23, 0.05)', borderRadius: '0.5rem' }}>
                                      <input 
                                        type="text" 
                                        placeholder="Cupom"
                                        value={couponCode}
                                        onChange={(e) => {
                                          setCouponCode(e.target.value.toUpperCase());
                                          setCheckoutCouponError('');
                                        }}
                                        className="lux-input"
                                        style={{ padding: 0, fontSize: '13.5px', fontWeight: 500 }}
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={!couponCode.trim() || applyingCheckoutCoupon}
                                    onClick={() => void validateCheckoutCoupon(couponCode)}
                                    style={{ 
                                      backgroundColor: couponCode.trim() ? '#131517' : '#ebeced',
                                      cursor: couponCode.trim() ? 'pointer' : 'not-allowed',
                                      padding: '8px 16px',
                                      borderRadius: '0.5rem',
                                      border: 'none',
                                      color: couponCode.trim() ? 'white' : '#939597',
                                      fontWeight: 600,
                                      fontSize: '13px',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    {applyingCheckoutCoupon ? 'Validando...' : 'Aplicar'}
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  className="btn lux-button flex-center medium brand link py-1 variant-color-brand no-icon" 
                                  type="button"
                                  onClick={() => setIsAddingCoupon(true)}
                                  style={{ border: 'none', background: 'transparent', color: brandColor, fontWeight: 600, cursor: 'pointer', fontSize: '14px', padding: 0 }}
                                >
                                  {appliedCheckoutCoupon ? `Cupom ${appliedCheckoutCoupon.code} aplicado` : 'Adicionar cupom'}
                                </button>
                              )}
                            </div>
                          )}
                          {checkoutCouponError && <div style={{ marginTop: '-0.5rem', marginBottom: '0.75rem', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}>{checkoutCouponError}</div>}
                          <div className="jsx-6798717d5536d220 amount-row flex-baseline spread" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.875rem' }}>
                            <div className="text-tertiary-alpha min-width-0" style={{ fontSize: '14px', color: '#939597', fontWeight: 500 }}>Total</div>
                            <div className="jsx-6798717d5536d220 amount" style={{ fontSize: '24px', fontWeight: 700, color: '#131517' }}>
                              {totalAmount === 0 ? 'Grátis' : `R$\u00a0${totalAmount.toFixed(2).replace('.', ',')}`}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* PAINEL ESQUERDO (Formulário do Usuário) */}
                  <div className="jsx-2978724248 left flex-1">
                    <div className="jsx-207974560 flex-column pb-5">
                      
                      {isPaymentSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center max-w-md mx-auto">
                          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-solid border-emerald-100 shadow-sm animate-bounce">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                          </div>
                          <h3 className="text-xl font-bold text-[#131517]">Inscrição Confirmada!</h3>
                          <p className="text-sm text-gray-600 mt-2">
                            Seu ingresso foi emitido com sucesso e as informações foram enviadas para o seu e-mail: <strong>{user?.email || checkoutEmail}</strong>.
                          </p>
                          {(!user) && (
                            <div className="mt-6 p-4 bg-rose-50/50 rounded-2xl border border-solid border-rose-100/50 text-xs text-[#bc3f57] text-left">
                              <span className="font-bold block mb-1">Sua conta foi criada automaticamente!</span> Um calendário pessoal padrão foi configurado para você. Acesse a plataforma gerando um código de login rápido enviado ao seu e-mail.
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={() => setIsCheckoutModalOpen(false)}
                            className="mt-8 px-6 py-2.5 text-white font-bold rounded-full transition-colors cursor-pointer shadow-md border-none"
                            style={{ backgroundColor: brandColor }}
                          >
                            Fechar
                          </button>
                        </div>
                      ) : pixIntent ? (
                        <div className="flex flex-col items-center py-4 text-center max-w-md mx-auto">
                          <h3 className="text-xl font-bold text-[#131517]">Realize o pagamento via Pix</h3>
                          <p className="text-xs text-gray-500 mt-1">Escaneie o QR Code ou copie o código abaixo para pagar.</p>
                          
                          {pixIntent.qrBase64 ? (
                            <div className="mt-6 p-4 bg-white border border-solid border-gray-100 rounded-3xl shadow-md inline-block">
                              <img 
                                src={`data:image/png;base64,${pixIntent.qrBase64}`} 
                                alt="QR Code Pix" 
                                className="w-48 h-48 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="mt-6 w-48 h-48 bg-gray-50 border border-solid border-gray-100 rounded-3xl flex items-center justify-center text-xs text-gray-400">
                              Carregando QR Code...
                            </div>
                          )}

                          <div className="mt-6 w-full text-left">
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">Código Pix Copia e Cola:</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                readOnly 
                                value={pixIntent.code} 
                                className="flex-1 bg-[#f1f3f5] border-none rounded-xl px-4 py-3 text-xs text-gray-600 focus:outline-none"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(pixIntent.code);
                                  alert('Código Pix copiado para a área de transferência!');
                                }}
                                className="px-4 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1 border-none"
                                style={{ backgroundColor: brandColor }}
                              >
                                Copiar
                              </button>
                            </div>
                          </div>

                          <div className="mt-8 flex flex-col items-center gap-2">
                            {isCheckingPayment ? (
                              <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-3.5 py-2 rounded-full border border-solid border-amber-100">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Aguardando confirmação do pagamento...
                              </div>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => startCheckingPayment(createdOrder.id)}
                                className="text-xs font-bold hover:underline border-none bg-transparent cursor-pointer"
                                style={{ color: brandColor }}
                              >
                                Verificar pagamento novamente
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="jsx-207974560 mb-2 pb-4">
                          <h3 className="jsx-207974560 section-title">Suas Informações</h3>
                          
                          {checkoutError && (
                            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl text-xs border border-solid border-rose-100 font-medium text-left mb-4">
                              {checkoutError}
                            </div>
                          )}

                          <div className="jsx-207974560 flex-column gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            
                            {/* Bloco de Usuário Logado */}
                            {user && (
                              <div className="flex-center gap-25" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div className="jsx-3439053062 avatar-wrapper">
                                  <div className="jsx-3439053062 avatar" style={{ backgroundImage: `url(${user.photoUrl || "https://cdn.lu.ma/avatars-default/avatar_25.png"})` }}></div>
                                </div>
                                <div className="min-width-0" style={{ textAlign: 'left', flex: 1 }}>
                                  <div className="flex-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div className="fw-medium text-ellipses" style={{ fontSize: '15px', color: '#131517', fontWeight: 600 }}>{checkoutName || 'Usuário'}</div>
                                    <button 
                                      aria-label="Atualizar Nome" 
                                      className="btn lux-button flex-center medium secondary link variant-color-secondary icon-only" 
                                      type="button"
                                      onClick={() => {
                                        setTempCheckoutName(checkoutName);
                                        setIsNameModalOpen(true);
                                      }}
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#939597', padding: '2px' }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14">
                                        <path fill="currentColor" fillRule="evenodd" d="M10.217 3.22c.354-.354.456-.451.543-.51.42-.28.969-.28 1.389 0 .087.059.189.156.543.51s.45.456.509.543c.28.42.28.968 0 1.389-.058.086-.155.189-.509.543l-.53.53L9.687 3.75zm-1.59 1.59L11.1 7.287l-5.76 5.76a1.25 1.25 0 0 1-.963.363l-.49-.031c-.48-.03-.768-.05-.977-.09-.185-.036-.213-.072-.214-.074-.001 0-.037-.028-.073-.213-.04-.209-.06-.498-.09-.978l-.031-.489a1.25 1.25 0 0 1 .363-.963zm1.3-3.347c-.227.152-.441.366-.719.644l-.052.052-1.06 1.06-6.29 6.291a2.75 2.75 0 0 0-.8 2.12l.03.489.003.042c.027.424.052.81.113 1.124.066.345.191.697.485.99.293.293.645.419.99.485.314.06.7.085 1.124.112l.042.003.489.031a2.75 2.75 0 0 0 2.12-.8l6.29-6.29 1.06-1.06.052-.053c.278-.277.493-.491.644-.718a2.75 2.75 0 0 0 0-3.056c-.151-.226-.366-.44-.644-.718l-.051-.052-.052-.052c-.278-.278-.492-.492-.719-.644a2.75 2.75 0 0 0-3.055 0m.578 11.986a.75.75 0 1 0 0 1.5h4a.75.75 0 1 0 0-1.5z"></path>
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="fs-sm text-secondary-alpha" style={{ fontSize: '13px', color: '#939597' }}>{user.email}</div>
                                </div>
                              </div>
                            )}

                            {/* Inputs Deslogados */}
                            {!user && (
                              <>
                                <div className="lux-input-wrapper medium outline">
                                  <div className="inner-wrapper">
                                    <label className="lux-input-label medium">
                                      <div>Nome Completo&nbsp;*</div>
                                    </label>
                                    <div className="input-wrapper flex-baseline">
                                      <div className="flex-center flex-1">
                                        <input 
                                          required 
                                          className="lux-input" 
                                          placeholder="Digite seu nome completo" 
                                          type="text" 
                                          value={checkoutName}
                                          onChange={(e) => setCheckoutName(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="lux-input-wrapper medium outline">
                                  <div className="inner-wrapper">
                                    <label className="lux-input-label medium">
                                      <div>Endereço de E-mail&nbsp;*</div>
                                    </label>
                                    <div className="input-wrapper flex-baseline">
                                      <div className="flex-center flex-1">
                                        <input 
                                          required 
                                          className="lux-input" 
                                          placeholder="exemplo@e-mail.com" 
                                          type="email" 
                                          value={checkoutEmail}
                                          onChange={(e) => setCheckoutEmail(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Input Celular */}
                            {(!user || !user.phone) && (
                              <div className="lux-input-wrapper medium outline">
                                <div className="inner-wrapper">
                                  <label className="lux-input-label medium">
                                    <div>Celular&nbsp;*</div>
                                  </label>
                                  <div className="input-wrapper flex-baseline">
                                    <div className="flex-center flex-1">
                                      <input 
                                        required 
                                        className="lux-input" 
                                        placeholder="+55 11 96123 4567" 
                                        type="tel" 
                                        value={checkoutPhone}
                                        onChange={(e) => setCheckoutPhone(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Input CPF */}
                            {(!user || !user.cpf) && (
                              <div className="lux-input-wrapper medium outline">
                                <div className="inner-wrapper">
                                  <label className="lux-input-label medium">
                                    <div>CPF (apenas para controle de acesso ao local do evento)&nbsp;*</div>
                                  </label>
                                  <div className="input-wrapper flex-baseline">
                                    <div className="flex-center flex-1">
                                      <input 
                                        required 
                                        className="lux-input" 
                                        placeholder="000.000.000-00" 
                                        type="text" 
                                        value={checkoutCpf}
                                        onChange={(e) => setCheckoutCpf(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Perguntas Customizadas do Organizador */}
                            {event.registrationForm?.customQuestions && event.registrationForm.customQuestions.length > 0 && (
                              <div className="space-y-4 pt-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 text-left mb-1">Perguntas do Organizador</h4>
                                {event.registrationForm.customQuestions.map((q: any) => (
                                  <div key={q.id} className="lux-input-wrapper medium outline">
                                    <div className="inner-wrapper">
                                      <label className="lux-input-label medium">
                                        <div>{q.label} {q.required && <span className="text-[#bc3f57]">*</span>}</div>
                                      </label>
                                      <div className="input-wrapper flex-baseline">
                                        <div className="flex-center flex-1">
                                          {q.type === 'select' ? (
                                            <select
                                              required={q.required}
                                              value={customAnswers[q.id] || ''}
                                              onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                                              className="lux-input"
                                              style={{ cursor: 'pointer' }}
                                            >
                                              <option value="">Selecione uma opção</option>
                                              {q.options?.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          ) : q.type === 'checkbox' ? (
                                            <label className="flex items-center gap-3 cursor-pointer py-1.5" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                              <input 
                                                type="checkbox"
                                                checked={customAnswers[q.id] === 'Sim'}
                                                onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.checked ? 'Sim' : 'Não' })}
                                                className="w-4.5 h-4.5 text-[#bc3f57] border-gray-300 rounded focus:ring-[#bc3f57]"
                                              />
                                              <span className="text-sm text-gray-700" style={{ fontSize: '13px' }}>Sim</span>
                                            </label>
                                          ) : (
                                            <input 
                                              type="text"
                                              required={q.required}
                                              value={customAnswers[q.id] || ''}
                                              onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                                              placeholder="Sua resposta"
                                              className="lux-input"
                                            />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Checkbox de Termos do Evento Luma-Style */}
                            <div className="lux-checkbox checkbox-input animated wrapper" style={{ marginTop: '0.5rem' }}>
                              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                                <span className="checkbox-icon" style={{
                                  backgroundColor: agreedToTerms ? brandColor : 'transparent',
                                  borderColor: agreedToTerms ? brandColor : 'rgba(19, 21, 23, 0.16)',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '6px',
                                  border: '1px solid',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                  transition: 'all 0.2s ease',
                                  flexShrink: 0,
                                  marginTop: '2px'
                                }}>
                                  <input 
                                    className="input" 
                                    type="checkbox" 
                                    checked={agreedToTerms}
                                    onChange={(e) => {
                                      setAgreedToTerms(e.target.checked);
                                      if (e.target.checked) setShowTermsError(false);
                                    }}
                                    style={{
                                      position: 'absolute',
                                      opacity: 0,
                                      cursor: 'pointer',
                                      inset: 0,
                                      margin: 0,
                                      width: '100%',
                                      height: '100%',
                                      zIndex: 2
                                    }}
                                  />
                                  <span className="checkbox-display" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    width: '100%',
                                    height: '100%',
                                    opacity: agreedToTerms ? 1 : 0,
                                    transform: agreedToTerms ? 'scale(1)' : 'scale(0.6)',
                                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    pointerEvents: 'none'
                                  }}>
                                    <svg fill="none" viewBox="5 5 10 10" width="12" height="12" style={{ color: 'white' }}>
                                      <path d="M14 7L8.5 12.5L6 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                                    </svg>
                                  </span>
                                </span>
                                <div className="text-label" style={{ fontSize: '13px', color: '#7b2435cc', textAlign: 'left', lineHeight: '1.35' }}>
                                  <div className="noselect fs-sm" style={{ userSelect: 'none' }}>
                                    Ao me cadastrar, concordo com os <button className="a inline p-0" type="button" onClick={() => setIsTermsModalOpen(true)} style={{ background: 'transparent', border: 'none', color: brandColor, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '13px' }}>termos do evento</button>.<span> *</span>
                                  </div>
                                </div>
                              </label>
                            </div>

                            {/* Mensagem de Erro de Termos do Luma */}
                            {showTermsError && !agreedToTerms && (
                              <div className="fs-sm text-error pt-1 error-message ml-45 animate-fade-in" style={{ fontSize: '12px', color: '#e25950', textAlign: 'left', marginLeft: '26px', marginTop: '4px', fontWeight: 500 }}>
                                Você deve concordar com os termos do evento.
                              </div>
                            )}

                          </div>
                        </div>
                      )}

                      {/* Bloco de Pagamento */}
                      {!isPaymentSuccess && !pixIntent && (
                        <div className="lux-collapse shown" style={{ filter: 'opacity(1)', height: 'auto', marginTop: '1.5rem' }}>
                          <div className="jsx-207974560">
                            <h3 className="jsx-207974560 section-title">Pagamento</h3>
                            
                            <div className="pb-3 text-left">
                              <label className="lux-input-label medium">
                                <div>Pagar via Pix *</div>
                              </label>
                              
                              <div className="flex gap-3" style={{ marginTop: '0.5rem' }}>
                                <div 
                                  className="flex-1 p-3.5 rounded-xl border-2 border-solid flex items-center justify-between cursor-pointer transition-all" 
                                  style={{ borderColor: brandColor, background: `${brandColor}08`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', width: '100%', border: `2px solid ${brandColor}`, borderRadius: '0.75rem' }}
                                >
                                  <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: brandColor }}><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20M6 15h2"/></svg>
                                    <span className="text-sm font-semibold text-gray-800" style={{ fontSize: '14px', fontWeight: 600 }}>Pix</span>
                                  </div>
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center border-2 border-solid" style={{ borderColor: brandColor, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${brandColor}` }}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor, width: '8px', height: '8px', borderRadius: '50%' }} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button 
                              type="submit" 
                              disabled={isSubmitting}
                              className="btn lux-button flex-center medium brand solid variant-color-brand full-width no-icon border-none font-bold text-white transition-all shadow-md cursor-pointer"
                              style={{ 
                                backgroundColor: brandColor, 
                                padding: '1rem', 
                                borderRadius: '30px', 
                                width: '100%', 
                                fontSize: '15px', 
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '1.25rem',
                                border: 'none'
                              }}
                            >
                              {isSubmitting ? (
                                <>
                                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processando...
                                </>
                              ) : totalAmount === 0 ? (
                                'Confirmar Inscrição Gratuita'
                              ) : (
                                'Confirmar e Pagar'
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL PEQUENO ATUALIZAR NOME (LUMA-STYLE) */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifycontent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}>
          {/* Caixa do Modal */}
          <div 
            className="bg-white rounded-3xl w-full max-w-[360px] p-7 shadow-xl border border-solid border-gray-100 flex flex-col text-left animate-scale-up" 
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '1.5rem', 
              width: '100%', 
              maxWidth: '360px', 
              padding: '1.75rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left'
            }}
          >
            {/* Ícone de perfil com caneta */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4" 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: '#f1f3f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1rem',
                color: '#495057'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <line x1="12" y1="11" x2="12" y2="13" />
                <path d="M18.5 12.5a2.121 2.121 0 0 1 3 3L12 25l-4 1 1-4Z" />
              </svg>
            </div>

            {/* Textos */}
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#131517', margin: '0 0 0.375rem 0' }}>Atualizar Nome</h3>
            <p style={{ fontSize: '13.5px', color: '#737577', margin: '0 0 1.25rem 0', lineHeight: '1.4' }}>Seu nome atualizado será salvo no seu perfil.</p>

            {/* Input */}
            <input 
              type="text"
              value={tempCheckoutName}
              onChange={(e) => setTempCheckoutName(e.target.value)}
              placeholder="Digite seu nome"
              className="focus:outline-none"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '15px',
                fontWeight: 500,
                borderRadius: '0.75rem',
                border: '1px solid #131517',
                backgroundColor: 'white',
                color: '#131517',
                outline: 'none'
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCheckoutName(tempCheckoutName);
                  setIsNameModalOpen(false);
                }
              }}
            />

            {/* Botão Atualizar */}
            <button
              type="button"
              onClick={() => {
                setCheckoutName(tempCheckoutName);
                setIsNameModalOpen(false);
              }}
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: '0.75rem',
                backgroundColor: '#2d3135',
                color: 'white',
                border: 'none',
                marginTop: '1.25rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#131517')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2d3135')}
            >
              Atualizar
            </button>

            {/* Botão Cancelar */}
            <button
              type="button"
              onClick={() => setIsNameModalOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#939597',
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE TERMOS DO EVENTO (LUMA-STYLE) */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}>
          {/* Caixa do Modal */}
          <div 
            className="bg-white rounded-3xl w-full max-w-[420px] p-7 shadow-xl border border-solid border-gray-100 flex flex-col text-left relative animate-scale-up" 
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '1.5rem', 
              width: '100%', 
              maxWidth: '420px', 
              padding: '1.75rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              position: 'relative'
            }}
          >
            {/* Botão de fechar (x) no topo direito */}
            <button 
              type="button"
              onClick={() => setIsTermsModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f1f3f5] hover:bg-[#ebeced] flex items-center justify-center transition-colors text-gray-500 cursor-pointer shadow-none border-none z-50"
              style={{ 
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#f1f3f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                color: '#737577',
                cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>

            {/* Ícone de documento/termos */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4" 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: '#f1f3f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1rem',
                color: '#495057'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </div>

            {/* Textos */}
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#131517', margin: '0 0 0.75rem 0' }}>Termos do Evento</h3>
            <p style={{ fontSize: '13.5px', color: '#2c2e30', margin: '0 0 1rem 0', lineHeight: '1.5', textAlign: 'left' }}>
              Ao me inscrever, concordo em receber comunicações sobre o evento e novidades dos parceiros/patrocinadores do <strong>{event.name}</strong>. 
              Também autorizo o uso da minha imagem em fotos e vídeos do evento para fins de divulgação. 
              Posso cancelar o recebimento de comunicações a qualquer momento. O direito ao reembolso ou transferência do ingresso está previsto, 
              desde que o pedido de cancelamento aconteça 7 dias antes da data do evento.
            </p>
            <p style={{ fontSize: '11.5px', color: '#939597', margin: '0 0 1.25rem 0', lineHeight: '1.4', textAlign: 'left' }}>
              Estes termos são definidos pelo organizador do evento. Se tiver alguma dúvida, entre em contato com o organizador do evento.
            </p>

            {/* Botão Aceitar Termos */}
            <button
              type="button"
              onClick={() => {
                setAgreedToTerms(true);
                setIsTermsModalOpen(false);
                setShowTermsError(false);
              }}
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: '0.75rem',
                backgroundColor: '#2d3135',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#131517')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2d3135')}
            >
              Aceitar Termos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPageV2;
