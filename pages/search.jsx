"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchFilteredProducts } from "@/lib/productFetcher";
import ItemCard from "@/components/ItemCard";
import Filter from "@/components/Filter";
import Link from "next/link";

export default function SearchPage({ user = null }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract filter params
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const condition = searchParams.get("condition") || "all";
  const min_price = searchParams.get("min_price") || "";
  const max_price = searchParams.get("max_price") || "";
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categories (map to cat_id)
  const categories = [
    { id: "all", label: "All" },
    { id: "1", label: "Textbooks" },
    { id: "2", label: "Electronics" },
    { id: "3", label: "Furniture" },
    { id: "4", label: "Clothing" },
    { id: "5", label: "Sports" },
  ];

  // Fetch products whenever filters change
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
  }, [q, category, condition, min_price, max_price, sort]);

  return (
    <main className="font-inter min-h-screen flex flex-col bg-gray-900 text-white">

      {/* Page Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="px-4 py-2 inline-block rounded-full bg-gray-800 border border-gray-700 text-gray-200 font-medium hover:bg-gray-700 transition"
          >
            ← Back to Landing Page
          </Link>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-500">
            Search results for “{q}”
          </h1>
         <p className="text-gray-300 mt-2 max-w-lg mx-auto">
    Discover a variety of second-hand items—electronics, clothing, books, and more—posted by people near you.
  </p>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <Filter itemCount={products.length} hasSearch={true} darkTheme />
        </div>

        {/* Items */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-400">Loading results...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <span className="text-3xl">😕</span>
            </div>
            <p className="text-2xl font-semibold text-gray-200">No items found</p>
            <p className="text-gray-400 mt-2">
              Try adjusting your filters or search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 animate-fadeIn">
            {products.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-700 p-1"
              >
                <ItemCard item={item} darkTheme />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-900 py-8 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} CampusMart — All rights reserved.
      </footer>
    </main>
  );
}
