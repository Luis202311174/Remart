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

 useEffect(() => {
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("cat_id, cat_name")
      .order("cat_name", { ascending: true });

    if (!error && data) {
      // Remove duplicates by cat_id (in case DB has dup names)
      const unique = Array.from(
        new Map(data.map((c) => [c.cat_id, c])).values()
      );
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
      <p className="text-gray-500 mb-3">{itemCount} items found</p>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        {/* Category (dynamic) */}
      <select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  className="p-2 border border-gray-300 rounded"
>
  <option value="all">All Categories</option>
  {categories.map((cat) => (
    <option key={cat.cat_id} value={cat.cat_id}>
      {cat.cat_name}
    </option>
  ))}
</select>

        {/* Condition */}
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        >
          <option value="all">All Conditions</option>
          <option value="New">New</option>
          <option value="Like New">Like New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
        </select>

        {/* Price range */}
        <input
          type="number"
          placeholder="Min ₱"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="p-2 border border-gray-300 rounded w-24"
        />
        <input
          type="number"
          placeholder="Max ₱"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="p-2 border border-gray-300 rounded w-24"
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>

        {/* Buttons */}
        <button
          type="submit"
          className="bg-gray-200 border border-gray-300 px-3 py-2 rounded hover:bg-gray-300"
        >
          Apply
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="bg-gray-200 border border-gray-300 px-3 py-2 rounded hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </form>
    </div>
  );
}
