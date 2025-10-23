"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import { MessageSquare, Eye } from "lucide-react";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const router = useRouter();

  // 🔹 Fetch cart items
  const fetchCart = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("cart")
      .select(`
        cart_id,
        quantity,
        buyer_id,
        product_id,
        products:cart_product_id_fkey (
          title,
          price,
          condition,
          location,
          seller_id,
          product_images (img_path),
          seller: seller_id (id, auth_id)
        )
      `)
      .eq("buyer_id", user.id);

    if (error) {
      console.error("Cart fetch error:", error.message);
      return;
    }

    const formatted = data.map((item) => ({
      cart_id: item.cart_id,
      quantity: item.quantity,
      product_id: item.product_id,
      title: item.products?.title,
      price: item.products?.price,
      condition: item.products?.condition,
      location: item.products?.location,
      seller_id: item.products?.seller_id,
      img_path:
        item.products?.product_images?.[0]?.img_path || "/uploads/default.png",
    }));

    setCartItems(formatted);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 🔹 Remove item
  const handleRemove = async (cartId) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("cart_id", cartId)
      .eq("buyer_id", user.id);

    if (error) console.error("Remove error:", error.message);
    else fetchCart();
  };

  // 🔹 Contact Seller (for now just alert or redirect)
  const handleContactSeller = async (sellerId) => {
    // Fetch seller’s account info via auth_id or your acc table
    const { data, error } = await supabase
      .from("seller")
      .select("id, auth_id")
      .eq("id", sellerId)
      .single();

    if (error || !data) {
      alert("⚠️ Seller info not found.");
      return;
    }

    // You can redirect to a message/chat page or show modal
    alert(`📞 Contact this seller via their profile.`);
  };

  return (
    <>
      <Header />
      <div className="h-[50px]" /> {/* Spacer for header */}
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-2">
          🛍️ Interested Items
        </h1>

        <div className="bg-white shadow-md rounded-2xl p-6">
          {cartItems.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <div
                  key={item.cart_id}
                  className="flex flex-col md:flex-row items-center gap-6 py-5"
                >
                  {/* 🖼 Product Image */}
                  <img
                    src={item.img_path}
                    alt={item.title}
                    className="w-32 h-32 object-cover rounded-xl shadow-sm border border-gray-200"
                  />

                  {/* 📦 Product Info */}
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Condition: {item.condition}
                    </p>
                    <p className="text-sm text-gray-500">
                      Location: {item.location}
                    </p>
                    <p className="text-xl font-bold text-green-600 mt-2">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* 🧭 Actions */}
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => router.push(`/view-product/${item.product_id}`)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      <Eye size={18} /> View Item
                    </button>

                    <button
                      onClick={() => handleContactSeller(item.seller_id)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
                    >
                      <MessageSquare size={18} /> Contact Seller
                    </button>

                    <button
                      onClick={() => handleRemove(item.cart_id)}
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
