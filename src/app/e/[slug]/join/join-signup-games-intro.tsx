/**
 * Three-game strip — Romantic-era steel engraving (cross-hatch shading, arch plate,
 * chiaroscuro); Wonderland subjects (teacup, crown, teapot).
 */

function RomanticHatchPatterns({ prefix }: { prefix: string }) {
  return (
    <>
      <pattern
        id={`${prefix}-h1`}
        width="2"
        height="2"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(38)"
      >
        <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.34" />
      </pattern>
      <pattern
        id={`${prefix}-h2`}
        width="2"
        height="2"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-38)"
      >
        <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="0.3" />
      </pattern>
    </>
  );
}

function RomanticArchFrame() {
  const d = "M11 24 Q11 11 40 9 Q69 11 69 24 L69 91 Q40 95 11 91 Z";
  return (
    <>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="0.58" opacity="0.44" vectorEffect="nonScalingStroke" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.24" vectorEffect="nonScalingStroke" />
    </>
  );
}

function IllusTeaCup({ className }: { className?: string }) {
  const p = "rt";
  const cupClip = "M26 52 Q24 72 40 76 Q56 72 54 52 Q40 46 26 52Z";
  return (
    <svg className={className} viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <RomanticHatchPatterns prefix={p} />
        <clipPath id={`${p}-cc`}>
          <path d={cupClip} />
        </clipPath>
      </defs>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="nonScalingStroke">
        <RomanticArchFrame />
        <path d="M14 20 Q22 14 28 22" strokeWidth="0.52" opacity="0.42" />
        <path
          d="M24 13 A8 8 0 1 1 24 27 A5.5 5.5 0 1 0 24 13Z"
          strokeWidth="0.38"
          opacity="0.5"
          fill="currentColor"
          fillOpacity="0.08"
        />
        <path d="M8 52 Q14 46 18 54 Q12 62 8 68" strokeWidth="0.38" opacity="0.32" />
        <path d="M10 58 Q16 52 20 60" strokeWidth="0.34" opacity="0.28" />
        <ellipse cx="40" cy="80" rx="28" ry="6.5" strokeWidth="0.82" opacity="0.8" />
        <g clipPath={`url(#${p}-cc)`}>
          <rect x="20" y="44" width="40" height="40" fill={`url(#${p}-h1)`} opacity="0.18" />
          <rect x="20" y="44" width="40" height="40" fill={`url(#${p}-h2)`} opacity="0.12" />
        </g>
        <path d={cupClip} strokeWidth="0.92" fill="currentColor" fillOpacity="0.09" />
        <path d="M54 56 Q66 58 68 68 Q69 76 56 80" strokeWidth="0.82" />
        <path d="M32 48 L34 40 L46 40 L48 48" strokeWidth="0.82" />
        <path d="M40 40 L40 33" strokeWidth="0.82" />
        <path d="M34 31 Q36 24 34 18" strokeWidth="0.48" opacity="0.68" />
        <path d="M40 29 Q42 20 40 13" strokeWidth="0.48" opacity="0.68" />
        <path d="M46 31 Q48 22 46 17" strokeWidth="0.48" opacity="0.68" />
      </g>
    </svg>
  );
}

function IllusQueenCrown({ className }: { className?: string }) {
  const p = "rq";
  return (
    <svg className={className} viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <RomanticHatchPatterns prefix={p} />
        <clipPath id={`${p}-band`}>
          <path d="M18 68 L62 68 L60 78 L20 78 Z" />
        </clipPath>
      </defs>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="nonScalingStroke">
        <RomanticArchFrame />
        <g opacity="0.34" strokeWidth="0.36">
          <line x1="40" y1="10" x2="40" y2="22" />
          <line x1="28" y1="14" x2="34" y2="24" />
          <line x1="52" y1="14" x2="46" y2="24" />
          <line x1="22" y1="20" x2="30" y2="26" />
          <line x1="58" y1="20" x2="50" y2="26" />
          <line x1="18" y1="28" x2="28" y2="30" />
          <line x1="62" y1="28" x2="52" y2="30" />
        </g>
        <path d="M10 78 Q6 72 12 68 Q18 74 14 82" strokeWidth="0.4" opacity="0.32" />
        <path d="M70 78 Q74 72 68 68 Q62 74 66 82" strokeWidth="0.4" opacity="0.32" />
        <g clipPath={`url(#${p}-band)`}>
          <rect x="16" y="64" width="48" height="20" fill={`url(#${p}-h1)`} opacity="0.19" />
          <rect x="16" y="64" width="48" height="20" fill={`url(#${p}-h2)`} opacity="0.1" />
        </g>
        <path d="M18 68 L62 68 L60 78 L20 78 Z" strokeWidth="0.88" fill="currentColor" fillOpacity="0.1" />
        <path d="M20 68 L24 38 L32 58 L40 28 L48 58 L56 38 L60 68" strokeWidth="0.92" />
        <circle cx="24" cy="36" r="3.5" strokeWidth="0.7" fill="currentColor" fillOpacity="0.12" />
        <circle cx="40" cy="24" r="3.5" strokeWidth="0.7" fill="currentColor" fillOpacity="0.12" />
        <circle cx="56" cy="36" r="3.5" strokeWidth="0.7" fill="currentColor" fillOpacity="0.12" />
        <path d="M40 52 C36 48 36 44 40 42 C44 44 44 48 40 52Z" fill="currentColor" fillOpacity="0.13" strokeWidth="0.6" />
      </g>
    </svg>
  );
}

