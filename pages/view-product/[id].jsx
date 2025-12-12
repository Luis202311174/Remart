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
  faUser,
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

/* SERVER SIDE PROPS */
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

/* MAIN COMPONENT */
export default function ProductPage({ product, similar = [], user }) {
  const router = useRouter();
  const [mainImage, setMainImage] = useState(product?.images?.[0]?.img_path || "");
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(user?.id || null);
  const [address, setAddress] = useState(product?.location || "Not specified");

  const images = product?.images || [];

  /* Load User ID if missing */
  useEffect(() => {
    if (!userId) {
      (async () => {
        try {
          const { data } = await supabase.auth.getUser();
          setUserId(data?.user?.id || null);
        } catch {}
      })();
    }
  }, [userId]);

  /* Reverse Geocode */
  useEffect(() => {
    (async () => {
      if (product?.lat != null && product?.lng != null) {
        const addr = await reverseGeocode(product.lat, product.lng);
        setAddress(addr || product.location || "Not specified");
      }
    })();
  }, [product?.lat, product?.lng, product?.location]);

  /* Check if saved */
  useEffect(() => {
    if (!userId || !product?.id) return;

    (async () => {
      try {
        const { data } = await supabase
          .from("cart")
          .select("product_id")
          .eq("buyer_id", userId)
          .eq("product_id", product.id)
          .maybeSingle();
        if (data) setSaved(true);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [userId, product?.id]);

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

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F2F5F3] flex items-center justify-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  return (
    <main className="bg-[#F2F5F3] min-h-screen pb-16">
      <Header user={user} />

      <section className="max-w-[1200px] mx-auto px-4 py-12 grid md:grid-cols-2 gap-10">
        {/* LEFT: Images */}
        <div className="flex flex-col gap-4">
          {mainImage ? (
            <>
              <div
                className="rounded-xl overflow-hidden shadow-md cursor-pointer bg-white"
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
                        ? "border-green-500 ring-2 ring-green-400"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                  >
                    <img src={img.img_path} className="w-full h-full object-cover rounded-md" />
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} /> Seller
                </p>
                <p className="text-lg font-semibold text-gray-900">{product.seller_label}</p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl h-80 flex items-center justify-center text-gray-400 shadow-md">
              No image available
            </div>
          )}
        </div>

        {/* RIGHT: Details */}
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl md:text-4xl font-bold text-green-600">{product.title}</h1>

          <div>
            <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
              ₱{Number(product.price).toLocaleString()}
            </p>
            {product.original_price && (
              <p className="line-through text-gray-400">
                ₱{Number(product.original_price).toLocaleString()}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="text-green-500" /> Location
            </p>
            <p className="text-lg font-semibold text-gray-900">{address}</p>
          </div>

          <div className="flex gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Category</p>
              <div className="px-4 py-2 rounded-full bg-white text-sm font-medium text-green-600 border border-gray-200">
                {product.category || "Uncategorized"}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Condition</p>
              <div className="px-4 py-2 rounded-full bg-white text-sm font-medium text-green-600 border border-gray-200">
                {product.condition || "Unknown"}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <button
              onClick={handleSaveItem}
              disabled={saved || loading}
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md transition ${
                saved ? "bg-green-500" : "bg-white hover:bg-gray-100"
              } text-gray-900`}
            >
              <FontAwesomeIcon icon={faBookmark} />
            </button>

            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <button className="flex-1 py-2 rounded-xl bg-white hover:bg-gray-100 text-green-600 text-sm font-medium flex items-center justify-center gap-2 border border-gray-200">
                <FontAwesomeIcon icon={faCommentDots} /> Contact Seller
              </button>

              <button className="flex-1 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faCircleInfo} /> Ask AI
              </button>

              <button
                onClick={() => router.back()}
                className="flex-1 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-900 text-sm font-medium flex items-center justify-center gap-2 border border-gray-200"
              >
                <FontAwesomeIcon icon={faArrowLeftRotate} /> Back
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2 font-semibold">Description</p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-900">
              {product.description || <span className="text-gray-400">No description provided.</span>}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <p className="font-semibold mb-3 text-gray-900">Map</p>
            {product.lat && product.lng ? (
              <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                <LeafletMap
                  center={[product.lat, product.lng]}
                  radius={product.radius || 300}
                  previewOnly={false}
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            ) : (
              <p className="text-gray-400">No location provided.</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Location: <span className="font-medium text-gray-900">{address}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-[1200px] mx-auto my-12 border-t border-gray-200" />

      {/* Similar Items */}
      {similar.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 mb-16">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">Similar Items</h2>
          <ItemGrid items={similar} />
        </section>
      )}
    </main>
  );
}
