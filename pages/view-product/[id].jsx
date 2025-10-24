"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { X } from "lucide-react"; // Lucide icon for red X
import Header from "@/components/Header";
import ItemGrid from "@/components/ItemGrid";
import { fetchProductById, fetchSimilarProducts } from "@/lib/productFetcher";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [mainImage, setMainImage] = useState("");

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

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
        setSimilar(similarData);
      } catch (err) {
        console.error("Error loading product:", err);
      }
    };

    loadData();
  }, [id]);

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
    [lightboxOpen]
  );

  useEffect(() => {
    if (lightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, handleKeyDown]);

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
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const data = await res.json();
      alert(data.message || (data.success ? "Added to cart!" : "Failed to add."));
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

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
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 mt-5">
          {/* Images */}
          <div>
            {images.length ? (
              <>
                <div
                  className="rounded-xl overflow-hidden border border-gray-200 mb-3 cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={mainImage}
                    className="w-full h-80 object-cover"
                    alt={product.title}
                  />
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
              <p>
                {product.seller.label} (⭐ {product.rating})
              </p>
            </div>

            {/* Main Form Buttons */}
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
                      detail: { seller_auth_id: product.seller.auth_id, product_id: product.id },
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
            {/* Red X */}
            <button
              className="absolute top-2 right-2 text-red-600 p-1 hover:bg-red-100 rounded z-50"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={20} />
            </button>

            {/* Main Image */}
            <img
              src={mainImage}
              className={`w-full max-h-[80vh] object-contain transition-transform duration-300 ${
                zoomed ? "scale-150" : ""
              }`}
              alt="Zoomed Product"
            />

            {/* Zoom Controls */}
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

            {/* Navigation Arrows */}
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
