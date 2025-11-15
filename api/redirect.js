export default function handler(req, res) {
  try {
    return res.status(200).json({
      ok: true,
      message: "Redirect API fonctionne 🟢"
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
