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

  // Fetch cart items
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

  // Remove from cart
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
    <main className="min-h-screen bg-[#F2F5F3] text-[#3C3C3C]">
      <Header />

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-[#2F8F4E] mb-10 text-center flex items-center justify-center gap-2">
          <ShoppingCart size={32} /> Your Cart
        </h1>

        {loading ? (
          <div className="text-gray-400 text-center">Loading cart items...</div>
        ) : cartItems.length === 0 ? (
          <div className="text-gray-500 text-center mt-16 flex flex-col items-center gap-3">
            <ShoppingCart size={48} />
            <span className="text-lg font-medium">Your cart is empty. Start shopping now!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartItems.map(({ cart_id, quantity, product }) => (
              <div
                key={cart_id}
                className="bg-white border border-[#DDE2D8] rounded-2xl shadow-lg p-4 flex flex-col hover:shadow-2xl transition-all"
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(cart_id)}
                  className="absolute -top-3 -right-3 text-red-500 hover:text-red-600 transition p-2 rounded-full bg-white shadow-md"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>

                {/* Quantity */}
                <div className="flex justify-end mb-2">
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                    x{quantity}
                  </span>
                </div>

                {/* Product image */}
                <div className="rounded-xl overflow-hidden bg-gray-100 h-44 mb-4">
                  <img
                    src={product.image || "/uploads/default.png"}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Product details */}
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">{product.title}</h3>
                <p className="text-green-600 font-bold mb-1 text-sm">
                  ₱{(product.price * quantity).toFixed(2)}
                </p>
                <p className="text-gray-500 text-xs sm:text-sm">Seller: {product.seller_label}</p>
                <p className="text-gray-500 text-xs sm:text-sm">Condition: {product.condition}</p>
                <p className="text-gray-500 text-xs sm:text-sm mb-3">Location: {product.location}</p>

                {/* Action buttons */}
                <div className="mt-auto flex gap-3">
                  <button
                    onClick={() => router.push(`/view-product/${product.id}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium text-sm"
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
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
                  >
                    <MessageSquare size={14} /> Contact Seller
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
