export default async function handler(req, res) {
  try {
    res.status(200).json({ ok: true, status: "online" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
