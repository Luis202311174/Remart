"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  List,
  PackageX,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  MapPin,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import EditProductModal from "@/components/EditProductModal";

// Dynamic Leaflet imports
const LeafletMapWithDraw = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

export default function MyListings({ loadPage }) {
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mapModalProduct, setMapModalProduct] = useState(null);

  // Load seller + products
  useEffect(() => {
    const loadSellerProducts = async () => {
      setLoading(true);
      setError("");

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        setError("⚠️ Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      const { data: sellerData } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!sellerData) {
        setError("⚠️ You are not registered as a seller.");
        setLoading(false);
        return;
      }

      setSeller(sellerData);

      const { data: productsData, error: prodError } = await supabase
        .from("products")
        .select(`
          product_id,
          title,
          description,
          price,
          original_price,
          condition,
          status,
          lat,
          lng,
          radius,
          created_at,
          categories (cat_name),
          product_images (img_path)
        `)
        .eq("seller_id", sellerData.id)
        .order("product_id", { ascending: false });

      if (prodError) setError("❌ " + prodError.message);
      else setProducts(productsData || []);

      setLoading(false);
    };

    loadSellerProducts();
  }, []);

  // Auto-hide flash message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Delete logic
  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };
  const handleDelete = async () => {
    if (!productToDelete) return;
    setShowDeleteModal(false);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("product_id", productToDelete.product_id);

    if (error) alert("❌ Error deleting product: " + error.message);
    else {
      setProducts((prev) =>
        prev.filter((p) => p.product_id !== productToDelete.product_id)
      );
      setSuccessMsg("✅ Product deleted successfully!");
    }

    setProductToDelete(null);
  };

  // Edit logic
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading products...
      </div>
    );

  if (error)
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg mt-10">
        {error}
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow p-6 relative">
      {/* Flash message */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 animate-fade-in-down">
          <div className="backdrop-blur-md bg-green-600/80 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 relative">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="text-gray-700 mb-5">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{productToDelete?.title}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => window.location.reload()}
        />
      )}

      {/* Map modal with Leaflet Draw */}
      {mapModalProduct && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative w-11/12 h-5/6 bg-white rounded-lg overflow-hidden shadow-lg">
            {/* Close button */}
            <button
              onClick={() => setMapModalProduct(null)}
              className="absolute top-3 right-3 z-[1000] bg-white shadow-md rounded-full p-2 hover:bg-gray-100 border"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Leaflet Draw Map */}
            <LeafletMapWithDraw
              center={[mapModalProduct.lat, mapModalProduct.lng]}
              radius={mapModalProduct.radius || 300}
              onCircleChange={({ lat, lng, radius }) => {
                setProducts((prev) =>
                  prev.map((p) =>
                    p.product_id === mapModalProduct.product_id
                      ? { ...p, lat, lng, radius }
                      : p
                  )
                );
                setMapModalProduct((prev) => ({ ...prev, lat, lng, radius }));
              }}
              style={{ height: "100%" }}
            />

            {/* Save Location button */}
            <div className="absolute bottom-4 right-4 z-[1100]">
              <button
                onClick={async () => {
                  if (!mapModalProduct) return;
                  const { error } = await supabase
                    .from("products")
                    .update({
                      lat: mapModalProduct.lat,
                      lng: mapModalProduct.lng,
                      radius: mapModalProduct.radius,
                    })
                    .eq("product_id", mapModalProduct.product_id);

                  if (error) {
                    alert("❌ Failed to save location: " + error.message);
                  } else {
                    setSuccessMsg("✅ Location updated!");
                    setMapModalProduct(null);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <List className="w-6 h-6" /> My Product Listings
      </h2>

      {products.length === 0 ? (
        <div className="p-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
          <PackageX className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p>No products found.</p>
          <button
            onClick={() => loadPage("add-product")}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition relative"
            >
              {/* Sold Badge */}
              {product.status === "sold" && (
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded font-bold text-xs z-10">
                  SOLD
                </div>
              )}

              {/* Image */}
              {product.product_images?.length ? (
                <img
                  src={product.product_images[0].img_path}
                  alt={product.title}
                  className={`w-full h-48 object-cover rounded-lg mb-2 ${
                    product.status === "sold" ? "opacity-60" : ""
                  }`}
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400 mb-2">
                  No Image
                </div>
              )}

              {/* Map preview (disabled if sold) */}
              {product.lat &&
                product.lng &&
                !mapModalProduct &&
                !showEditModal && (
                  <div
                    className={`w-full h-36 mb-2 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative ${
                      product.status === "sold"
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }`}
                    onClick={() =>
                      product.status !== "sold"
                        ? setMapModalProduct(product)
                        : null
                    }
                  >
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-gray-600 bg-white/70 px-2 py-1 rounded">
                      <MapPin className="w-4 h-4" /> Preview
                    </div>
                    <LeafletMapWithDraw
                      center={[product.lat, product.lng]}
                      radius={product.radius || 300}
                      previewOnly={true}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                )}

              {/* Info */}
              <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {product.categories?.cat_name || "Uncategorized"}
              </p>
              <p className="text-gray-700 mb-2 line-clamp-2">
                {product.description}
              </p>

              {/* Price & Actions */}
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="text-blue-600 font-bold">
                    ₱{Number(product.price).toFixed(2)}
                  </span>
                  {product.original_price && (
                    <span className="text-gray-400 line-through ml-2">
                      ₱{Number(product.original_price).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => confirmDelete(product)}
                    className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Sold Button */}
                  {product.status !== "sold" && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from("products")
                          .update({ status: "sold" })
                          .eq("product_id", product.product_id);

                        if (error) {
                          alert("❌ Failed to mark as sold: " + error.message);
                        } else {
                          setProducts((prev) =>
                            prev.map((p) =>
                              p.product_id === product.product_id
                                ? { ...p, status: "sold" }
                                : p
                            )
                          );
                          setSuccessMsg("✅ Product marked as sold!");
                        }
                      }}
                      className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                    >
                      Sold
                    </button>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-500 mt-3">
                Condition: {product.condition || "N/A"} <br />
                {product.lat && product.lng
                  ? `Location: ${product.lat.toFixed(5)}, ${product.lng.toFixed(5)}`
                  : "Location: N/A"}
                <br />
                <span className="text-xs text-gray-400">
                  Posted on{" "}
                  {new Date(product.created_at).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
