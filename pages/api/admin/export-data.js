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
      supabaseAdmin.from("seller").select("id, auth_id, created_at"),
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
    // CSV EXPORT (omit any ID columns)
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
        section("Users", users, ["fname", "lname", "created_at"]);

      if (dataset === "all" || dataset === "sellers")
        section("Sellers", enrichedSellers, ["fname", "lname", "created_at"]);

      if (dataset === "all" || dataset === "products")
        section("Products", enrichedProducts, ["title", "price", "original_price", "condition", "status", "created_at", "location", "seller_name"]);

      if (dataset === "all" || dataset === "cart")
        section("Cart", enrichedCart, ["product_title", "quantity", "buyer_name", "added_at"]);

      if (dataset === "all" || dataset === "chats")
        section("Chats", enrichedChats, ["product_title", "buyer_name", "seller_name", "created_at"]);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="remart_export_${dataset}.csv"`);
      return res.send(csv);
    }

    // ===========================================================
    // PDF EXPORT (optimized header/footer/layout, omit ID columns)
    // ===========================================================
    const doc = new jsPDF();

    const generatedAt = new Date();

    // compute summary totals and status breakdowns
    const totals = {
      users: users.length,
      sellers: enrichedSellers.length,
      products: enrichedProducts.length,
      chats: enrichedChats.length,
      savedProducts: enrichedCart.length
    };

    const productStatusCounts = enrichedProducts.reduce((acc, p) => {
      const key = p.status || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Helper: draw the standardized header and section title
    function addHeader(sectionTitle) {
      const w = doc.internal.pageSize.getWidth();
      doc.setFontSize(18);
      doc.setTextColor(20);
      doc.text("Remart Administrative Report", w / 2.18, 18, { align: "right" });
      doc.setDrawColor(150);
      doc.setLineWidth(0.5);
      doc.line(14, 26, w - 14, 26);
      if (sectionTitle) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(sectionTitle, 14, 34);
      }
    }

    let firstSection = true;

    function addFrontPage() {
      if (!firstSection) doc.addPage();
      firstSection = false;
      const w = doc.internal.pageSize.getWidth();
      doc.setFontSize(22);
      doc.setTextColor(20);
      doc.text("Remart Administrative Report", w / 2, 30, { align: "center" });
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.setDrawColor(150);
      doc.setLineWidth(0.5);
      doc.line(14, 43, w - 14, 43);

      // Data Metrics title
      doc.setFontSize(16);
      doc.setTextColor(20);
      doc.text("Data Metrics", 14, 55);

      // Summary totals table
      const summaryData = [
        ["Total Users", totals.users],
        ["Total Sellers", totals.sellers],
        ["Total Products", totals.products],
        ["Total Chats", totals.chats]
      ];

      autoTable(doc, {
        startY: 58,
        head: [["Metric", "Count"]],
        body: summaryData,
        theme: "grid",
        margin: { left: 14, right: 14 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
        bodyStyles: { textColor: 0 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Product status breakdown table
      const statuses = Object.entries(productStatusCounts);
      if (statuses.length) {
        const statusData = statuses.map(([status, count]) => [status, count]);
        const lastY = doc.lastAutoTable.finalY || 120;

        autoTable(doc, {
          startY: lastY + 15,
          head: [["Product Status", "Count"]],
          body: statusData,
          theme: "grid",
          margin: { left: 14, right: 14 },
          headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: "bold" },
          bodyStyles: { textColor: 0 },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      }
    }

    const newPage = (sectionTitle) => {
      if (!firstSection) doc.addPage();
      firstSection = false;
      addHeader(sectionTitle);
    };

    // Table options use a unified startY so content sits below header
    const tableOptions = {
      startY: 40,
      margin: { top: 40 }
    };

    // Add front page
    addFrontPage();

    // ========= USERS (moved to its own page after front page) =========
    if (dataset === "all" || dataset === "users") {
      newPage("List of Users");

      autoTable(doc, {
        ...tableOptions,
        head: [["First Name", "Last Name", "Created"]],
        body: users.map(u => [
          u.fname || "",
          u.lname || "",
          u.created_at ? new Date(u.created_at).toLocaleDateString() : ""
        ])
      });

      const usersLastY = doc.lastAutoTable?.finalY || tableOptions.startY;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Users: ${totals.users}`, 14, usersLastY + 8);
    }

    // ========= SELLERS =========
    if (dataset === "all" || dataset === "sellers") {
      newPage("List of Sellers");

      autoTable(doc, {
        ...tableOptions,
        head: [["Name", "Created"]],
        body: enrichedSellers.map(s => [
          `${s.fname} ${s.lname}`.trim(),
          s.created_at ? new Date(s.created_at).toLocaleDateString() : ""
        ])
      });

      const sellersLastY = doc.lastAutoTable?.finalY || tableOptions.startY;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Sellers: ${totals.sellers}`, 14, sellersLastY + 8);
    }

    // ========= PRODUCTS =========
    if (dataset === "all" || dataset === "products") {
      newPage("List of all Products");

      autoTable(doc, {
        ...tableOptions,
        head: [["Title", "Price", "Condition", "Status", "Seller", "Created"]],
        body: enrichedProducts.map(p => [
          p.title,
          p.price,
          p.condition,
          p.status,
          p.seller_name,
          p.created_at ? new Date(p.created_at).toLocaleDateString() : ""
        ])
      });

      const productsLastY = doc.lastAutoTable?.finalY || tableOptions.startY;
      const availableCount = Object.entries(productStatusCounts).reduce((acc, [k, v]) => acc + ((k || '').toLowerCase() === 'available' ? v : 0), 0);
      const soldCount = Object.entries(productStatusCounts).reduce((acc, [k, v]) => acc + ((k || '').toLowerCase() === 'sold' ? v : 0), 0);
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Products: ${totals.products}`, 14, productsLastY + 8);
      doc.text(`Available: ${availableCount}    Sold: ${soldCount}`, 14, productsLastY + 16);
    }

    // ========= CART =========
    if (dataset === "all" || dataset === "cart") {
      newPage("List of all Saved Products (Cart)");

      autoTable(doc, {
        ...tableOptions,
        head: [["Product", "Qty", "Buyer", "Added"]],
        body: enrichedCart.map(c => [
          c.product_title,
          c.quantity,
          c.buyer_name,
          c.added_at ? new Date(c.added_at).toLocaleDateString() : ""
        ])
      });

      const cartLastY = doc.lastAutoTable?.finalY || tableOptions.startY;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Saved Products: ${totals.savedProducts}`, 14, cartLastY + 8);
    }

    // ========= CHATS =========
    if (dataset === "all" || dataset === "chats") {
      newPage("List of Chats");

      autoTable(doc, {
        ...tableOptions,
        head: [["Product", "Buyer", "Seller", "Created"]],
        body: enrichedChats.map(c => [
          c.product_title,
          c.buyer_name,
          c.seller_name,
          c.created_at ? new Date(c.created_at).toLocaleDateString() : ""
        ])
      });

      const chatsLastY = doc.lastAutoTable?.finalY || tableOptions.startY;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Chats: ${totals.chats}`, 14, chatsLastY + 8);
    }

    // Add consistent footer (Generated: date,time left  Page X of Y right) on every page
    const addFooters = () => {
      const pageCount = doc.getNumberOfPages();
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const genText = `Generated: ${generatedAt.toLocaleDateString()}, ${generatedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}`;

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100);
        const footerY = h - 12;
        doc.setDrawColor(150);
        doc.setLineWidth(0.5);
        doc.line(14, footerY - 6, w - 14, footerY - 6);
        doc.text(genText, 14, footerY);
        doc.text(`Page ${i} of ${pageCount}`, w - 14, footerY, { align: "right" });
      }
    };

    addFooters();

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
