"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Header from "@/components/Header";
import { MessageSquare, Eye } from "lucide-react";
import { fetchProductById } from "@/lib/productFetcher";

export default function CartPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch user's cart and merge product details
  const fetchCart = async () => {
    if (!user) return router.push("/login");

    try {
      // Step 1: get all cart rows
      const { data: cartData, error: cartError } = await supabase
        .from("cart")
        .select("cart_id, product_id, buyer_id, quantity")
        .eq("buyer_id", user.id);

      if (cartError) throw cartError;

      if (!cartData || cartData.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Step 2: fetch product details using productFetcher
      const detailedCart = await Promise.all(
        cartData.map(async (cartItem) => {
          const product = await fetchProductById(cartItem.product_id);
          return {
            ...cartItem,
            product,
          };
        })
      );

      setCartItems(detailedCart.filter((i) => i.product));
    } catch (err) {
      console.error("❌ Error fetching cart:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  // 🔹 Remove from cart
  const handleRemove = async (cartId) => {
    try {
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("cart_id", cartId)
        .eq("buyer_id", user.id);

      if (error) throw error;
      fetchCart();
    } catch (err) {
      console.error("❌ Remove error:", err.message);
    }
  };

  // 🔹 Contact seller → redirect to chat page
  const handleContactSeller = (sellerAuthId, productId) => {
    if (!sellerAuthId || !productId) return;
    router.push(`/chat?seller=${sellerAuthId}&product=${productId}`);
  };

  return (
    <>
      <Header user={user} />
      <div className="h-[50px]" />

      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-2">
          🛍️ Interested Items
        </h1>

        <div className="bg-white shadow-md rounded-2xl p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-10">
              Loading your items...
            </div>
          ) : cartItems.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {cartItems.map(({ cart_id, quantity, product }) => (
                <div
                  key={cart_id}
                  className="flex flex-col md:flex-row items-center gap-6 py-5"
                >
                  {/* 🖼 Product Image */}
                  <img
                    src={product.image || "/uploads/default.png"}
                    alt={product.title}
                    className="w-32 h-32 object-cover rounded-xl shadow-sm border border-gray-200"
                  />

                  {/* 📦 Product Info */}
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Seller: {product.seller_label}
                    </p>
                    <p className="text-sm text-gray-500">
                      Condition: {product.condition}
                    </p>
                    <p className="text-sm text-gray-500">
                      Location: {product.location}
                    </p>
                    <p className="text-xl font-bold text-green-600 mt-2">
                      ₱{(product.price * quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* 🧭 Actions */}
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() =>
                        router.push(`/view-product/${product.id}`)
                      }
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      <Eye size={18} /> View Item
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
                      onClick={() => handleRemove(cart_id)}
                      className="text-red-500 hover:text-red-700 font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <h2 className="text-xl font-semibold mb-2">
                Your interested list is empty.
              </h2>
              <p>Browse products and add something you like!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
