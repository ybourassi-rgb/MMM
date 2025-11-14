export default async function score(
  link: string,
  summary: string,
  category: string
) {
  const response = await fetch("https://mmm-alpha-one.vercel.app/api/yscore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link, summary, category }),
  });

  if (!response.ok) {
    console.error("Erreur API Y-Score", response.status);
    throw new Error("YScore API error");
  }

  const data = await response.json();
  return data; // doit contenir globalScore, etc.
}
