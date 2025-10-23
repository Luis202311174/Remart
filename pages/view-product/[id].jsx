"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faUser, faStar, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { X } from "lucide-react";
import Header from "@/components/Header";
import ItemGrid from "@/components/ItemGrid";
import { supabase } from "@/lib/supabaseClient";
import { fetchProductById, fetchSimilarProducts } from "@/lib/productFetcher";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [mainImage, setMainImage] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [loading, setLoading] = useState(false); // for save action
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState(null);

  // 🧠 Get logged-in user ID
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    fetchUser();
  }, []);

  // 🧠 Check if item is already saved
  useEffect(() => {
    if (!userId || !product) return;

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
  }, [userId, product]);

  // Load product + similar items
  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const productData = await fetchProductById(id);
        if (!productData) return;

        setProduct(productData);
        setImages(productData.images || []);
        if (productData.images?.length) {
          setMainImage(productData.images[0].img_path);
          setLightboxIndex(0);
        }

        const similarData = await fetchSimilarProducts(productData.cat_id, id);
        setSimilar(similarData || []);
      } catch (err) {
        console.error("Error loading product:", err);
      }
    };
    loadData();
  }, [id]);

  // Save item logic
  const handleSaveItem = async () => {
    if (saved || loading || !product) return;
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
      console.error(err);
      alert(err.message || "Could not save item.");
    } finally {
      setLoading(false);
    }
  };

  // Lightbox navigation
  const handleNext = () => {
    if (!images.length) return;
    const nextIndex = (lightboxIndex + 1) % images.length;
    setLightboxIndex(nextIndex);
    setMainImage(images[nextIndex].img_path);
    setZoomed(false);
  };
  const handlePrev = () => {
    if (!images.length) return;
    const prevIndex = (lightboxIndex - 1 + images.length) % images.length;
    setLightboxIndex(prevIndex);
    setMainImage(images[prevIndex].img_path);
    setZoomed(false);
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        setZoomed(false);
      }
      if (lightboxOpen) {
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handlePrev();
      }
    },
    [lightboxOpen, images, lightboxIndex]
  );

  useEffect(() => {
    if (lightboxOpen) window.addEventListener("keydown", handleKeyDown);
    else window.removeEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, handleKeyDown]);

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-10">
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
                        idx === lightboxIndex ? "border-black" : "border-transparent"
                      }`}
                      onClick={() => {
                        setMainImage(img.img_path);
                        setLightboxIndex(idx);
                        setZoomed(false);
                      }}
                      alt={`Thumbnail ${idx + 1}`}
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

          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-semibold mb-2">{product.title}</h1>
            <p className="text-gray-600 mb-4">{product.category} • {product.condition}</p>
            <p className="text-2xl font-bold mb-2">₱{product.price.toLocaleString()}</p>
            {product.original_price && (
              <p className="line-through text-gray-400 mb-4">₱{product.original_price.toLocaleString()}</p>
            )}
            <p className="mb-5 text-gray-700 leading-relaxed">{product.description}</p>

            <div className="mb-5 flex items-center gap-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-600" />
              <span className="font-semibold">Location:</span>
              <span>{product.location}</span>
            </div>

            <div className="mb-5 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-gray-600" />
              <span className="font-semibold">Seller:</span>
              <span>{product.seller}</span>
            </div>

            <div className="mb-5 flex items-center gap-2">
              <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
              <span className="font-semibold">Rating:</span>
              <span>{product.rating}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveItem}
                disabled={loading || saved || checking}
                className={`flex-1 py-3 rounded-lg transition ${
                  saved ? "bg-green-500 text-white cursor-default" : "bg-black text-white hover:bg-gray-800"
                } disabled:opacity-50`}
              >
                {checking ? "…" : saved ? "Saved" : loading ? "Saving..." : "Save Item"}
              </button>
              <a
                href={`/chat?seller_id=${product.seller_id}`}
                className="flex-1 text-center bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Contact Seller
              </a>
              <button
                onClick={() => router.push("/")}
                className="flex-1 bg-gray-100 text-black py-3 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to Browsing
              </button>
            </div>
          </div>
        </div>

        {/* Similar Items */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Similar Items</h2>
            <ItemGrid items={similar} />
          </div>
        )}
      </div>

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
              <button className="bg-white p-2 rounded hover:bg-gray-200" onClick={() => setZoomed(true)}>+</button>
              <button className="bg-white p-2 rounded hover:bg-gray-200" onClick={() => setZoomed(false)}>-</button>
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
