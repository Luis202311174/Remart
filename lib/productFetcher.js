// /lib/productFetcher.js
import { supabase } from "@/lib/supabaseClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/* -----------------------------------------------------
   🔹 Helper: Convert datetime into “time ago” format
----------------------------------------------------- */
export function timeAgo(datetime) {
  if (!datetime) return "Unknown";
  const diff = (new Date() - new Date(datetime)) / 1000;

  if (diff < 60) return diff <= 1 ? "Just now" : `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

/* -----------------------------------------------------
   🔹 Helper: Format a product into a clean structure
----------------------------------------------------- */
function formatProduct(p) {
  const avgRating =
    p.reviews?.length > 0
      ? (p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length).toFixed(1)
      : "N/A";

  const sellerName =
    p.seller?.profile
      ? `${p.seller.profile.fname || ""} ${p.seller.profile.lname || ""}`.trim()
      : null;

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
    seller_label:
      sellerName || p.seller?.name || `Seller #${p.seller?.id?.toString().slice(-4)}`,
    seller_auth_id: p.seller?.auth_id || null,
    seller_id: p.seller?.id || null,
    created_at: p.created_at,
  };
}

/* -----------------------------------------------------
   🔹 Helper: Fetch and merge seller profiles
----------------------------------------------------- */
async function mergeProfiles(products, supabaseClient) {
  const authIds = [
    ...new Set(products.map((p) => p.seller?.auth_id).filter(Boolean)),
  ];

  if (authIds.length === 0) return products;

  const { data: profileData, error: profileError } = await supabaseClient
    .from("profiles")
    .select("auth_id, fname, lname")
    .in("auth_id", authIds);

  if (profileError) {
    console.warn("⚠️ Profile fetch error:", profileError.message);
    return products;
  }

  return products.map((p) => {
    const profile = profileData.find((pr) => pr.auth_id === p.seller?.auth_id);
    return formatProduct({
      ...p,
      seller: {
        ...p.seller,
        profile: profile || null,
      },
    });
  });
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

    // Get logged-in seller numeric ID (if any)
    let sellerNumericId = null;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const authId = session?.user?.id;
      if (authId) {
        const { data: sellerData } = await supabaseClient
          .from("seller")
          .select("id")
          .eq("auth_id", authId)
          .maybeSingle();
        sellerNumericId = sellerData?.id || null;
      }
    } catch (e) {
      console.warn("⚠️ Failed to check current seller:", e.message);
    }

    // Fetch all available products
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

    return await mergeProfiles(data || [], supabaseClient);
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
    const supabaseClient =
      typeof window === "undefined"
        ? createSupabaseServerClient(context)
        : supabase;

    const { data: product, error } = await supabaseClient
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

    if (error || !product) throw error || new Error("Product not found");

    // Fetch seller profile
    let sellerProfile = null;
    if (product.seller?.auth_id) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("fname, lname")
        .eq("auth_id", product.seller.auth_id)
        .maybeSingle();
      sellerProfile = profile || null;
    }

    return formatProduct({
      ...product,
      seller: { ...product.seller, profile: sellerProfile },
    });
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

    const supabaseClient =
      typeof window === "undefined"
        ? createSupabaseServerClient(context)
        : supabase;

    const { data, error } = await supabaseClient
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
      .eq("cat_id", catId)
      .neq("product_id", excludeId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // 🧩 Merge profiles (ensures consistent structure like main list)
    const merged = await mergeProfiles(data || [], supabaseClient);
    return merged;
  } catch (err) {
    console.error("❌ fetchSimilarProducts error:", err.message || err);
    return [];
  }
}

/* -----------------------------------------------------
   🔹 Fetch products with filters (for SSR and search)
   Works with /pages/search.jsx
----------------------------------------------------- */
export async function fetchFilteredProducts({
  supabase,
  category = "all",
  condition = "all",
  minPrice = "",
  maxPrice = "",
  sort = "newest",
  limit = 50,
  search = "",
  context = null, // optional for SSR
}) {
  try {
    // ✅ Step 1: Detect logged-in seller (to exclude their products)
    let sellerNumericId = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authId = session?.user?.id;
      if (authId) {
        const { data: sellerData } = await supabase
          .from("seller")
          .select("id")
          .eq("auth_id", authId)
          .maybeSingle();
        sellerNumericId = sellerData?.id || null;
      }
    } catch (e) {
      console.warn("⚠️ Failed to check current seller:", e.message);
    }

    // ✅ Step 2: Build query
    let query = supabase
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
      .limit(limit);

    // ✅ Step 3: Exclude own seller_id
    if (sellerNumericId) query = query.neq("seller_id", sellerNumericId);

    // ✅ Step 4: Apply search
    if (search) {
      // Search by title OR category name
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // ✅ Step 5: Apply filters dynamically
    if (category !== "all") query = query.eq("cat_id", category);
    if (condition !== "all") query = query.eq("condition", condition);
    if (minPrice) query = query.gte("price", Number(minPrice));
    if (maxPrice) query = query.lte("price", Number(maxPrice));

    // ✅ Step 6: Sorting
    switch (sort) {
      case "price_low":
        query = query.order("price", { ascending: true });
        break;
      case "price_high":
        query = query.order("price", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    // ✅ Step 7: Fetch and merge seller profiles
    const { data, error } = await query;
    if (error) throw error;

    const merged = await mergeProfiles(data || [], supabase);
    return { data: merged, error: null };
  } catch (error) {
    console.error("❌ fetchFilteredProducts error:", error.message || error);
    return { data: [], error };
  }
}

