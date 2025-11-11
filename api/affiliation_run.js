// /api/affiliation_run.js (test minimal)
export const config = { runtime: "edge" };

export default async function handler() {
  return new Response(JSON.stringify({ ok: true, ping: "affiliation_run" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
