"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const fetchCart = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("cart_view") // cart + product + image + seller view
      .select("*")
      .eq("buyer_id", user.id);

    if (error) console.error(error);
    else {
      setCartItems(data);
      setTotal(data.reduce((sum, item) => sum + item.price * item.quantity, 0));
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (cartId) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("cart_id", cartId)
      .eq("buyer_id", user.id);

    if (error) console.error(error);
    else fetchCart();
  };

  const handleQuantityChange = async (cartId, quantity) => {
    if (quantity < 1) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { error } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("cart_id", cartId)
      .eq("buyer_id", user.id);

    if (error) console.error(error);
    else fetchCart();
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <>
      <Header />
      <div className="h-[90px]" /> {/* spacer for fixed header */}
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-2">
          🛒 My Cart
        </h1>

        <div className="bg-white shadow-md rounded-2xl p-6">
          {cartItems.length > 0 ? (
            <>
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div
                    key={item.cart_id}
                    className="flex flex-col md:flex-row items-center gap-6 py-5"
                  >
                    <img
                      src={item.img_path || "/uploads/default.png"}
                      alt={item.title}
                      className="w-32 h-32 object-cover rounded-xl shadow-sm border border-gray-200"
                    />

                    <div className="flex-1 space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">Condition: {item.condition}</p>
                      <p className="text-sm text-gray-500">Location: {item.location}</p>
                      <p className="text-sm text-gray-500">
                        Seller: {item.seller_fname} {item.seller_lname}
                      </p>
                      <p className="text-xl font-bold text-green-600 mt-2">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          onClick={() =>
                            handleQuantityChange(item.cart_id, item.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <span className="font-semibold">{item.quantity}</span>
                        <button
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          onClick={() =>
                            handleQuantityChange(item.cart_id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(item.cart_id)}
                      className="self-start text-red-500 hover:text-red-700 font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Total: ₱{total.toFixed(2)}
                </h2>
                <button
                  onClick={handleCheckout}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <h2 className="text-xl font-semibold mb-2">Your cart is empty.</h2>
              <p>Browse products and add something to your cart!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
