// /lib/productFetcher.js
import { supabase } from "@/lib/supabaseClient";

/* -----------------------------------------------------
   🔹 Helper: Convert datetime into “time ago” format
----------------------------------------------------- */
export function timeAgo(datetime) {
  if (!datetime) return "Unknown";

  const itemTime = new Date(datetime);
  const now = new Date();
  const diff = (now - itemTime) / 1000;

  if (diff < 60) return diff <= 1 ? "Just now" : `${Math.floor(diff)} seconds ago`;
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return mins === 1 ? "A minute ago" : `${mins} minutes ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return hours === 1 ? "An hour ago" : `${hours} hours ago`;
  }
  if (diff < 172800) return "Yesterday";
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

/* -----------------------------------------------------
   🔹 Helper: Format product data into a unified structure
----------------------------------------------------- */
function formatProduct(p) {
  const avgRating =
    p.reviews?.length > 0
      ? (p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length).toFixed(1)
      : "N/A";

  return {
    id: p.product_id,
    title: p.title,
    description: p.description || "",
    price: p.price,
    original_price: p.original_price || null,
    condition: p.condition || "Unknown",
    location: p.location || "Not specified",
    status: p.status || "Unknown",
    category: p.categories?.cat_name || "Uncategorized",
    image: p.product_images?.[0]?.img_path || null,
    images: p.product_images || [],        // ✅ Add this line
    rating: avgRating,
    seller: p.seller?.auth_id
      ? `Seller #${p.seller.id.toString().slice(-4)}`
      : "Unknown Seller",
    created_at: p.created_at,
  };
}

/* -----------------------------------------------------
   🔹 Fetch all products
----------------------------------------------------- */
export async function fetchAllProducts(limit = 20) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        product_id,
        title,
        description,
        price,
        original_price,
        condition,
        location,
        status,
        created_at,
        categories:cat_id (cat_name),
        seller:seller_id (
          id,
          auth_id
        ),
        product_images (img_path),
        reviews (rating)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(formatProduct);
  } catch (err) {
    console.error("❌ fetchAllProducts error:", err.message || err);
    return [];
  }
}

/* -----------------------------------------------------
   🔹 Fetch a single product by ID
----------------------------------------------------- */
export async function fetchProductById(id) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        product_id,
        title,
        description,
        price,
        original_price,
        condition,
        location,
        status,
        created_at,
        categories:cat_id (cat_name),
        seller:seller_id (
          id,
          auth_id
        ),
        product_images (img_path),
        reviews (rating, comment)
      `
      )
      .eq("product_id", id)
      .single();

    if (error) throw error;

    return formatProduct(data);
  } catch (err) {
    console.error("❌ fetchProductById error:", err.message || err);
    return null;
  }
}

/* -----------------------------------------------------
   🔹 Fetch similar products by category
----------------------------------------------------- */
export async function fetchSimilarProducts(catId, excludeId, limit = 4) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        product_id,
        title,
        price,
        created_at,
        categories:cat_id (cat_name),
        product_images (img_path),
        reviews (rating)
      `
      )
      .eq("cat_id", catId)
      .neq("product_id", excludeId)
      .limit(limit);

    if (error) throw error;

    return (data || []).map(formatProduct);
  } catch (err) {
    console.error("❌ fetchSimilarProducts error:", err.message || err);
    return [];
  }
}