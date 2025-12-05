"use client";

import * as Icons from "lucide-react";

export default function Landing() {
  const categories = [
    { name: "Textbooks", icon: "BookOpen", desc: "Academic books, reference materials", count: "1,200+ items" },
    { name: "Calculators", icon: "Calculator", desc: "Scientific, graphing calculators", count: "180+ items" },
    { name: "Uniforms", icon: "Shirt", desc: "Lab coats, sports uniforms", count: "320+ items" },
    { name: "Dorm Supplies", icon: "Home", desc: "Furniture, bedding, decorations", count: "450+ items" },
    { name: "Electronics", icon: "Laptop", desc: "Laptops, tablets, accessories", count: "280+ items" },
    { name: "Stationery", icon: "PenBox", desc: "Notebooks, pens, organizers", count: "650+ items" },
    { name: "Lab Equipment", icon: "FlaskRound", desc: "Lab tools, safety equipment", count: "95+ items" },
    { name: "Art Supplies", icon: "Palette", desc: "Paints, brushes, canvases", count: "220+ items" },
  ];

  const steps = [
    { title: "Browse & Search", desc: "Find textbooks and supplies posted by students.", icon: "Search" },
    { title: "Connect & Chat", desc: "Message sellers directly through secure chat.", icon: "MessageCircle" },
    { title: "Secure Payment", desc: "Pay safely with buyer protection.", icon: "CreditCard" },
    { title: "Meet & Exchange", desc: "Meet on campus and complete your transaction.", icon: "Handshake" },
  ];

  const RenderIcon = ({ name, className }) => {
    const Icon = Icons[name];
    return Icon ? <Icon className={className} /> : null;
  };

  return (
    <main className="font-inter bg-white text-gray-900">

      {/* =========================
          TOP NAVIGATION BAR
      ========================== */}
      <header className="w-full py-4 border-b bg-white/70 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          <a href="/" className="text-2xl font-bold tracking-tight">
            Campus<span className="text-green-600">Mart</span>
          </a>

          <div className="flex items-center gap-4">
            <a href="/login" className="text-gray-700 hover:text-green-600 font-medium transition">
              Login
            </a>

            <a
              href="/register"
              className="px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 shadow-sm transition"
            >
              Register
            </a>
          </div>
        </div>
      </header>

      {/* =========================
          HERO SECTION
      ========================== */}
      <section className="pt-28 pb-32 relative overflow-hidden bg-gradient-to-br from-green-50 to-white">
        
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-300 rounded-full blur-3xl opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative">

          {/* LEFT TEXT */}
          <div>
            <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full shadow-sm">
              Student Marketplace
            </span>

            <h1 className="text-5xl lg:text-6xl font-bold mt-6 leading-tight">
              Save Money. Buy Smart.<br />
              <span className="text-green-600">Shop Within Your Campus.</span>
            </h1>

            <p className="text-gray-600 mt-6 max-w-md leading-relaxed">
              Buy and sell second-hand textbooks, calculators, uniforms, and dorm supplies.
              Affordable, sustainable, and student-friendly.
            </p>

            <div className="flex gap-4 mt-8">
              <a href="/browse" className="px-7 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 shadow-md transition">
                Start Shopping
              </a>
              <a href="/sell" className="px-7 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-100 shadow-sm transition">
                Start Selling
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-12 mt-14">
              {[["2,500+", "Active Students"], ["$180", "Avg. Saved"], ["95%", "Satisfaction"]].map(([num, label]) => (
                <div key={num}>
                  <p className="text-3xl font-bold text-green-700">{num}</p>
                  <p className="text-gray-500 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT FLOATING CARDS */}
          <div className="relative h-[420px] flex items-center justify-center">

            <div className="w-full h-72 bg-white/40 backdrop-blur-xl rounded-3xl shadow-inner border border-white/30" />

            {/* Card 1 */}
            <div className="absolute top-6 left-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-5 w-64 border border-white/40">
              <div className="w-12 h-12 bg-green-100 rounded-lg" />
              <p className="font-semibold mt-2">Calculus Textbook</p>
              <p className="text-sm font-semibold text-green-700">$45 → $15</p>
              <p className="text-xs text-gray-500">Save 67%</p>
            </div>

            {/* Card 2 */}
            <div className="absolute bottom-6 right-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-5 w-64 border border-white/40">
              <div className="w-12 h-12 bg-green-100 rounded-lg" />
              <p className="font-semibold mt-2">Scientific Calculator</p>
              <p className="text-sm font-semibold text-green-700">$120 → $35</p>
              <p className="text-xs text-gray-500">Like new condition</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          CATEGORIES
      ========================== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold">Shop by Category</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Everything you need—organized for easy browsing.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 mt-12">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-white border rounded-2xl p-5 hover:shadow-xl hover:border-green-400 transition flex flex-col items-center group"
              >
                <RenderIcon name={cat.icon} className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition" />
                <p className="font-semibold text-sm">{cat.name}</p>
                <p className="text-gray-400 text-xs">{cat.desc}</p>
                <span className="text-gray-500 text-xs mt-1">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================== */}
      <section className="py-24 bg-green-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold">How CampusMart Works</h2>
          <p className="text-gray-500 mt-3">
            Simple, safe, and student-friendly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition relative border border-green-100"
              >
                <span className="absolute top-3 right-4 bg-green-600 text-white rounded-full text-xs px-2 py-1 shadow">
                  {index + 1}
                </span>

                <RenderIcon name={step.icon} className="w-10 h-10 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="bg-gray-900 text-gray-300 py-14 mt-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <FooterColumn title="Marketplace" links={["Browse Items", "Sell Your Items", "Categories"]} />
          <FooterColumn title="Support" links={["Help Center", "Contact Us", "Report an Issue"]} />
          <FooterColumn title="Account" links={["Sign Up", "Sign In"]} />
          <FooterColumn title="About" links={["About CampusMart", "Careers", "Campus Partners"]} />
        </div>

        <p className="text-center text-gray-500 mt-10 text-sm">
          © {new Date().getFullYear()} CampusMart. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold text-white mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a className="hover:text-green-400 transition cursor-pointer">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
