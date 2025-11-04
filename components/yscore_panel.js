// --- YScorePanel.js — panneau de réglages du moteur Y-Score
window.YScorePanel = (() => {

  // --- pondérations par défaut
  const presets = {
    default: { value: 0.4, risk: 0.3, liq: 0.2, momentum: 0.1 },
    conservateur: { value: 0.5, risk: 0.4, liq: 0.1, momentum: 0.0 },
    agressif: { value: 0.3, risk: 0.2, liq: 0.2, momentum: 0.3 }
  };

  // --- charger depuis localStorage
  function load() {
    try {
      return JSON.parse(localStorage.getItem('yweights')) || { ...presets.default };
    } catch {
      return { ...presets.default };
    }
  }

  // --- sauvegarder
  function save(w) {
    localStorage.setItem('yweights', JSON.stringify(w));
  }

  // --- création de slider
  function slider(label, key, state, onChange) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '10px';

    const title = document.createElement('div');
    title.textContent = `${label} (${(state[key] * 100).toFixed(0)}%)`;
    title.style.marginBottom = '4px';
    title.style.fontSize = '14px';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = 0;
    input.max = 100;
    input.value = state[key] * 100;
    input.style.width = '100%';

    input.oninput = e => {
      state[key] = e.target.value / 100;
      title.textContent = `${label} (${(state[key] * 100).toFixed(0)}%)`;
      onChange();
    };

    wrap.appendChild(title);
    wrap.appendChild(input);
    return wrap;
  }

  // --- bouton preset
  function makePresetBtn(name, weights, state, onChange) {
    const b = document.createElement('button');
    b.textContent = name;
    b.className = 'btn';
    b.style.marginRight = '6px';
    b.onclick = () => {
      Object.assign(state, weights);
      save(state);
      onChange(true);
    };
    return b;
  }

  // --- montage du panneau
  function mount(id) {
    const root = document.getElementById(id);
    if (!root) return;

    const state = load();
    const panel = document.createElement('div');
    panel.style.background = '#0b0f14';
    panel.style.border = '1px solid #1c232b';
    panel.style.borderRadius = '10px';
    panel.style.padding = '14px';
    panel.style.marginTop = '8px';

    const refresh = (fromPreset = false) => {
      save(state);
      // si clic sur preset, on rafraîchit tous les sliders
      if (fromPreset) root.innerHTML = '';
      render();
    };

    function render() {
      root.innerHTML = '';
      const head = document.createElement('div');
      head.style.marginBottom = '10px';
      head.innerHTML = `<strong>Pondérations Y-Score</strong>`;

      const sliders = document.createElement('div');
      sliders.appendChild(slider('Valeur (Value)', 'value', state, refresh));
      sliders.appendChild(slider('Risque (Risk)', 'risk', state, refresh));
      sliders.appendChild(slider('Liquidité (Liquidity)', 'liq', state, refresh));
      sliders.appendChild(slider('Momentum', 'momentum', state, refresh));

      const total = document.createElement('div');
      total.textContent = `Total : ${(Object.values(state).reduce((a,b)=>a+b,0)*100).toFixed(0)}%`;
      total.style.marginTop = '8px';
      total.style.fontSize = '13px';
      total.style.color = '#a9b3c1';

      const btns = document.createElement('div');
      btns.style.marginTop = '10px';
      btns.appendChild(makePresetBtn('Default', presets.default, state, refresh));
      btns.appendChild(makePresetBtn('Conservateur', presets.conservateur, state, refresh));
      btns.appendChild(makePresetBtn('Agressif', presets.agressif, state, refresh));

      panel.innerHTML = '';
      panel.appendChild(head);
      panel.appendChild(sliders);
      panel.appendChild(total);
      panel.appendChild(btns);

      root.appendChild(panel);
    }

    render();
  }

  return { mount };
})();
