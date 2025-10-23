"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ItemCard({ item }) {
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("You must be logged in to add items to your cart.");

      const res = await fetch("/api/add-to-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: item.id, quantity: 1 }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add to cart");

      alert(data.message);
    } catch (err) {
      console.error("Add to Cart error:", err);
      alert(err.message || "Could not add to cart.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span className="category">{item.category}</span>
        <span
          className={`cursor-pointer ${favorited ? "text-red-500" : ""}`}
          onClick={() => setFavorited(!favorited)}
        >
          {favorited ? "❤️" : "♡"}
        </span>
      </div>

      <div className="bg-gray-200 rounded-md h-40 mb-3 flex items-center justify-center overflow-hidden">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.title}
          className="object-cover h-full w-full"
        />
      </div>

      <h3 className="text-lg font-medium mb-1">{item.title}</h3>

      <p className="mb-1 font-semibold">
        {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.price)}
        {item.original_price && (
          <span className="line-through text-gray-400 ml-2">
            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.original_price)}
          </span>
        )}
        {item.discount && <span className="text-green-600 ml-2">{item.discount}% off</span>}
      </p>

      <p className="text-sm text-gray-600 mb-1">Condition: {item.condition}</p>
      <p className="text-sm text-gray-600 mb-1">📍 {item.location}</p>

      <p className="text-xs text-gray-500 mb-3">
        🕑 {item.created_at} • ⭐ {item.rating} • {item.seller}
      </p>

      <div className="mt-auto flex justify-between gap-2">
        <Link
          href={`/view-product/${item.id}`}
          className="flex-1 text-center bg-gray-200 text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-300"
        >
          View Details
        </Link>
        <button
          onClick={handleAddToCart}
          disabled={loading}
          className="flex-1 bg-black text-white py-2 px-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
