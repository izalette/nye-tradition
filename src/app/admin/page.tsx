import Link from "next/link";
import { getPublicBaseUrl } from "@/lib/base-url";
import { isEmailConfigured } from "@/lib/email";
import { CreateEventForm, CloseDrawForm } from "./admin-forms";

export default function AdminPage() {
  const baseUrl = getPublicBaseUrl();
  const emailReady = isEmailConfigured();

  return (
    <>
      <h1>Admin</h1>
      <p className="muted">
        Anyone who can open this page can create events and run draws — fine on your own
        Wi‑Fi; do not expose this app to the public internet without other protection.
        Optionally set <code>NEXT_PUBLIC_APP_URL</code> so links match your deployment.
        Use <code>TURSO_DATABASE_URL</code> and <code>TURSO_AUTH_TOKEN</code> for Turso
        (otherwise a local SQLite file is used).
      </p>
      <p className="muted">
        Email (optional):{" "}
        {emailReady ? (
          <>
            <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code> are set —
            join and draw notifications will send when participants provide an email.
          </>
        ) : (
          <>
            add <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code> to send
            join confirmations and &quot;draw ready&quot; messages.
          </>
        )}
      </p>
      <CreateEventForm baseUrl={baseUrl} />
      <CloseDrawForm baseUrl={baseUrl} />
      <p style={{ marginTop: "2rem" }}>
        <Link href="/">Home</Link>
      </p>
    </>
  );
}
