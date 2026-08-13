"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { PasswordField } from "@/components/PasswordField";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.erro || "E-mail ou senha incorretos.");
        return;
      }
      window.location.href = data.redirect || "/";
    } catch {
      setErro("Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-visual">
        <img src="/login.png" alt="Hábitos saudáveis: refeição, água e anotações" />
      </aside>

      <section className="login-panel">
        <form className="login-form" onSubmit={(e) => void onLogin(e)}>
          <div className="login-mark" aria-hidden="true">
            <CalendarIcon />
          </div>
          <h1>Controle de Hábitos</h1>
          <p>Acompanhe sua rotina. Transforme sua vida.</p>

          <label className="sr-only" htmlFor="email">
            E-mail
          </label>
          <div className="login-field">
            <span className="field-icon">
              <PersonIcon />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <PasswordField
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Senha"
            required
            icon={<LockIcon />}
          />

          {erro ? <p className="error">{erro}</p> : null}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  );
}

function PersonIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c.8-3.2 3.5-5 7-5s6.2 1.8 7 5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
