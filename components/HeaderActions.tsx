"use client";

export function HeaderActions({ homeLabel = "Início" }: { homeLabel?: string }) {
  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="header-actions" aria-label="Atalhos">
      <a className="suggest-chip" href="/">
        {homeLabel}
      </a>
      <a className="suggest-chip" href="/conta">
        Minha conta
      </a>
      <button className="suggest-chip" type="button" onClick={() => void sair()}>
        Sair
      </button>
    </nav>
  );
}
