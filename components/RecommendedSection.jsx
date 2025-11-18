// components/RecommendedSection.jsx
"use client";
import { useEffect, useState } from "react";
import ItemGrid from "@/components/ItemGrid";

export default function RecommendedSection() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/recommendations");
        const j = await r.json();
        setItems(j.recommended || []);
      } catch (e) {
        console.error("Failed to load recommendations", e);
      }
    })();
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-2xl mb-4 font-semibold">Recommended for You</h2>
      <ItemGrid items={items} />
    </section>
  );
}
