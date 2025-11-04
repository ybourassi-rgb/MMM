import React, { useEffect, useMemo, useState } from "react";

/**
 * Panneau de réglages Y-Score
 * Props:
 *  - defaultProfile?: string        // profil à charger au début (default = "default")
 *  - onSaved?: (weights) => void    // callback après sauvegarde
 *  - showTestRun?: boolean          // affiche un bloc pour tester POST /api/yscore
 *  - sampleItems?: Array<any>       // items de test pour le bouton "Tester le Y-Score"
 */
export default function YScorePanel({
  defaultProfile = "default",
  onSaved,
  showTestRun = true,
  sampleItems = [
    {
      id: "TSLA",
      price: 210, fairValue: 260,
      momentum30dPct: 8.5, volatility30dPct: 28, avgDailyLiquidity: 120000,
      profitabilityPct: 12, growthYoYPct: 25, debtToEquity: 0.4, esg: 72,
      halalCompliant: false,
    },
    {
      id: "BMW-X3-2019",
      price: 21000, fairValue: 25000,
      momentum30dPct: 3, volatility30dPct: 18, avgDailyLiquidity: 180,
      quality: 68, halalCompliant: true,
    },
  ],
}) {
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [weights, setWeights] = useState({
    value: 0.30,
    quality: 0.25,
    momentum: 0.20,
    risk: 0.15,
    liquidity: 0.10,
    halalPenalty: 15,
  });

  // somme = 1 pour les 5 pondérations (affichage)
  const sum = useMemo(
    () => (weights.value + weights.quality + weights.momentum + weights.risk + weights.liquidity),
    [weights]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      setInfo("");
      try {
        const r = await fetch(`/api/weights?profile=${encodeURIComponent(profile)}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`GET /api/weights failed (${r.status})`);
        const json = await r.json();
        if (!cancelled && json?.weights) {
          setWeights(json.weights);
          setInfo(`Profil « ${profile} » chargé (${json.source || "defaults"}).`);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [profile]);

  const handleChange = (key, value) => {
    setWeights((w) => ({ ...w, [key]: Number(value) }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const r = await fetch(`/api/weights?profile=${encodeURIComponent(profile)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json?.ok) throw new Error(json?.error || `POST /api/weights failed (${r.status})`);
      setInfo(`Pondérations enregistrées pour « ${profile} ».`);
      onSaved && onSaved(json.weights);
    } catch (e) {
      setError(e?.message || "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const testRun = async () => {
    setError("");
    setInfo("Calcul en cours…");
    try {
      const r = await fetch("/api/yscore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modeMMM: true, weights, items: sampleItems }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || `POST /api/yscore failed (${r.status})`);
      const first = json.results?.[0];
      setInfo(`OK: ${json.count} éléments scorés. Top: ${first?.id} (${first?.yScore}).`);
      console.log("Y-Score results:", json);
    } catch (e) {
      setError(e?.message || "Erreur de test Y-Score");
    }
  };

  return (
    <div style={box}>
      <div style={header}>
        <h3 style={{ margin: 0 }}>Réglages du moteur Y-Score</h3>
        <small style={{ opacity: 0.8 }}>Somme pondérations = {sum.toFixed(2)} (renormalisée côté API)</small>
      </div>

      <div style={row}>
        <label style={label}>Profil</label>
        <input
          type="text"
          value={profile}
          onChange={(e) => setProfile(e.target.value.trim() || "default")}
          placeholder="default | conservateur | agressif…"
          style={input}
        />
        <button onClick={() => setProfile(profile)} disabled={loading} style={btn}>
          Recharger
        </button>
      </div>

      <Divider />

      {loading ? <p>Chargement…</p> : (
        <>
          <Slider
            name="Value"
            value={weights.value}
            min={0} max={1} step={0.01}
            onChange={(v) => handleChange("value", v)}
            hint="Plus un actif est sous-valorisé vs fairValue, meilleur est le score."
          />
          <Slider
            name="Quality"
            value={weights.quality}
            min={0} max={1} step={0.01}
            onChange={(v) => handleChange("quality", v)}
            hint="Qualité intrinsèque (profitabilité, croissance, D/E, ESG)."
          />
          <Slider
            name="Momentum"
            value={weights.momentum}
            min={0} max={1} step={0.01}
            onChange={(v) => handleChange("momentum", v)}
            hint="Tendance 30j (sigmoïde autour de 0%)."
          />
          <Slider
            name="Risk"
            value={weights.risk}
            min={0} max={1} step={0.01}
            onChange={(v) => handleChange("risk", v)}
            hint="Volatilité (plus bas = mieux)."
          />
          <Slider
            name="Liquidity"
            value={weights.liquidity}
            min={0} max={1} step={0.01}
            onChange={(v) => handleChange("liquidity", v)}
            hint="Volume/transactions (échelle log)."
          />

          <Slider
            name="Halal penalty"
            value={weights.halalPenalty}
            min={0} max={100} step={1}
            onChange={(v) => handleChange("halalPenalty", v)}
            suffix="pts"
            hint="Pénalité si mode MMM et actif non halal."
          />

          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>
              {saving ? "Sauvegarde…" : "Sauvegarder les pondérations"}
            </button>
            {showTestRun && (
              <button onClick={testRun} style={btn}>
                Tester le Y-Score (échantillon)
              </button>
            )}
          </div>

          {!!error && <p style={{ color: "#b00020", marginTop: 8 }}>{error}</p>}
          {!!info && <p style={{ color: "#0b6b00", marginTop: 4 }}>{info}</p>}
        </>
      )}
    </div>
  );
}

/** ============ UI bits ============ */
function Slider({ name, value, min, max, step, onChange, hint, suffix = "" }) {
  return (
    <div style={{ margin: "10px 0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontWeight: 600 }}>{name}</label>
        <span style={{ opacity: 0.8 }}>{Number(value).toFixed(2)} {suffix}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%" }}
      />
      {hint && <small style={{ opacity: 0.7 }}>{hint}</small>}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(0,0,0,.08)", margin: "10px 0 14px" }} />;
}

const box = {
  border: "1px solid rgba(0,0,0,.1)",
  borderRadius: 10,
  padding: 16,
  maxWidth: 560,
  background: "white",
};
const header = { display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 };
const row = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };
const label = { minWidth: 60, fontWeight: 600 };
const input = { padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,.15)", flex: "1 1 180px" };
const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,.15)", background: "#f5f5f5", cursor: "pointer" };
const btnPrimary = { ...btn, background: "#0f62fe", color: "white", borderColor: "#0f62fe" };
