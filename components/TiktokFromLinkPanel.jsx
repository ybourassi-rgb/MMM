import { useState } from "react";

export default function TiktokFromLinkPanel() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/mmy-tiktok-from-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erreur API");
      }

      setResult(data.plan);
    } catch (err) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #333", borderRadius: 8 }}>
      <h2>🎥 Générateur TikTok depuis un lien</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Colle ici ton lien Amazon / AliExpress / eBay"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />

        <button
          type="submit"
          disabled={loading || !url}
          style={{ padding: "0.5rem 1rem" }}
        >
          {loading ? "Génération..." : "Générer"}
        </button>
      </form>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Hook</h3>
          <p>{result.hook}</p>

          <h3>Overlay Screens</h3>
          <ul>
            {result.overlayScreens?.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>

          <h3>Description</h3>
          <p>{result.tiktokDescription}</p>

          <h3>Hashtags</h3>
          <p>{result.hashtags?.join(" ")}</p>
        </div>
      )}
    </div>
  );
}
