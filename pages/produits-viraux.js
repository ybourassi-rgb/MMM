// pages/produits-viraux.js

export default function ProduitsViraux() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050810",
        color: "#f5f5f5",
        padding: "24px 16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          🔥 Produits viraux
        </h1>
        <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
          Espace dédié pour repérer, analyser et suivre les produits les plus
          viraux pour TikTok & l’affiliation (Amazon / AliExpress, etc.).
        </p>

        <div
          style={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "16px",
            background:
              "radial-gradient(circle at top, rgba(88,101,242,0.18), transparent 55%) #050810",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
            🚧 En cours de construction
          </h2>
          <p style={{ opacity: 0.9, marginBottom: "0.75rem" }}>
            La page est bien activée ✅. On va maintenant lui ajouter :
          </p>
          <ul style={{ paddingLeft: "1.2rem", opacity: 0.9 }}>
            <li>un listing de produits viraux (AliExpress / Amazon)</li>
            <li>un bouton pour générer un script TikTok auto</li>
            <li>un bouton pour générer ton lien affilié tracké</li>
          </ul>
        </div>

        <p style={{ marginTop: "1.5rem" }}>
          👉 En attendant, tu peux continuer à utiliser le{" "}
          <a
            href="/"
            style={{ color: "#58a6ff", textDecoration: "underline" }}
          >
            tableau de bord Money Motor Y
          </a>
          .
        </p>
      </div>
    </div>
  );
}
