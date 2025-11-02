export default function handler(req, res){
  const { query } = req;
  const op = query.op || 'ping';
  if (op === 'ping') return res.status(200).json({ ok: true, engine: 'Money Motor Y', status: 'ready' });
  if (op === 'advice') {
    const topic = query.topic || 'marché';
    return res.status(200).json({ ok:true, advice:`Analyse rapide pour ${topic}: privilégier sécurité, cash-flow, et diversification licite.` });
  }
  if (op === 'currencies') {
    return res.status(200).json({ ok: true, list: ['EUR','USD','MAD','DZD','TND','SAR','AED','QAR','TRY','XOF','XAF'] });
  }
  return res.status(400).json({ ok:false, error:'Unknown op' });
}