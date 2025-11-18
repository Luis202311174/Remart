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

  const fetchCart = async () => {
    if (!user) return router.push("/login");

    try {
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

      const detailedCart = await Promise.all(
        cartData.map(async (cartItem) => {
          const product = await fetchProductById(cartItem.product_id);
          return { ...cartItem, product };
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

  return (
    <>
      <Header user={user} />
      <div className="h-16 md:h-20" /> {/* Spacer for header */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-10 flex items-center gap-3">
          🛍️ Your Interested Items
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-400 text-lg sm:text-xl">
            Loading your cart items...
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 text-center text-gray-500">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-400 sm:text-lg">
              Browse products and add something you like!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cartItems.map(({ cart_id, quantity, product }) => {
              const isSold = product.status === "sold";

              return (
                <div
                  key={cart_id}
                  className={`relative flex flex-col bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 gap-4 border border-gray-100`}
                >
                  {/* SOLD Badge */}
                  {isSold && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
                      SOLD
                    </span>
                  )}

                  {/* Product Image */}
                  <div className={`w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-gray-200 ${isSold ? "opacity-60" : ""}`}>
                    <img
                      src={product.image || "/uploads/default.png"}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className={`flex-1 flex flex-col justify-between gap-2 ${isSold ? "opacity-60" : ""}`}>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-500">Seller: {product.seller_label}</p>
                      <p className="text-sm text-gray-500">Condition: {product.condition}</p>
                      <p className="text-sm text-gray-500">Location: {product.location}</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 mt-2">
                      ₱{(product.price * quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 mt-3">
                    {/* View Item */}
                    <button
                      onClick={() => router.push(`/view-product/${product.id}`)}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg shadow text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isSold ? "pointer-events-none bg-gray-400 hover:bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      <Eye size={18} /> View Item
                    </button>

                    {/* Contact Seller */}
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
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                        isSold
                          ? "pointer-events-none bg-gray-200 text-gray-500 hover:bg-gray-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      <MessageSquare size={18} /> Contact Seller
                    </button>

                   {/* Remove button: neon red text */}
{/* Remove button: bright red text */}
<button
  onClick={() => handleRemove(cart_id)}
  className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-400"
>
  <Trash2 size={18} /> Remove
</button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
