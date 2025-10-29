import Header from "../components/Header";
import Filter from "../components/Filter";
import ItemGrid from "../components/ItemGrid";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { fetchFilteredProducts } from "@/lib/productFetcher"; // ✅ updated import

export async function getServerSideProps(context) {
  try {
    const supabase = createPagesServerClient(context);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user || null;

    // ✅ Extract filters from query params
    const {
      category = "all",
      condition = "all",
      min_price = "",
      max_price = "",
      sort = "newest",
    } = context.query;

    // ✅ Fetch products with filters (SSR-safe)
    const { data: items, error } = await fetchFilteredProducts({
      supabase,
      category,
      condition,
      minPrice: min_price,
      maxPrice: max_price,
      sort,
      limit: 50,
    });

    if (error) console.warn("⚠️ fetchFilteredProducts error:", error.message);

    return { props: { items: items || [], user } };
  } catch (error) {
    console.error("❌ Error in getServerSideProps:", error.message || error);
    return { props: { items: [], user: null } };
  }
}

export default function Home({ items = [], user }) {
  return (
    <main className="bg-white text-gray-900 font-sans min-h-screen">
      <Header user={user} />

      <div className="max-w-[1200px] mx-auto p-4">
        <h2 className="text-2xl mb-1 font-semibold">Browse Items</h2>
        <Filter itemCount={items.length} hasSearch={true} />

        {items.length > 0 ? (
          <ItemGrid items={items} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No items found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
