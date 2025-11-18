"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Filter({ itemCount = 0, hasSearch = true }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🧠 Initial values from URL
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [condition, setCondition] = useState(searchParams.get("condition") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  // 🧭 Categories from DB
  const [categories, setCategories] = useState([]);

  // Mobile collapse toggle
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("cat_id, cat_name")
        .order("cat_name", { ascending: true });

      if (!error && data) {
        const unique = Array.from(new Map(data.map((c) => [c.cat_id, c])).values());
        setCategories(unique);
      }
    };
    fetchCategories();
  }, []);

  // ✅ Handle Apply
  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);

    if (category && category !== "all") params.set("category", category);
    else params.delete("category");

    if (condition && condition !== "all") params.set("condition", condition);
    else params.delete("condition");

    if (minPrice) params.set("min_price", minPrice);
    else params.delete("min_price");

    if (maxPrice) params.set("max_price", maxPrice);
    else params.delete("max_price");

    if (sort) params.set("sort", sort);
    else params.delete("sort");

    router.push(`?${params.toString()}`);
  };

  // ✅ Handle Clear
  const handleClear = () => {
    const q = searchParams.get("q") || "";
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/");
  };

  // ✅ Sync state with URL
  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setCondition(searchParams.get("condition") || "all");
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setSort(searchParams.get("sort") || "newest");
  }, [searchParams]);

  return (
    <div className="mb-6">
      {/* Items count */}
      <p className="text-gray-500 mb-2 text-sm md:text-base">{itemCount} items found</p>

      {/* Mobile Toggle */}
      <div className="md:hidden mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-black text-white px-4 py-2 rounded flex justify-between items-center hover:bg-gray-800 transition"
        >
          Filters
          <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
        </button>
      </div>

      {/* Filter Form */}
      <form
        onSubmit={handleSubmit}
        className={`flex flex-wrap gap-3 items-end bg-white p-4 rounded-xl shadow-sm border border-gray-200
          ${!isOpen && "hidden md:flex"} md:flex`}
      >
        {/* Category */}
        <div className="flex-1 min-w-[120px]">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
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
            className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
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
            className="w-20 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          />
          <input
            type="number"
            placeholder="Max ₱"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-20 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>

        {/* Sort */}
        <div className="flex-1 min-w-[140px]">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition w-full sm:w-auto"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition w-full sm:w-auto"
          >
            Clear Filters
          </button>
        </div>
      </form>
    </div>
  );
}
