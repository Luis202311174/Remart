"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { List, PlusCircle, ShoppingBag, Settings } from "lucide-react";
import Header from "@/components/Header";

// Lazy-loaded sub-pages
const MyListings = dynamic(() => import("./my-listings"), {
  loading: () => <p className="text-gray-500">Loading listings...</p>,
});
const AddProduct = dynamic(() => import("./add-product"), {
  loading: () => <p className="text-gray-500">Loading add product form...</p>,
});
const SellerOrdersPage = dynamic(() => import("./orders"), {
  loading: () => <p className="text-gray-500">Loading orders...</p>,
});
const SellerSettingsPage = dynamic(() => import("./settings"), {
  loading: () => <p className="text-gray-500">Loading orders...</p>,
});

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [content, setContent] = useState(
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-3">Seller Dashboard</h2>
      <p className="text-gray-700">Welcome to your seller dashboard.</p>
    </div>
  );

  // ✅ Secure: Check Supabase session on mount
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn("⚠️ No logged-in session:", error?.message);
        router.push("/login"); // redirect to login
      } else {
        setUser(user);
      }
    };
    getSession();
  }, [supabase, router]);

  const menuItems = [
    { key: "my-listings", label: "My Listings", icon: List },
    { key: "add-product", label: "Add Product", icon: PlusCircle },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  const loadPage = (page) => {
    setActivePage(page);
    switch (page) {
      case "my-listings":
        setContent(<MyListings loadPage={loadPage} />);
        break;
      case "add-product":
        setContent(<AddProduct />);
        break;
      case "orders":
        setContent(<SellerOrdersPage />);
        break;
      case "settings":
        setContent(<SellerSettingsPage />);
        break;
      default:
        setContent(
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-3">Seller Dashboard</h2>
            <p className="text-gray-700">Welcome to your seller dashboard.</p>
          </div>
        );
    }
  };

  if (!user)
    return (
      <div className="flex justify-center items-center h-screen bg-white text-gray-700">
        <p>Checking authentication...</p>
      </div>
    );

  return (
    <>
      <Header hideSearch />

      <div className="flex h-screen overflow-hidden bg-white text-gray-900 font-sans">
        {/* Sidebar */}
        <aside
          className="w-64 bg-gray-50 border-r border-gray-200 p-5 flex-shrink-0
                     fixed top-16 bottom-0 overflow-y-auto left-0"
        >
          <h3 className="text-xl font-semibold mb-4">Seller Menu</h3>
          <nav className="flex flex-col gap-2">
            {menuItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={(e) => {
                  e.preventDefault();
                  loadPage(key);
                }}
                className={`px-3 py-2 flex items-center gap-2 text-left rounded transition ${
                  activePage === key
                    ? "bg-gray-200 font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 overflow-y-auto overflow-x-hidden h-screen p-6">
          {content}
        </main>
      </div>
    </>
  );
}
