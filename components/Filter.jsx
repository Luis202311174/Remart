"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SlidersHorizontal } from "lucide-react";

export default function Filter({ itemCount = 0, darkTheme = false, hasSearch = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [condition, setCondition] = useState(searchParams.get("condition") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [categories, setCategories] = useState([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("cat_id, cat_name")
        .order("cat_name", { ascending: true });

      if (data) {
        const unique = Array.from(new Map(data.map(c => [c.cat_id, c])).values());
        setCategories(unique);
      }
    };
    loadCategories();
  }, []);

  // Sync URL → state
  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setCondition(searchParams.get("condition") || "all");
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setSort(searchParams.get("sort") || "newest");
  }, [searchParams]);

  // Apply filters
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

  const handleClear = () => {
    const q = searchParams.get("q") || "";
    setIsOpen(false);
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/");
  };

  return (
    <div className="mb-4 relative">

      {/* Items Count + Filter Icon */}
      <div className="flex items-center justify-between mb-2">
        <p className={`${darkTheme ? "text-gray-400" : "text-gray-700"} text-sm md:text-base`}>
          {itemCount} items found
        </p>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-full border transition flex items-center
            ${darkTheme ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
          aria-label="Toggle Filters"
        >
          <SlidersHorizontal className={`h-5 w-5 ${darkTheme ? "text-green-500" : "text-gray-700"}`} />
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={`absolute top-full right-0 mt-2 w-full max-w-lg z-50 transform transition-all duration-300
          ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <form
          onSubmit={handleSubmit}
          className={`bg-gradient-to-b from-gray-900 to-black rounded-xl p-4 shadow-lg border border-green-600 flex flex-col gap-4`}
        >
          <div className="flex flex-wrap gap-3">

            {/* Category */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-sm text-gray-400 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full p-2 rounded border focus:ring-1 focus:ring-green-500
                  ${darkTheme ? "bg-black border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.cat_id} value={cat.cat_id}>{cat.cat_name}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-sm text-gray-400 mb-1 block">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className={`w-full p-2 rounded border focus:ring-1 focus:ring-green-500
                  ${darkTheme ? "bg-black border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              >
                <option value="all">All Conditions</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            {/* Price */}
            <div className="flex gap-2 min-w-[140px]">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Min Price</label>
                <input
                  type="number"
                  placeholder="₱ Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className={`w-full p-2 rounded border focus:ring-1 focus:ring-green-500
                    ${darkTheme ? "bg-black border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Max Price</label>
                <input
                  type="number"
                  placeholder="₱ Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className={`w-full p-2 rounded border focus:ring-1 focus:ring-green-500
                    ${darkTheme ? "bg-black border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-sm text-gray-400 mb-1 block">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`w-full p-2 rounded border focus:ring-1 focus:ring-green-500
                  ${darkTheme ? "bg-black border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
              </select>
            </div>

          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="flex-1 bg-green-500 text-black py-2 rounded hover:bg-green-600 transition"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleClear}
              className={`${darkTheme ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} flex-1 py-2 rounded transition`}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
