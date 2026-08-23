"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null);

  return (
    <div style={{ maxWidth: "22rem", margin: "3rem auto" }}>
      <h1 style={{ marginBottom: "1.25rem" }}>Create account</h1>
      <form action={action} className="card">
        <label htmlFor="group_code">Group code</label>
        <input
          id="group_code"
          name="group_code"
          type="password"
          required
          autoComplete="off"
          placeholder="Shared with the group"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          style={{ marginBottom: "0.75rem" }}
        />
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          placeholder="Your name or nickname"
          style={{ marginBottom: "0.75rem" }}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="At least 6 characters"
        />
        {state?.error ? (
          <p className="error" role="alert" style={{ marginTop: "0.5rem" }}>
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} style={{ marginTop: "1rem", width: "100%" }}>
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Already have an account?{" "}
        <Link href="/admin/login">Sign in</Link>
      </p>
    </div>
  );
}
