// pages/index.js

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#050816",
        color: "white",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div>
        <h1>Money Motor Y / MMM</h1>
        <p style={{ marginTop: "1rem", opacity: 0.8 }}>
          Backend & API en ligne.  
          Les routes sont sous <code>/api</code>.
        </p>
      </div>
    </main>
  );
}
