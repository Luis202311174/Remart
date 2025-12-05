"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCartShopping,
  faUser,
  faChevronDown,
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
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    };
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("fname, lname")
        .eq("auth_id", user.id)
        .maybeSingle();
      setProfile(data);
    };
    fetchProfile();
  }, [user]);

  // Seller check
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      setIsSeller(!!data);
    };
    check();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleBecomeSeller = async () => {
    if (!user) return router.push("/login");

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("seller").insert([{ auth_id: user.id }]);
      }
      setIsSeller(true);
      router.push("/seller");
    } finally {
      setLoading(false);
      setShowSellerModal(false);
    }
  };

  return (
    <>
      {/* 🌿 Fixed Modern Green Glass Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent"
          >
            ReMart
          </Link>

          {/* Desktop Search */}
          {!logoOnly && !hideSearch && (
            <div className="hidden md:flex flex-1 justify-center px-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim())
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }}
                className="flex w-full max-w-md bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Search items..."
                  className="flex-1 px-4 py-2 text-sm focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  className="px-5 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
              </form>
            </div>
          )}

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/cart"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm flex items-center gap-2 transition"
                >
                  <FontAwesomeIcon icon={faCartShopping} />
                  Cart
                </Link>

                {isSeller ? (
                  <Link
                    href="/seller"
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700 transition"
                  >
                    + Sell
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowSellerModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700 transition"
                  >
                    + Sell
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-2 hover:bg-emerald-200 transition"
                  >
                    <FontAwesomeIcon icon={faUser} />
                    {profile ? `${profile.fname} ${profile.lname}` : user.email.split("@")[0]}
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`${dropdownOpen ? "rotate-180" : ""} transition`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-2">
                      <Link href="/profile" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                        Profile
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 rounded-lg hover:bg-gray-100">
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link className="text-sm hover:text-gray-600" href="/login">Login</Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faX : faBars} />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-xl p-4 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim())
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }}
              className="flex w-full bg-white border border-gray-200 rounded-full overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-4 py-2 text-sm focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="px-4 bg-emerald-600 text-white text-sm">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
            </form>

            {user ? (
              <div className="space-y-2">
                <Link href="/cart" className="block bg-gray-100 px-4 py-2 rounded-lg">
                  Cart
                </Link>

                {isSeller ? (
                  <Link href="/seller" className="block bg-emerald-600 text-white px-4 py-2 rounded-lg">
                    + Sell
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowSellerModal(true)}
                    className="block w-full bg-emerald-600 text-white px-4 py-2 rounded-lg"
                  >
                    + Sell
                  </button>
                )}

                <Link href="/profile" className="block bg-blue-600 text-white px-4 py-2 rounded-lg">
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="block w-full bg-gray-200 px-4 py-2 rounded-lg"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="block bg-gray-100 px-4 py-2 rounded-lg">
                  Login
                </Link>
                <Link href="/signup" className="block bg-gray-100 px-4 py-2 rounded-lg">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Become Seller Modal */}
      {showSellerModal && !isSeller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-2">Become a Seller</h2>
            <p className="text-gray-600 mb-5">
              Agree to our seller terms and conditions to start selling.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleBecomeSeller}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                {loading ? "Processing..." : "Yes, Continue"}
              </button>
              <button
                onClick={() => setShowSellerModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
