<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Money Motor Y — Tableau de bord</title>
  <!-- build v10.4.1 (marché dynamique + affiliation) -->
  <style>
    :root{
      --bg:#0c0f12; --panel:#12161b; --muted:#a9b3c1; --text:#e9eef6;
      --primary:#4da3ff; --ok:#29d38d; --chip:#1a1f25; --line:#1c232b;
      --danger:#ff6b6b; --badge:#0f1420;
    }
    *{box-sizing:border-box} html,body{margin:0;height:100%;background:var(--bg);color:var(--text);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial}
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
    footer{margin-top:22px;color:var(--muted);font-size:12px;text-align:center}
  </style>
</head>
<body>
  <div class="wrap">
    <!-- HEADER -->
    <header>
      <div class="title">
        <h1>Money Motor Y — Tableau de bord</h1>
        <div class="sub">IA stratégique d’investissement • <span class="pill">v10.4.1</span></div>
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
      <!-- CONSEIL D’INVESTISSEMENT -->
      <section class="module" id="advice">
        <h3>Conseil d’investissement</h3>
        <p class="p-muted">Pose une question, colle un lien d’annonce ou décris l’opportunité. Nous te donnons un verdict chiffré + plan d’action.</p>

        <div class="row">
          <textarea id="advice-input" placeholder="Exemples : Est-ce une bonne affaire ?  Acheter ou éviter ?  Stratégie de revente en 30 jours ?"></textarea>
        </div>

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

      <!-- MARCHÉ EN DIRECT -->
      <section class="module">
        <h3>Marché en direct</h3>
        <p class="p-muted">Flux synthétique des opportunités (auto, immo, business, crypto). Mise à jour en continu.</p>
        <div class="kpis">
          <div class="kpi"><div class="k">Opportunités du jour</div><div class="v">—</div></div>
          <div class="kpi"><div class="k">Spread moyen</div><div class="v">—</div></div>
          <div class="kpi"><div class="k">Risque médian</div><div class="v">—</div></div>
          <div class="kpi"><div class="k">Liquidité</div><div class="v">—</div></div>
        </div>
        <!-- Liste dynamique -->
        <div class="list" id="market-list" style="margin-top:12px"></div>
      </section>

      <!-- ANALYSE RAPIDE Y-SCORE -->
      <section class="module">
        <h3>Analyse rapide Y-Score</h3>
        <p class="p-muted">Rentre 3–4 chiffres clés et obtiens un score instantané (rentabilité, risque, liquidité, momentum).</p>
        <div class="row"><input class="input" id="price" placeholder="Prix (€)" inputmode="decimal"></div>
        <div class="row"><input class="input" id="market" placeholder="Valeur marché (€)" inputmode="decimal"></div>
        <div class="row"><input class="input" id="risk" placeholder="Risque (0–100)" inputmode="numeric"></div>
        <div class="row"><input class="input" id="liquidity" placeholder="Liquidité (transactions/mois)" inputmode="numeric"></div>
        <div class="stack" style="margin-top:8px">
          <button class="btn primary" id="yscore-run">Analyser</button>
          <button class="btn" id="yscore-clear">Effacer</button>
        </div>
        <div class="response" id="yscore-resp" style="display:none">
          <div class="title">Résultat</div>
          <div id="yscore-text">—</div>
        </div>
      </section>

      <!-- RÉGLAGES DU MOTEUR Y-SCORE -->
      <section class="module">
        <h3>Réglages du moteur (Y-Score)</h3>
        <p class="p-muted">Ajuste les pondérations, charge/enregistre des profils et teste sur un échantillon.</p>
        <div id="yscore-panel"></div>
      </section>

      <!-- ALERTES MARCHÉ -->
      <section class="module">
        <h3>Alertes marché</h3>
        <p class="p-muted">Crée des alertes ciblées (prix, rendement, risque, temps de revente). Nous te prévenons dès qu’une opportunité matche.</p>
        <div class="list">
          <div class="item">
            <div><strong>Auto</strong> • Spread ≥ 12% • Risque ≤ 40/100</div>
            <div class="p-muted">2 alertes actives</div>
          </div>
          <div class="item">
            <div><strong>Immo</strong> • Rendement brut ≥ 6% • Cash-on-cash ≥ 9%</div>
            <div class="p-muted">1 alerte active</div>
          </div>
        </div>
      </section>
    </div>

    <footer>
      Money Motor Y • build v10.4.1 — Marché dynamique
    </footer>
  </div>

  <!-- =================== LOGIQUE =================== -->
  <script>
    async function j(url, opts){
      const r = await fetch(url, opts);
      const raw = await r.text();
      try{
        const json = JSON.parse(raw);
        if(!r.ok) throw new Error(json.error || 'Erreur ' + r.status);
        return json;
      }catch{
        throw new Error(raw || ('Erreur ' + r.status));
      }
    }

    // --- BADGE ÉTAT IA
    (async () => {
      try {
        const s = await j('/api/status');
        const dot = document.getElementById('status-dot');
        const st  = document.getElementById('status-text');
        if (!s.hasOpenAIKey) { dot.style.background = '#ff6b6b'; st.textContent = 'État IA : Clé OpenAI manquante'; }
        else if (!s.hasUpstashKV) { dot.style.background = '#ffb020'; st.textContent = 'État IA : KV non configuré'; }
        else { dot.style.background = '#29d38d'; st.textContent = 'État IA : En ligne'; }
      } catch {
        const dot = document.getElementById('status-dot');
        const st  = document.getElementById('status-text');
        dot.style.background = '#ff6b6b'; st.textContent = 'État IA : Hors ligne';
      }
    })();

    // --- CONSEIL (stream + fallback)
    const $in=document.getElementById('advice-input'),$send=document.getElementById('advice-send'),$clr=document.getElementById('advice-clear'),$ys=document.getElementById('advice-yscore'),$box=document.getElementById('advice-resp'),$txt=document.getElementById('advice-text');
    $send.addEventListener('click', async ()=>{
      const prompt = ($in.value||'').trim();
      if(!prompt){$box.style.display='block';$txt.innerHTML='<span class="danger">Saisis un message.</span>';return;}
      $send.disabled=true;$box.style.display='block';$txt.textContent='Analyse en cours…';
      try{
        const resp = await fetch('/api/advisor_stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
        if(!resp.ok||!resp.body)throw new Error(await resp.text());
        const reader=resp.body.getReader();const decoder=new TextDecoder();let acc='';
        while(true){const {value,done}=await reader.read();if(done)break;acc+=decoder.decode(value,{stream:true});$txt.textContent=acc||'…';}
        if(!acc.trim())$txt.textContent='Réponse vide.';
      }catch(e){
        try{const data=await j('/api/advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
          $txt.textContent=data.reply||'—';
        }catch(e2){$txt.innerHTML='<span class="danger">'+(e2.message||e.message||'Erreur')+'</span>';}
      }finally{$send.disabled=false;}
    });
    $clr.addEventListener('click',()=>{$in.value='';$box.style.display='none';$txt.textContent='';});
    $ys.addEventListener('click',()=>{$box.style.display='block';$txt.textContent='(Bientôt) Analyse Y-Score détaillée…';});

    // --- Y-SCORE (existant)
    const $p=id=>document.getElementById(id);const $yrun=document.getElementById('yscore-run');const $yclr=document.getElementById('yscore-clear');const $ybox=document.getElementById('yscore-resp');const $ytxt=document.getElementById('yscore-text');
    $yrun.addEventListener('click',async()=>{
      const price=parseFloat($p('price').value||0);const market=parseFloat($p('market').value||0);
      const risk=Math.max(0,Math.min(100,parseFloat($p('risk').value||50)));const liq=Math.max(0,parseFloat($p('liquidity').value||0));
      try{
        const data=await j('/api/yscore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({modeMMM:false,items:[{id:'custom',price,fairValue:market,volatility30dPct:100-risk,avgDailyLiquidity:liq}]})});
        const top=data.results?.[0];$ybox.style.display='block';
        $ytxt.textContent=top?`Y-Score ${top.yScore}/100 • Value ${top.features.value.toFixed(1)} • Momentum ${top.features.momentum.toFixed(0)} • Risque ${top.features.risk.toFixed(0)} • Liquidité ${top.features.liq.toFixed(0)}`:'—';
      }catch(e){$ybox.style.display='block';$ytxt.textContent=e.message||'Erreur Y-Score';}
    });
    $yclr.addEventListener('click',()=>{['price','market','risk','liquidity'].forEach(id=>$p(id).value='');$ybox.style.display='none';$ytxt.textContent='';});
  </script>

  <!-- ===== MARCHÉ EN DIRECT DYNAMIQUE ===== -->
  <script>
    (async () => {
      const list = document.getElementById('market-list');
      if (!list) return;

      const el = (tag, attrs = {}, children = []) => {
        const n = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => (n[k] = v));
        [].concat(children).forEach(c =>
          n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
        );
        return n;
      };

      const affiliateHref = (rawUrl, type = 'gen') =>
        `/api/r?u=${encodeURIComponent(rawUrl)}&s=${encodeURIComponent(type||'gen')}`;

      list.innerHTML = '<div class="item">Chargement…</div>';

      try {
        const r = await fetch('/api/status', { cache: 'no-store' });
        const data = await r.json();
        const feed = Array.isArray(data.feed) ? data.feed : [];
        list.innerHTML = '';

        if (feed.length === 0) {
          list.appendChild(el('div', { className: 'item p-muted' }, 'Aucune opportunité disponible.'));
          return;
        }

        for (const it of feed) {
          const title = el('div', {}, [
            el('strong', {}, it.title || '—'),
            ' ',
            el('span', { className: 'pill' }, (it.type || 'GEN').toUpperCase())
          ]);
          const meta = el('div', { className: 'p-muted' }, [
            (typeof it.price === 'number' ? `Prix: ${it.price.toLocaleString('fr-FR')} • ` : ''),
            it.updatedAtISO
              ? `Maj: ${new Date(it.updatedAtISO).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`
              : ''
          ]);
          const card = el('div', { className: 'item' }, [title, meta]);

          if (it.url) {
            const a = el('a', {
              href: affiliateHref(it.url, it.type),
              className: 'btn',
              target: '_blank',
              rel: 'nofollow sponsored noopener'
            }, 'Voir l’offre');
            a.style.marginTop = '8px';
            card.appendChild(a);
          }

          list.appendChild(card);
        }
      } catch (e) {
        list.innerHTML = '';
        list.appendChild(el('div', { className: 'item danger' }, 'Erreur: ' + (e.message || e)));
      }
    })();
  </script>

  <!-- Panneau Y-Score (script + montage) -->
  <script src="/components/yscore_panel.js"></script>
  <script> window.YScorePanel?.mount("yscore-panel"); </script>
</body>
</html>
