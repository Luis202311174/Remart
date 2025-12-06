"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Header from "@/components/Header";
import { MessageSquare, Eye, Trash2, ShoppingCart } from "lucide-react";
import { fetchProductById } from "@/lib/productFetcher";

export default function CartPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

      setCartItems(detailedCart.filter((i) => i.product));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (cartId) => {
    try {
      await supabase.from("cart").delete().eq("cart_id", cartId).eq("buyer_id", user.id);
      fetchCart();
    } catch (err) {
      console.error("❌ Remove error:", err.message);
    }
  };

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  return (
    <>
      <Header />

      <div className="bg-gray-900 min-h-screen py-12 px-6">
        <h1 className="text-4xl font-bold text-white mb-10 text-center flex items-center justify-center gap-2">
          <ShoppingCart size={32} /> Your Cart
        </h1>

        {loading ? (
          <div className="text-gray-400 text-center">Loading items...</div>
        ) : cartItems.length === 0 ? (
          <div className="text-gray-400 text-center text-lg flex flex-col items-center gap-3 mt-16">
            <ShoppingCart size={48} className="text-gray-500" />
            <span>Your cart is empty. Add some products!</span>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartItems.map(({ cart_id, quantity, product }) => (
              <div
                key={cart_id}
                className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all"
              >
                {/* Remove Button — floating outside top-right */}
                <button
                  onClick={() => handleRemove(cart_id)}
                  className="absolute -top-3 -right-3 text-red-500 hover:text-red-600 transition p-2 rounded-full bg-gray-800 shadow-lg"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>

                {/* Top Row — Quantity */}
                <div className="flex justify-end mb-2">
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                    x{quantity}
                  </span>
                </div>

                {/* Product Image */}
                <div className="rounded-xl overflow-hidden bg-gray-800 h-44 mb-4">
                  <img
                    src={product.image || "/uploads/default.png"}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>

                {/* Product Details */}
                <h3 className="text-lg font-semibold text-white line-clamp-1 mb-1">{product.title}</h3>
                <p className="text-green-400 font-bold mb-1 text-sm">
                  ₱{(product.price * quantity).toFixed(2)}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">Seller: {product.seller_label}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Condition: {product.condition}</p>
                <p className="text-gray-400 text-xs sm:text-sm mb-3">Location: {product.location}</p>

                {/* Action Buttons — side by side */}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => router.push(`/view-product/${product.id}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-400 text-black rounded-lg shadow hover:bg-green-500 transition font-medium text-sm"
                  >
                    <Eye size={14} /> View Item
                  </button>

                  <button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("openChat", {
                          detail: {
                            seller_auth_id: product.seller?.auth_id || product.seller_auth_id || product.seller_id,
                            product_id: product.id,
                          },
                        })
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-700 transition font-medium text-sm"
                  >
                    <MessageSquare size={14} /> Contact Seller
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
