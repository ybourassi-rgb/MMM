export default function log(data: any) {
  console.log("📝 Log (non persisté Redis):", {
    ...data,
    ts: Date.now(),
  });
}
