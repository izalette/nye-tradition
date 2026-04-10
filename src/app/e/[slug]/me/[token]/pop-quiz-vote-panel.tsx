"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitPopQuizVotesBatchAction, type PopQuizVoteState } from "@/app/actions";

type NameOpt = { id: string; display_name: string };

type FactRow = {
  authorId: string;
  authorName: string;
  fun_fact: string;
};

type Props = {
  slug: string;
  token: string;
  facts: FactRow[];
  voteOptions: NameOpt[];
  initialGuesses: Record<string, string>;
};

export function PopQuizVotePanel({ slug, token, facts, voteOptions, initialGuesses }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    PopQuizVoteState | null,
    FormData
  >(submitPopQuizVotesBatchAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state?.ok, router]);

  if (facts.length === 0) {
    return null;
  }

  const allAnswered = facts.every((f) => {
    const g = initialGuesses[f.authorId];
    return g !== undefined && String(g).trim() !== "";
  });

  const nameById = (id: string) => voteOptions.find((v) => v.id === id)?.display_name ?? "—";

  const correctCount = facts.filter(
    (f) => (initialGuesses[f.authorId] ?? "") === f.authorId,
  ).length;
  const factCount = facts.length;

  return (
    <div className="card card-festive pop-quiz-vote-section">
      <p className="card-festive-heading" style={{ marginTop: 0 }}>
        Fun fact
      </p>
      <p className="muted" style={{ marginTop: "0.15rem", marginBottom: "1rem" }}>
        How well do you know the Group?
      </p>

      {allAnswered ? (
        <>
          <p className="pop-quiz-score-summary" role="status">
            You got <strong>{correctCount}</strong> of <strong>{factCount}</strong>{" "}
            {factCount === 1 ? "fact" : "facts"} right.
          </p>
          <ul className="pop-quiz-vote-list">
          {facts.map((fact) => {
            const guess = initialGuesses[fact.authorId] ?? "";
            const correct = guess === fact.authorId;
            return (
              <li key={fact.authorId} className="pop-quiz-vote-item">
                <p className="pop-quiz-vote-fact">{fact.fun_fact}</p>
                <p className="muted" style={{ margin: "0.35rem 0 0.15rem" }}>
                  Your pick: <strong>{nameById(guess)}</strong>
                </p>
                <p className="pop-quiz-result" role="status">
                  {correct ? (
                    <span className="pop-quiz-correct">Correct!</span>
                  ) : (
                    <span className="pop-quiz-wrong">
                      Answer: <strong>{fact.authorName}</strong>
                    </span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
        </>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="token" value={token} />
          <ul className="pop-quiz-vote-list">
            {facts.map((fact) => (
              <li key={fact.authorId} className="pop-quiz-vote-item">
                <p id={`fact-${fact.authorId}`} className="pop-quiz-vote-fact">
                  {fact.fun_fact}
                </p>
                <select
                  id={`vote-${fact.authorId}`}
                  name={`guess_${fact.authorId}`}
                  required
                  className="pop-quiz-select"
                  aria-labelledby={`fact-${fact.authorId}`}
                  defaultValue={initialGuesses[fact.authorId] ?? ""}
                >
                  <option value="" disabled>
                    Choose…
                  </option>
                  {voteOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          {state && !state.ok ? (
            <p className="error" role="alert" style={{ marginTop: "0.75rem" }}>
              {state.error}
            </p>
          ) : null}
          <button type="submit" className="btn" style={{ marginTop: "1rem" }} disabled={pending}>
            {pending ? "Submitting…" : "Submit answers"}
          </button>
          <p className="muted" style={{ marginTop: "0.65rem", marginBottom: 0, fontSize: "0.95em" }}>
            Answers are shown after you submit — make a pick for every fact first.
          </p>
        </form>
      )}
    </div>
  );
}
