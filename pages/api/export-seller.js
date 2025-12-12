import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  try {
    const { format = "pdf" } = req.query;

    // ================= AUTH =================
    const token = req.headers.token;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user)
      return res.status(401).json({ error: "Invalid token" });

    const auth = authData.user;

    // ================= FETCH SELLER =================
    const { data: seller, error: sellerErr } = await supabaseAdmin
      .from("seller")
      .select("id")
      .eq("auth_id", auth.id)
      .single();

    if (sellerErr || !seller)
      return res.status(404).json({ error: "Seller not found" });

    const sellerId = seller.id;

    // Fetch profile info for header
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("fname, lname")
      .eq("auth_id", auth.id)
      .single();

    const sellerName = profile ? `${profile.fname} ${profile.lname}` : "Unknown Seller";
    const sellerEmail = auth.email || "Unknown Email";

    // ================= FETCH PRODUCTS =================
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("product_id, title, price, condition, status, created_at")
      .eq("seller_id", sellerId);

    const generatedAt = new Date();
    const totalProducts = products ? products.length : 0;

    // Count statuses (available, sold, etc.)
    const statusCounts = (products || []).reduce((acc, p) => {
      const key = (p.status || "Unknown").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const availableCount = statusCounts["available"] || 0;
    const soldCount = statusCounts["sold"] || 0;

    // ================= CSV =================
    if (format === "csv") {
      let csv = "";
      csv += `"Seller Name","${sellerName}"\n`;
      csv += `"Seller Email","${sellerEmail}"\n`;
      csv += `"Generated","${generatedAt.toLocaleString()}"\n`;
      csv += `"Total Products","${totalProducts}"\n\n`;

      csv += `"Products"\n`;
      const headers = ["title", "price", "condition", "status", "created_at"];
      csv += headers.join(",") + "\n";

      if (!products || products.length === 0) {
        csv += `"No products found"\n`;
      } else {
        for (const p of products) {
          csv += headers
            .map((h) => {
              if (h === "created_at") {
                return `"${new Date(p[h]).toLocaleDateString()}"`;
              }
              return `"${String(p[h] || "").replace(/"/g, '""')}"`;
            })
            .join(",") + "\n";
        }
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="seller_export.csv"`);
      return res.send(csv);
    }

    // ================= PDF =================
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    // ====== HEADER ======
    doc.setFontSize(18);
    doc.setTextColor(20);
    doc.text("ReMart: Seller Data Export", 14, 18);

    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`Name: ${sellerName}`, 14, 28);
    doc.text(`Email: ${sellerEmail}`, 14, 36);

    // Divider
    doc.setDrawColor(150);
    doc.setLineWidth(0.5);
    doc.line(14, 42, w - 14, 42);

    let currentY = 50;

    // ====== PRODUCTS TITLE ======
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("List of Products", 14, currentY);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      head: [["Title", "Price", "Condition", "Status", "Created"]],
      body: products && products.length > 0
        ? products.map((p) => [
            p.title,
            p.price,
            p.condition,
            p.status,
            new Date(p.created_at).toLocaleDateString(),
          ])
        : [["No products found", "", "", "", ""]],
      margin: { left: 14, right: 14 },
    });

    // Total products
    const productsLastY = doc.lastAutoTable?.finalY || currentY;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total Products: ${totalProducts}`, 14, productsLastY + 8);
    doc.text(`Available: ${availableCount}    Sold: ${soldCount}`, 14, productsLastY + 16);

    // Footer on all pages
    const addFooters = () => {
      const pageCount = doc.getNumberOfPages();
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

    const out = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="seller_export.pdf"`);
    return res.send(Buffer.from(out));

  } catch (err) {
    console.error("export-seller error:", err);
    res.status(500).json({ error: err.message });
  }
}
