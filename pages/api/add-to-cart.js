// pages/api/add-to-cart.js
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { product_id, quantity = 1 } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "You must be logged in." });
    }

    // Verify session server-side
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ success: false, message: "Invalid session." });
    }

    const buyer_id = user.id;

    // Check if item exists in cart
    const { data: existingCart, error: fetchError } = await supabase
      .from("cart")
      .select("*")
      .eq("buyer_id", buyer_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingCart) {
      // Update quantity
      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: existingCart.quantity + quantity })
        .eq("cart_id", existingCart.cart_id);

      if (updateError) throw updateError;

      return res.status(200).json({ success: true, message: "Quantity updated in cart!" });
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from("cart")
        .insert([{ buyer_id, product_id, quantity }]);

      if (insertError) throw insertError;

      return res.status(200).json({ success: true, message: "Item added to cart!" });
    }
  } catch (err) {
    console.error("Add to cart error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to add item to cart." });
  }
}
