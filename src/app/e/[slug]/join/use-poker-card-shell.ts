"use client";

import { useLayoutEffect, useRef, useState } from "react";

const MAX_TILT_DEG = 6;

export type PokerCardShellOptions = {
  /** Stagger second card entrance (ms). Ignored when reduced motion. */
  entranceDelayMs?: number;
};

/**
 * Entrance animation + pointer-based 3D tilt on the join “poker card”.
 * Respects prefers-reduced-motion (no tilt, no entrance slide).
 */
export function usePokerCardShell(options?: PokerCardShellOptions) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [entranceReady, setEntranceReady] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const delayMs = options?.entranceDelayMs ?? 0;

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTiltEnabled(!reduce);
    if (reduce) {
      setEntranceReady(true);
      return;
    }
    const t = window.setTimeout(() => {
      requestAnimationFrame(() => setEntranceReady(true));
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  useLayoutEffect(() => {
    if (!tiltEnabled) return;
    const el = cardRef.current;
    if (!el) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const dx = nx * 2 - 1;
        const dy = ny * 2 - 1;
        const rx = -dy * MAX_TILT_DEG;
        const ry = dx * MAX_TILT_DEG;
        el.style.setProperty("--tilt-x", `${rx}deg`);
        el.style.setProperty("--tilt-y", `${ry}deg`);
      });
    };

    const onLeave = () => {
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [tiltEnabled]);

  return { cardRef, entranceReady, tiltEnabled };
}
