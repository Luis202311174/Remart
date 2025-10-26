"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Filter({ itemCount = 0, show = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");

  // Update state when URL changes
  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setCondition(searchParams.get("condition") || "all");
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setSort(searchParams.get("sort") || "newest");
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (category !== "all") params.set("category", category);
    if (condition !== "all") params.set("condition", condition);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (sort !== "newest") params.set("sort", sort);

    router.push(`/?${params.toString()}`);
  };

  const handleClear = () => {
    router.push(query ? `/?q=${encodeURIComponent(query)}` : "/");
  };

  return (
    <div className="mb-6">
      <p className="text-gray-500 mb-3">{itemCount} items found</p>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <input type="hidden" name="q" value={query} />

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        >
          <option value="all">All Categories</option>
          <option value="Textbooks">Textbooks</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Clothing">Clothing</option>
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
