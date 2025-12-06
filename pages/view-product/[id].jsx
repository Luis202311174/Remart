"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ItemGrid from "@/components/ItemGrid";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { supabase } from "@/lib/supabaseClient";
import { fetchProductById, fetchSimilarProducts } from "@/lib/productFetcher";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faCommentDots,
  faCircleInfo,
  faArrowLeftRotate,
  faLocationDot,
  faUser
} from "@fortawesome/free-solid-svg-icons";

/* Leaflet map (client-only) */
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

/* Reverse Geocoding Cache */
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

/* SERVER SIDE PROPS (for pages that use SSR) */
export async function getServerSideProps(context) {
  try {
    const supabaseServer = createPagesServerClient(context);
    const {
      data: { session },
    } = await supabaseServer.auth.getSession();

    const user = session?.user || null;
    const { id } = context.params;

    const product = await fetchProductById(id, context);
    let similar = product ? await fetchSimilarProducts(product.cat_id, id, 4, context) : [];

    similar = similar.map((item) => ({
      ...item,
      title: item.title || item.product_name || "Untitled",
      category: item.category || item.cat_name || "Uncategorized",
      price: item.price || item.amount || 0,
      images: item.images || (item.img_path ? [{ img_path: item.img_path }] : []),
      seller_label: item.seller_label || item.seller_name || "Unknown Seller",
    }));

    return {
      props: {
        product: product || null,
        similar,
        user,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching product:", error?.message || error);
    return { props: { product: null, similar: [], user: null } };
  }
}

/* MAIN PAGE COMPONENT */
export default function ProductPage({ product, similar = [], user }) {
  const router = useRouter();

  const [mainImage, setMainImage] = useState(product?.images?.[0]?.img_path || "");
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState(user?.id || null);
  const [address, setAddress] = useState(product?.location || "Not specified");

  const images = product?.images || [];

  /* Load User ID if not present */
  useEffect(() => {
    if (!userId) {
      (async () => {
        try {
          const { data } = await supabase.auth.getUser();
          setUserId(data?.user?.id || null);
        } catch (err) {
          // silent
        }
      })();
    }
  }, [userId]);

  /* Reverse Geocode Address from lat/lng */
  useEffect(() => {
    (async () => {
      if (product?.lat != null && product?.lng != null) {
        const addr = await reverseGeocode(product.lat, product.lng);
        setAddress(addr || product.location || "Not specified");
      }
    })();
  }, [product?.lat, product?.lng, product?.location]);

  /* Check if Saved */
  useEffect(() => {
    if (!userId || !product?.id) return;

    const checkIfSaved = async () => {
      try {
        const { data } = await supabase
          .from("cart")
          .select("product_id")
          .eq("buyer_id", userId)
          .eq("product_id", product.id)
          .maybeSingle();

        if (data) setSaved(true);
      } catch (err) {
        console.error("Error checking saved item:", err);
      } finally {
        setChecking(false);
      }
    };

    checkIfSaved();
  }, [userId, product?.id]);

  /* Save Item handler */
  const handleSaveItem = async () => {
    if (!userId) return router.push("/login");
    if (saved || loading) return;

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error("You must be logged in.");

      const res = await fetch("/api/save-item", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save item.");

      setSaved(true);
    } catch (err) {
      alert(err?.message || "Failed to save item.");
    } finally {
      setLoading(false);
    }
  };

  /* If Product Missing */
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Product not found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Header (keeps its own styling) */}
      <Header user={user} className="z-50" />

      {/* Page wrapper — black primary background */}
      <div className="bg-gray-900 min-h-screen pb-16">
        <main className="max-w-[1200px] mx-auto px-4 pt-10 grid md:grid-cols-2 gap-10">
          {/* LEFT — Images */}
          <div className="flex flex-col">
            {images.length ? (
              <>
                <div
                  className="rounded-xl overflow-hidden border border-gray-800 mb-3 cursor-pointer bg-neutral-900"
                  onClick={() => setLightboxIndex(lightboxIndex)}
                >
                  <img
                    src={mainImage}
                    alt={product.title}
                    className="w-full h-80 md:h-[420px] object-cover transition-transform hover:scale-105"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.img_path}
                      onClick={() => {
                        setMainImage(img.img_path);
                        setLightboxIndex(idx);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-md border transition ${
                        idx === lightboxIndex
                          ? "border-green-400 ring-2 ring-green-500"
                          : "border-gray-700 hover:border-green-500"
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img src={img.img_path} className="w-full h-full object-cover rounded-md" />
                    </button>
                  ))}
                </div>

                {/* Seller Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                    Seller
                  </p>
                  <p className="text-lg font-semibold text-gray-100">{product.seller_label || "Unknown Seller"}</p>
                </div>
              </>
            ) : (
              <div className="bg-gray-800 rounded-xl h-80 flex items-center justify-center text-gray-500">
                No image available
              </div>
            )}
          </div>

          {/* RIGHT — Details */}
          <div className="flex flex-col gap-6 text-gray-100">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-green-300">{product.title}</h1>

            {/* Price */}
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-white">
                ₱{Number(product.price).toLocaleString()}
              </p>
              {product.original_price && (
                <p className="line-through text-gray-500">
                  ₱{Number(product.original_price).toLocaleString()}
                </p>
              )}
            </div>

            {/* Location card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1 flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="text-green-400" /> Location
              </p>
              <p className="text-lg font-semibold text-gray-100">{address}</p>
            </div>

            {/* Category & Condition */}
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Category</p>
                <div className="px-4 py-2 rounded-full bg-gray-800 text-sm font-medium text-green-200">
                  {product.category || "Uncategorized"}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Condition</p>
                <div className="px-4 py-2 rounded-full bg-gray-800 text-sm font-medium text-green-200">
                  {product.condition || "Unknown"}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Save (round) */}
              <button
                onClick={handleSaveItem}
                disabled={loading || saved}
                className={`flex items-center justify-center w-12 h-12 rounded-full shadow transition ${
                  saved ? "bg-green-500" : "bg-gray-800 hover:bg-gray-700"
                } text-white`}
                aria-label={saved ? "Saved" : "Save"}
                title={saved ? "Saved" : "Save"}
              >
                <FontAwesomeIcon icon={faBookmark} />
              </button>

              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("openChat", {
                        detail: {
                          seller_auth_id:
                            product.seller?.auth_id || product.seller_auth_id || product.seller_id,
                          product_id: product.id,
                        },
                      })
                    )
                  }
                  className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-green-100 text-sm font-medium flex items-center justify-center gap-2 border border-gray-700"
                >
                  <FontAwesomeIcon icon={faCommentDots} /> Contact Seller
                </button>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("openChatbot", { 
                    detail: { 
                      product: { ...product, location: address },
                      condition: "You are a helpful product assistant. Provide accurate, concise information about the product. Answer questions based on the product details provided. Be friendly and professional. if they ask about the details make sure to send it like: The product is (product) and (your thoughts). no need to make it longer. if they ask about if the product is legit(make sure to actually scan through the product and do some research) send it like: The product (display product name in parenthesis) is (either legit or not) because (your thoughts)."
                    } 
                  }))}
                  className="flex-1 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-black text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faCircleInfo} /> Ask AI
                </button>

                <button
                  onClick={() => router.back()}
                  className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium flex items-center justify-center gap-2 border border-gray-700"
                >
                  <FontAwesomeIcon icon={faArrowLeftRotate} /> Back
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-gray-400 mb-2 font-semibold">Description</p>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-gray-200">
                {product.description || <span className="text-gray-500">No description provided.</span>}
              </div>
            </div>

            {/* Map (non-overlapping) */}
            <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
              <p className="font-semibold mb-3 text-gray-200">Map</p>

              {product.lat && product.lng ? (
                <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-700 mb-3 relative z-0">
                  <LeafletMap
                    center={[product.lat, product.lng]}
                    radius={product.radius || 300}
                    previewOnly={false}
                    style={{ height: "100%", width: "100%", position: "relative", zIndex: 1 }}
                  />
                </div>
              ) : (
                <p className="text-gray-500 mb-3">No location provided.</p>
              )}

              <p className="text-sm text-gray-400">
                Location: <span className="font-medium text-gray-100">{address}</span>
              </p>
            </div>
          </div>
        </main>

        {/* Separator */}
        <div className="max-w-[1200px] mx-auto my-12 border-t border-gray-800" />

        {/* Similar Items */}
        {similar.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-4 mb-16">
            <h2 className="text-2xl font-semibold mb-4 text-green-300">Similar Items</h2>
            <ItemGrid items={similar} dark />
          </section>
        )}
      </div>
    </>
  );
}