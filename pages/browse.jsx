"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "../components/Header";
import ItemCard from "../components/ItemCard";
import ChatLayout from "@/components/ChatLayout";
import ChatbotLayout from "@/components/ChatbotLayout";

import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { fetchFilteredProducts } from "@/lib/productFetcher";
import { supabase } from "@/lib/supabaseClient";

/* ------------------------------- SERVER SIDE ------------------------------ */
export async function getServerSideProps(context) {
  const supabase = createPagesServerClient(context);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
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

  return {
    props: { items: items || [], user },
  };
}

/* --------------------------------- CLIENT -------------------------------- */
export default function Browse({ items = [], user }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ----------------------------- FILTER STATES ----------------------------- */
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [categories, setCategories] = useState([]);

  /* ------------------------------ CHAT STATES ------------------------------ */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotContext, setChatbotContext] = useState(null);

  /* --------------------------- LOAD CATEGORIES ----------------------------- */
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("cat_id, cat_name")
        .order("cat_name", { ascending: true });

      if (data) {
        const unique = Array.from(new Map(data.map((c) => [c.cat_id, c])).values());
        setCategories(unique);
      }
    };
    loadCategories();
  }, []);

  /* -------------------------- SYNC URL → STATE ----------------------------- */
  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setCondition(searchParams.get("condition") || "all");
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setSort(searchParams.get("sort") || "newest");
  }, [searchParams]);

  /* ---------------------------- APPLY FILTERS ------------------------------ */
  const handleApplyFilters = () => {
    const query = new URLSearchParams();
    if (category !== "all") query.set("category", category);
    if (condition !== "all") query.set("condition", condition);
    if (minPrice) query.set("min_price", minPrice);
    if (maxPrice) query.set("max_price", maxPrice);
    if (sort) query.set("sort", sort);

    router.push(`/browse?${query.toString()}`);
  };

  /* -------------------------- CHAT + CHATBOT EVENTS ------------------------ */
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

  /* --------------------------------- UI ----------------------------------- */
  return (
    <main className="font-inter min-h-screen flex flex-col bg-[#F2F5F3] text-[#1E5631]">

      {/* ----------------------------- HEADER ----------------------------- */}
      <Header user={user} />

      {/* ----------------------------- TITLE ------------------------------ */}
      <div className="w-full mt-[90px] text-center px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold">Browse Items</h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto text-lg">
          Discover a variety of second-hand items—electronics, clothing, books, and more—posted by people near you.
        </p>
      </div>

      {/* --------------------------- MAIN CONTENT ------------------------- */}
      <div className="max-w-7xl mx-auto flex gap-8 mt-12 pb-20">

        {/* --------------------------- LEFT SIDEBAR --------------------------- */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white border border-[#DDE2D8] rounded-xl p-6 sticky top-32 shadow-lg">

            <h2 className="text-xl font-bold mb-4">Filters ({items.length})</h2>

            {/* CATEGORY */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Category</h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F2F5F3] border border-[#DDE2D8] rounded p-2"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.cat_id} value={cat.cat_id}>
                    {cat.cat_name}
                  </option>
                ))}
              </select>
            </div>

            {/* CONDITION */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Condition</h3>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-[#F2F5F3] border border-[#DDE2D8] rounded p-2"
              >
                <option value="all">All Conditions</option>
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>

            {/* PRICE */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Price</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 bg-[#F2F5F3] border border-[#DDE2D8] rounded p-2"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 bg-[#F2F5F3] border border-[#DDE2D8] rounded p-2"
                />
              </div>
            </div>

            {/* SORT */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Sort By</h3>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-[#F2F5F3] border border-[#DDE2D8] rounded p-2"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            {/* APPLY BUTTON */}
            <button
              onClick={handleApplyFilters}
              className="w-full bg-green-600 hover:bg-green-500 mt-4 py-2 rounded-xl font-semibold text-white transition"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* ----------------------------- PRODUCTS GRID ----------------------------- */}
        <section className="flex-1 flex justify-center">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
              {items.map((item) => (
                <div key={item.id} className="p-2">
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 w-full">
              <p className="text-2xl font-semibold text-gray-600">No items found</p>
              <p className="text-gray-400 mt-2">Try adjusting the filters.</p>
            </div>
          )}
        </section>
      </div>

      {/* ----------------------------- FOOTER ----------------------------- */}
      <footer className="text-center text-gray-500 py-10 border-t border-[#DDE2D8] mt-10">
        © {new Date().getFullYear()} CampusMart — All rights reserved.
      </footer>

      {/* ----------------------------- CHAT WINDOWS ----------------------------- */}
      {chatOpen && <ChatLayout onClose={() => setChatOpen(false)} chatTarget={chatTarget} />}
      {chatbotOpen && <ChatbotLayout onClose={() => setChatbotOpen(false)} productData={chatbotContext?.product} />}
    </main>
  );
}
