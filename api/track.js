"use client";

import { useState } from "react";

export default function AffiliationAmazonCard() {
  const [rawUrl, setRawUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Colle d'abord une URL Amazon.");

  async function handleGenerate() {
    if (!rawUrl || rawUrl.trim().length === 0) {
      setMessage("Colle d'abord une URL Amazon.");
      setGeneratedLink("");
      return;
    }

    try {
      setLoading(true);
      setMessage("Génération du lien affilié…");

      const res = await fetch(
        `/api/track?url=${encodeURIComponent(rawUrl)}`,
      );
      const data = await res.json();

      if (!data.ok) {
        setMessage(`Erreur : ${data.error || "génération impossible"}`);
        setGeneratedLink("");
        return;
      }

      setGeneratedLink(data.link);
      setMessage("Lien généré avec succès ✅");
    } catch (e) {
      setMessage("Erreur réseau lors de la génération.");
      setGeneratedLink("");
    } finally {
      setLoading(false);
    }
  }

  function handleTest() {
    if (!generatedLink) {
      setMessage("Génère d'abord un lien avant de tester.");
      return;
    }
    window.open(generatedLink, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    if (!generatedLink) {
      setMessage("Rien à copier pour l'instant.");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedLink);
      setMessage("Lien copié dans le presse-papier ✅");
    } catch {
      setMessage("Impossible de copier le lien (permissions).");
    }
  }

  return (
    <div className="border rounded-xl p-4 space-y-4 bg-[#05070b]">
      <div>
        <h2 className="text-lg font-semibold">Affiliation Amazon</h2>
        <p className="text-sm text-gray-400">
          Colle une URL produit Amazon, on génère un lien affilié tracké via
          <span className="font-mono"> /api/track</span>.
        </p>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="https://www.amazon.fr/..."
          value={rawUrl}
          onChange={(e) => setRawUrl(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Génération..." : "Générer le lien affilié"}
          </button>

          <button
            type="button"
            onClick={handleTest}
            className="rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
          >
            Tester
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
          >
            Copier
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-red-500/60 bg-red-500/5 p-3 text-xs text-gray-200">
        <div className="mb-1 font-semibold">Lien affilié Amazon tracké</div>
        {generatedLink ? (
          <div className="break-all font-mono text-[11px] text-gray-100">
            {generatedLink}
          </div>
        ) : (
          <div className="text-red-400">{message}</div>
        )}
      </div>
    </div>
  );
}
