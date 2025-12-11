import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Server-only Supabase admin instance
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  try {
    const { format = "csv", dataset = "all" } = req.query;

    // Fetch data
    const [
      { data: usersRaw },
      { data: sellersRaw },
      { data: productsRaw },
      { data: cartRaw },
      { data: chatsRaw }
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("auth_id, fname, lname, pfp, created_at"),
      supabaseAdmin.from("seller").select("id, auth_id"),
      supabaseAdmin.from("products").select("product_id, title, price, original_price, condition, status, created_at, location, seller_id"),
      supabaseAdmin.from("cart").select("cart_id, product_id, quantity, added_at, buyer_id"),
      supabaseAdmin.from("chats").select("chat_id, product_id, buyer_auth_id, seller_auth_id, created_at")
    ]);

    const users = usersRaw || [];
    const sellers = sellersRaw || [];
    const products = productsRaw || [];
    const cart = cartRaw || [];
    const chats = chatsRaw || [];

    // Enrich sellers with profile names
    const enrichedSellers = (sellers || []).map(s => {
      let profile = null;
      if (s.auth_id) {
        profile = users.find(u => u.auth_id === s.auth_id);
      }
      return {
        ...s,
        fname: profile?.fname || '',
        lname: profile?.lname || '',
      };
    });

    // Enrich products with profile directly
    const enrichedProducts = products.map(p => {
      const sellerEntry = sellers.find(s => s.id === p.seller_id);
      const profile = users.find(u => u.auth_id === sellerEntry?.auth_id);
      return {
        ...p,
        seller_name: profile ? `${profile.fname} ${profile.lname}`.trim() : 'Unknown'
      };
    });

    // Enrich cart using enrichedProducts and users
    const enrichedCart = cart.map(c => {
      const product = enrichedProducts.find(p => p.product_id === c.product_id);
      const buyer = users.find(u => u.auth_id === c.buyer_id);
      return {
        ...c,
        product_title: product?.title || "Unknown",
        buyer_name: buyer ? `${buyer.fname} ${buyer.lname}`.trim() : "Unknown"
      };
    });

    // Enrich chats with names + product title
    const enrichedChats = chats.map(c => {
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

    // ===========================================================
    // CSV EXPORT
    // ===========================================================
    if (format === "csv") {
      let csv = "";

      function section(title, rows, headers) {
        csv += `"${title}"\n`;
        csv += headers.join(",") + "\n";
        rows.forEach(r => {
          csv += headers.map(h => `"${String(r[h] || "").replace(/"/g, '""')}"`).join(",") + "\n";
        });
        csv += "\n\n";
      }

      if (dataset === "all" || dataset === "users")
        section("Users", users, ["auth_id", "fname", "lname", "created_at"]);

      if (dataset === "all" || dataset === "sellers")
        section("Sellers", enrichedSellers, ["id", "fname", "lname", "auth_id", "created_at"]);

      if (dataset === "all" || dataset === "products")
        section("Products", enrichedProducts, ["product_id", "title", "price", "original_price", "condition", "status", "created_at", "location", "seller_name"]);

      if (dataset === "all" || dataset === "cart")
        section("Cart", enrichedCart, ["cart_id", "product_title", "quantity", "buyer_name", "added_at"]);

      if (dataset === "all" || dataset === "chats")
        section("Chats", enrichedChats, ["chat_id", "product_title", "buyer_name", "seller_name", "created_at"]);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="remart_export_${dataset}.csv"`);
      return res.send(csv);
    }

    // ===========================================================
    // PDF EXPORT
    // ===========================================================
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Remart Administrative Export", 14, 18);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.line(14, 30, 200, 30);

    // Page number footer
    const addPageNumber = () => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(`Page ${pageCount}`, 185, 290);
    };
    addPageNumber();

    let firstSection = true;
    const newPage = () => {
      if (!firstSection) doc.addPage();
      firstSection = false;
    };

    const tableOptions = {
      startY: 43,
      margin: { top: 43 }
    };

    // ========= USERS =========
    if (dataset === "all" || dataset === "users") {
      newPage();
      doc.setFontSize(14);
      doc.text("Users", 14, 39);

      autoTable(doc, {
        ...tableOptions,
        head: [["Auth ID", "First Name", "Last Name", "Created"]],
        body: users.map(u => [
          u.auth_id,
          u.fname || "",
          u.lname || "",
          new Date(u.created_at).toLocaleDateString()
        ])
      });

      addPageNumber();
    }

    // ========= SELLERS =========
    if (dataset === "all" || dataset === "sellers") {
      newPage();
      doc.setFontSize(14);
      doc.text("Sellers", 14, 39);

      autoTable(doc, {
        ...tableOptions,
        head: [["ID", "Name", "Auth ID"]],
        body: enrichedSellers.map(s => [
          s.id,
          `${s.fname} ${s.lname}`.trim(),
          s.auth_id,
          new Date(s.created_at).toLocaleDateString()
        ])
      });

      addPageNumber();
    }

    // ========= PRODUCTS =========
    if (dataset === "all" || dataset === "products") {
      newPage();
      doc.setFontSize(14);
      doc.text("Products", 14, 39);

      autoTable(doc, {
        ...tableOptions,
        head: [["ID", "Title", "Price", "Condition", "Status", "Seller", "Created"]],
        body: enrichedProducts.map(p => [
          p.product_id,
          p.title,
          p.price,
          p.condition,
          p.status,
          p.seller_name,
          new Date(p.created_at).toLocaleDateString()
        ])
      });

      addPageNumber();
    }

    // ========= CART =========
    if (dataset === "all" || dataset === "cart") {
      newPage();
      doc.setFontSize(14);
      doc.text("Saved Products (Cart)", 14, 39);

      autoTable(doc, {
        ...tableOptions,
        head: [["Cart ID", "Product", "Qty", "Buyer", "Added"]],
        body: enrichedCart.map(c => [
          c.cart_id,
          c.product_title,
          c.quantity,
          c.buyer_name,
          new Date(c.added_at).toLocaleDateString()
        ])
      });

      addPageNumber();
    }

    // ========= CHATS =========
    if (dataset === "all" || dataset === "chats") {
      newPage();
      doc.setFontSize(14);
      doc.text("Chats", 14, 39);

      autoTable(doc, {
        ...tableOptions,
        head: [["Chat ID", "Product", "Buyer", "Seller", "Created"]],
        body: enrichedChats.map(c => [
          c.chat_id,
          c.product_title,   // show product title instead of ID
          c.buyer_name,      // enriched name
          c.seller_name,     // enriched name
          new Date(c.created_at).toLocaleDateString()
        ])
      });

      addPageNumber();
    }

    // ============================
    // GRAPH PAGE REMOVED
    // ============================

    // Send PDF
    const pdfBytes = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="remart_export_${dataset}.pdf"`);
    return res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error("export-data error:", err);
    return res.status(500).json({ error: err.message });
  }
}
