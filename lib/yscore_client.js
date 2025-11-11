// /lib/yscore_client.js
// Scoring minimal et compatible Edge.
// Si ton vrai scoring existe ailleurs, branche-le ici plus tard.

export async function scoreItems(items = []) {
  // Exemple : si un item a déjà score_total, on garde,
  // sinon on met une valeur par défaut (70) pour les tests.
  return items.map(it => {
    if (typeof it.score_total === "number") return it;
    return { ...it, score_total: 70 };
  });
}
