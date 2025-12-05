import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ItemGrid from "@/components/ItemGrid";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { supabase } from "@/lib/supabaseClient";
import { fetchProductById, fetchSimilarProducts } from "@/lib/productFetcher";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

export async function getServerSideProps(context) {
  try {
    const supabase = createPagesServerClient(context);
    const {
      data: { session },
    } = await supabase.auth.getSession();

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
    console.error("❌ Error fetching product:", error.message || error);
    return {
      props: {
        product: null,
        similar: [],
        user: null,
      },
    };
  }
}

export default function ProductPage({ product, similar = [], user }) {
  const router = useRouter();

  const [mainImage, setMainImage] = useState(product?.images?.[0]?.img_path || "");
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState(user?.id || null);

  const images = product?.images || [];

  useEffect(() => {
    if (!userId) {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      })();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !product?.id) return;
    const checkIfSaved = async () => {
      try {
        const { data, error } = await supabase
          .from("cart")
          .select("product_id")
          .eq("buyer_id", userId)
          .eq("product_id", product.id)
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
  }, [userId, product?.id, supabase]);

  const handleSaveItem = async () => {
    if (!userId) return router.push("/login");
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
        body: JSON.stringify({ product_id: product.id }),
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

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  return (
    <>
      <Header user={user} className="z-50" />

      <main className="max-w-[1200px] mx-auto px-4 mt-8 grid md:grid-cols-2 gap-10">
        {/* Product Images */}
        <div>
          {images.length ? (
            <>
              <div
                className="rounded-xl overflow-hidden border border-gray-200 mb-3 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setLightboxIndex(lightboxIndex)}
              >
                <img
                  src={mainImage}
                  alt={product.title}
                  className="w-full h-80 md:h-[400px] object-cover transition-transform hover:scale-105"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={img.img_path}
                    onClick={() => {
                      setMainImage(img.img_path);
                      setLightboxIndex(idx);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-md border transition ${
                      idx === lightboxIndex ? "border-black" : "border-gray-300 hover:border-black"
                    } focus:outline-none focus:ring-2 focus:ring-black`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img.img_path}
                      className="w-full h-full object-cover rounded-md"
                      alt="Thumbnail"
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-gray-200 rounded-xl h-80 flex items-center justify-center text-gray-500">
              No image available
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">{product.title}</h1>
          <p className="text-gray-600 mb-2">
            {product.category} • {product.condition}
          </p>

          <div className="flex items-center gap-4">
            <p className="text-2xl md:text-3xl font-bold text-black">
              ₱{product.price.toLocaleString()}
            </p>
            {product.original_price && (
              <p className="line-through text-gray-400">
                ₱{product.original_price.toLocaleString()}
              </p>
            )}
          </div>

          <p className="text-gray-700 leading-relaxed">{product.description}</p>

          {/* Product Location */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-4 relative z-0">
            <p className="font-semibold mb-2">📍 Pickup Location</p>
            {product.lat && product.lng ? (
              <div className="w-full h-64 rounded-lg overflow-hidden border relative z-0">
                <LeafletMap
                  center={[product.lat, product.lng]}
                  radius={300}
                  previewOnly={true}
                  style={{ height: "100%", zIndex: 0 }}
                />
              </div>
            ) : (
              <p className="text-gray-500">No location provided.</p>
            )}
          </div>

          {/* Seller Info */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-4">
            <p className="font-semibold mb-1">👤 Seller:</p>
            <p>
              {product.seller_label} (⭐ {product.rating})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={handleSaveItem}
              disabled={loading || saved}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                saved
                  ? "bg-green-500 text-white cursor-default"
                  : "bg-black text-white hover:bg-gray-800"
              } disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black`}
            >
              {loading ? "Saving..." : saved ? "Saved" : "Save Item"}
            </button>

            <button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("openChat", {
                    detail: {
                      seller_auth_id:
                        product.seller?.auth_id ||
                        product.seller_auth_id ||
                        product.seller_id,
                      product_id: product.id,
                    },
                  })
                )
              }
              className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium transition focus:outline-none focus:ring-2 focus:ring-black"
            >
              Contact Seller
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent("openChatbot", { detail: { product } }))}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Ask AI Assistant
            </button>

            <button
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-lg bg-gray-100 text-black hover:bg-gray-200 font-medium transition focus:outline-none focus:ring-2 focus:ring-black"
            >
              Back to Browsing
            </button>
          </div>
        </div>
      </main>

      {/* Separator Line */}
      <div className="max-w-[1200px] mx-auto my-12 border-t border-gray-300"></div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 mb-12">
          <h2 className="text-2xl font-semibold mb-4">Similar Items</h2>
          <ItemGrid items={similar} />
        </div>
      )}
    </>
  );
}