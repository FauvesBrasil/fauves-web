import React, { useEffect, useRef, useState } from 'react';

type PagePoint = { x: number; y: number };

interface Props {
  fromSigla: string;
  toSigla: string;
  toName: string;
  onFinish: () => void;
  durationMs?: number;
  startPageCoords?: PagePoint | null;
  endPageCoords?: PagePoint | null;
}

const planePath = `M84.2785 48.8571H106.92C110.654 48.8571 114.235 47.4273 116.876 44.8822C119.517 42.337 121 38.8851 121 35.2857C121 31.6863 119.517 28.2344 116.876 25.6893C114.235 23.1441 110.654 21.7143 106.92 21.7143H28.7345C27.6888 21.7137 26.664 21.4326 25.7747 20.9024C24.8854 20.3722 24.1668 19.6139 23.6994 18.7123L21.1762 13.8591C20.7088 12.9576 19.9902 12.1992 19.1009 11.669C18.2116 11.1388 17.1867 10.8577 16.1411 10.8571H5.63714C4.70465 10.8563 3.78655 11.0787 2.96523 11.5043C2.14391 11.9299 1.44508 12.5454 0.93144 13.2955C0.417804 14.0457 0.105441 14.907 0.0223862 15.8022C-0.0606687 16.6974 0.0881833 17.5985 0.455583 18.4246L12.5252 45.5674C12.9598 46.5446 13.6825 47.3772 14.6036 47.962C15.5248 48.5468 16.6038 48.8581 17.7068 48.8571H39.4637C40.3836 48.8577 41.2893 49.0754 42.1018 49.4913C42.9142 49.9072 43.6086 50.5085 44.1242 51.2428C44.6399 51.977 44.9611 52.8219 45.0598 53.7034C45.1584 54.5849 45.0316 55.4763 44.6903 56.2997L39.6158 68.5629C39.2758 69.3855 39.1499 70.2759 39.2488 71.1562C39.3478 72.0366 39.6687 72.8802 40.1836 73.6136C40.6984 74.347 41.3916 74.9479 42.2027 75.3639C43.0137 75.7798 43.918 75.9982 44.8367 76H56.3375C57.1822 76.0003 58.0161 75.8175 58.7775 75.4651C59.5389 75.1127 60.2083 74.5998 60.7362 73.9643L79.8855 50.8929C80.4128 50.2581 81.0813 49.7455 81.8417 49.3932C82.6021 49.0408 83.4348 48.8576 84.2785 48.8571ZM44.9663 16.2857H71.7189L60.7362 2.17143C60.2116 1.49722 59.5313 0.950002 58.7493 0.573109C57.9672 0.196216 57.1049 0 56.2305 0H45.6309C44.6712 0.000493834 43.7276 0.237332 42.8896 0.68804C42.0515 1.13875 41.3469 1.78838 40.8425 2.57528C40.3381 3.36219 40.0506 4.26027 40.0075 5.18432C39.9643 6.10836 40.1668 7.02772 40.5958 7.85514L44.9663 16.2857Z`;

// plane tuning constants (SVG viewBox units)
const PLANE_SCALE = 0.24;
const PLANE_TX = -48;
const PLANE_TY = -22;

