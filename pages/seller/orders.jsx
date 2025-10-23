"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PackageX, ShoppingBag } from "lucide-react";

export default function SellerOrdersPage() {
  const [seller, setSeller] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);

      // 1️⃣ Get logged in user
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        alert("⚠️ Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      // 2️⃣ Get seller linked to user
      const { data: sellerData, error: sellerErr } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (sellerErr || !sellerData) {
        alert("⚠️ You are not registered as a seller.");
        setLoading(false);
        return;
      }
      setSeller(sellerData);

      // 3️⃣ Fetch cart items joined with products (using correct FK name)
      const { data: orderData, error: orderErr } = await supabase
        .from("cart")
        .select(`
          cart_id,
          quantity,
          added_at,
          buyer_id,
          products:cart_product_id_fkey (
            product_id,
            title,
            description,
            price,
            original_price,
            condition,
            location,
            cat_id,
            seller_id,
            categories (
              cat_name
            ),
            product_images (
              img_path
            )
          )
        `)
        .order("added_at", { ascending: false });

      if (orderErr) {
        console.error("❌ Order fetch error:", orderErr);
        alert("❌ Failed to fetch orders.");
        setLoading(false);
        return;
      }

      // 4️⃣ Filter orders that belong to this seller
      const sellerOrders = orderData.filter(
        (o) => o.products?.seller_id === sellerData.id
      );

      setOrders(sellerOrders);
      setLoading(false);
    };

    loadOrders();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading orders...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6" /> Orders
      </h2>

      {orders.length === 0 ? (
        <div className="p-6 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
          <PackageX className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p>No orders found yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {orders.map((o) => {
            const p = o.products || {};
            const img = p.product_images?.[0]?.img_path || "/uploads/default.png";

            return (
              <div
                key={o.cart_id}
                className="border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition"
              >
                {/* Product Image */}
                <div className="relative mb-2">
                  <img
                    src={img}
                    className="w-full h-48 object-cover rounded-lg"
                    alt={p.title}
                  />
                </div>

                {/* Product Info */}
                <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {p.categories?.cat_name || "Uncategorized"}
                </p>
                <p className="text-gray-700 mb-2 line-clamp-2">{p.description}</p>

                {/* Price & Quantity */}
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-blue-600 font-bold">
                      ₱{Number(p.price).toFixed(2)}
                    </span>
                    {p.original_price && (
                      <span className="text-gray-400 line-through ml-2">
                        ₱{Number(p.original_price).toFixed(2)}
                      </span>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      Quantity: {o.quantity}
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="text-sm text-gray-500 mt-3">
                  Buyer ID: {o.buyer_id}
                  <br />
                  Condition: {p.condition || "N/A"}
                  <br />
                  Location: {p.location || "N/A"}
                  <br />
                  <span className="text-xs text-gray-400">
                    Added on{" "}
                    {new Date(o.added_at).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
