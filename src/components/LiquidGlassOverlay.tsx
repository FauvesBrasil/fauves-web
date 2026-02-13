import React, { useEffect, useRef } from 'react';

type Props = {
  className?: string;
};

const vertexShaderSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// A lightweight fragment shader that applies a subtle liquid distortion and
// returns semi-transparent color so the card underneath shows through.
const fragmentShaderSource = `
precision mediump float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform sampler2D iChannel0;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p = uv;
  float t = iTime * 0.6;

  // Simple moving waves driven by time and mouse
  p += 0.005 * vec2(
    sin(10.0 * uv.y + t + iMouse.x * 0.01),
    cos(10.0 * uv.x + t - iMouse.y * 0.01)
  );

  // Sample a fallback white texture (iChannel0).
  vec3 base = texture2D(iChannel0, p).rgb;

  // Tint to bluish glass color and reduce contrast
  vec3 tint = mix(base, vec3(0.85, 0.9, 1.0), 0.18);
  // Soft lighten and semi-transparent
  gl_FragColor = vec4(tint, 0.55);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // eslint-disable-next-line no-console
    console.warn('Shader compile error', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const LiquidGlassOverlay: React.FC<Props> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    let rafId = 0;

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms: Record<string, WebGLUniformLocation | null> = {
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iTime: gl.getUniformLocation(program, 'iTime'),
      iMouse: gl.getUniformLocation(program, 'iMouse'),
      iChannel0: gl.getUniformLocation(program, 'iChannel0'),
    };

    // Create a tiny white texture as fallback
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const pixel = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let mouse = [0, 0];

    function setSizeToContainer() {
      const container = containerRef.current || canvas.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = [e.clientX - rect.left, rect.height - (e.clientY - rect.top)];
    };

    window.addEventListener('resize', setSizeToContainer);
    canvas.addEventListener('pointermove', onPointerMove);

    setSizeToContainer();

    const startTime = performance.now();
    function render() {
      const currentTime = (performance.now() - startTime) / 1000;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (uniforms.iResolution) gl.uniform3f(uniforms.iResolution, canvas.width, canvas.height, 1.0);
      if (uniforms.iTime) gl.uniform1f(uniforms.iTime, currentTime);
      if (uniforms.iMouse) gl.uniform4f(uniforms.iMouse, mouse[0], mouse[1], 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (uniforms.iChannel0) gl.uniform1i(uniforms.iChannel0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', setSizeToContainer);
      canvas.removeEventListener('pointermove', onPointerMove);
      try {
        if (program) gl.deleteProgram(program);
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        if (buffer) gl.deleteBuffer(buffer);
        if (texture) gl.deleteTexture(texture);
      } catch (_) {}
    };
  }, []);

  return (
    <div ref={containerRef} className={className || 'absolute inset-0 pointer-events-none'}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default LiquidGlassOverlay;
