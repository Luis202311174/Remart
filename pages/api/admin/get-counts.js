import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    const [
      { count: users },
      { count: sellers },
      { count: products },
      { count: cart },
      { count: chats }
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact" }),
      supabaseAdmin.from("seller").select("*", { count: "exact" }),
      supabaseAdmin.from("products").select("*", { count: "exact" }),
      supabaseAdmin.from("cart").select("*", { count: "exact" }),
      supabaseAdmin.from("chats").select("*", { count: "exact" }),
    ]);

    res.status(200).json({ users, sellers, products, cart, chats });
  } catch (e) {
    console.error("get-counts error", e);
    res.status(500).json({ error: true });
  }
}