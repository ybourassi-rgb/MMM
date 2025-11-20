// pages/produits-viraux.js

export default function ProduitsViraux() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 16px",
        background: "#050816",
        color: "#f9fafb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          borderRadius: 16,
          border: "1px solid rgba(148, 163, 184, 0.35)",
          background:
            "radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 55%), #020617",
          boxShadow:
            "0 18px 45px rgba(15,23,42,0.9), 0 0 0 1px rgba(15,23,42,0.9)",
          padding: "28px 22px 26px",
        }}
      >
        <p
          style={{
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#38bdf8",
            marginBottom: 6,
          }}
        >
          Money Motor Y • Lab
        </p>

        <h1
          style={{
            fontSize: 26,
            margin: 0,
            marginBottom: 10,
          }}
        >
          🔥 Produits viraux TikTok & Reels
        </h1>

        <p
          style={{
            margin: 0,
            marginBottom: 22,
            color: "#cbd5f5",
            fontSize: 15,
            lineHeight: 1.55,
          }}
        >
          Cette page servira à lister les{" "}
          <strong>produits les plus viraux</strong> à pousser sur TikTok,
          Reels et Shorts, reliés à ton système d’affiliation Money Motor Y.
        </p>

        <div
          style={{
            padding: "14px 14px 13px",
            borderRadius: 12,
            border: "1px dashed rgba(148, 163, 184, 0.7)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.75))",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
              color: "#e5e7eb",
            }}
          >
            ✅ Si tu vois cette page, c’est que la route{" "}
            <code style={{ color: "#a5b4fc" }}>/produits-viraux</code> est bien
            active.
            <br />
            Ensuite, on branchera ici :
          </p>

          <ul
            style={{
              marginTop: 10,
              marginBottom: 0,
              paddingLeft: 20,
              fontSize: 14,
              color: "#cbd5f5",
            }}
          >
            <li>Le générateur de produits viraux (API / TikTok / Amazon / AliExpress)</li>
            <li>Les scores Y-Score (rentabilité, risque, viralité)</li>
            <li>Les liens trackés /api/track déjà en place</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
