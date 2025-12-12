"use client";

import * as Icons from "lucide-react";
import { useEffect, useState, memo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient"; // normal import
import { fetchAllProducts } from "@/lib/productFetcher";

// Icon Renderer
const RenderIcon = ({ name, className }) => {
  const Icon = Icons[name];
  return Icon ? <Icon className={className} /> : null;
};

// Modal Memoized for performance
const StepModal = memo(({ step, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 max-w-lg w-full relative shadow-2xl">
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 font-bold text-lg"
        onClick={onClose}
      >
        ×
      </button>
      <h3 className="font-bold text-xl text-[#2F8F4E] mb-4">{step.title}</h3>
      <p className="text-[#4A4A4A]">{step.full}</p>
    </div>
  </div>
));

export default function Landing() {
  const [user, setUser] = useState(null);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedStep, setSelectedStep] = useState(null);

  // Load user and listen to auth state changes
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser || null);

        const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error("User load error:", err);
      }
    };
    loadUser();
  }, []);

  // Fetch latest products
  useEffect(() => {
    const loadLatestProducts = async () => {
      setLoadingProducts(true);
      const products = await fetchAllProducts(10);
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
    { title: "Eco-Friendly", desc: "Give items a second life" },
    { title: "Fast Deals", desc: "Chat & close deals quickly" },
  ];

  const testimonials = [
    { name: "Anna P.", text: "I love how easy it is to find affordable second-hand items!" },
    { name: "Mark D.", text: "Selling my old electronics was fast and smooth." },
    { name: "Liza T.", text: "Great deals and eco-friendly approach. Highly recommend!" },
  ];

  const stats = [
    ["1000+", "Products Available"],
    ["500+", "Happy Customers"],
    ["Free", "Delivery Nationwide"],
  ];

  const steps = [
    {
      title: "Browse",
      icon: "ShoppingCart",
      preview: "Explore products from various sellers.",
      full: "You can browse for second-hand items in various categories, compare prices, and find the best deals for your needs."
    },
    {
      title: "Chat",
      icon: "MessageCircle",
      preview: "Connect directly with sellers.",
      full: "Connect directly with sellers, ask questions, and negotiate deals in a safe environment."
    },
    {
      title: "Buy",
      icon: "CreditCard",
      preview: "Purchase safely through our platform.",
      full: "Purchase items safely through our platform using secure payment options and get confirmation instantly."
    },
    {
      title: "Meet & Deliver",
      icon: "Truck",
      preview: "Arrange meetups or get items delivered.",
      full: "Arrange convenient meetups or choose delivery options to receive your items quickly and safely."
    },
  ];

  return (
    <main className="min-h-screen bg-[#F2F5F3] text-[#3C3C3C]">
      <Header />

      {/* ================= HERO ================= */}
      <section className="relative bg-gradient-to-r from-[#E6F2E6] to-[#F4EDE2] text-[#1E5631] border-b border-[#D9DCCF] pt-20 pb-16 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#2F8F4E] leading-tight drop-shadow-md">
              Find Everything You Need at ReMart
            </h1>
            <p className="text-[#4A4A4A] md:text-xl max-w-lg drop-shadow-sm">
              Sustainable, second-hand items for smart shoppers. Buy, sell, and make a difference.
            </p>

            <div className="flex gap-4 flex-wrap mt-6">
              <Link
                href="/browse"
                className="px-6 py-3 bg-[#2F8F4E] text-white font-semibold rounded-lg hover:bg-[#1E5631] shadow-md transition-transform duration-150 hover:scale-105"
              >
                Shop Now
              </Link>
              <Link
                href="/seller"
                className="px-6 py-3 border border-[#2F8F4E] text-[#2F8F4E] hover:bg-[#2F8F4E] hover:text-white rounded-lg shadow-md transition-transform duration-150 hover:scale-105"
              >
                Become a Seller
              </Link>
            </div>

            <div className="flex gap-12 mt-10 flex-wrap">
              {stats.map(([num, label]) => (
                <div key={label} className="bg-white shadow-lg rounded-xl px-4 py-3">
                  <p className="text-3xl md:text-4xl font-bold text-[#2F8F4E]">{num}</p>
                  <p className="text-[#6A6A6A] text-sm md:text-base">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex-1 flex items-center justify-center">
            <div
              className="w-full h-80 md:h-96 rounded-3xl shadow-2xl border border-[#D0D5CA] overflow-hidden relative"
              style={{
                backgroundImage: "url('/images/flat.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/20 rounded-3xl"></div>
            </div>

            <div className="absolute -top-4 -left-6 w-48 h-32 rounded-2xl shadow-2xl bg-white border border-[#D0D5CA] transform rotate-[-5deg] p-3">
              <p className="font-semibold text-sm md:text-base">Wireless Earbuds</p>
              <p className="text-[#2F8F4E] font-bold">₱2,500 → ₱900</p>
              <p className="text-xs text-[#1E5631]">50% off retail</p>
            </div>

            <div className="absolute -bottom-4 -right-6 w-52 h-32 rounded-2xl shadow-2xl bg-white border border-[#D0D5CA] transform rotate-[5deg] p-3">
              <p className="font-semibold text-sm md:text-base">Office Chair</p>
              <p className="text-[#2F8F4E] font-bold">₱4,000 → ₱1,500</p>
              <p className="text-xs text-[#1E5631]">Great condition</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED CATEGORIES ================= */}
      <section className="bg-white py-12 border-b border-[#E2E6DD] shadow-inner">
        <div className="max-w-7xl mx-auto px-6 flex justify-center flex-wrap gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/browse?category=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center gap-3 hover:text-[#2F8F4E] transition-transform duration-150 hover:scale-105"
            >
              <div className="w-16 h-16 bg-[#F2F5F3] rounded-xl flex items-center justify-center border border-[#DDE2D8] shadow-md hover:shadow-lg transition-shadow duration-150">
                <RenderIcon name={cat.icon} className="w-8 h-8 text-[#2F8F4E]" />
              </div>
              <span className="text-2xl font-semibold">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= PROMO BANNERS ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
        {promoBanners.map(({ title, desc }) => (
          <div
            key={title}
            className="bg-white border border-[#E2E6DD] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-transform duration-150 hover:-translate-y-2"
          >
            <h3 className="font-bold text-xl text-[#2F8F4E]">{title}</h3>
            <p className="text-[#4A4A4A] mt-2">{desc}</p>
          </div>
        ))}
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12 bg-[#E8F0E7] rounded-xl shadow-lg my-12">
        <h2 className="text-2xl font-bold text-[#2F8F4E] mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {steps.map(({ title, icon, preview, full }) => (
            <div
              key={title}
              className="p-6 bg-white rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-transform duration-150 hover:-translate-y-2"
              onClick={() => setSelectedStep({ title, full })}
            >
              <RenderIcon name={icon} className="w-12 h-12 mx-auto text-[#2F8F4E] mb-4" />
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-[#4A4A4A] text-sm">{preview}</p>
            </div>
          ))}
        </div>

        {selectedStep && <StepModal step={selectedStep} onClose={() => setSelectedStep(null)} />}
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12 bg-white rounded-xl shadow-lg my-12">
        <h2 className="text-2xl font-bold text-[#2F8F4E] mb-8 text-center">What Our Users Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ name, text }) => (
            <div key={name} className="bg-[#E8F0E7] rounded-xl p-6 shadow-md">
              <p className="text-[#4A4A4A] mb-4">"{text}"</p>
              <p className="font-semibold text-[#2F8F4E]">- {name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SELLER SPOTLIGHT ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-6 items-center bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-[#2F8F4E] mb-4">Featured Sellers</h2>
          <p className="text-[#4A4A4A] mb-6">
            Check out top marketplace interactions and start your selling journey today!
          </p>
          <Link
            href="/seller"
            className="px-6 py-3 bg-[#2F8F4E] text-white font-semibold rounded-lg hover:bg-[#1E5631] shadow-md transition-transform duration-150 hover:scale-105"
          >
            Start Selling
          </Link>
        </div>
        <img
          src="https://cdn.pixabay.com/photo/2016/11/19/14/00/market-1837001_1280.jpg"
          alt="Marketplace Scene"
          className="rounded-xl shadow-md object-cover"
          loading="lazy"
        />
      </section>

      {/* ================= LATEST PRODUCTS ================= */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2F8F4E]">Latest Products</h2>
          <Link href="/browse" className="text-[#2F8F4E] font-medium hover:underline">
            View More →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {loadingProducts
            ? [...Array(5)].map((_, i) => ( // only 5 placeholders
                <div key={i} className="bg-white rounded-xl border border-[#E2E6DD] p-4 animate-pulse shadow-md">
                  <div className="bg-[#DDE2D8] h-40 rounded mb-3 w-full"></div>
                  <div className="h-4 bg-[#DDE2D8] rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-[#DDE2D8] rounded w-1/2"></div>
                </div>
              ))
            : latestProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/view-product/${product.id}`}
                  className="group relative bg-white rounded-xl border border-[#E2E6DD] overflow-hidden shadow-md hover:shadow-xl transition-transform duration-150 hover:-translate-y-1 will-change-transform"
                >
                  {product.image && (
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                      {product.discount && (
                        <span className="absolute top-2 left-2 bg-[#2F8F4E] text-white text-xs px-2 py-1 rounded">
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="text-sm md:text-base font-semibold mb-1 group-hover:text-[#2F8F4E]">
                      {product.title}
                    </h3>
                    <p className="text-[#2F8F4E] font-bold text-base">₱{product.price}</p>
                    {product.category && (
                      <span className="text-xs text-[#6A6A6A]">{product.category}</span>
                    )}
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* ================= JOIN COMMUNITY ================= */}
      <section className="bg-[#F4EDE2] py-12 mt-12 rounded-xl shadow-lg">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2F8F4E] mb-4">Join the ReMart Community</h2>
          <p className="text-[#4A4A4A] mb-6">Connect with sellers, get updates, and enjoy exclusive deals!</p>
          <Link
            href="/signup"
            className="px-6 py-3 bg-[#2F8F4E] text-white font-semibold rounded-lg hover:bg-[#1E5631] shadow-md transition-transform duration-150 hover:scale-105"
          >
            Join Now
          </Link>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#F4EDE2] text-[#4A4A4A] border-t border-[#E2E6DD] mt-12 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <FooterColumn title="Marketplace" links={["Browse", "Sell", "Categories"]} />
          <FooterColumn title="Support" links={["Help Center", "Contact"]} />
          <FooterColumn title="Account" links={["Sign In", "Register"]} />
          <FooterColumn title="Company" links={["About", "Guidelines"]} />
        </div>
        <p className="text-center text-xs text-[#6A6A6A] pb-6">
          © {new Date().getFullYear()} ReMart. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold text-[#1E5631] mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a className="hover:text-[#2F8F4E] transition cursor-pointer">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

Landing.getLayout = (page) => <>{page}</>;
