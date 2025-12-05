// /pages/api/log-activity.js
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const supabase = createPagesServerClient({ req, res });

    // Get logged-in user (may be null)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    const { product_id, action_type } = req.body;

    if (!product_id || !["view", "save"].includes(action_type)) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    // Insert into user_activity
    const { error } = await supabase.from("user_activity").insert([
      {
        user_id: userId, // null if guest
        product_id,
        action_type,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    return res.status(200).json({ success: true, userId });
  } catch (err) {
    console.error("Log activity error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
