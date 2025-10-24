"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ItemCard({ item }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState(null);

  // 🧠 Get logged-in user ID (for saved/bookmarked check)
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    fetchUser();
  }, []);

  // 🧠 Check if this product is already saved
  useEffect(() => {
    if (!userId) return;

    const checkIfSaved = async () => {
      try {
        const { data, error } = await supabase
          .from("cart")
          .select("product_id")
          .eq("buyer_id", userId)
          .eq("product_id", item.id)
          .maybeSingle();

        if (error) throw error;
        if (data) setSaved(true);
      } catch (err) {
        console.error("Error checking saved item:", err);
      } finally {
        setChecking(false);
      }
    };

    checkIfSaved();
  }, [userId, item.id]);

  // ❤️ Save item (bookmark)
  const handleSaveItem = async () => {
    if (saved || loading) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("You must be logged in to save items.");

      const res = await fetch("/api/save-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: item.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save item.");

      setSaved(true);
    } catch (err) {
      console.error("Save Item error:", err);
      alert(err.message || "Could not save item.");
    } finally {
      setLoading(false);
    }
  };

  const imageSrc = item.image || "https://placehold.co/400x300?text=No+Image";

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Category + Save Icon */}
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span className="category">{item.category}</span>
        <span
          className={`transition ${saved ? "text-red-500 cursor-default" : "cursor-pointer hover:text-red-400"}`}
          onClick={!saved ? handleSaveItem : undefined}
        >
          {checking ? "…" : saved ? "❤️" : "♡"}
        </span>
      </div>

      {/* Product Image */}
      <div className="bg-gray-100 rounded-md h-40 mb-3 flex items-center justify-center overflow-hidden">
        <img
          src={imageSrc}
          alt={item.title || "Product image"}
          className="object-cover h-full w-full transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            if (!e.target.dataset.fallback) {
              e.target.src = "https://placehold.co/400x300?text=No+Image";
              e.target.dataset.fallback = "true";
            }
          }}
        />
      </div>

      {/* Title + Price */}
      <h3 className="text-lg font-medium mb-1 truncate">{item.title}</h3>
      <p className="mb-1 font-semibold">
        {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.price)}
        {item.original_price && (
          <span className="line-through text-gray-400 ml-2">
            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.original_price)}
          </span>
        )}
        {item.discount && <span className="text-green-600 ml-2">{item.discount}% off</span>}
      </p>

      {/* Meta Info */}
      <p className="text-sm text-gray-600 mb-1">Condition: {item.condition}</p>
      <p className="text-sm text-gray-600 mb-1">📍 {item.location}</p>
      <p className="text-xs text-gray-500 mb-3">
        🕑 {item.created_at} • ⭐ {item.rating} • {item.seller}
      </p>

      {/* Buttons */}
      <div className="mt-auto flex justify-between gap-2">
        <Link
          href={`/view-product/${item.id}`}
          className="flex-1 text-center bg-gray-200 text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-300 transition"
        >
          View Details
        </Link>
        <button
          onClick={handleSaveItem}
          disabled={loading || saved}
          className={`flex-1 py-2 px-3 rounded-lg transition ${
            saved ? "bg-green-500 text-white cursor-default" : "bg-black text-white hover:bg-gray-800"
          } disabled:opacity-50`}
        >
          {loading ? "Saving..." : saved ? "Saved" : "Save Item"}
        </button>
      </div>
    </div>
  );
}