// pages/api/admin/get-all.js
import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    // fetch raw data
    const [{ data: profiles }, { data: sellers }, { data: products }, { data: cart }, { data: chats }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*"),
      supabaseAdmin.from("seller").select("*"),
      supabaseAdmin.from("products").select("*"),
      supabaseAdmin.from("cart").select("*"),
      supabaseAdmin.from("chats").select("*")
    ]);

    const users = profiles ?? [];
    const sellersList = sellers ?? [];
    const productsList = products ?? [];
    const cartList = cart ?? [];
    const chatsList = chats ?? [];

    // enrich sellers with names
    const enrichedSellers = sellersList.map(s => {
      const profile = users.find(u => u.auth_id === s.auth_id);
      return {
        ...s,
        fname: profile?.fname || "",
        lname: profile?.lname || ""
      };
    });

    // enrich products with seller_name
    const enrichedProducts = productsList.map(p => {
      const seller = enrichedSellers.find(s => s.id === p.seller_id);
      return {
        ...p,
        seller_name: seller ? `${seller.fname} ${seller.lname}`.trim() : "Unknown"
      };
    });

    // enrich cart with product_title and buyer_name
    const enrichedCart = cartList.map(c => {
      const product = enrichedProducts.find(p => p.product_id === c.product_id);
      const buyer = users.find(u => u.auth_id === c.buyer_id);
      return {
        ...c,
        product_title: product?.title || "Unknown",
        buyer_name: buyer ? `${buyer.fname} ${buyer.lname}`.trim() : "Unknown"
      };
    });

    // enrich chats with buyer_name, seller_name, product_title
    const enrichedChats = chatsList.map(c => {
      const buyer = users.find(u => u.auth_id === c.buyer_auth_id);
      const seller = users.find(u => u.auth_id === c.seller_auth_id);
      const product = enrichedProducts.find(p => p.product_id === c.product_id);
      return {
        ...c,
        buyer_name: buyer ? `${buyer.fname} ${buyer.lname}`.trim() : "Unknown",
        seller_name: seller ? `${seller.fname} ${seller.lname}`.trim() : "Unknown",
        product_title: product?.title || "Unknown"
      };
    });

    res.status(200).json({
      users,
      sellers: enrichedSellers,
      products: enrichedProducts,
      cart: enrichedCart,
      chats: enrichedChats
    });
  } catch (e) {
    console.log("get-all error", e);
    res.status(500).json({ error: true });
  }
}
