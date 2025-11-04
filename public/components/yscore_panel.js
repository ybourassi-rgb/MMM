// public/components/yscore_panel.js
(function () {
  const CSS = `
    .ys-box{border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:16px;background:#12161b;color:#e9eef6}
    .ys-just{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
    .ys-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}
    .ys-label{min-width:90px;font-weight:700}
    .ys-input{padding:10px 12px;border-radius:10px;border:1px solid #1c232b;background:#0b0f14;color:#e9eef6;flex:1 1 200px}
    .ys-btn{padding:10px 12px;border-radius:10px;border:1px solid #1c232b;background:#0e141b;color:#eaf2ff;cursor:pointer}
    .ys-btnP{padding:10px 12px;border-radius:10px;border:1px solid #2f78c7;background:#4da3ff;color:#061522;cursor:pointer;font-weight:600}
    .ys-divider{height:1px;background:#1c232b;margin:12px 0 16px}
    .ys-hint{opacity:.75}
    .ys-badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#0f1420;border:1px solid #1c232b;color:#a9b3c1;font-size:12px}
    .ys-good{color:#29d38d}
    .ys-bad{color:#ff6b6b}
    input[type="range"]{width:100%}
  `;

  // -------- utils
  async function j(url, opts){
    const r = await fetch(url, opts);
    const raw = await r.text();
    try{
      const js = JSON.parse(raw);
      if(!r.ok) throw new Error(js.error || ('HTTP '+r.status));
      return js;
    }catch{
      throw new Error(raw || ('HTTP '+r.status));
    }
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
    };

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
        slider("w-quality","Quality",W.quality,0,1,0.01,"","Qualité (profitabilité, croissance, D/E, etc.)."),
        slider("w-momentum","Momentum",W.momentum,0,1,0.01,"","Tendance 30 j."),
        slider("w-risk","Risk",W.risk,0,1,0.01,"","Volatilité (plus bas = mieux)."),
        slider("w-liquidity","Liquidity",W.liquidity,0,1,0.01,"","Volume/transactions (échelle log)."),
        slider("w-halal","Halal penalty",W.halalPenalty,0,100,1,"pts","Pénalité si mode MMM & non halal (ignorée si modeMMM=false).")
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
        const res = await j(`/api/weights?profile=${encodeURIComponent(prof)}`);
        if(res?.weights){
          state.profile = prof;
          state.weights = res.weights;
          renderSliders();
          msg(`Profil « ${prof} » chargé (${res.source||"defaults"}).`, true);
        }else{
          msg("Impossible de charger les pondérations.", false);
        }
      }catch(e){ msg(e.message||"Erreur de chargement.", false); }
    }

    async function save(){
      try{
        el.msg.style.display="none";
        const prof = el.profile.value.trim() || "default";
        const res = await j(`/api/weights?profile=${encodeURIComponent(prof)}`,{
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify(state.weights)
        });
        if(res?.ok){
          msg(`Pondérations enregistrées pour « ${prof} ».`, true);
        }else{
          msg(res?.error || "Erreur de sauvegarde.", false);
        }
      }catch(e){ msg(e.message||"Erreur de sauvegarde.", false); }
    }

    async function testRun(){
      try{
        el.msg.style.display="none";
        const SAMPLE_ITEMS = [
          { id:"TSLA", price:210, fairValue:260, momentum30dPct:8.5, volatility30dPct:28, avgDailyLiquidity:120000, profitabilityPct:12, growthYoYPct:25, debtToEquity:0.4, halalCompliant:false },
          { id:"BMW-X3-2019", price:21000, fairValue:25000, momentum30dPct:3, volatility30dPct:18, avgDailyLiquidity:180, quality:68, halalCompliant:true }
        ];
        const res = await j("/api/yscore",{
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ modeMMM:false, weights: state.weights, items: SAMPLE_ITEMS })
        });
        if(res?.ok){
          const top = res.results?.[0];
          msg(`✅ ${res.count} éléments scorés. Top: ${top?.id} (${top?.yScore}).`, true);
          console.log("[YScorePanel] results:", res);
        }else{
          msg(res?.error || "Erreur Y-Score.", false);
        }
      }catch(e){ msg(e.message||"Erreur Y-Score.", false); }
    }

    // bind
    renderSliders();
    root.querySelector("#ys-load").addEventListener("click", load);
    root.querySelector("#ys-save").addEventListener("click", save);
    root.querySelector("#ys-test").addEventListener("click", testRun);

    // auto-load au montage
    load();
  }

  window.YScorePanel = { mount };
})();
