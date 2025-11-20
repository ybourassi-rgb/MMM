import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Money Motor Y – Dashboard</title>
        <meta name="description" content="Analyse intelligente, affiliation, TikTok automation" />
      </Head>

      <div style={{
        padding: "2rem",
        maxWidth: 800,
        margin: "0 auto",
        color: "white",
        fontFamily: "sans-serif"
      }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          👋 Bienvenue sur Money Motor Y
        </h1>

        <p style={{ opacity: 0.8, marginBottom: "2rem" }}>
          Choisis une fonctionnalité ci-dessous :
        </p>

        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "1rem" }}>
            <a href="/produits-viraux"
               style={{ color: "#4AB3FF", textDecoration: "none", fontSize: "1.2rem" }}>
              🔥 Produits viraux (AliExpress + Amazon)
            </a>
          </li>

          <li style={{ marginBottom: "1rem" }}>
            <a href="/api/track?url=https://www.amazon.fr"
               style={{ color: "#4AB3FF", textDecoration: "none", fontSize: "1.2rem" }}>
              🔗 Générateur de liens affiliés
            </a>
          </li>

          <li style={{ marginBottom: "1rem" }}>
            <a href="/api/mmy-tiktok-from-link"
               style={{ color: "#4AB3FF", textDecoration: "none", fontSize: "1.2rem" }}>
              🎬 Générateur TikTok (depuis un lien)
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
