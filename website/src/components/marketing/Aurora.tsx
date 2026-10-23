import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * Three drifting radial light sources (violet / teal / pink) over near-black.
 * Deliberately cheap: no noise loops, no texture reads.
 */
const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 u_res;
uniform float u_time;

void main() {
  vec2 p = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / max(u_res.y, 1.0);
  vec2 uv = vec2((p.x - 0.5) * aspect, p.y - 0.5);

  float t = u_time * 0.06;

  vec2 c1 = vec2(-0.32 + 0.16 * sin(t * 1.05), 0.16 + 0.10 * cos(t * 0.86));
  vec2 c2 = vec2( 0.38 + 0.18 * cos(t * 0.72), 0.02 + 0.13 * sin(t * 1.21));
  vec2 c3 = vec2( 0.06 + 0.22 * sin(t * 0.58), -0.30 + 0.09 * cos(t * 0.97));

  float d1 = smoothstep(1.05, 0.0, length(uv - c1));
  float d2 = smoothstep(0.92, 0.0, length(uv - c2));
  float d3 = smoothstep(0.78, 0.0, length(uv - c3));

  vec3 col = vec3(0.0196, 0.0196, 0.0392);

  col += vec3(0.482, 0.141, 0.851) * pow(d1, 2.0) * 0.62;
  col += vec3(0.000, 0.878, 0.949) * pow(d2, 2.3) * 0.42;
  col += vec3(0.949, 0.180, 0.522) * pow(d3, 2.5) * 0.34;

  float vignette = smoothstep(1.15, 0.12, length(uv * vec2(0.82, 1.05)));
  col *= mix(0.58, 1.0, vignette);

  gl_FragColor = vec4(col, 1.0);
}
`;

const MAX_DPR = 1.5;
const FRAME_INTERVAL_MS = 1000 / 30;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Aurora({ className }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let disposed = false;
    let started = false;
    let visible = !document.hidden;
    let inView = true;
    let rafId = 0;
    let startRafA = 0;
    let startRafB = 0;
    let lastFrameAt = 0;
    const startedAt = performance.now();

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let uRes: WebGLUniformLocation | null = null;
    let uTime: WebGLUniformLocation | null = null;

    const fail = () => {
      if (!disposed) setWebglFailed(true);
    };

    const compile = (type: number, source: string): WebGLShader | null => {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const resize = () => {
      if (!gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const draw = (timeSeconds: number) => {
      if (!gl || !program || !uRes || !uTime) return;
      gl.useProgram(program);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, timeSeconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      rafId = 0;
      if (disposed || !visible || !inView) return;
      if (now - lastFrameAt >= FRAME_INTERVAL_MS) {
        lastFrameAt = now;
        draw((now - startedAt) / 1000);
      }
      rafId = requestAnimationFrame(frame);
    };

    const resume = () => {
      if (disposed || !started || rafId || !visible || !inView) return;
      rafId = requestAnimationFrame(frame);
    };

    const pause = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const setup = () => {
      if (disposed) return;
      started = true;

      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      });

      if (!gl) {
        fail();
        return;
      }

      const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vertex || !fragment) {
        fail();
        return;
      }

      program = gl.createProgram();
      if (!program) {
        fail();
        return;
      }
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        fail();
        return;
      }

      uRes = gl.getUniformLocation(program, 'u_res');
      uTime = gl.getUniformLocation(program, 'u_time');

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW
      );
      const position = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      resize();

      if (prefersReducedMotion()) {
        draw(0);
        return;
      }

      resume();
    };

    const onVisibilityChange = () => {
      visible = !document.hidden;
      if (visible) resume();
      else pause();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        if (inView) resume();
        else pause();
      },
      { threshold: 0 }
    );
    observer.observe(wrapper);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (started && prefersReducedMotion()) draw(0);
    });
    resizeObserver.observe(wrapper);

    document.addEventListener('visibilitychange', onVisibilityChange);
    canvas.addEventListener('webglcontextlost', fail);

    // Wait for the first paint (the H1 is the LCP element) before touching WebGL.
    startRafA = requestAnimationFrame(() => {
      startRafB = requestAnimationFrame(setup);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(startRafA);
      cancelAnimationFrame(startRafB);
      cancelAnimationFrame(rafId);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', fail);
      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {/* Static fallback: also what renders while the shader is warming up. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 18% 22%, rgba(123,36,217,0.55) 0%, rgba(123,36,217,0) 70%),' +
            'radial-gradient(55% 50% at 82% 16%, rgba(0,224,242,0.30) 0%, rgba(0,224,242,0) 72%),' +
            'radial-gradient(60% 55% at 52% 92%, rgba(242,46,133,0.28) 0%, rgba(242,46,133,0) 72%),' +
            '#05050a',
        }}
      />
      <canvas
        ref={canvasRef}
        className={cn('absolute inset-0 h-full w-full transition-opacity duration-700', webglFailed ? 'opacity-0' : 'opacity-100')}
      />
    </div>
  );
}
