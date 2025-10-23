import Header from "../components/Header";
import Filter from "../components/Filter";
import ItemGrid from "../components/ItemGrid";
import { fetchAllProducts } from "@/lib/productFetcher"; 
import { supabase } from "@/lib/supabaseClient";

export async function getServerSideProps({ req }) {
  try {
    // Get the logged-in user from Supabase auth cookie
    const { data: { session } } = await supabase.auth.getSession(req);
    const userId = session?.user?.id || null;

    const items = await fetchAllProducts(50, userId); // Exclude seller's own products
    return { props: { items } };
  } catch (error) {
    console.error("❌ Error in getServerSideProps:", error.message || error);
    return { props: { items: [] } };
  }
}

export default function Home({ items = [] }) {
  return (
    <main className="bg-white text-gray-900 font-sans min-h-screen">
      <Header />

      <div className="max-w-[1200px] mx-auto p-4">
        <h2 className="text-2xl mb-1 font-semibold">Browse Items</h2>

        <Filter itemCount={items.length} hasSearch={false} />

        {items.length > 0 ? (
          <ItemGrid items={items} />
        ) : (
          <p className="text-gray-500 mt-6">No items found.</p>
        )}
      </div>
    </main>
  );
}
