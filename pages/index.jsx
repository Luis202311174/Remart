// /pages/index.jsx
import Header from "../components/Header";
import Filter from "../components/Filter";
import ItemGrid from "../components/ItemGrid";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs"; // ✅ for SSR session-safe fetch
import { fetchAllProducts } from "@/lib/productFetcher";

export async function getServerSideProps(context) {
  try {
    // ✅ Create a Supabase client tied to user cookies (auth-safe)
    const supabase = createPagesServerClient(context);

    // ✅ Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user || null;

    // ✅ Fetch items from your productFetcher (optionally use user info)
    const items = await fetchAllProducts(50, context);

    return {
      props: {
        items,
        user, // ✅ pass session user (optional, but useful for UI)
      },
    };
  } catch (error) {
    console.error("❌ Error in getServerSideProps:", error.message || error);
    return { props: { items: [], user: null } };
  }
}

export default function Home({ items = [], user }) {
  return (
    <main className="bg-white text-gray-900 font-sans min-h-screen">
      <Header user={user} /> {/* ✅ Pass user if you want conditional header UI */}

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
