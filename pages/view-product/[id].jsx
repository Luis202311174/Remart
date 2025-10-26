// /pages/view-product/[id].jsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Header from "@/components/Header";
import ItemGrid from "@/components/ItemGrid";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
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
    const similar = product ? await fetchSimilarProducts(product.cat_id, id, 4, context) : [];

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = product?.images || [];

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  const handleNext = () => {
    const nextIndex = (lightboxIndex + 1) % images.length;
    setLightboxIndex(nextIndex);
    setMainImage(images[nextIndex].img_path);
    setZoomed(false);
  };

  const handlePrev = () => {
    const prevIndex = (lightboxIndex - 1 + images.length) % images.length;
    setLightboxIndex(prevIndex);
    setMainImage(images[prevIndex].img_path);
    setZoomed(false);
  };

  const handleAddToCart = async () => {
    if (!user) return router.push("/login");

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          buyerId: user.id,
        }),
      });

      const data = await res.json();
      alert(data.message || (data.success ? "Added to cart!" : "Failed to add."));
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <>
      <Header user={user} />
      <div className="max-w-[1200px] mx-auto px-4 mt-5 grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          {images.length ? (
            <>
              <div
                className="rounded-xl overflow-hidden border border-gray-200 mb-3 cursor-pointer"
                onClick={() => setLightboxOpen(true)}
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

        {/* Details */}
        <div>
          <h1 className="text-3xl font-semibold mb-2">{product.title}</h1>
          <p className="text-gray-600 mb-4">{product.category} • {product.condition}</p>
          <p className="text-2xl font-bold mb-2">₱{product.price.toLocaleString()}</p>
          {product.original_price && (
            <p className="line-through text-gray-400 mb-4">₱{product.original_price.toLocaleString()}</p>
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

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
            >
              Add to Cart
            </button>
            <button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("openChat", {
                    detail: {
                      seller_auth_id: product.seller.auth_id,
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

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="mt-12 max-w-[1200px] mx-auto px-4">
          <h2 className="text-xl font-semibold mb-4">Similar Items</h2>
          <ItemGrid items={similar} />
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-[90%] max-h-[90%] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-red-600 p-1 hover:bg-red-100 rounded z-50"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={20} />
            </button>

            <img
              src={mainImage}
              className={`w-full max-h-[80vh] object-contain transition-transform duration-300 ${
                zoomed ? "scale-150" : ""
              }`}
              alt="Zoomed Product"
            />

            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                className="bg-white p-2 rounded hover:bg-gray-200"
                onClick={() => setZoomed(true)}
              >
                +
              </button>
              <button
                className="bg-white p-2 rounded hover:bg-gray-200"
                onClick={() => setZoomed(false)}
              >
                -
              </button>
            </div>

            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded hover:bg-gray-200"
                  onClick={handlePrev}
                >
                  ◀
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded hover:bg-gray-200"
                  onClick={handleNext}
                >
                  ▶
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
