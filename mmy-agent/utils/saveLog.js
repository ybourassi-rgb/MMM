// Logging désactivé temporairement pour éviter les erreurs Redis
export default async function saveLog(data) {
  console.log("📝 Log (non persisté Redis):", {
    ...data,
    ts: Date.now(),
  });
}
