"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCartShopping,
  faUser,
  faChevronDown,
  faComments, // 👈 new
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Header({ logoOnly = false, hideSearch = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false); // 👈 new

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkSeller = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      setIsSeller(!!data);
    };
    checkSeller();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  const handleBecomeSeller = async () => {
    if (!user) {
      alert("You need to log in first.");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (existing) {
        alert("✅ You are already a seller!");
        setIsSeller(true);
      } else {
        const { error } = await supabase.from("seller").insert([{ auth_id: user.id }]);
        if (error) throw error;
        alert("🎉 You are now registered as a seller!");
        setIsSeller(true);
        router.push("/seller/index");
      }

      setShowSellerModal(false);
    } catch (error) {
      console.error("Become Seller Error:", error);
      alert("❌ Failed to become a seller.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-gray-50 border-b border-gray-200 z-50">
        <div className="flex flex-wrap items-center justify-between px-5 py-4 max-w-[1200px] mx-auto">
          <div>
            <Link href="/" className="text-4xl font-bold text-black">
              ReMart
            </Link>
          </div>

          {!logoOnly && !hideSearch && (
            <div className="flex-1 mx-5 hidden md:flex">
              <form className="flex w-full max-w-xl">
                <input
                  type="text"
                  placeholder="Search items..."
                  required
                  className="flex-1 p-3 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 rounded-r-lg hover:bg-gray-800 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
              </form>
            </div>
          )}

          {!logoOnly && (
            <div className="flex items-center gap-4 relative">
              {user ? (
                <>
                  <Link
                    href="/cart"
                    className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCartShopping} />
                    Cart
                  </Link>

                  {isSeller ? (
                    <Link
                      href="/seller"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      + Sell
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowSellerModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      + Sell
                    </button>
                  )}

                  {/* 👤 Account Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faUser} />
                      {user.email.split("@")[0]}
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-2 w-48 z-50">
                        <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">
                          Profile
                        </Link>
                        <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100">
                          My Orders
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 💬 Chat Button */}
                  <button
                    onClick={() => setChatOpen(true)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                    title="Open Chat"
                  >
                    <FontAwesomeIcon icon={faComments} size="lg" />
                  </button>
                  
                </>
              ) : (
                <>
                  <Link href="/login" className="text-lg font-medium text-black hover:text-gray-600">
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="h-[90px]" />

      {/* 💬 Placeholder Chat Modal */}
      {chatOpen && (
        <div className="fixed bottom-5 right-5 bg-white shadow-2xl border rounded-2xl w-96 h-[500px] z-[100] flex flex-col">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-bold text-lg">Chat</h3>
            <button
              onClick={() => setChatOpen(false)}
              className="text-gray-500 hover:text-gray-800 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto text-gray-600">Chat system coming soon...</div>
        </div>
      )}

      {showSellerModal && !isSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-3">Become a Seller on ReMart</h2>
            <p className="text-gray-700 mb-5">
              To sell items, you must agree to our seller terms and conditions.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleBecomeSeller}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Processing..." : "Yes, I Agree"}
              </button>
              <button
                onClick={() => setShowSellerModal(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                No, Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