function IllusTeapot({ className }: { className?: string }) {
  const p = "rp";
  const body = "M24 54 Q22 82 40 84 Q58 82 56 54 Q40 48 24 54Z";
  return (
    <svg className={className} viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <RomanticHatchPatterns prefix={p} />
        <clipPath id={`${p}-bd`}>
          <path d={body} />
        </clipPath>
      </defs>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="nonScalingStroke">
        <RomanticArchFrame />
        <path d="M6 88 Q20 82 40 84 Q60 82 74 88" strokeWidth="0.4" opacity="0.26" />
        <path d="M10 86 Q24 80 40 82 Q56 80 70 86" strokeWidth="0.3" opacity="0.18" />
        <path
          d="M26 12 Q40 6 54 12 Q48 20 40 22 Q32 20 26 12Z"
          strokeWidth="0.46"
          opacity="0.36"
          fill="currentColor"
          fillOpacity="0.05"
        />
        <path
          d="M30 8 Q40 4 50 8 M32 10 Q40 7 48 10 M34 12 Q40 10 46 12"
          strokeWidth="0.3"
          opacity="0.4"
        />
        <g clipPath={`url(#${p}-bd)`}>
          <rect x="18" y="46" width="44" height="44" fill={`url(#${p}-h1)`} opacity="0.17" />
          <rect x="18" y="46" width="44" height="44" fill={`url(#${p}-h2)`} opacity="0.11" />
        </g>
        <path d={body} strokeWidth="0.92" fill="currentColor" fillOpacity="0.09" />
        <path d="M56 58 Q74 56 76 70 Q77 80 58 84" strokeWidth="0.82" />
        <path d="M24 58 Q12 62 12 74 Q12 86 24 90" strokeWidth="0.82" />
        <path d="M30 52 L32 42 L48 42 L50 52" strokeWidth="0.82" />
        <path d="M38 42 L38 33" strokeWidth="0.82" />
        <ellipse cx="40" cy="40" rx="10" ry="3" strokeWidth="0.7" />
        <path
          d="M30 26 Q34 14 40 10 Q46 14 50 26 Q44 22 40 24 Q36 22 30 26Z"
          strokeWidth="0.5"
          opacity="0.58"
          fill="none"
        />
        <path d="M34 22 Q40 18 46 22" strokeWidth="0.4" opacity="0.46" />
      </g>
    </svg>
  );
}

export function JoinSignupGamesIntro() {
  return (
    <div className="join-page-intro">
      <p>
        <strong>One sign-up per person.</strong>
      </p>
      <h2 className="join-page-signup-heading">What you&apos;re signing up for</h2>

      <div className="join-page-games-row">
        <article className="join-page-game-tile">
          <div className="join-page-game-illus join-page-game-illus--romantic join-page-game-illus--moon">
            <IllusTeaCup className="join-page-illus-svg join-page-illus-svg--romantic" />
          </div>
          <h3 className="join-page-game-name">Secret friend</h3>
          <p className="join-page-game-text">
            Someone&apos;s got your back throughout the trip. You&apos;ll find out who on the last day.
          </p>
        </article>

        <article className="join-page-game-tile">
          <div className="join-page-game-illus join-page-game-illus--romantic join-page-game-illus--storm">
            <IllusQueenCrown className="join-page-illus-svg join-page-illus-svg--romantic" />
          </div>
          <h3 className="join-page-game-name">Secret enemy</h3>
          <p className="join-page-game-text">You know what this is. Good luck.</p>
        </article>

        <article className="join-page-game-tile">
          <div className="join-page-game-illus join-page-game-illus--romantic join-page-game-illus--dusk">
            <IllusTeapot className="join-page-illus-svg join-page-illus-svg--romantic" />
          </div>
          <h3 className="join-page-game-name">Cooking partner</h3>
          <p className="join-page-game-text">
            You and one other person. One preparation for the group. No excuses — only legends come out
            of this.
          </p>
        </article>
      </div>
    </div>
  );
}
