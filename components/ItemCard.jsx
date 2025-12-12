"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaPuzzlePiece, 
  FaHeart, 
  FaRegHeart 
} from "react-icons/fa";

/* --------------------- REVERSE GEOCODE HELPER --------------------- */
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

/* ---------------------------- ITEM CARD ---------------------------- */
export default function ItemCard({ item, savedIds = [] }) {
  const [saved, setSaved] = useState(savedIds.includes(item.id));
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [checking, setChecking] = useState(true);
  const [address, setAddress] = useState(item.location || "Not specified");

  /* Fetch logged-in user */
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setChecking(false);
    };
    fetchUser();
  }, []);

  /* Check if item already saved */
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

  /* Handle save item */
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
    <div className="bg-white border border-[#DDE2D8] rounded-2xl p-4 flex flex-col shadow-lg hover:shadow-2xl transition-all duration-200 w-[230px] h-[550px]">

      {/* Top Row — Category + Save */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-semibold">
          {item.category || "Other"}
        </span>

        <button
          onClick={!saved ? handleSaveItem : undefined}
          disabled={loading}
          className={`text-lg transition ${saved ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
        >
          {checking ? "…" : saved ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>

      {/* Image */}
      <div className="rounded-xl overflow-hidden bg-gray-100 h-48 mb-4 flex-shrink-0">
        <img
          src={imageSrc}
          alt={item.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            if (!e.target.dataset.fallback) {
              e.target.src = "https://placehold.co/400x300?text=No+Image";
              e.target.dataset.fallback = "true";
            }
          }}
        />
      </div>

      {/* Title + Price */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
        {item.title}
      </h3>

      <div className="mb-2">
        <span className="font-bold text-green-600">
          {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.price)}
        </span>
        {item.original_price && (
          <span className="ml-2 line-through text-gray-400 text-sm">
            {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.original_price)}
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="text-sm text-gray-500 space-y-1 flex-1 overflow-hidden">
        <p className="flex items-center gap-2">
          <FaPuzzlePiece className="text-gray-400" /> {item.condition || "N/A"}
        </p>
        <p className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-gray-400" /> {address}
        </p>
        <p className="flex items-center gap-2 text-xs text-gray-400 truncate">
          <FaClock className="text-gray-400" />{" "}
          {new Date(item.created_at).toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            month: "short",
            day: "numeric",
            year: "numeric",
          })} • {item.seller_label}
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-3 flex flex-col sm:flex-row gap-3">
        <Link
          href={`/view-product/${item.id}`}
          className="flex-1 text-center bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
        >
          View
        </Link>

        <button
          onClick={handleSaveItem}
          disabled={loading || saved}
          className={`flex-1 py-2 rounded-xl transition ${
            saved ? "bg-green-500 text-white" : "bg-green-100 text-green-700 hover:bg-green-200"
          } disabled:opacity-50`}
        >
          {loading ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
