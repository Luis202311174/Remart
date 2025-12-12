"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState, memo } from "react";
import { supabase } from "@/lib/supabaseClient";
import * as Icons from "lucide-react";

// Lazy-loaded sub-pages
const MyListings = dynamic(() => import("./my-listings"), {
  loading: () => <p className="text-gray-400">Loading listings...</p>,
});
const AddProduct = dynamic(() => import("./add-product"), {
  loading: () => <p className="text-gray-400">Loading add product form...</p>,
});
const SellerSettingsPage = dynamic(() => import("./settings"), {
  loading: () => <p className="text-gray-400">Loading settings form...</p>,
});

// Icon Renderer
const RenderIcon = ({ icon: Icon, className }) => <Icon className={className} />;

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("my-listings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [content, setContent] = useState(<MyListings />);

  // Auth check
  useEffect(() => {
    const getSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) router.push("/login");
      else setUser(user);
    };
    getSession();
  }, [router]);

  // Sidebar menu items
  const menuItems = [
    { key: "my-listings", label: "My Listings", icon: Icons.List },
    { key: "add-product", label: "Add Product", icon: Icons.PlusCircle },
    { key: "settings", label: "Settings", icon: Icons.Settings },
  ];

  // Load subpage
  const loadPage = (page) => {
    setActivePage(page);
    switch (page) {
      case "my-listings":
        setContent(<MyListings loadPage={loadPage} />);
        break;
      case "add-product":
        setContent(<AddProduct />);
        break;
      case "settings":
        setContent(<SellerSettingsPage />);
        break;
      default:
        setContent(<MyListings />);
    }
  };

  if (!user)
    return (
      <div className="flex justify-center items-center h-screen bg-[#F4F4F4] text-gray-500">
        <p>Checking authentication...</p>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2F5F3] text-[#3C3C3C] font-sans relative">
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-20 left-2 z-50 p-2 bg-[#2F8F4E] text-white rounded-full shadow hover:bg-[#1E5631] transition"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <Icons.ChevronLeft size={20} /> : <Icons.ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          bg-white border-r border-[#D9DCCF] p-6 w-64 flex-shrink-0
          fixed top-16 bottom-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <h3 className="text-2xl font-bold mb-6 text-[#2F8F4E]">Seller Menu</h3>
        <nav className="flex flex-col gap-3">
          {menuItems.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={(e) => {
                e.preventDefault();
                loadPage(key);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`
                px-4 py-2 flex items-center gap-3 rounded-lg transition
                ${activePage === key
                  ? "bg-[#2F8F4E] text-white font-semibold shadow-md"
                  : "hover:bg-[#E6F2E6] hover:text-[#2F8F4E]"}
              `}
            >
              <RenderIcon icon={icon} className="w-5 h-5" />
              <span className="text-base">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden h-screen p-6 md:ml-64 transition-all duration-300">
        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-full">
          {content}
        </div>
      </main>
    </div>
  );
}
