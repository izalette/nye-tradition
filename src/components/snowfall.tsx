"use client";

const FLAKE_COUNT = 30;

type Flake = {
  id: number;
  leftPct: number;
  fallDuration: number;
  fallDelay: number;
  wobbleDuration: number;
  sizePx: number;
  opacity: number;
};

function flakes(): Flake[] {
  return Array.from({ length: FLAKE_COUNT }, (_, i) => ({
    id: i,
    leftPct: ((i * 37) % 100) + (i % 5) * 0.15,
    fallDuration: 9 + (i % 9) + (i % 4) * 0.4,
    fallDelay: (i * 0.31) % 7,
    wobbleDuration: 2.2 + (i % 5) * 0.35,
    sizePx: 2 + (i % 5),
    opacity: 0.45 + (i % 6) * 0.07,
  }));
}

const DATA = flakes();

export function Snowfall() {
  return (
    <div className="snowfall" aria-hidden="true">
      {DATA.map((f) => (
        <div
          key={f.id}
          className="snowfall-track"
          style={{
            left: `${f.leftPct}%`,
            animationDuration: `${f.fallDuration}s`,
            animationDelay: `${f.fallDelay}s`,
          }}
        >
          <span
            className={`snowfall-flake${f.id % 2 === 0 ? " snowfall-flake--alt" : ""}`}
            style={{
              width: f.sizePx,
              height: f.sizePx,
              opacity: f.opacity,
              animationDuration: `${f.wobbleDuration}s`,
              animationDelay: `${-(f.id % 10)}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
