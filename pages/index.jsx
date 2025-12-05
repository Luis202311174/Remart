"use client";

import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";

// Safe dynamic icon renderer
const RenderIcon = ({ name, className }) => {
  const Icon = Icons[name];
  return Icon ? <Icon className={className} /> : null;
};

export default function Landing() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => listener.subscription.unsubscribe();
    };

    loadUser();
  }, []);

  const categories = [
    { name: "Textbooks", icon: "BookOpen", desc: "Reference & educational books", count: "500+ listings" },
    { name: "Electronics", icon: "Laptop", desc: "Phones, laptops, gadgets", count: "3,200+ listings" },
    { name: "Furniture", icon: "Sofa", desc: "Tables, chairs, home essentials", count: "1,100+ listings" },
    { name: "Clothing", icon: "Shirt", desc: "Apparel for all styles", count: "2,800+ listings" },
    { name: "Sports", icon: "Dumbbell", desc: "Sportswear & equipment", count: "900+ listings" },
  ];

  const steps = [
    { title: "Explore Listings", desc: "Browse thousands of items across multiple categories.", icon: "Search" },
    { title: "Chat Safely", desc: "Message sellers securely inside the platform.", icon: "MessageCircle" },
    { title: "Easy Transactions", desc: "Agree on price, payment, and pickup with confidence.", icon: "CreditCard" },
    { title: "Meet & Exchange", desc: "Complete the deal at your preferred safe location.", icon: "Handshake" },
  ];

  return (
    <main className="font-inter bg-white text-gray-900 relative overflow-hidden">
      <Header logoOnly={true} />

      {/* HERO SECTION */}
      <section className="pt-28 pb-32 relative overflow-hidden bg-gradient-to-br from-green-50 to-white">
        {/* Floating gradients for depth */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-300 rounded-full blur-3xl opacity-20"></div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative">
          {/* LEFT TEXT */}
          <div>
            <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full shadow-sm">
              Second-Hand Marketplace
            </span>

            <h1 className="text-5xl lg:text-6xl font-bold mt-6 leading-tight">
              Buy Smart. Sell Fast.
              <br />
              <span className="text-green-600">Your Local Marketplace.</span>
            </h1>

            <p className="text-gray-600 mt-6 max-w-md leading-relaxed">
              Find great deals on electronics, furniture, clothing, books, and more — all from trusted local sellers.
              <span className="text-black font-medium"> Reduce waste and save money with pre-owned items.</span>
            </p>

            <div className="flex gap-4 mt-8">
              <Link
                href="/browse"
                className="px-7 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 shadow-md transition"
              >
                Browse Items
              </Link>

              <Link
                href="/sell"
                className="px-7 py-3 border border-black rounded-xl font-medium hover:bg-black/5 shadow-sm transition"
              >
                Sell an Item
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-12 mt-14">
              {[
                ["12,000+", "Active Users"],
                ["₱350", "Avg. Savings"],
                ["4.9 / 5", "User Rating"],
              ].map(([num, label]) => (
                <div key={num}>
                  <p className="text-3xl font-bold text-green-700">{num}</p>
                  <p className="text-black/70 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

         {/* RIGHT FLOATING CARDS */}
<div className="relative h-[420px] flex items-center justify-center">
  {/* Big background box with image and subtle overlay */}
  <div
    className="w-full h-72 bg-white/40 rounded-3xl shadow-inner border border-black/20 relative overflow-hidden"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1567016541164-68cd7ce29e8c?auto=format&fit=crop&w=1200&q=80')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
  </div>

  {/* Card 1 - straight */}
  <div
    className="absolute top-6 left-8 w-56 h-40 rounded-2xl shadow-2xl border border-black/30 overflow-hidden"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1580894908361-23e6b08ee900?auto=format&fit=crop&w=400&q=80')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    {/* Glassy overlay for text */}
    <div className="absolute bottom-2 left-2 w-max">
      <div className="absolute inset-0 bg-white/25 rounded-lg border border-white/20"></div>
      <div className="relative p-2 text-left">
        <p className="font-semibold text-sm text-black">Wireless Earbuds</p>
        <p className="text-xs font-semibold text-green-900">₱2,500 → ₱900</p>
        <p className="text-[10px] text-black">50% off retail</p>
      </div>
    </div>
  </div>

  {/* Card 2 - straight */}
  <div
    className="absolute bottom-6 right-8 w-60 h-40 rounded-2xl shadow-2xl border border-black/30 overflow-hidden"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1581092334892-5e40c15b3f4a?auto=format&fit=crop&w=400&q=80')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    {/* Glassy overlay for text */}
    <div className="absolute bottom-2 left-2 w-max">
      <div className="absolute inset-0 bg-white/25 rounded-lg border border-white/20"></div>
      <div className="relative p-2 text-left">
        <p className="font-semibold text-sm text-black">Office Chair</p>
        <p className="text-xs font-semibold text-green-900">₱4,000 → ₱1,500</p>
        <p className="text-[10px] text-black">Great condition</p>
      </div>
    </div>
  </div>
</div>

        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-black">Shop by Category</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Find the perfect deal across a wide range of categories.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-12">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-white border rounded-2xl p-5 hover:shadow-xl hover:border-black/40 transition flex flex-col items-center group"
              >
                <RenderIcon
                  name={cat.icon}
                  className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition"
                />
                <p className="font-semibold text-sm text-black">{cat.name}</p>
                <p className="text-gray-500 text-xs">{cat.desc}</p>
                <span className="text-gray-400 text-xs mt-1">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-green-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-black">How It Works</h2>
          <p className="text-gray-500 mt-3">Simple, safe, and convenient.</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition relative border border-black/20"
              >
                <span className="absolute top-3 right-4 bg-green-600 text-white rounded-full text-xs px-2 py-1 shadow">
                  {index + 1}
                </span>

                <RenderIcon
                  name={step.icon}
                  className="w-10 h-10 text-green-600 mx-auto mb-4"
                />

                <h3 className="font-bold mb-2 text-black">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-green-400 py-14 mt-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <FooterColumn title="Marketplace" links={["Browse Items", "Sell an Item", "Categories"]} />
          <FooterColumn title="Support" links={["Help Center", "Contact Us", "Report an Issue"]} />
          <FooterColumn title="Account" links={["Sign Up", "Sign In"]} />
          <FooterColumn title="About" links={["About Us", "Careers", "Community Guidelines"]} />
        </div>

        <p className="text-center text-green-300 mt-10 text-sm">
          © {new Date().getFullYear()} ReMart. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold text-green-400 mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a className="hover:text-black transition cursor-pointer">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

Landing.getLayout = (page) => <>{page}</>;
