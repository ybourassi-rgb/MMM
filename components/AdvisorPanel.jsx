// components/AdvisorPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";

export default function AdvisorPanel() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const abortRef = useRef(null);

  // Date locale côté client (source de vérité affichée à l’écran)
  const todayFr = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!prompt.trim() || loading) return;

    setReply("");
    setLoading(true);
    setLastUpdated(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/advisor_stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "Erreur inconnue");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setReply((prev) => prev + chunk);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setReply(`❌ ${err?.message || "Erreur réseau."}`);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleClear() {
    setPrompt("");
    setReply("");
    setLastUpdated(null);
    if (abortRef.current) abortRef.current.abort();
    setLoading(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reply || "");
    } catch {}
  }

  return (
    <section className="advisor-panel">
      <header style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Conseil d’investissement</h3>
        <small style={{ opacity: 0.75 }}>
          Aujourd’hui&nbsp;: <strong>{todayFr}</strong>
          {lastUpdated && (
            <>
              {" • "}Maj&nbsp;:{" "}
              <strong>
                {lastUpdated.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </>
          )}
        </small>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <textarea
          placeholder="Pose une question, colle un lien d’annonce ou décris l’opportunité…"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ width: "100%", resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" disabled={loading || !prompt.trim()}>
            {loading ? "Analyse en cours…" : "Obtenir un conseil"}
          </button>
          <button type="button" onClick={handleClear} disabled={loading}>
            Effacer
          </button>
          <button type="button" onClick={handleCopy} disabled={!reply}>
          Copier
          </button>
        </div>
      </form>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          whiteSpace: "pre-wrap",
          minHeight: 80,
        }}
      >
        <strong>Réponse condensée</strong>
        <div style={{ marginTop: 8 }}>
          {reply ? reply : (loading ? "…" : "—")}
        </div>
      </div>
    </section>
  );
}
