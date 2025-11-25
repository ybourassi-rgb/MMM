// app/search/page.js
import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Chargement…</div>}>
      <SearchClient />
    </Suspense>
  );
}
