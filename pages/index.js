import Link from "next/link";

export default function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🚀 Money Motor Y — Dashboard</h1>
      <p>Bienvenue dans ton tableau de bord MMM.</p>

      <h2>📌 Navigation rapide</h2>
      <ul style={{ lineHeight: "2rem" }}>
        <li>
          <Link href="/produits-viraux">🔥 Produits viraux automatiques</Link>
        </li>
        <li>
          <Link href="/tiktok-from-link">🎥 Générateur TikTok (Beta)</Link>
        </li>
        <li>
          <Link href="/affiliation">💰 Génération de liens affiliés</Link>
        </li>
        <li>
          <Link href="/market">📈 Marché en direct</Link>
        </li>
        <li>
          <Link href="/status">🛠️ Status & logs</Link>
        </li>
      </ul>

      <p style={{ marginTop: "2rem", opacity: 0.6 }}>
        Version alpha — MMM powered by Money Motor Y
      </p>
    </div>
  );
}
