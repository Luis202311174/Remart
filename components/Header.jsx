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

      if (!existing) await supabase.from("seller").insert([{ auth_id: user.id }]);
      setIsSeller(true);
      router.push("/seller");
    } finally {
      setLoading(false);
      setShowSellerModal(false);
    }
  };

  return (
    <>
      {/* Dark Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black border-b border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            href={user ? (logoOnly ? "/" : "/browse") : "/"}
            className="text-3xl font-extrabold tracking-tight flex items-center"
          >
            <span className="text-green-400">Re</span>
            <span className="text-white">Mart</span>
          </Link>

          {/* Desktop / Landing Page Buttons */}
          {logoOnly ? (
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <span className="text-gray-300 font-medium">
                  {profile ? `${profile.fname} ${profile.lname}` : user.email.split("@")[0]}
                </span>
              ) : (
                <>
                  <Link className="text-green-400 hover:text-green-500 font-medium" href="/login">
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 rounded-lg bg-green-400 text-black font-medium hover:bg-green-500 shadow-sm transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Search */}
              {!hideSearch && (
                <div className="hidden md:flex flex-1 justify-center px-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim())
                        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                    className="flex w-full max-w-md bg-gray-900 rounded-full shadow-sm border border-gray-700 overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="Search items..."
                      className="flex-1 px-4 py-2 text-sm bg-gray-900 text-white focus:outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="px-5 bg-green-400 text-black text-sm font-medium hover:bg-green-500 transition">
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
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm flex items-center gap-2 transition text-white"
                    >
                      <FontAwesomeIcon icon={faCartShopping} />
                      Cart
                    </Link>

                    {isSeller ? (
                      <Link
                        href="/seller"
                        className="px-4 py-2 bg-green-400 text-black text-sm rounded-full hover:bg-green-500 transition"
                      >
                        + Sell
                      </Link>
                    ) : (
                      <button
                        onClick={() => setShowSellerModal(true)}
                        className="px-4 py-2 bg-green-400 text-black text-sm rounded-full hover:bg-green-500 transition"
                      >
                        + Sell
                      </button>
                    )}

                    {/* User Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-full text-sm flex items-center gap-2 hover:bg-gray-700 transition"
                      >
                        <FontAwesomeIcon icon={faUser} />
                        {profile ? `${profile.fname} ${profile.lname}` : user.email.split("@")[0]}
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`${dropdownOpen ? "rotate-180" : ""} transition`}
                        />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-2 text-white">
                                                    <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-800"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link className="text-sm text-white hover:text-green-400" href="/login">
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 bg-gray-800 text-white rounded-full text-sm hover:bg-gray-700"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </>
          )}

          {/* Mobile Menu Button */}
          {!logoOnly && (
            <button
              className="md:hidden p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faX : faBars} />
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {!logoOnly && mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-700 shadow-xl p-4 space-y-3 text-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim())
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }}
              className="flex w-full bg-gray-800 border border-gray-700 rounded-full overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 px-4 py-2 text-sm bg-gray-800 text-white focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="px-4 bg-green-400 text-black text-sm">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
            </form>

            {user ? (
              <div className="space-y-2">
                <Link href="/cart" className="block bg-gray-800 px-4 py-2 rounded-lg text-white hover:bg-gray-700">
                  Cart
                </Link>
                {isSeller ? (
                  <Link href="/seller" className="block bg-green-400 text-black px-4 py-2 rounded-lg hover:bg-green-500">
                    + Sell
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowSellerModal(true)}
                    className="block w-full bg-green-400 text-black px-4 py-2 rounded-lg hover:bg-green-500"
                  >
                    + Sell
                  </button>
                )}
                               <button
                  onClick={handleLogout}
                  className="block w-full bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="block bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
                  Login
                </Link>
                <Link href="/signup" className="block bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
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
          <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Become a Seller</h2>
            <p className="text-gray-300 mb-5">
              Agree to our seller terms and conditions to start selling.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleBecomeSeller}
                disabled={loading}
                className="px-4 py-2 bg-green-400 text-black rounded-lg hover:bg-green-500"
              >
                {loading ? "Processing..." : "Yes, Continue"}
              </button>
              <button
                onClick={() => setShowSellerModal(false)}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
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
