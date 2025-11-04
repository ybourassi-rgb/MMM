<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Money Motor Y — Tableau de bord</title>
  <style>
    :root{
      --bg:#0c0f12; --panel:#12161b; --muted:#a9b3c1; --text:#e9eef6;
      --primary:#4da3ff; --ok:#29d38d; --chip:#1a1f25; --line:#1c232b;
      --danger:#ff6b6b; --badge:#0f1420;
    }
    *{box-sizing:border-box} html,body{margin:0;height:100%;background:var(--bg);color:var(--text);font:15px/1.45 system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial}
    a{color:var(--primary);text-decoration:none}
    .wrap{max-width:1100px;margin:28px auto;padding:0 16px}
    header{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
    .title h1{margin:0 0 6px 0;font-size:28px}
    .sub{color:var(--muted)}
    .badges{display:flex;gap:8px;flex-wrap:wrap}
    .badge{display:inline-flex;align-items:center;gap:6px;background:var(--badge);border:1px solid var(--line);border-radius:999px;padding:6px 10px;color:var(--muted)}
    .dot{width:10px;height:10px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 3px #123b2e33 inset}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    @media (max-width:900px){.grid{grid-template-columns:1fr}}
    .module{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px}
    .module h3{margin:0 0 8px;font-size:18px}
    .p-muted{color:var(--muted);margin:0 0 10px}
    .chips{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 18px}
    .chip{background:var(--chip);border:1px solid var(--line);border-radius:999px;padding:10px 14px;color:#dbe6ff}
    .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .input, textarea{width:100%;background:#0b0f14;border:1px solid var(--line);border-radius:10px;color:#e9eef6;padding:12px}
    textarea{min-height:120px;resize:vertical}
    .btn{border:1px solid var(--line);background:#111824;color:#eaf2ff;padding:10px 14px;border-radius:10px;cursor:pointer}
    .btn.primary{background:var(--primary);border-color:#2f78c7;color:#061522}
    .btn.ghost{background:#0e141b}
    .btn:disabled{opacity:.6;cursor:not-allowed}
    .stack{display:flex;gap:10px;flex-wrap:wrap}
    .response{background:#0b1118;border:1px dashed #243244;border-radius:12px;padding:12px;margin-top:12px}
    .response .title{font-weight:600;margin:0 0 6px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    @media (max-width:700px){.kpis{grid-template-columns:repeat(2,1fr)}}
    .kpi{background:#0e141a;border:1px solid var(--line);border-radius:10px;padding:12px}
    .kpi .k{color:var(--muted);font-size:12px}
    .kpi .v{font-weight:700;font-size:18px;margin-top:2px}
    .list{display:flex;flex-direction:column;gap:10px}
    .item{padding:10px;border:1px solid var(--line);border-radius:10px;background:#0e141a}
    .pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#0c1320;border:1px solid #253043;color:#9fb4d3;font-size:12px}
    .danger{color:var(--danger)}
  </style>
</head>
<body>
  <div class="wrap">
    <!-- HEADER -->
    <header>
      <div class="title">
        <h1>Money Motor Y — Tableau de bord</h1>
        <div class="sub">IA stratégique d’investissement • <span class="pill">v10.4</span></div>
      </div>
      <div class="badges">
        <span class="badge"><span class="dot" id="status-dot"></span> <span id="status-text">État IA : En ligne</span></span>
      </div>
    </header>

    <!-- QUICK CHIPS -->
    <div class="chips">
      <div class="chip">Conseil d’investissement</div>
      <div class="chip">Marché en direct</div>
      <div class="chip">Analyse rapide Y-Score</div>
      <div class="chip">Alertes marché</div>
    </div>

    <div class="grid">
      <!-- CONSEIL -->
      <section class="module" id="advice">
        <h3>Conseil d’investissement</h3>
        <p class="p-muted">Pose une question, colle un lien d’annonce ou décris l’opportunité. Nous te donnons un verdict chiffré + plan d’action.</p>
        <div class="row"><textarea id="advice-input" placeholder="Ex : Est-ce une bonne affaire ? Acheter ou éviter ?"></textarea></div>
        <div class="stack" style="margin-top:8px">
          <button class="btn primary" id="advice-send">Obtenir un conseil</button>
          <button class="btn ghost" id="advice-yscore">Analyser avec Y-Score</button>
          <button class="btn" id="advice-clear">Effacer</button>
        </div>
        <div class="response" id="advice-resp" style="display:none">
          <div class="title">Réponse condensée</div>
          <div id="advice-text">—</div>
        </div>
      </section>

      <!-- MARCHÉ -->
      <section class="module">
        <h3>Marché en direct</h3>
        <p class="p-muted">Flux synthétique des opportunités (auto, immo, business, crypto).</p>
        <div class="kpis">
          <div class="kpi"><div class="k">Opportunités du jour</div><div class="v">128</div></div>
          <div class="kpi"><div class="k">Spread moyen</div><div class="v">+6.1%</div></div>
          <div class="kpi"><div class="k">Risque médian</div><div class="v">34/100</div></div>
          <div class="kpi"><div class="k">Liquidité</div><div class="v">Bonne</div></div>
        </div>
      </section>

      <!-- ANALYSE Y-SCORE -->
      <section class="module">
        <h3>Analyse rapide Y-Score</h3>
        <p class="p-muted">Rentre 3–4 chiffres clés pour un score instantané.</p>
        <div class="row"><input class="input" id="price" placeholder="Prix (€)"></div>
        <div class="row"><input class="input" id="market" placeholder="Valeur marché (€)"></div>
        <div class="row"><input class="input" id="risk" placeholder="Risque (0–100)"></div>
        <div class="row"><input class="input" id="liquidity" placeholder="Liquidité (transactions/mois)"></div>
        <div class="stack" style="margin-top:8px">
          <button class="btn primary" id="yscore-run">Analyser</button>
          <button class="btn" id="yscore-clear">Effacer</button>
        </div>
        <div class="response" id="yscore-resp" style="display:none">
          <div class="title">Résultat</div>
          <div id="yscore-text">—</div>
        </div>
      </section>

      <!-- ALERTES -->
      <section class="module">
        <h3>Alertes marché</h3>
        <p class="p-muted">Crée des alertes selon le rendement ou le risque.</p>
      </section>
    </div>

    <!-- PANNEAU Y-SCORE -->
    <div id="yscore-panel" style="margin-top:30px"></div>

  </div>

  <!-- CHARGEMENT DU PANNEAU -->
  <script src="/components/yscore_panel.js"></script>
  <script>
    window.YScorePanel?.mount("yscore-panel");
  </script>
</body>
</html>
