"use client";

import ChatLayout from "@/components/ChatLayout";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCartShopping,
  faUser,
  faChevronDown,
  faComments,
  faBars,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Header({ logoOnly = false, hideSearch = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔹 Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
    };
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("fname, lname")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (error) console.error(error);
      else setProfile(data);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const checkSeller = async () => {
      const { data } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      setIsSeller(!!data);
    };
    checkSeller();
  }, [user]);

  // 🔹 Listen for chat events
  useEffect(() => {
    const handler = (e) => {
      setChatOpen(true);
      setChatTarget(e.detail);
    };
    window.addEventListener("openChat", handler);
    return () => window.removeEventListener("openChat", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  const handleBecomeSeller = async () => {
    if (!user) {
      alert("Please log in first.");
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
        router.push("/seller");
      }

      setShowSellerModal(false);
    } catch (error) {
      console.error(error);
      alert("❌ Failed to become a seller.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-3xl md:text-4xl font-bold text-black">
              ReMart
            </Link>
          </div>

          {/* Desktop Search */}
          {!logoOnly && !hideSearch && (
            <div className="flex-1 hidden md:flex mx-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!searchQuery.trim()) return;
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }}
                className="flex w-full max-w-xl"
              >
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 rounded-r-lg hover:bg-gray-800 transition"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
              </form>
            </div>
          )}

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/cart"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                  <FontAwesomeIcon icon={faCartShopping} />
                  Cart
                </Link>

                {isSeller ? (
                  <Link
                    href="/seller"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    + Sell
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowSellerModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    + Sell
                  </button>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    aria-expanded={dropdownOpen}
                    aria-label="User menu"
                  >
                    <FontAwesomeIcon icon={faUser} />
                    {profile
                      ? `${profile.fname?.split(" ")[0] || ""} ${profile.lname || ""}`.trim()
                      : user.email.split("@")[0]}
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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

                <button
                  onClick={() => setChatOpen(true)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
                  title="Open Chat"
                >
                  <FontAwesomeIcon icon={faComments} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-lg font-medium hover:text-gray-600">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faX : faBars} size="lg" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="flex flex-col p-4 gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!searchQuery.trim()) return;
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  setMobileMenuOpen(false);
                }}
                className="flex w-full"
              >
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 bg-black text-white rounded-r-lg hover:bg-gray-800 transition"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
              </form>

              {user ? (
                <>
                  <Link
                    href="/cart"
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cart
                  </Link>

                  {isSeller ? (
                    <Link
                      href="/seller"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      + Sell
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowSellerModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      + Sell
                    </button>
                  )}

                  <Link
                    href="/profile"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => setChatOpen(true)}
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                  >
                    Chat
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20"></div>

      {/* Chat Modal */}
      {chatOpen && <ChatLayout onClose={() => setChatOpen(false)} chatTarget={chatTarget} />}

      {/* Become Seller Modal */}
      {showSellerModal && !isSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg text-center">
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
