import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ItemGrid from "@/components/ItemGrid";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { fetchProductById, fetchSimilarProducts } from "@/lib/productFetcher";

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

    // 🧩 Normalize "similar" items to match main product structure
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
  const supabase = createClientComponentClient();

  const [mainImage, setMainImage] = useState(product?.images?.[0]?.img_path || "");
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState(user?.id || null);

  const images = product?.images || [];

  // 🔹 If no user from SSR, get client-side
  useEffect(() => {
    if (!userId) {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      })();
    }
  }, [supabase, userId]);

  // 🔹 Check if product is already saved/bookmarked
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

  // ❤️ Save item handler
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
      <Header user={user} />
      <div className="max-w-[1200px] mx-auto px-4 mt-5 grid md:grid-cols-2 gap-10">
        {/* 🖼️ Product Images */}
        <div>
          {images.length ? (
            <>
              <div
                className="rounded-xl overflow-hidden border border-gray-200 mb-3 cursor-pointer"
                onClick={() => setLightboxIndex(lightboxIndex)}
              >
                <img src={mainImage} className="w-full h-80 object-cover" alt={product.title} />
              </div>
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <img
                    key={img.img_path}
                    src={img.img_path}
                    className={`w-20 h-20 object-cover rounded-md border cursor-pointer hover:opacity-75 ${
                      idx === lightboxIndex ? "border-black" : ""
                    }`}
                    onClick={() => {
                      setMainImage(img.img_path);
                      setLightboxIndex(idx);
                    }}
                    alt="Thumbnail"
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-gray-200 rounded-xl h-80 flex items-center justify-center text-gray-500">
              No image available
            </div>
          )}
        </div>

        {/* 📝 Product Details */}
        <div>
          <h1 className="text-3xl font-semibold mb-2">{product.title}</h1>
          <p className="text-gray-600 mb-4">
            {product.category} • {product.condition}
          </p>
          <p className="text-2xl font-bold mb-2">₱{product.price.toLocaleString()}</p>
          {product.original_price && (
            <p className="line-through text-gray-400 mb-4">
              ₱{product.original_price.toLocaleString()}
            </p>
          )}
          <p className="mb-5 text-gray-700 leading-relaxed">{product.description}</p>

          <div className="mb-5">
            <p className="font-semibold">📍 Location:</p>
            <p>{product.location}</p>
          </div>

          <div className="mb-5">
            <p className="font-semibold">👤 Seller:</p>
            <p>{product.seller_label} (⭐ {product.rating})</p>
          </div>

          {/* ❤️ Save & Contact Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveItem}
              disabled={loading || saved}
              className={`flex-1 py-3 rounded-lg transition ${
                saved
                  ? "bg-green-500 text-white cursor-default"
                  : "bg-black text-white hover:bg-gray-800"
              } disabled:opacity-50`}
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
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Contact Seller
            </button>

            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-black py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Back to Browsing
            </button>
          </div>
        </div>
      </div>

      {/* 🛍️ Similar Products */}
      {similar.length > 0 && (
        <div className="mt-12 max-w-[1200px] mx-auto px-4">
          <h2 className="text-xl font-semibold mb-4">Similar Items</h2>
          <ItemGrid items={similar} />
        </div>
      )}
    </>
  );
}
