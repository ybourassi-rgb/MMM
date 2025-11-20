// /pages/produits-viraux.js

import { useState } from "react";

export default function ProduitsViraux() {
  const [url, setUrl] = useState("");
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptData, setScriptData] = useState(null);

  const [affLink, setAffLink] = useState(null);
  const [affLoading, setAffLoading] = useState(false);

  // 1️⃣ Analyse basique du produit
  const handleScan = async () => {
    if (!url) return;
    setLoadingScan(true);
    setScanResult(null);

    try {
      // On ne fait pas encore d'analyse complexe → simple preview
      setScanResult({
        ok: true,
        domain: new URL(url).hostname.replace("www.", ""),
        isAmazon: url.includes("amazon."),
        isAli: url.includes("aliexpress."),
        raw: url,
      });
    } catch (e) {
      setScanResult({ ok: false, error: "URL invalide" });
    }

    setLoadingScan(false);
  };

  // 2️⃣ Génération du script TikTok via ton API /api/mmy-tiktok-from-link
  const handleScript = async () => {
    setScriptLoading(true);
    setScriptData(null);

    try {
      const r = await fetch("/api/mmy-tiktok-from-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await r.json();
      if (!data.ok) throw new Error(data.error);

      setScriptData(data.plan);
    } catch (e) {
      setScriptData({ error: e.message });
    }

    setScriptLoading(false);
  };

  // 3️⃣ Génération du lien affilié via /api/track
  const generateAffiliate = async () => {
    setAffLoading(true);
    setAffLink(null);

    try {
      const r = await fetch(`/api/track?url=${encodeURIComponent(url)}`);
      const data = await r.json();

      if (!data.ok) throw new Error(data.error);
      setAffLink(data.link);
    } catch (e) {
      setAffLink("Erreur : " + e.message);
    }

    setAffLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>🔥 Produits Viraux (MMY)</h1>
      <p>Analyse un produit Amazon / AliExpress et génère ton script TikTok + lien affilié.</p>

      {/* INPUT */}
      <input
        type="text"
        placeholder="Colle ici un lien Amazon/AliExpress"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 20 }}
      />

      <button onClick={handleScan} disabled={loadingScan || !url} style={{ padding: 10 }}>
        {loadingScan ? "Analyse..." : "Analyser le produit"}
      </button>

      {/* RESULT SCAN */}
      {scanResult && (
        <div style={{ marginTop: 20, padding: 15, border: "1px solid #333" }}>
          <h3>📌 Résultat de l'analyse</h3>
          {scanResult.ok ? (
            <>
              <p>Domaine : <b>{scanResult.domain}</b></p>
              <p>Amazon : {scanResult.isAmazon ? "Oui" : "Non"}</p>
              <p>AliExpress : {scanResult.isAli ? "Oui" : "Non"}</p>
            </>
          ) : (
            <p style={{ color: "red" }}>❌ {scanResult.error}</p>
          )}
        </div>
      )}

      {/* SCRIPT TIKTOK */}
      {scanResult?.ok && (
        <div style={{ marginTop: 30 }}>
          <button onClick={handleScript} disabled={scriptLoading} style={{ padding: 10 }}>
            {scriptLoading ? "Génération..." : "Générer script TikTok"}
          </button>

          {scriptData && (
            <div style={{ marginTop: 20, padding: 15, border: "1px solid #444" }}>
              {scriptData.error ? (
                <p style={{ color: "red" }}>❌ {scriptData.error}</p>
              ) : (
                <>
                  <h3>🎥 Hook</h3>
                  <p>{scriptData.hook}</p>

                  <h3>📝 Overlay Screens</h3>
                  <ul>
                    {scriptData.overlayScreens?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>

                  <h3>Description</h3>
                  <p>{scriptData.tiktokDescription}</p>

                  <h3>🏷 Hashtags</h3>
                  <p>{scriptData.hashtags?.join(" ")}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* AFFILIATE LINK */}
      {scanResult?.ok && (
        <div style={{ marginTop: 30 }}>
          <button
            onClick={generateAffiliate}
            disabled={affLoading}
            style={{ padding: 10, background: "#1e90ff", color: "white" }}
          >
            {affLoading ? "Création..." : "Créer lien affilié"}
          </button>

          {affLink && (
            <div style={{ marginTop: 15, padding: 15, border: "1px solid #555" }}>
              <h3>🔗 Lien affilié :</h3>
              <p style={{ wordWrap: "break-word" }}>{affLink}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
