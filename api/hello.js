export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: 'MMM API alive',
    version: 'V10.3'
  });
}
