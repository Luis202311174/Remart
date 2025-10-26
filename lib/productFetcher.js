// /lib/productFetcher.js
import { supabase } from "@/lib/supabaseClient"; // client-side
import { createSupabaseServerClient } from "@/lib/supabaseServer"; // server-side

/* -----------------------------------------------------
   🔹 Helper: Convert datetime into “time ago” format
----------------------------------------------------- */
export function timeAgo(datetime) {
  if (!datetime) return "Unknown";
  const diff = (new Date() - new Date(datetime)) / 1000;
  if (diff < 60) return diff <= 1 ? "Just now" : `${Math.floor(diff)} seconds ago`;
  if (diff < 3600) return Math.floor(diff / 60) === 1 ? "A minute ago" : `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return Math.floor(diff / 3600) === 1 ? "An hour ago" : `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return "Yesterday";
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

/* -----------------------------------------------------
   🔹 Format product data into unified structure
----------------------------------------------------- */
function formatProduct(p) {
  const avgRating =
    p.reviews?.length > 0
      ? (p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length).toFixed(1)
      : "N/A";

  return {
    id: p.product_id,
    cat_id: p.cat_id,
    title: p.title,
    description: p.description || "",
    price: p.price,
    original_price: p.original_price || null,
    condition: p.condition || "Unknown",
    location: p.location || "Not specified",
    status: p.status || "Unknown",
    category: p.categories?.cat_name || "Uncategorized",
    image: p.product_images?.[0]?.img_path || null,
    images: p.product_images || [],
    rating: avgRating,
    seller_label: p.seller?.name || `Seller #${p.seller?.id?.toString().slice(-4)}`,
    seller_auth_id: p.seller?.auth_id || null,
    seller_id: p.seller?.id || null,
    created_at: p.created_at,
  };
}

/* -----------------------------------------------------
   🔹 Fetch all products (excluding logged-in seller)
----------------------------------------------------- */
export async function fetchAllProducts(limit = 20, context = null) {
  try {
    const isServer = typeof window === "undefined";
    const supabaseClient = isServer
      ? createSupabaseServerClient(context)
      : supabase;

    let authId = null;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      authId = session?.user?.id || null;
    } catch (err) {
      console.warn("⚠️ Unable to get session:", err.message);
    }

    let sellerNumericId = null;
    if (authId) {
      const { data: sellerData } = await supabaseClient
        .from("seller")
        .select("id")
        .eq("auth_id", authId)
        .maybeSingle();
      sellerNumericId = sellerData?.id || null;
    }

    let query = supabaseClient
      .from("products")
      .select(
        `
        product_id,
        seller_id,
        cat_id,
        title,
        description,
        price,
        original_price,
        condition,
        location,
        status,
        created_at,
        categories:cat_id (cat_name),
        seller:seller_id (id, auth_id),
        product_images (img_path),
        reviews (rating)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (sellerNumericId) query = query.neq("seller_id", sellerNumericId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(formatProduct);
  } catch (err) {
    console.error("❌ fetchAllProducts error:", err.message || err);
    return [];
  }
}

/* -----------------------------------------------------
   🔹 Fetch single product by ID
----------------------------------------------------- */
export async function fetchProductById(id, context = null) {
  try {
    const supabaseClient = typeof window === "undefined"
      ? createSupabaseServerClient(context)
      : supabase;

    const { data, error } = await supabaseClient
      .from("products")
      .select(
        `
        product_id,
        cat_id,
        title,
        description,
        price,
        original_price,
        condition,
        location,
        status,
        created_at,
        categories:cat_id (cat_name),
        seller:seller_id (id, auth_id),
        product_images (img_path),
        reviews (rating, comment)
      `
      )
      .eq("product_id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? formatProduct(data) : null;
  } catch (err) {
    console.error("❌ fetchProductById error:", err.message || err);
    return null;
  }
}

/* -----------------------------------------------------
   🔹 Fetch similar products by category
----------------------------------------------------- */
export async function fetchSimilarProducts(catId, excludeId, limit = 4, context = null) {
  try {
    if (!catId || !excludeId) return [];

    const supabaseClient = typeof window === "undefined"
      ? createSupabaseServerClient(context)
      : supabase;

    const { data, error } = await supabaseClient
      .from("products")
      .select(
        `
        product_id,
        cat_id,
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
