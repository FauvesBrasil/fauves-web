import { useEffect, useRef } from 'react';
import { Geometry, Mesh, Program, Renderer, Vec2 } from 'ogl';

type WebGLParticleFieldProps = {
  className?: string;
  mode?: 'hero' | 'footer';
  active?: boolean;
};

const vertex = /* glsl */ `
  precision highp float;

  attribute vec3 position;
  attribute float aSeed;

  uniform float uTime;
  uniform float uDpr;
  uniform float uActive;
  uniform float uFooter;
  uniform vec2 uPointer;

  varying float vAlpha;
  varying float vSeed;

  void main() {
    float speed = mix(0.018, 0.052, aSeed);
    float depth = fract(position.z + uTime * speed);
    vec2 point = position.xy;

    if (uFooter < 0.5) {
      float perspective = mix(0.48, 1.34, depth);
      point *= perspective;
      point += uPointer * mix(0.018, 0.065, depth);
      point.y += sin(uTime * 0.42 + aSeed * 18.0) * 0.018;
    } else {
      point.x += sin(uTime * 0.16 + position.y * 7.0 + aSeed * 9.0) * 0.018;
      point.y += cos(uTime * 0.13 + position.x * 8.0 + aSeed * 12.0) * 0.014;
      point += uPointer * 0.014;
    }

    float edgeFade = smoothstep(0.0, 0.16, depth) * (1.0 - smoothstep(0.82, 1.0, depth));
    vAlpha = edgeFade * mix(0.26, 0.82, aSeed) * mix(0.7, 1.35, uActive);
    vSeed = aSeed;

    gl_Position = vec4(point, 0.0, 1.0);
    gl_PointSize = (1.2 + aSeed * 2.8) * uDpr * mix(0.68, 1.42, depth) * mix(0.85, 1.3, uActive);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uFooter;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float circle = 1.0 - smoothstep(0.27, 0.5, length(uv));

    vec3 blue = vec3(0.20, 0.30, 1.0);
    vec3 pink = vec3(0.88, 0.20, 0.62);
    vec3 orange = vec3(1.0, 0.34, 0.12);
    vec3 color = vSeed < 0.52
      ? mix(blue, pink, vSeed * 1.9)
      : mix(pink, orange, (vSeed - 0.52) * 2.08);

    float footerDim = mix(1.0, 0.72, uFooter);
    gl_FragColor = vec4(color * footerDim, circle * vAlpha);
  }
`;

const WebGLParticleField = ({ className = '', mode = 'hero', active = false }: WebGLParticleFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = mode === 'footer' ? 920 : 460;
    let renderer: Renderer;

    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        antialias: false,
        depth: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.7),
        powerPreference: 'high-performance',
      });
    } catch {
      return undefined;
    }

    const { gl } = renderer;
    gl.clearColor(0, 0, 0, 0);

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const seed = ((index * 16807) % 2147483647) / 2147483647;
      const secondary = ((index * 48271 + 17) % 2147483647) / 2147483647;
      positions[offset] = secondary * 2.16 - 1.08;
      positions[offset + 1] = seed * 2.18 - 1.09;
      positions[offset + 2] = ((index * 69621 + 31) % count) / count;
      seeds[index] = (seed + secondary * 0.73) % 1;
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      aSeed: { size: 1, data: seeds },
    });
    const pointer = new Vec2(0, 0);
    const pointerTarget = new Vec2(0, 0);
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: renderer.dpr },
        uActive: { value: activeRef.current ? 1 : 0 },
        uFooter: { value: mode === 'footer' ? 1 : 0 },
        uPointer: { value: pointer },
      },
    });
    const particles = new Mesh(gl, { geometry, program, mode: gl.POINTS });

    let frame = 0;
    let visible = true;
    let activation = activeRef.current ? 1 : 0;
    const start = performance.now();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height));
      program.uniforms.uDpr.value = renderer.dpr;
    };

    const movePointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerTarget.set(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        -((event.clientY - rect.top) / rect.height - 0.5) * 2,
      );
    };

    const render = (now: number) => {
      pointer.lerp(pointerTarget, reducedMotion ? 1 : 0.045);
      activation += ((activeRef.current ? 1 : 0) - activation) * 0.055;
      program.uniforms.uActive.value = activation;
      program.uniforms.uTime.value = reducedMotion ? 0 : (now - start) * 0.001;
      renderer.render({ scene: particles, clear: true });
      if (visible && !reducedMotion) frame = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      const nextVisible = entry.isIntersecting;
      if (nextVisible && !visible && !reducedMotion) frame = requestAnimationFrame(render);
      visible = nextVisible;
    }, { rootMargin: '120px' });

    resizeObserver.observe(host);
    intersectionObserver.observe(host);
    host.addEventListener('pointermove', movePointer, { passive: true });
    resize();
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      host.removeEventListener('pointermove', movePointer);
      geometry.remove();
      program.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [mode]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default WebGLParticleField;
