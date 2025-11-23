// app/layout.jsx

export const metadata = {
  title: "Money Motor Y",
  description: "IA stratégique d’investissement"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#0a0b0f", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
