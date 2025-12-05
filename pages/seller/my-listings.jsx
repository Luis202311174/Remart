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
const LeafletMapWithDraw = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

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

  /* -----------------------------
     LOAD SELLER + PRODUCTS
  --------------------------------*/
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

  /* -----------------------------
       AUTO-HIDE SUCCESS FLASH
  --------------------------------*/
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  /* -----------------------------
       DELETE LOGIC
  --------------------------------*/
  const confirmDelete = (product) => {
     setMapModalProduct(null);
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

const handleEdit = (product) => {
  setMapModalProduct(null); // 👈 auto-close map preview
  setSelectedProduct(product);
  setShowEditModal(true);
};

  /* -----------------------------
       LOADING SCREEN
  --------------------------------*/
  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500 text-lg">
        Loading products...
      </div>
    );

  /* -----------------------------
       ERROR SCREEN
  --------------------------------*/
  if (error)
    return (
      <div className="max-w-xl mx-auto p-6 mt-12 text-center bg-red-100 text-red-700 border border-red-300 rounded-xl shadow">
        {error}
      </div>
    );

  /* ===============================================================
      MODERN RESPONSIVE UI STARTS HERE
     ===============================================================*/
  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-10">

      {/* Floating success flash */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in-down">
          <div className="backdrop-blur-sm bg-green-600/90 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMsg}</span>
          </div>
        </div>
      )}

      {/* -------------------------
           MODALS
      --------------------------*/}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 animate-scale-in">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-xl font-semibold">Delete Product</h3>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {productToDelete?.title}
              </span>
              ?
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
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
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

      {/* Map modal */}
      {mapModalProduct && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden animate-slide-up">

            <button
              onClick={() => setMapModalProduct(null)}
              className="absolute top-4 right-4 bg-white/90 shadow-lg border rounded-full p-2 z-[300] hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

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

            <div className="absolute bottom-6 right-6 z-[300]">
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from("products")
                    .update({
                      lat: mapModalProduct.lat,
                      lng: mapModalProduct.lng,
                      radius: mapModalProduct.radius,
                    })
                    .eq("product_id", mapModalProduct.product_id);

                  if (error) alert("❌ Failed to save: " + error.message);
                  else {
                    setSuccessMsg("✅ Location updated!");
                    setMapModalProduct(null);
                  }
                }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------
           HEADER
      --------------------------*/}
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
        <List className="w-7 h-7" />
        My Product Listings
      </h2>

      {/* -------------------------
           NO PRODUCTS
      --------------------------*/}
      {products.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl py-12 text-center bg-gray-50">
          <PackageX className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">You have no products yet.</p>
          <button
            onClick={() => loadPage("add-product")}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Product
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col relative"
            >
              {/* SOLD BADGE */}
              {product.status === "sold" && (
                <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 text-xs font-bold rounded-full shadow">
                  SOLD
                </div>
              )}

              {/* IMAGE */}
              {product.product_images?.length ? (
                <img
                  src={product.product_images[0].img_path}
                  alt={product.title}
                  className={`w-full h-48 object-cover rounded-lg mb-3 ${
                    product.status === "sold" ? "opacity-60" : ""
                  }`}
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-3">
                  No Image
                </div>
              )}

              {/* MAP PREVIEW */}
              {product.lat && product.lng && (
                <div
                  onClick={() =>
                    product.status !== "sold" && setMapModalProduct(product)
                  }
                  className={`w-full h-32 rounded-lg overflow-hidden shadow-inner border border-gray-200 relative mb-3 ${
                    product.status === "sold"
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded-md text-sm flex items-center gap-1 z-10">
                    <MapPin className="w-4 h-4 text-gray-700" />
                    Preview
                  </div>

                  <LeafletMapWithDraw
                    center={[product.lat, product.lng]}
                    radius={product.radius || 300}
                    previewOnly={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              )}

              {/* TITLE + CATEGORY */}
              <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">
                {product.title}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                {product.categories?.cat_name || "Uncategorized"}
              </p>

              {/* DESCRIPTION */}
              <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                {product.description}
              </p>

              {/* PRICE + ACTIONS */}
              <div className="flex items-center justify-between mt-auto mb-3">
                <div>
                  <span className="text-blue-700 font-bold text-lg">
                    ₱{Number(product.price).toFixed(2)}
                  </span>
                  {product.original_price && (
                    <span className="ml-2 text-gray-400 line-through text-sm">
                      ₱{Number(product.original_price).toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    <Edit size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => confirmDelete(product)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Sold */}
                  {product.status !== "sold" && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from("products")
                          .update({ status: "sold" })
                          .eq("product_id", product.product_id);

                        if (error)
                          alert("❌ Failed to mark as sold: " + error.message);
                        else {
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
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                    >
                      Sold
                    </button>
                  )}
                </div>
              </div>

              {/* FOOTER METADATA */}
              <div className="text-xs text-gray-500">
                Condition: {product.condition || "N/A"} <br />
                {product.lat && product.lng
                  ? `Location: ${product.lat.toFixed(5)}, ${product.lng.toFixed(
                      5
                    )}`
                  : "Location: N/A"}
                <br />
                <span className="block mt-1 text-gray-400">
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