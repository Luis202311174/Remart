"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* 🗺️ Reverse geocode helper with caching */
const geocodeCache = new Map(); // cache lat/lng => address

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
      data.address.country,
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

  /* Step 1: Get logged-in user ID */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch {
        setUserId(null);
      } finally {
        setChecking(false);
      }
    };
    fetchUser();
  }, []);

  /* Step 2: Check if already saved in DB */
  useEffect(() => {
    if (!userId || saved) return;
    const checkIfSaved = async () => {
      try {
        const { data, error } = await supabase
          .from("cart")
          .select("product_id")
          .eq("buyer_id", userId)
          .eq("product_id", item.id)
          .maybeSingle();
        if (!error && data) setSaved(true);
      } catch {}
    };
    checkIfSaved();
  }, [userId, item.id, saved]);

  /* Step 3: Handle Save */
  const handleSaveItem = async () => {
    if (saved || loading) return;
    setSaved(true);
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
    } catch (err) {
      setSaved(false);
      alert(err.message || "Could not save item.");
    } finally {
      setLoading(false);
    }
  };

  /* Step 4: Image fallback */
  const imageSrc = item.image || "https://placehold.co/400x300?text=No+Image";

  /* Step 5: Reverse geocode if lat/lng exist */
  useEffect(() => {
    const fetchAddress = async () => {
      if (item.lat != null && item.lng != null) {
        const addr = await reverseGeocode(item.lat, item.lng);
        setAddress(addr || item.location || "Not specified");
      }
    };
    fetchAddress();
  }, [item.lat, item.lng, item.location]);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Category + Save Icon */}
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span className="category">{item.category}</span>
        <span
          className={`transition ${
            saved ? "text-red-500 cursor-default" : "cursor-pointer hover:text-red-400"
          }`}
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
            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
              item.original_price
            )}
          </span>
        )}
      </p>

      {/* Meta Info */}
      <p className="text-sm text-gray-600 mb-1">Condition: {item.condition}</p>
      <p className="text-sm text-gray-600 mb-1">📍 {address}</p>
      <p className="text-xs text-gray-500 mb-3">
        🕑 {item.created_at} • ⭐ {item.rating} • {item.seller_label}
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
