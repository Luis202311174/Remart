"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { List, PlusCircle, Settings, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function SellerDashboard() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("my-listings");
  const [content, setContent] = useState(<MyListings />);

  // Authentication
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
      } else {
        setUser(user);
      }
    };
    getSession();
  }, [router]);

  // Menu Items
  const menuItems = [
    { key: "my-listings", label: "My Listings", icon: List },
    { key: "add-product", label: "Add Product", icon: PlusCircle },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  // Load selected page
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
      <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-400">
        <p>Checking authentication...</p>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-200 font-sans relative">
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-24 left-2 z-50 p-2 bg-gray-800 border border-gray-700 rounded-full shadow hover:bg-gray-700 transition"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          bg-gray-900 border-r border-gray-800 p-5 w-64 flex-shrink-0
          fixed top-16 bottom-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <h3 className="text-xl font-semibold mb-6 text-green-400">Seller Menu</h3>

        <nav className="flex flex-col gap-3">
          {menuItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={(e) => {
                e.preventDefault();
                loadPage(key);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`
                px-3 py-2 flex items-center gap-3 text-left rounded-lg transition
                ${activePage === key
                  ? "bg-green-500 text-gray-900 font-semibold"
                  : "hover:bg-green-700 hover:text-white"}
              `}
            >
              <Icon size={20} />
              <span className="text-sm md:text-base">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden h-screen p-6 ml-0 md:ml-64 transition-all duration-300">
        {content}
      </main>
    </div>
  );
}
