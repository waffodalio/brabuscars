"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const COLORS = ["#6d28d9", "#4f46e5", "#2563eb", "#f5a524", "#fb7185", "#34d399"];
const PIECES = 140;
const DURATION_MS = 2600;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  color: string;
}

/**
 * One-shot confetti shower over the whole window (a canvas, no library),
 * then `onDone`. Skipped for visitors who asked the system for less motion.
 */
export function Confetti({ onDone }: { onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone?.();
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);

    // Two bursts, from the lower corners, towards the middle.
    const pieces: Piece[] = Array.from({ length: PIECES }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const speed = 9 + Math.random() * 8;
      const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7;
      return {
        x: fromLeft ? 0 : width,
        y: height * 0.85,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 6,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: COLORS[i % COLORS.length],
      };
    });

    const start = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const elapsed = now - start;
      context.clearRect(0, 0, width, height);
      context.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - DURATION_MS * 0.6) / (DURATION_MS * 0.4));
      for (const piece of pieces) {
        piece.vy += 0.28;
        piece.vx *= 0.985;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.angle += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
        context.restore();
      }
      if (elapsed < DURATION_MS) frame = requestAnimationFrame(draw);
      else onDone?.();
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
    // One shot per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Under <body>: a transformed ancestor (page fade-in) would otherwise
  // pin "fixed" to itself instead of the window.
  return createPortal(<canvas ref={canvasRef} className="chc-confetti" aria-hidden="true" />, document.body);
}
