"use client";

import { useState } from "react";

export function PopQuizCard({
  index,
  display_name,
  fun_fact,
}: {
  index: number;
  display_name: string;
  fun_fact: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <li className="pop-quiz-card pop-quiz-card-admin">
      <div className="pop-quiz-meta">#{index}</div>
      <p className="pop-quiz-fact">{fun_fact}</p>
      {revealed ? (
        <p className="pop-quiz-name">
          <strong>{display_name}</strong>
        </p>
      ) : (
        <button
          type="button"
          className="pop-quiz-reveal"
          onClick={() => setRevealed(true)}
        >
          Reveal
        </button>
      )}
    </li>
  );
}
