export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const d = req.body || {};
  // paramètres par défaut (tu ajusteras plus tard)
  const cfg = {
    weights: {
      weightPrice: 20,
      weightMarketValue: 20,
      weightProfitability: 25,
      weightRisk: 15,
      weightTimeToLiquidity: 10,
      weightStrategic: 10
    },
    thresholds: { excellent: 80, acceptable: 60, risky: 40 },
    timeDecayFactor: 2
  };

  const r = computeYScore(d, cfg);
  return res.status(201).json({ ...d, ...r, createdAt: new Date().toISOString() });
}

function computeYScore(data, cfg) {
  const w = cfg.weights, t = cfg.thresholds;
  const safeDiv = (a, b) => (b > 0 ? a / b : 0);

  const profitAbs = (data.marketValue ?? 0) - (data.price ?? 0);
  const profitPct = safeDiv(profitAbs, data.price ?? 0) * 100;

  const priceComponent = (data.marketValue ?? 0) > 0
    ? (100 - (safeDiv(data.price ?? 0, data.marketValue ?? 0) * 100))
    : 0;
  const marketValueComponent = (data.marketValue ?? 0) > 0 ? 100 : 0;
  const risk = clamp(data.risk ?? 0, 0, 100);
  const riskComponent = 100 - risk;

  const decay = cfg.timeDecayFactor ?? 2;
  const days = Math.max(0, data.daysToLiquidity ?? 0);
  const timeComponent = Math.max(0, 100 - (days * decay));

  const strategicComponent = clamp(data.strategic ?? 0, 0, 100);

  const yScore =
      priceComponent * (w.weightPrice / 100) +
      marketValueComponent * (w.weightMarketValue / 100) +
      profitPct * (w.weightProfitability / 100) +
      riskComponent * (w.weightRisk / 100) +
      timeComponent * (w.weightTimeToLiquidity / 100) +
      strategicComponent * (w.weightStrategic / 100);

  const y = clamp(+yScore.toFixed(2), 0, 100);

  let decision = 'Mauvaise';
  if (y >= t.excellent) decision = 'Excellente';
  else if (y >= t.acceptable) decision = 'Acceptable';
  else if (y >= t.risky) decision = 'Risquée';

  return {
    profitAbs: +profitAbs.toFixed(2),
    profitPct: +profitPct.toFixed(2),
    yScore: y,
    decision
  };
}

function clamp(n, min, max) { return Math.min(Math.max(n, min), max); }
