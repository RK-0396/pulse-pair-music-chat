"use client";
import { useEffect, useRef } from "react";

interface Props {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  isSpotify?: boolean;
}

export const AudioVisualizer = ({ analyser, isPlaying, isSpotify }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const BAR_COUNT = 52;
    const BAR_GAP = 3;
    const BAR_W = W / BAR_COUNT - BAR_GAP;

    const drawIdle = () => {
      ctx.clearRect(0, 0, W, H);
      const t = Date.now() / 800;
      for (let i = 0; i < BAR_COUNT; i++) {
        const h = (Math.sin(t + i * 0.38) * 0.5 + 0.5) * H * 0.18 + H * 0.06;
        const x = i * (W / BAR_COUNT);
        const grad = ctx.createLinearGradient(0, H - h, 0, H);
        grad.addColorStop(0, "rgba(168,85,247,0.45)");
        grad.addColorStop(1, "rgba(99,102,241,0.15)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, H - h, BAR_W, h, 3);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(drawIdle);
    };

    const drawSimulated = () => {
      ctx.clearRect(0, 0, W, H);
      const t = Date.now() / 200;
      for (let i = 0; i < BAR_COUNT; i++) {
        const noise = Math.sin(t + i * 0.2) * 0.3 + Math.sin(t * 0.8 + i * 0.4) * 0.2;
        const h = Math.max((noise + 0.5) * H * 0.6, H * 0.12);
        const x = i * (W / BAR_COUNT);
        const hue = 260 + (noise + 0.5) * 40;
        const grad = ctx.createLinearGradient(0, H - h, 0, H);
        grad.addColorStop(0, `hsla(${hue},85%,68%,1)`);
        grad.addColorStop(1, `hsla(${hue - 40},70%,35%,0.3)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, H - h, BAR_W, h, 3);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(drawSimulated);
    };

    const drawActive = () => {
      if (!analyser) { drawSimulated(); return; }
      const len = analyser.frequencyBinCount;
      const data = new Uint8Array(len);
      const step = Math.floor(len / BAR_COUNT);

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        analyser.getByteFrequencyData(data);
        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < BAR_COUNT; i++) {
          const raw = data[i * step] / 255;
          const mirror = i < BAR_COUNT / 2 ? i : BAR_COUNT - 1 - i;
          const val = (data[mirror * step] / 255 + raw) / 2;
          const h = Math.max(val * H * 0.95, H * 0.04);
          const x = i * (W / BAR_COUNT);
          const hue = 260 + val * 80;
          const grad = ctx.createLinearGradient(0, H - h, 0, H);
          grad.addColorStop(0, `hsla(${hue},85%,68%,1)`);
          grad.addColorStop(0.6, `hsla(${hue - 20},75%,50%,0.8)`);
          grad.addColorStop(1, `hsla(${hue - 40},70%,35%,0.3)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, H - h, BAR_W, h, [4, 4, 0, 0]);
          ctx.fill();
        }
      };
      loop();
    };

    cancelAnimationFrame(rafRef.current);
    if (isPlaying) {
      if (isSpotify || !analyser) drawSimulated();
      else drawActive();
    } else {
      drawIdle();
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, analyser, isSpotify]);

  return (
    <canvas
      ref={canvasRef}
      width={624}
      height={130}
      className="w-full rounded-2xl"
    />
  );
};
