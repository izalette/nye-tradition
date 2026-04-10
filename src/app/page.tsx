import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <h1>NYE tradition</h1>
      <p>
        Use a link from your WhatsApp group to join an event. After the organiser
        runs the draw, open your personal link to see your secret friend, secret
        enemy, and cooking partner — never yourself in any role.
      </p>
      <p className="muted">
        Organisers: create an event in the admin area and share the join link in
        the group.
      </p>
      <Link className="btn" href="/admin">
        Admin
      </Link>
    </>
  );
}
