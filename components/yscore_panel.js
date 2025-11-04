// components/yscore_panel.js
(function () {
  const CSS = `
    .ys-box{border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:16px;max-width:680px;background:#111;color:#eee}
    .ys-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0}
    .ys-label{min-width:72px;font-weight:700}
    .ys-input{padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#0d0d0d;color:#eee;flex:1 1 180px}
    .ys-btn{padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:#1b1b1b;color:#eee;cursor:pointer}
    .ys-btnP{padding:8px 12px;border-radius:8px;border:1px solid #0f62fe;background:#0f62fe;color:#fff;cursor:pointer}
    .ys-divider{height:1px;background:rgba(255,255,255,.08);margin:10px 0 14px}
    .ys-hint{opacity:.7}
    .ys-just{display:flex;justify-content:space-between;align-items:baseline}
    input[type="range"]{width:100%}
    .ys-bad{color:#ff6b6b} .ys-good{color:#18c57d} .ys-info{color:#c4d4ff}
    .ys-badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#222;border:1px solid rgba(255,255,255,.1);font-size:12px}
    .ys-banner{display:none;margin-top:8px;padding:8px 12px;border-radius:8px;background:#0f1629;border:1px solid rgba(99,132,255,.25)}
    .ys-line{display:flex;align-items:center;gap:8px}
    .ys-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.25);border-top:2px solid rgba(255,255,255,.9);border-radius:50%;animation:ys-rot 0.8s linear infinite}
    .ys-banner--error{background:#2a0d0d;border-color:#ff6b6b;color:#ff6b6b}
    @keyframes ys-rot{to{transform:rotate(360deg)}}
  `;

  const SAMPLE_ITEMS = [
    { id:"TSLA", price:210, fairValue:260, momentum30dPct:8.5, volatility30dPct:28, avgDailyLiquidity:120000, profitabilityPct:12, growthYoYPct:25, debtToEquity:0.4, esg:72, halalCompliant:false },
    { id:"BMW-X3-2019", price:21000, fairValue:25000, momentum30dPct:3, volatility30dPct:18, avgDailyLiquidity:180, quality:68, halalCompliant:true }
  ];

  // j(): retry + timeout + banner
  async function j(url, opts = {}, { retries = 3, timeoutMs = 8000, backoffMs = 600, onRetry } = {}) {
    let attempt = 0, lastErr;
    while (attempt <= retries) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const r = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(t);
        let data = null; try { data = await r.json(); } catch {}
        if (!r.ok) {
          const msg = (data && (data.error || data.message)) || `HTTP ${r.status}`;
          if (r.status >= 400 && r.status < 500) throw new Error(msg);
          lastErr = new Error(msg);
        } else return data;
      } catch (e) {
        clearTimeout(t);
        lastErr = e.name === "AbortError" ? new Error("Timeout du serveur") : e;
      }
      attempt++;
      if (attempt <= retries) {
        onRetry && onRetry({ attempt, retries });
        await new Promise(res => setTimeout(res, backoffMs * attempt));
      }
    }
    throw new Error(lastErr?.message || "Échec réseau");
  }

  function slider(id, label, value, min, max, step, suffix, hint) {
    const v = Number.isFinite(value) ? value : 0;
    return `
      <div style="margin:10px 0 16px">
        <div class="ys-just">
          <label class="ys-label">${label}</label>
          <span class="ys-badge"><span id="${id}-val">${(suffix==="pts") ? v.toFixed(0) : v.toFixed(2)}</span> ${suffix||""}</span>
        </div>
        <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}">
        ${hint ? `<small class="ys-hint">${hint}</small>` : ""}
      </div>
    `;
  }

  function mount(containerId="yscore-panel", opts={}){
    const root = document.getElementById(containerId);
    if(!root){ console.warn("[YScorePanel] container introuvable:", containerId); return; }

    if(!document.getElementById("yscore-style")){
      const st = document.createElement("style"); st.id="yscore-style"; st.textContent=CSS; document.head.appendChild(st);
    }

    const state = {
      profile: (opts.defaultProfile || "default"),
      weights: { value:.30, quality:.25, momentum:.20, risk:.15, liquidity:.10, halalPenalty:15 }
    };

    root.innerHTML = `
      <div class="ys-box">
        <div class="ys-just">
          <h3 style="margin:0">Réglages du moteur Y-Score</h3>
          <small id="ys-sum" class="ys-hint">Somme pondérations = …</small>
        </div>

        <div class="ys-row">
          <label class="ys-label">Profil</label>
          <input id="ys-profile" class="ys-input" value="${state.profile}" placeholder="default | conservateur | agressif…">
          <button id="ys-load" class="ys-btn">Charger</button>
        </div>

        <div class="ys-banner" id="ys-banner">
          <div class="ys-line"><div class="ys-spin"></div><span id="ys-banner-text" class="ys-info">Connexion…</span></div>
        </div>

        <div class="ys-divider"></div>

        <div id="ys-sliders"></div>

        <div class="ys-row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
          <button id="ys-save" class="ys-btnP">Sauvegarder les pondérations</button>
          <button id="ys-test" class="ys-btn">Tester le Y-Score (échantillon)</button>
        </div>

        <p id="ys-msg" style="margin-top:10px;display:none"></p>
      </div>
    `;

    const el = {
      profile: root.querySelector("#ys-profile"),
      load: root.querySelector("#ys-load"),
      sliders: root.querySelector("#ys-sliders"),
      save: root.querySelector("#ys-save"),
      test: root.querySelector("#ys-test"),
      sum: root.querySelector("#ys-sum"),
      msg: root.querySelector("#ys-msg"),
      banner: root.querySelector("#ys-banner"),
      bannerText: root.querySelector("#ys-banner-text"),
    };

    // Banner helpers (auto-close on error)
    let __ysBusyTimer = null;
    function setBusy(text){
      el.banner.classList.remove("ys-banner--error");
      el.bannerText.textContent = text || "Connexion…";
      el.banner.style.display = "block";
      if (__ysBusyTimer) { clearTimeout(__ysBusyTimer); __ysBusyTimer = null; }
    }
    function clearBusy(){
      if (__ysBusyTimer) { clearTimeout(__ysBusyTimer); __ysBusyTimer = null; }
      el.banner.style.display = "none";
    }
    function clearBusyLater(ms = 1500, isError = false){
      if (__ysBusyTimer) clearTimeout(__ysBusyTimer);
      if (isError) el.banner.classList.add("ys-banner--error");
      __ysBusyTimer = setTimeout(() => {
        el.banner.style.display = "none";
        el.banner.classList.remove("ys-banner--error");
        __ysBusyTimer = null;
      }, ms);
    }

    function msg(text, ok=true){
      el.msg.textContent = text;
      el.msg.style.display = "block";
      el.msg.className = ok ? "ys-good" : "ys-bad";
    }

    function renderSliders(){
      const W = state.weights;
      const sum = (W.value + W.quality + W.momentum + W.risk + W.liquidity);
      el.sum.textContent = `Somme pondérations = ${sum.toFixed(2)} (renormalisée côté API)`;

      el.sliders.innerHTML = [
        slider("w-value","Value",W.value,0,1,0.01,"","Sous-valorisation (prix vs fairValue)."),
        slider("w-quality","Quality",W.quality,0,1,0.01,"","Qualité (profitabilité, croissance, D/E, ESG)."),
        slider("w-momentum","Momentum",W.momentum,0,1,0.01,"","Tendance 30 j."),
        slider("w-risk","Risk",W.risk,0,1,0.01,"","Volatilité (plus bas = mieux)."),
        slider("w-liquidity","Liquidity",W.liquidity,0,1,0.01,"","Volume/transactions (échelle log)."),
        slider("w-halal","Halal penalty",W.halalPenalty,0,100,1,"pts","Pénalité si non conforme (optionnel).")
      ].join("");

      [
        ["w-value","value",false],
        ["w-quality","quality",false],
        ["w-momentum","momentum",false],
        ["w-risk","risk",false],
        ["w-liquidity","liquidity",false],
        ["w-halal","halalPenalty",true],
      ].forEach(([id,key,isInt])=>{
        const r = root.querySelector("#"+id);
        const v = root.querySelector("#"+id+"-val");
        r.addEventListener("input", (e)=>{
          const num = isInt ? parseInt(e.target.value,10) : parseFloat(e.target.value);
          state.weights[key] = num;
          v.textContent = isInt ? String(num) : num.toFixed(2);
          const W = state.weights;
          const sum = (W.value + W.quality + W.momentum + W.risk + W.liquidity);
          el.sum.textContent = `Somme pondérations = ${sum.toFixed(2)} (renormalisée côté API)`;
        });
      });
    }

    async function load(){
      try{
        el.msg.style.display="none";
        const prof = el.profile.value.trim() || "default";
        setBusy("Chargement des pondérations…");
        const res = await j(`/api/weights?profile=${encodeURIComponent(prof)}`, {}, {
          onRetry: ({attempt,retries}) => setBusy(`Reconnexion… tentative ${attempt}/${retries}`),
        });
        clearBusy();
        if(res?.weights){
          state.profile = prof;
          state.weights = res.weights;
          renderSliders();
          msg(`Profil « ${prof} » chargé (${res.source||"defaults"}).`, true);
        }else msg("Impossible de charger les pondérations.", false);
      }catch(e){ clearBusyLater(1800, true); msg(e.message||"Erreur de chargement.", false); }
    }

    async function save(){
      try{
        el.msg.style.display="none";
        const prof = el.profile.value.trim() || "default";
        setBusy("Sauvegarde…");
        const res = await j(`/api/weights?profile=${encodeURIComponent(prof)}`,{
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify(state.weights)
        }, { onRetry: ({attempt,retries}) => setBusy(`Reconnexion… tentative ${attempt}/${retries}`) });
        clearBusy();
        if(res?.ok) msg(`Pondérations enregistrées pour « ${prof} ».`, true);
        else msg(res?.error || "Erreur de sauvegarde.", false);
      }catch(e){ clearBusyLater(1600, true); msg(e.message||"Erreur de sauvegarde.", false); }
    }

    async function testRun(){
      try{
        el.msg.style.display="none";
        setBusy("Calcul du Y-Score…");
        const res = await j("/api/yscore",{
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ modeMMM:false, weights: state.weights, items: SAMPLE_ITEMS })
        }, { onRetry: ({attempt,retries}) => setBusy(`Reconnexion… tentative ${attempt}/${retries}`) });
        clearBusy();
        if(res?.ok){
          const top = res.results?.[0];
          msg(`✅ ${res.count} éléments scorés. Top: ${top?.id} (${top?.yScore}).`, true);
          console.log("Y-Score results:", res);
        }else msg(res?.error || "Erreur Y-Score.", false);
      }catch(e){ clearBusyLater(2000, true); msg(e.message||"Erreur Y-Score.", false); }
    }

    el.load.addEventListener("click", load);
    el.save.addEventListener("click", save);
    el.test.addEventListener("click", testRun);

    renderSliders();
    load();
  }

  window.YScorePanel = { mount };
})();
