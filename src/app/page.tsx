import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-page">
      <h1 className="home-title">Welcome to the NYE Group</h1>
      <p>
        Every year we run <strong>three games</strong> together: secret friend, secret enemy,
        and a NYE cooking partner. Same chaos, new draws — let&apos;s go.
      </p>
      <p className="muted">
        It all started in <strong>London, 2017</strong>, when we first played secret friends. By
        the end of that trip, <strong>secret enemy</strong> was born — and the tradition stuck.
      </p>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <p style={{ marginTop: 0 }}>
          <strong>How it works</strong> (no stress)
        </p>
        <ol className="instruction-list">
          <li>
            Someone shares the <strong>join link</strong> in the WhatsApp Group — you sign up
            once with your name.
          </li>
          <li>
            Add your <strong>email</strong> — we send your private link; bookmark that page.
          </li>
          <li>When everyone&apos;s in, the organiser <strong>runs the draw</strong>.</li>
          <li>
            Open your private page to see your assignments. Keep &quot;enemy&quot; playful; you
            know the vibe.
          </li>
        </ol>
      </div>

      <p style={{ marginTop: "1.25rem" }} className="muted">
        Running the event? Head to admin, create this year&apos;s game, then paste the join link in
        the chat.
      </p>
      <Link className="btn" href="/admin">
        Admin
      </Link>
    </div>
  );
}
