"use client";

import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { fetchAllProducts } from "@/lib/productFetcher";

const RenderIcon = ({ name, className }) => {
  const Icon = Icons[name];
  return Icon ? <Icon className={className} /> : null;
};

export default function Landing() {
  const [user, setUser] = useState(null);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load current user and auth state
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: currentUser } } = await (await import("@/lib/supabaseClient")).supabase.auth.getUser();
        setUser(currentUser || null);

        const { data: listener } = (await import("@/lib/supabaseClient")).supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
        });

        return () => listener.subscription.unsubscribe();
      } catch (err) {
        console.error("❌ User load error:", err);
      }
    };
    loadUser();
  }, []);

  // Fetch latest products
  useEffect(() => {
    const loadLatestProducts = async () => {
      setLoadingProducts(true);
      const products = await fetchAllProducts(10); // Fetch 10 latest products
      setLatestProducts(products);
      setLoadingProducts(false);
    };
    loadLatestProducts();
  }, []);

  const categories = [
    { name: "Textbooks", icon: "BookOpen" },
    { name: "Electronics", icon: "Laptop" },
    { name: "Furniture", icon: "Sofa" },
    { name: "Clothing", icon: "Shirt" },
    { name: "Sports", icon: "Dumbbell" },
     ];

  const promoBanners = [
    { title: "Big Savings", desc: "Up to 70% off pre-owned items" },
    { title: "Trusted Sellers", desc: "Verified local marketplace" },
    { title: "Fast Deals", desc: "Chat & close deals quickly" },
  ];

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />

      {/* ================= HERO SECTION ================= */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Left */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-bold">
              Buy & Sell Second-Hand Items Easily
            </h1>
            <p className="text-gray-400 mt-4 max-w-lg">
              Discover affordable products from trusted local sellers in your community.
            </p>

            <div className="mt-6 flex gap-4 flex-wrap items-center">
              <Link
                href="/browse"
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg transition"
              >
                Browse Items
              </Link>

              {user && (
                <Link
                  href="/seller"
                  className="px-6 py-3 border border-green-500 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition"
                >
                  Sell an Item
                </Link>
              )}
            </div>

            <div className="flex gap-12 mt-14">
              {[
                ["12,000+", "Active Users"],
                ["₱350", "Avg. Savings"],
                ["4.9 / 5", "User Rating"]
              ].map(([num, label]) => (
                <div key={num}>
                  <p className="text-3xl font-bold text-green-400">{num}</p>
                  <p className="text-gray-400 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="relative h-[380px] flex items-center justify-center flex-1 mt-6">
            <div
              className="w-full h-64 rounded-3xl shadow-inner border border-gray-700 relative overflow-hidden"
              style={{
                backgroundImage: "url('/images/flat.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/40 rounded-3xl"></div>
            </div>

            <div
              className="absolute -top-2 -left-6 w-48 h-32 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transform rotate-[-5deg]"
              style={{
                backgroundImage: "url('/images/wireless.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute bottom-2 left-2 w-max">
                <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                <div className="relative p-2 text-left">
                  <p className="font-semibold text-sm text-white">Wireless Earbuds</p>
                  <p className="text-green-400 font-bold drop-shadow-md">₱2,500 → ₱900</p>
                  <p className="text-[10px] text-green-300">50% off retail</p>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-3 -right-6 w-52 h-32 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transform rotate-[5deg]"
              style={{
                backgroundImage: "url('/images/chair.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute bottom-2 left-2 w-max">
                <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                <div className="relative p-2 text-left">
                  <p className="font-semibold text-sm text-white">Office Chair</p>
                  <p className="text-green-400 font-bold drop-shadow-md">₱4,000 → ₱1,500</p>
                  <p className="text-[10px] text-green-300">Great condition</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORY GRID ================= */}
      <section className="bg-gray-900 text-white border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/browse?category=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center text-xs gap-2 hover:text-green-400 transition"
            >
              <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center">
                <RenderIcon name={cat.icon} className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-center font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= PROMO BANNERS ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
        {promoBanners.map(({ title, desc }) => (
          <div
            key={title}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-white shadow-md hover:shadow-lg transition"
          >
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-gray-300 mt-2">{desc}</p>
          </div>
        ))}
      </section>

     {/* ================= LATEST PRODUCTS ================= */}
<section className="max-w-7xl mx-auto px-6 py-12">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-xl font-bold">Latest Products</h2>
    <Link href="/browse" className="text-green-500 font-medium hover:underline">
      View More →
    </Link>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
    {loadingProducts
      ? [...Array(10)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4 animate-pulse"
          >
            <div className="bg-gray-700 h-32 rounded mb-3"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))
      : latestProducts.map((product) => (
          <Link
            key={product.id}
            href={`/view-product/${product.id}`} // <-- updated path
            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:shadow-lg transition"
          >
            {product.image && (
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="p-2">
              <p className="text-sm font-semibold text-white">{product.title}</p>
              <p className="text-green-400 font-bold">₱{product.price}</p>
            </div>
          </Link>
        ))}
  </div>
</section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-black text-gray-400">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <FooterColumn title="Marketplace" links={["Browse", "Sell", "Categories"]} />
          <FooterColumn title="Support" links={["Help Center", "Contact"]} />
          <FooterColumn title="Account" links={["Sign In", "Register"]} />
          <FooterColumn title="Company" links={["About", "Guidelines"]} />
        </div>

        <p className="text-center text-xs text-gray-500 pb-6">
          © {new Date().getFullYear()} ReMart. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

// -------------------- Footer Column --------------------
function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold text-white mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a className="hover:text-green-500 transition cursor-pointer">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

Landing.getLayout = (page) => <>{page}</>;