const FlightAnimationOverlay: React.FC<Props> = ({
  fromSigla,
  toSigla,
  toName,
  onFinish,
  durationMs = 2200,
  startPageCoords,
  endPageCoords,
}) => {
  const [phase, setPhase] = useState<'start' | 'mid' | 'end'>('start');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [computedPath, setComputedPath] = useState<string | null>(null);
  const [computedPoints, setComputedPoints] = useState<{ s: PagePoint; e: PagePoint } | null>(null);

  const initialMessage = 'Decolagem autorizada';
  const finalMessage = `Bem-vindo ao ${toName}`;

  useEffect(() => {
    let mounted = true;
    const midMs = Math.round(durationMs * 0.65);
    const endPhaseMs = Math.max(120, Math.round(durationMs * 0.9));
    const finishMs = endPhaseMs + 420;

    const midT = setTimeout(() => { if (!mounted) return; setPhase('mid'); }, midMs);
    const endT = setTimeout(() => { if (!mounted) return; setPhase('end'); }, endPhaseMs);
    const finishT = setTimeout(() => { if (!mounted) return; onFinish(); }, finishMs);

    return () => { mounted = false; clearTimeout(midT); clearTimeout(endT); clearTimeout(finishT); };
  }, [durationMs, onFinish]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !startPageCoords || !endPageCoords) {
      setComputedPath(null);
      setComputedPoints(null);
      return;
    }

    const rect = svg.getBoundingClientRect();
    const viewBox = { width: 900, height: 220 };

    const mapToSvg = (p: PagePoint) => {
      const x = ((p.x - window.scrollX) - rect.left) * (viewBox.width / rect.width);
      const y = ((p.y - window.scrollY) - rect.top) * (viewBox.height / rect.height);
      return { x, y };
    };

    const s = mapToSvg(startPageCoords);
    const e = mapToSvg(endPageCoords);

    const dx = e.x - s.x;
    const dist = Math.abs(dx);
    const arch = Math.max(80, dist * 0.25);
    const minY = Math.min(s.y, e.y);
    const c1 = { x: s.x + dx * 0.33, y: minY - arch };
    const c2 = { x: s.x + dx * 0.66, y: minY - arch };

    const isFiniteNumber = (v: any) => typeof v === 'number' && Number.isFinite(v);
    const inRange = (v: number, max: number) => v > -200 && v < max + 200;

    if ([s.x, s.y, e.x, e.y].every(isFiniteNumber) && inRange(s.x, viewBox.width) && inRange(e.x, viewBox.width) && inRange(s.y, viewBox.height) && inRange(e.y, viewBox.height)) {
      const d = `M${s.x.toFixed(2)},${s.y.toFixed(2)} C ${c1.x.toFixed(2)},${c1.y.toFixed(2)} ${c2.x.toFixed(2)},${c2.y.toFixed(2)} ${e.x.toFixed(2)},${e.y.toFixed(2)}`;
      setComputedPath(d);
      setComputedPoints({ s, e });
    } else {
      setComputedPath(null);
      setComputedPoints(null);
    }
  }, [startPageCoords, endPageCoords]);

  const pointsContent = computedPoints ? (
    <>
      <g className="fa-from-pop" transform={`translate(${computedPoints.s.x}, ${computedPoints.s.y})`}>
        <g className="fa-from-drag">
          <circle cx={0} cy={0} r={50} fill="#3B2AFB" filter="url(#drop)" />
          <text x={0} y={12} textAnchor="middle" fill="white" fontWeight={700} fontSize={28}>{fromSigla}</text>
        </g>
      </g>

      <g className="fa-plane-motion" style={{ opacity: 1 }}>
        <g transform={`translate(${PLANE_TX},${PLANE_TY}) scale(${PLANE_SCALE})`}>
          <g>
            <path fillRule="evenodd" clipRule="evenodd" d={planePath} fill="#EF4118" />
            <animateMotion dur={`${durationMs}ms`} fill="freeze" rotate="auto">
              <mpath href="#flightPath" />
            </animateMotion>
          </g>
        </g>
      </g>

      <g className={`fa-to-pop ${phase === 'end' ? 'visible' : ''}`} transform={`translate(${computedPoints.e.x}, ${computedPoints.e.y})`}>
        <circle cx={0} cy={0} r={50} fill="#3B2AFB" filter="url(#drop)" />
        <text x={0} y={12} textAnchor="middle" fill="white" fontWeight={700} fontSize={28}>{toSigla}</text>
      </g>
    </>
  ) : (
    <>
      <g className="fa-from-pop">
        <g className="fa-from-drag">
          <circle cx={140} cy={140} r={50} fill="#3B2AFB" filter="url(#drop)" />
          <text x={140} y={152} textAnchor="middle" fill="white" fontWeight={700} fontSize={32}>{fromSigla}</text>
        </g>
      </g>

      <g className="fa-plane-motion" style={{ opacity: 1 }}>
        <g transform={`translate(${PLANE_TX},${PLANE_TY}) scale(${PLANE_SCALE})`}>
          <g>
            <path fillRule="evenodd" clipRule="evenodd" d={planePath} fill="#EF4118" />
            <animateMotion dur={`${durationMs}ms`} fill="freeze" rotate="auto">
              <mpath href="#flightPath" />
            </animateMotion>
          </g>
        </g>
      </g>

      <g className={`fa-to-pop ${phase === 'end' ? 'visible' : ''}`}>
        <circle cx={760} cy={140} r={50} fill="#3B2AFB" filter="url(#drop)" />
        <text x={760} y={152} textAnchor="middle" fill="white" fontWeight={700} fontSize={32}>{toSigla}</text>
      </g>
    </>
  );

  const css = `
    .fa-from-pop { transform-origin: center; animation: fa-pop 340ms cubic-bezier(.2,.9,.2,1) forwards; }
    .fa-from-drag { animation: fa-drag 420ms cubic-bezier(.2,.9,.2,1) forwards 260ms; }
    .fa-line { stroke-dasharray: 600; stroke-dashoffset: 600; opacity:0; animation: fa-line ${Math.round(durationMs*0.7)}ms linear forwards 260ms; }
    .fa-plane { opacity:0; animation: fa-plane-fade 120ms linear forwards 220ms; }
    .fa-to-pop { transform-origin: center; transform: scale(0); }
    .fa-to-pop.visible { animation: fa-pop-to 300ms cubic-bezier(.2,.9,.2,1) forwards; }
    @keyframes fa-pop { 0% { transform: scale(0); opacity:0 } 60% { transform: scale(1.12); opacity:1 } 100% { transform: scale(1); } }
    @keyframes fa-drag { 0% { transform: translateX(0) } 100% { transform: translateX(-10px) } }
    @keyframes fa-line { 0% { stroke-dashoffset: 600; opacity:0 } 20% { opacity:0.12 } 100% { stroke-dashoffset: 0; opacity:0.12 } }
    @keyframes fa-plane-fade { 0% { opacity:0; transform: translateY(6px) } 100% { opacity:1; transform: translateY(0) } }
    @keyframes fa-pop-to { 0% { transform: scale(0); opacity:0 } 60% { transform: scale(1.15); opacity:1 } 100% { transform: scale(1); } }
    .fa-msg { position: relative; }
    .fa-msg .initial { opacity:1; transform: translateY(0); transition: opacity 280ms ease, transform 280ms ease; }
    .fa-msg.mid .initial { opacity:0; transform: translateY(-8px); }
    .fa-msg .final { opacity:0; transform: translateY(8px); transition: opacity 280ms ease 120ms, transform 280ms ease 120ms; }
    .fa-msg.mid .final, .fa-msg.end .final { opacity:1; transform: translateY(0); }
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <style>{css}</style>
      <div className="absolute inset-0 bg-white" />

      <div style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 8, borderRadius: 6, fontSize: 12, zIndex: 10000 }}>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>FLIGHT DEBUG</div>
        <div style={{ maxWidth: 420, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>path: {computedPath ?? '(fallback)'}</div>
        <div style={{ marginTop: 6 }}>s: {computedPoints ? `${Math.round(computedPoints.s.x)},${Math.round(computedPoints.s.y)}` : '-'}</div>
        <div>e: {computedPoints ? `${Math.round(computedPoints.e.x)},${Math.round(computedPoints.e.y)}` : '-'}</div>
      </div>

      <div className="relative w-full max-w-4xl px-6 py-8 flex flex-col items-center justify-center">
        <svg ref={svgRef} viewBox="0 0 900 220" className="w-full max-w-4xl h-[220px]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="drop" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.08" />
            </filter>
            <path id="flightPath" d={computedPath ?? 'M140,140 C300,10 600,10 760,140'} />
          </defs>

          <path d={computedPath ?? 'M140,140 C300,10 600,10 760,140'} stroke="#111827" strokeWidth={2} strokeDasharray="6 8" strokeLinecap="round" fill="none" className="fa-line" />

          {pointsContent}
        </svg>

        <div className={`mt-6 text-base text-[#0B1220] font-semibold fa-msg ${phase}`}>
          <div className="initial">{initialMessage}</div>
          <div className="final">{finalMessage}</div>
        </div>
      </div>
    </div>
  );
};

export default FlightAnimationOverlay;
