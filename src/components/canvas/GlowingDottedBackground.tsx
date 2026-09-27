'use client';

import React, { useEffect, useRef } from 'react';
import { useViewport } from '@xyflow/react';

interface GlowingDottedBackgroundProps {
  baseGap?: number;
  glowRadius?: number;
}

export function GlowingDottedBackground({
  baseGap = 24,
  glowRadius = 160,
}: GlowingDottedBackgroundProps) {
  const { x, y, zoom } = useViewport();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean; opacity: number }>({
    x: -9999,
    y: -9999,
    active: false,
    opacity: 0,
  });
  const animFrameRef = useRef<number | null>(null);

  // Track mouse coordinates accurately relative to canvas bounds
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
      mouseRef.current.opacity = 1;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Adaptive grid level-of-detail to avoid overcrowding when zoomed way out
      // Screen gap = effectiveWorldGap * zoom. Keep screen gap >= 18px.
      let stepMultiplier = 1;
      while (baseGap * zoom * stepMultiplier < 18) {
        stepMultiplier *= 2;
      }
      const effectiveWorldGap = baseGap * stepMultiplier;

      // Stitch-style dynamic dot scaling:
      // When zoomed out (zoom < 1), dots dynamically scale up so they remain distinct,
      // bold, and tactile rather than disappearing into subpixel dust.
      const scaleFactor = Math.pow(Math.max(0.08, zoom), -0.4);
      const dotRadius = Math.min(3.2, Math.max(1.2, 1.35 * scaleFactor));

      // Calculate the start and end coordinates of dots visible on screen in world space:
      // sx = wx * zoom + x  ==>  wx = (sx - x) / zoom
      const minWorldX = (0 - x) / zoom;
      const maxWorldX = (width - x) / zoom;
      const minWorldY = (0 - y) / zoom;
      const maxWorldY = (height - y) / zoom;

      const startX = Math.floor(minWorldX / effectiveWorldGap) * effectiveWorldGap;
      const endX = Math.ceil(maxWorldX / effectiveWorldGap) * effectiveWorldGap;
      const startY = Math.floor(minWorldY / effectiveWorldGap) * effectiveWorldGap;
      const endY = Math.ceil(maxWorldY / effectiveWorldGap) * effectiveWorldGap;

      const mouse = mouseRef.current;
      // Smooth fade out when mouse is inactive
      if (!mouse.active && mouse.opacity > 0) {
        mouse.opacity = Math.max(0, mouse.opacity - 0.04);
      }

      const hasMouseGlow = mouse.opacity > 0.01;

      // Draw subtle ambient cursor halo
      if (hasMouseGlow) {
        const haloGradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          glowRadius * 1.2
        );
        haloGradient.addColorStop(0, `rgba(125, 115, 255, ${0.09 * mouse.opacity})`);
        haloGradient.addColorStop(0.5, `rgba(108, 99, 255, ${0.03 * mouse.opacity})`);
        haloGradient.addColorStop(1, 'rgba(108, 99, 255, 0)');

        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, glowRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Group dots into standard and glowing for optimal batch canvas rendering
      const standardDots: { sx: number; sy: number }[] = [];
      const glowingDots: {
        sx: number;
        sy: number;
        r: number;
        alpha: number;
        innerAlpha: number;
      }[] = [];

      for (let wx = startX; wx <= endX; wx += effectiveWorldGap) {
        const sx = wx * zoom + x;
        if (sx < -10 || sx > width + 10) continue;

        for (let wy = startY; wy <= endY; wy += effectiveWorldGap) {
          const sy = wy * zoom + y;
          if (sy < -10 || sy > height + 10) continue;

          let isGlow = false;
          if (hasMouseGlow) {
            const dist = Math.hypot(sx - mouse.x, sy - mouse.y);
            if (dist < glowRadius) {
              isGlow = true;
              const intensity = (1 - dist / glowRadius) * mouse.opacity;
              const t2 = intensity * intensity;
              const r = dotRadius * (1 + 0.8 * t2);
              glowingDots.push({
                sx,
                sy,
                r,
                alpha: 0.35 + 0.65 * t2,
                innerAlpha: t2,
              });
            }
          }

          if (!isGlow) {
            standardDots.push({ sx, sy });
          }
        }
      }

      // Batch render standard dots across the full screen
      ctx.fillStyle = '#383842';
      ctx.beginPath();
      for (let i = 0; i < standardDots.length; i++) {
        const { sx, sy } = standardDots[i];
        ctx.moveTo(sx + dotRadius, sy);
        ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
      }
      ctx.fill();

      // Render glowing dots with luminous accent highlights
      for (let i = 0; i < glowingDots.length; i++) {
        const { sx, sy, r, alpha, innerAlpha } = glowingDots[i];

        // Luminous glowing dot
        ctx.fillStyle = `rgba(150, 140, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        // High-energy white core for dots closest to cursor
        if (innerAlpha > 0.35) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(innerAlpha - 0.35) * 1.5})`;
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [x, y, zoom, baseGap, glowRadius]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
