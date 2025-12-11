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
    const sellerAuthId = auth.id;
    const sellerEmail = auth.email || "Unknown Email";

    // ================= FETCH PRODUCTS =================
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("product_id, title, price, condition, status, created_at")
      .eq("seller_id", sellerId);

    // ================= CSV =================
    if (format === "csv") {
      let csv = "";
      csv += `"Seller Name","${sellerName}"\n`;
      csv += `"Seller Auth ID","${sellerAuthId}"\n`;
      csv += `"Seller Email","${sellerEmail}"\n`;
      csv += `"Generated","${new Date().toLocaleString()}"\n\n`;

      csv += `"Products"\n`;
      const headers = ["product_id", "title", "price", "condition", "status", "created_at"];
      csv += headers.join(",") + "\n";

      if (!products || products.length === 0) {
        csv += `"There are no products data"\n`;
      } else {
        for (const p of products) {
          csv += headers
            .map((h) => `"${String(p[h] || "").replace(/"/g, '""')}"`)
            .join(",") + "\n";
        }
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="seller_export.csv"`);
      return res.send(csv);
    }

    // ================= PDF =================
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("ReMart: Seller Data Export", 14, 16);

    doc.setFontSize(11);
    let currentY = 26;
    doc.text(`Seller Name: ${sellerName}`, 14, currentY); currentY += 6;
    doc.text(`Seller Auth ID: ${sellerAuthId}`, 14, currentY); currentY += 6;
    doc.text(`Seller Email: ${sellerEmail}`, 14, currentY); currentY += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, currentY); currentY += 6;

    // divider
    doc.line(14, currentY, 198, currentY); 
    currentY += 9;

    const addPageNum = () => {
      const page = doc.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(`Page ${page}`, 185, 290);
    };
    addPageNum();

    // ================= PRODUCTS TABLE =================
    doc.setFontSize(14);
    doc.text("Products", 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY + 2,
      head: [["ID", "Title", "Price", "Condition", "Status", "Created"]],
      body:
        products && products.length > 0
          ? products.map((p) => [
              p.product_id,
              p.title,
              p.price,
              p.condition,
              p.status,
              new Date(p.created_at).toLocaleDateString(),
            ])
          : [["There are no products data", "", "", "", "", ""]],
    });

    addPageNum();

    const out = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="seller_export.pdf"`);
    return res.send(Buffer.from(out));

  } catch (err) {
    console.error("export-seller error:", err);
    res.status(500).json({ error: err.message });
  }
}
