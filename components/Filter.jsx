"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SlidersHorizontal } from "lucide-react";

export default function Filter({ itemCount = 0 }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  // State values
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [condition, setCondition] = useState(searchParams.get("condition") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  const [categories, setCategories] = useState([]);

  /* Load categories */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("categories")
        .select("cat_id, cat_name")
        .order("cat_name", { ascending: true });

      if (data) {
        const unique = Array.from(new Map(data.map(c => [c.cat_id, c])).values());
        setCategories(unique);
      }
    };
    load();
  }, []);

  /* Sync URL → state */
  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setCondition(searchParams.get("condition") || "all");
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setSort(searchParams.get("sort") || "newest");
  }, [searchParams]);

  /* Apply */
  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);

    category !== "all" ? params.set("category", category) : params.delete("category");
    condition !== "all" ? params.set("condition", condition) : params.delete("condition");
    minPrice ? params.set("min_price", minPrice) : params.delete("min_price");
    maxPrice ? params.set("max_price", maxPrice) : params.delete("max_price");
    sort ? params.set("sort", sort) : params.delete("sort");

    setIsOpen(false);
    router.push(`?${params.toString()}`);
  };

  /* Clear */
  const handleClear = () => {
    const q = searchParams.get("q") || "";
    setIsOpen(false);
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/");
  };

  return (
    <div className="mb-4">

      {/* Items Count + Filter Icon */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-sm md:text-base">{itemCount} items found</p>

        {/* Filter Icon Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition flex items-center"
        >
          <SlidersHorizontal className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 shadow-md rounded-xl p-4 mt-2 flex flex-wrap gap-3 transition-all"
        >
          {/* Category */}
          <div className="flex-1 min-w-[120px]">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.cat_id} value={cat.cat_id}>
                  {cat.cat_name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="flex-1 min-w-[120px]">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black"
            >
              <option value="all">All Conditions</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min ₱"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black"
            />
            <input
              type="number"
              placeholder="Max ₱"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Sort */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-2 w-full">
            <button
              type="submit"
              className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800 transition"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
            >
              Clear
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
