import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface Props {
  animationData?: any;
  path?: string; // URL to JSON
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
}

const LottieReact: React.FC<Props> = ({ animationData, path, loop = true, autoplay = true, style }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // destroy previous
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        animationData: animationData,
        path: path,
      });
      // try to reduce subframe jitter and ensure playback resumes
      try {
        // setSubframe is available on AnimationItem in some versions
        // @ts-ignore
        if (animRef.current && typeof (animRef.current as any).setSubframe === 'function') {
          // prefer frame-based updates to avoid tiny subframe jumps
          // this can help reduce visible jitter on slow devices
          // @ts-ignore
          (animRef.current as any).setSubframe(false);
        }
      } catch (e) {}
      try { animRef.current.play(); } catch (e) {}
    } catch (e) {
      // no-op
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [animationData, path, loop, autoplay]);

  return <div ref={containerRef} style={style} />;
};

export default LottieReact;
