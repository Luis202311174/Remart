"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { List, PackageX, Edit, Trash2 } from "lucide-react";

export default function MyListings({ loadPage }) {
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  // ✅ 1. Load seller products
  useEffect(() => {
    const loadSellerProducts = async () => {
      setLoading(true);
      setError("");

      // ✅ Check authenticated user
      const { data: auth, error: authError } = await supabase.auth.getUser();
      const user = auth?.user;

      if (authError || !user) {
        setError("⚠️ Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      // ✅ 2. Find the seller by auth_id
      const { data: sellerData, error: sellerError } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (sellerError || !sellerData) {
        setError("⚠️ You are not registered as a seller.");
        setLoading(false);
        return;
      }

      setSeller(sellerData);

      // ✅ 3. Fetch seller’s products
      const { data: productsData, error: prodError } = await supabase
        .from("products")
        .select(
          `
          product_id,
          title,
          description,
          price,
          original_price,
          condition,
          location,
          created_at,
          categories (cat_name),
          product_images (img_path)
        `
        )
        .eq("seller_id", sellerData.id)
        .order("product_id", { ascending: false });

      if (prodError) {
        setError("❌ " + prodError.message);
      } else {
        setProducts(productsData || []);
      }

      setLoading(false);
    };

    loadSellerProducts();
  }, [supabase]);

  // ✅ 4. Delete product
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("product_id", id);
    if (error) alert("Error deleting product: " + error.message);
    else setProducts((prev) => prev.filter((p) => p.product_id !== id));
  };

  // ✅ UI States
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
    <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow p-6">
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
              className="border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition"
            >
              {/* Product Image */}
              <div className="relative mb-2">
                {product.product_images?.length ? (
                  <>
                    <img
                      src={product.product_images[0].img_path}
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="flex gap-1 mt-2 overflow-x-auto">
                      {product.product_images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.img_path}
                          className="w-16 h-16 object-cover rounded cursor-pointer border border-gray-300"
                          onClick={(e) => {
                            e.target
                              .closest("div")
                              .previousSibling.setAttribute("src", img.img_path);
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {product.categories?.cat_name || "Uncategorized"}
              </p>
              <p className="text-gray-700 mb-2 line-clamp-2">{product.description}</p>

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
                    onClick={() => alert("Open edit modal (coming soon)")}
                    className="p-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.product_id)}
                    className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-sm text-gray-500 mt-3">
                Condition: {product.condition || "N/A"} <br />
                Location: {product.location || "N/A"} <br />
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
