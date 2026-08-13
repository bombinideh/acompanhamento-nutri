"use client";

import { FormEvent, useEffect, useState } from "react";
import { HeaderActions } from "@/components/HeaderActions";
import { PasswordField } from "@/components/PasswordField";

export function ContaForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/me")
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        setName(data.name || "");
        setEmail(data.email || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErro("");
    setOk("");
    try {
      const novaSenha = password.trim();
      const payload: { name: string; email: string; password?: string; currentPassword?: string } = {
        name: name.trim(),
        email: email.trim(),
      };
      if (novaSenha) {
        payload.password = novaSenha;
        payload.currentPassword = currentPassword;
      }

      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.erro || "Não foi possível salvar.");
        return;
      }
      setPassword("");
      setCurrentPassword("");
      setOk("Dados atualizados.");
    } catch {
      setErro("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="wrap">
        <header className="top">
          <div>
            <h1>Minha conta</h1>
            <p className="sub">Altere nome, e-mail e senha.</p>
          </div>
          <HeaderActions />
        </header>

        <form className="card" onSubmit={(e) => void onSubmit(e)}>
          {loading ? <p className="status">Carregando...</p> : null}
          <label className="field" htmlFor="name">
            Nome
          </label>
          <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="field" htmlFor="email" style={{ marginTop: 12 }}>
            E-mail
          </label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <PasswordField
            id="currentPassword"
            label="Senha atual (só se for trocar a senha)"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="off"
            required={Boolean(password.trim())}
            labelStyle={{ marginTop: 12 }}
          />
          <PasswordField
            id="password"
            label="Nova senha (opcional)"
            value={password}
            onChange={setPassword}
            autoComplete="off"
            minLength={password.trim() ? 6 : undefined}
            labelStyle={{ marginTop: 12 }}
          />
          {erro ? <p className="error">{erro}</p> : null}
          {ok ? <p className="ok">{ok}</p> : null}
          <button className="primary" type="submit" disabled={saving || loading} style={{ marginTop: 16 }}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}
