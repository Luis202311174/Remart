"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Header from "@/components/Header";
import { MessageSquare, Eye, Trash2 } from "lucide-react";
import { fetchProductById } from "@/lib/productFetcher";

export default function CartPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchCart = async () => {
    if (!user) return router.push("/login");

    try {
      const { data: cartData } = await supabase
        .from("cart")
        .select("cart_id, product_id, buyer_id, quantity")
        .eq("buyer_id", user.id);

      if (!cartData || cartData.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      const detailedCart = await Promise.all(
        cartData.map(async (item) => {
          const product = await fetchProductById(item.product_id);
          return { ...item, product };
        })
      );

      const filtered = detailedCart.filter((i) => i.product);
      setCartItems(filtered);

      if (filtered.length > 0) setSelectedItem(filtered[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const handleRemove = async (cartId) => {
    try {
      await supabase.from("cart").delete().eq("cart_id", cartId).eq("buyer_id", user.id);
      fetchCart();
      setSelectedItem(null);
    } catch (err) {
      console.error("❌ Remove error:", err.message);
    }
  };

  return (
    <>
      <Header user={user} />

      {/* Full screen layout */}
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* LEFT PANEL: Cart List */}
        <div className="w-[38%] border-r border-gray-200 bg-white/50 backdrop-blur-md shadow-inner overflow-y-auto p-6 space-y-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">🛍️ Your Interested Items</h1>

          {loading ? (
            <div className="text-gray-500 p-4">Loading items...</div>
          ) : cartItems.length === 0 ? (
            <div className="text-gray-500 p-4 text-center">
              Your cart is empty. Browse products and add items you like!
            </div>
          ) : (
            cartItems.map(({ cart_id, quantity, product }) => {
              const isSold = product.status === "sold";
              const isSelected = selectedItem?.cart_id === cart_id;

              return (
                <div
                  key={cart_id}
                  onClick={() => setSelectedItem({ cart_id, quantity, product })}
                  className={`cursor-pointer flex gap-4 p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                    isSelected ? "border-emerald-400 bg-emerald-50/70" : "border-gray-200 bg-white"
                  }`}
                >
                  <img
                    src={product.image || "/uploads/default.png"}
                    className={`w-24 h-24 rounded-xl object-cover border ${isSold ? "opacity-60" : ""}`}
                  />
                  <div className="flex flex-col justify-between flex-1">
                    <p className="font-semibold text-gray-900 truncate">{product.title}</p>
                    <p className="text-sm text-gray-500">₱{(product.price * quantity).toFixed(2)}</p>
                    {isSold && <span className="text-xs text-red-600 font-semibold">SOLD</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT PANEL: Details */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto p-10">
          {!selectedItem ? (
            <div className="text-gray-500 text-lg flex-1 flex items-center justify-center">
              Select an item to view details
            </div>
          ) : (
            <div className="max-w-2xl mx-auto flex-1 flex flex-col">
              {/* Product Image */}
              <div className="w-full h-80 rounded-2xl overflow-hidden shadow-md border mb-6 flex-shrink-0">
                <img
                  src={selectedItem.product.image || "/uploads/default.png"}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedItem.product.title}</h2>
              <p className="text-gray-500 mb-1">Seller: {selectedItem.product.seller_label}</p>
              <p className="text-gray-500 mb-1">Condition: {selectedItem.product.condition}</p>
              <p className="text-gray-500 mb-1">Location: {selectedItem.product.location}</p>

              <p className="text-3xl text-emerald-600 font-extrabold mt-4">
                ₱{(selectedItem.product.price * selectedItem.quantity).toFixed(2)}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/view-product/${selectedItem.product.id}`)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                  <Eye size={20} /> View Item
                </button>

                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("openChat", {
                        detail: {
                          seller_auth_id:
                            selectedItem.product.seller?.auth_id ||
                            selectedItem.product.seller_auth_id ||
                            selectedItem.product.seller_id,
                          product_id: selectedItem.product.id,
                        },
                      })
                    )
                  }
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 transition"
                >
                  <MessageSquare size={20} /> Contact Seller
                </button>

                <button
                  onClick={() => handleRemove(selectedItem.cart_id)}
                  className="flex items-center justify-center gap-2 text-red-600 font-semibold hover:text-red-700 transition"
                >
                  <Trash2 size={20} /> Remove Item
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
