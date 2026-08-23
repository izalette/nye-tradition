"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <div style={{ maxWidth: "22rem", margin: "3rem auto" }}>
      <h1 style={{ marginBottom: "1.25rem" }}>Admin</h1>
      <form action={action} className="card">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        {state?.error ? (
          <p className="error" role="alert" style={{ marginTop: "0.5rem" }}>
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} style={{ marginTop: "1rem", width: "100%" }}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
