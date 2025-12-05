"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* 🗺️ Reverse geocode helper with caching */
const geocodeCache = new Map();

async function reverseGeocode(lat, lng) {
  if (!lat || !lng) return null;

  const key = `${lat},${lng}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    if (!data.address) return null;

    const parts = [
      data.address.suburb || data.address.neighbourhood,
      data.address.city || data.address.town || data.address.village,
      data.address.state,
    ].filter(Boolean);

    const addr = parts.join(", ");
    geocodeCache.set(key, addr);
    return addr;
  } catch {
    return null;
  }
}

export default function ItemCard({ item, savedIds = [] }) {
  const [saved, setSaved] = useState(savedIds.includes(item.id));
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [checking, setChecking] = useState(true);
  const [address, setAddress] = useState(item.location || "Not specified");

  /* Fetch user */
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setChecking(false);
    };
    fetchUser();
  }, []);

  /* Check if item saved */
  useEffect(() => {
    if (!userId || saved) return;
    const check = async () => {
      const { data } = await supabase
        .from("cart")
        .select("product_id")
        .eq("buyer_id", userId)
        .eq("product_id", item.id)
        .maybeSingle();

      if (data) setSaved(true);
    };
    check();
  }, [userId, item.id, saved]);

  /* Save item */
  const handleSaveItem = async () => {
    if (saved || loading) return;
    setLoading(true);
    setSaved(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/save-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: item.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
    } catch {
      setSaved(false);
      alert("Unable to save item.");
    } finally {
      setLoading(false);
    }
  };

  /* Image fallback */
  const imageSrc = item.image || "https://placehold.co/400x300?text=No+Image";

  /* Reverse geocode */
  useEffect(() => {
    const run = async () => {
      if (item.lat != null && item.lng != null) {
        const addr = await reverseGeocode(item.lat, item.lng);
        setAddress(addr || item.location || "Not specified");
      }
    };
    run();
  }, [item.lat, item.lng, item.location]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all">
      
      {/* Top Row — Category + Save */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
          {item.category || "Other"}
        </span>

        <button
          onClick={!saved ? handleSaveItem : undefined}
          disabled={loading}
          className={`text-lg transition ${
            saved ? "text-red-500" : "text-gray-400 hover:text-red-400"
          }`}
        >
          {checking ? "…" : saved ? "❤️" : "♡"}
        </button>
      </div>

      {/* Image */}
      <div className="rounded-xl overflow-hidden bg-gray-100 h-44 mb-4">
        <img
          src={imageSrc}
          alt={item.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
          onError={(e) => {
            if (!e.target.dataset.fallback) {
              e.target.src = "https://placehold.co/400x300?text=No+Image";
              e.target.dataset.fallback = "true";
            }
          }}
        />
      </div>

      {/* Title + Price */}
      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
        {item.title}
      </h3>

      <div className="mb-3">
        <span className="font-bold text-gray-900">
          {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.price)}
        </span>

        {item.original_price && (
          <span className="ml-2 line-through text-gray-400 text-sm">
            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.original_price)}
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="text-sm text-gray-600 space-y-1 mb-4">
        <p>🧩 Condition: {item.condition}</p>
        <p>📍 {address}</p>
        <p className="text-xs text-gray-500">
          🕑 {item.created_at} • ⭐ {item.rating} • {item.seller_label}
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-auto flex gap-3">
        <Link
          href={`/view-product/${item.id}`}
          className="flex-1 text-center bg-gray-100 text-gray-800 py-2 rounded-xl hover:bg-gray-200 transition"
        >
          View
        </Link>

        <button
          onClick={handleSaveItem}
          disabled={loading || saved}
          className={`flex-1 py-2 rounded-xl transition ${
            saved
              ? "bg-green-500 text-white"
              : "bg-black text-white hover:bg-gray-800"
          } disabled:opacity-50`}
        >
          {loading ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
