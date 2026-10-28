"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={formAction} className="form narrow card">
      <label className="field">
        <span className="field-label">Admin password</span>
        <input type="password" name="password" autoComplete="current-password" required autoFocus />
        {state.error && <span className="field-error">{state.error}</span>}
      </label>
      <button type="submit" className="button" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
