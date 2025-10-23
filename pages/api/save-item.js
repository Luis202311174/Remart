// pages/api/save-item.js
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { product_id } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "You must be logged in." });
    }

    // Verify the user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ success: false, message: "Invalid session." });
    }

    const buyer_id = user.id;

    // Check if the item is already saved
    const { data: existingItem, error: fetchError } = await supabase
      .from("cart") // still using the cart table
      .select("*")
      .eq("buyer_id", buyer_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingItem) {
      return res.status(200).json({
        success: false,
        message: "You’ve already saved this item.",
      });
    }

    // Save item (no quantity needed — acts like a bookmark)
    const { error: insertError } = await supabase
      .from("cart")
      .insert([{ buyer_id, product_id, quantity: 1 }]);

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: "Item saved successfully!",
    });
  } catch (err) {
    console.error("Save item error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to save item.",
    });
  }
}
