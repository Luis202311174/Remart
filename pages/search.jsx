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
  const q = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // ✅ This will detect the logged-in seller inside productFetcher
        const { data, error } = await fetchFilteredProducts({
          supabase,
          search: q,
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
  }, [q, supabase]);

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
