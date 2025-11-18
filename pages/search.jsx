"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchFilteredProducts } from "@/lib/productFetcher";
import Header from "@/components/Header";
import Filter from "@/components/Filter";
import ItemGrid from "@/components/ItemGrid";

export default function SearchPage({ user = null }) {
  const searchParams = useSearchParams();

  // Extract all filter params from URL
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const condition = searchParams.get("condition") || "all";
  const min_price = searchParams.get("min_price") || "";
  const max_price = searchParams.get("max_price") || "";
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await fetchFilteredProducts({
          supabase,
          search: q,
          category,
          condition,
          minPrice: min_price,
          maxPrice: max_price,
          sort,
          limit: 50,
        });

        if (error) {
          console.error("Search fetch error:", error);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Unexpected search error:", err);
        setProducts([]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [q, category, condition, min_price, max_price, sort]); // 🔑 re-fetch when any filter changes

  return (
    <main className="bg-white text-gray-900 font-sans min-h-screen">
      <Header user={user} />
      <div className="max-w-[1200px] mx-auto p-5">
        <h1 className="text-2xl font-bold mb-4">
          Search results for “{q}”
        </h1>

        <Filter itemCount={products.length} hasSearch={true} />

        {loading ? (
          <div className="text-center py-12">
            <p>Loading results...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No items found.</p>
          </div>
        ) : (
          <ItemGrid items={products} />
        )}
      </div>
    </main>
  );
}