// pages/index.jsx
import Header from "../components/Header";
import Filter from "../components/Filter";
import ItemCard from "../components/ItemCard"; // Updated ItemGrid -> ItemCard
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { fetchFilteredProducts } from "@/lib/productFetcher";

export async function getServerSideProps(context) {
  const supabase = createPagesServerClient(context);
  const { data: { session } } = await supabase.auth.getSession();

  const user = session?.user || null;
  const { category = "all", condition = "all", min_price = "", max_price = "", sort = "newest" } = context.query;

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
}

export default function Home({ items = [], user }) {
  return (
    <main className="bg-gray-50 font-inter min-h-screen flex flex-col">
      <Header user={user} />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Browse Items
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Filter itemCount={items.length} hasSearch={true} />
        </div>

        {/* Items Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-16 h-16 mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6h13M9 6L5 3m0 0l4 3m-4-3v16"
              />
            </svg>
            <h2 className="text-xl sm:text-2xl font-medium text-gray-500 mb-2">
              No items found
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Try adjusting your filters or search for something else.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
