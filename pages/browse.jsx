import Filter from "../components/Filter";
import ItemCard from "../components/ItemCard";
import ChatLayout from "@/components/ChatLayout";
import ChatbotLayout from "@/components/ChatbotLayout";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { fetchFilteredProducts } from "@/lib/productFetcher";
import { useState, useEffect } from "react";

export async function getServerSideProps(context) {
  const supabase = createPagesServerClient(context);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: { destination: "/login", permanent: false }
    };
  }

  const user = session.user;

  const {
    category = "all",
    condition = "all",
    min_price = "",
    max_price = "",
    sort = "newest",
  } = context.query;

  const { data: items } = await fetchFilteredProducts({
    supabase,
    category,
    condition,
    minPrice: min_price,
    maxPrice: max_price,
    sort,
    limit: 50,
  });

  return { props: { items: items || [], user } };
}

export default function Browse({ items = [], user }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotContext, setChatbotContext] = useState(null);

  // Listen for chat triggers
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
    <main className="font-inter min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-white">

      {/* Page Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            Browse Items
          </h1>
          <p className="text-gray-600 mt-2 max-w-lg mx-auto">
            Discover second-hand textbooks, electronics, uniforms, and dorm essentials posted by students.
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-10">
          <Filter itemCount={items.length} hasSearch={true} />
        </div>

        {/* Items */}
        {items.length > 0 ? (
          <div className="
            grid 
            grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 
            gap-7 
            animate-fadeIn
          ">
            {items.map((item) => (
              <div
                key={item.id}
                className="
                  bg-white rounded-2xl shadow-sm hover:shadow-lg 
                  transition-all duration-300 border border-gray-100 p-1
                "
              >
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-32 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <span className="text-3xl">😕</span>
            </div>
            <p className="text-gray-700 text-2xl font-semibold">
              No items found
            </p>
            <p className="text-gray-500 mt-2">
              Try adjusting the filters or search keywords.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-8 text-center text-gray-500 text-sm">
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
