import ItemCard from "../components/ItemCard";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { fetchFilteredProducts } from "@/lib/productFetcher";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export async function getServerSideProps(context) {
  const supabase = createPagesServerClient(context);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const user = session.user;

  // Extract query filters
  const {
    category = "all",
    condition = "all",
    min_price = "",
    max_price = "",
    sort = "newest",
  } = context.query;

  // Fetch products using cat_id as filter
  const { data: items } = await fetchFilteredProducts({
    supabase,
    category, // should be the actual cat_id
    condition,
    minPrice: min_price,
    maxPrice: max_price,
    sort,
    limit: 50,
  });

  return { props: { items: items || [], user, activeCategory: category } };
}

export default function Browse({ items = [], user, activeCategory }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotContext, setChatbotContext] = useState(null);

  const router = useRouter();

  // Define categories with ID mapping to your database cat_id
  const categories = [
    { id: "all", label: "All" },
    { id: "1", label: "Textbooks" },
    { id: "2", label: "Electronics" },
    { id: "3", label: "Furniture" },
    { id: "4", label: "Clothing" },
    { id: "5", label: "Sports" },
  ];

  useEffect(() => {
    const handleOpenChat = (e) => {
      setChatTarget(e.detail);
      setChatOpen(true);
    };
    const handleOpenChatbot = (e) => {
      setChatbotContext(e.detail || null);
      setChatbotOpen(true);
    };

    window.addEventListener("openChat", handleOpenChat);
    window.addEventListener("openChatbot", handleOpenChatbot);

    return () => {
      window.removeEventListener("openChat", handleOpenChat);
      window.removeEventListener("openChatbot", handleOpenChatbot);
    };
  }, []);

  return (
    <main className="font-inter min-h-screen flex flex-col bg-gray-900 text-white">

      {/* Page Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="px-4 py-2 inline-block rounded-full bg-gray-800 border border-gray-700 text-gray-200 font-medium hover:bg-gray-700 transition"
          >
            ← Back to Landing Page
          </Link>
        </div>

        {/* Page Title */}
      <div className="text-center mb-8">
  <h1 className="text-4xl font-bold text-white">Browse Items</h1>
  <p className="text-gray-300 mt-2 max-w-lg mx-auto">
    Discover a variety of second-hand items—electronics, clothing, books, and more—posted by people near you.
  </p>
</div>

        {/* Category Bar */}
        <div className="flex justify-center gap-3 flex-wrap mb-10">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={{
                  pathname: "/browse",
                  query: { ...router.query, category: cat.id },
                }}
              >
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer
                    ${isActive
                      ? "bg-green-500 text-white border-green-500 shadow-md"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  {cat.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Items */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 animate-fadeIn">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-700 p-1"
              >
                <ItemCard item={item} darkTheme />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-32 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <span className="text-3xl">😕</span>
            </div>
            <p className="text-gray-200 text-2xl font-semibold">No items found</p>
            <p className="text-gray-400 mt-2">
              Try adjusting the filters or search keywords.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-900 py-8 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} CampusMart — All rights reserved.
      </footer>

      {/* Chat Modal */}
      {chatOpen && (
        <ChatLayout
          onClose={() => setChatOpen(false)}
          chatTarget={chatTarget}
        />
      )}

      {/* Chatbot Modal */}
      {chatbotOpen && (
        <ChatbotLayout
          onClose={() => setChatbotOpen(false)}
          productData={chatbotContext?.product || null}
        />
      )}
    </main>
  );
}
