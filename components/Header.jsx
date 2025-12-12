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

  // Load user and listen to auth changes
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    };
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Check if user is a seller
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
     <header className="fixed top-0 left-0 w-full z-50 bg-[#E1D9C8] border-b border-[#CFC6B3] shadow-md backdrop-blur-sm">
  <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    {/* Logo */}
    <Link href="/" className="text-3xl font-extrabold flex items-center">
      <span className="text-[#2F8F4E]">Re</span>
      <span className="text-black">Mart</span>
    </Link>

    {/* Desktop Search + Buttons */}
    {!logoOnly && (
      <div className="hidden md:flex flex-1 items-center justify-center gap-6">
        {!hideSearch && (
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-md bg-white/90 rounded-full shadow border border-[#D0C9B5] overflow-hidden backdrop-blur-sm"
          >
            <input
              type="text"
              placeholder="Search items..."
              className="flex-1 px-4 py-2 text-sm focus:outline-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="px-5 bg-[#2F8F4E] text-white hover:bg-[#1E5631] transition">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
          </form>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/cart"
                className="px-4 py-2 bg-[#2F8F4E] text-white rounded-full hover:bg-[#1E5631] transition flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCartShopping} /> Cart
              </Link>

              {isSeller ? (
                <Link
                  href="/seller"
                  className="px-4 py-2 bg-[#2F8F4E] text-white rounded-full hover:bg-[#1E5631] transition"
                >
                  + Sell
                </Link>
              ) : (
                <button
                  onClick={() => setShowSellerModal(true)}
                  className="px-4 py-2 bg-[#2F8F4E] text-white rounded-full hover:bg-[#1E5631] transition"
                >
                  + Sell
                </button>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-4 py-2 bg-white/90 border border-[#D0C9B5] rounded-full flex items-center gap-2 hover:bg-white/95 transition backdrop-blur-sm"
                >
                  <FontAwesomeIcon icon={faUser} />
                  {profile ? `${profile.fname} ${profile.lname}` : user.email.split("@")[0]}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${dropdownOpen ? "rotate-180" : ""} transition`}
                  />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 border border-[#D0C9B5] rounded-xl shadow-lg p-2 text-black backdrop-blur-sm">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100/80"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 font-medium hover:text-[#2F8F4E] transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-[#2F8F4E] text-white font-medium rounded-lg hover:bg-[#1E5631] transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    )}

    {/* Mobile Menu Button */}
    {!logoOnly && (
      <button
        className="md:hidden p-2 rounded-full bg-white/90 border border-[#D0C9B5] text-black hover:bg-white/95 backdrop-blur-sm"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <FontAwesomeIcon icon={mobileMenuOpen ? faX : faBars} />
      </button>
    )}
  </div>

  {/* Mobile Menu */}
  {!logoOnly && mobileMenuOpen && (
    <div className="md:hidden bg-[#E1D9C8] border-t border-[#CFC6B3] shadow-xl p-4 space-y-3 text-black">
      <form
        onSubmit={handleSearch}
        className="flex w-full border border-[#D0C9B5] rounded-full overflow-hidden"
      >
        <input
          type="text"
          placeholder="Search items..."
          className="flex-1 px-4 py-2 text-sm focus:outline-none bg-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="px-4 bg-[#2F8F4E] text-white">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </button>
      </form>

      {user ? (
        <div className="space-y-2">
          <Link
            href="/cart"
            className="block px-4 py-2 bg-[#2F8F4E] text-white rounded-lg hover:bg-[#1E5631]"
          >
            Cart
          </Link>
          {isSeller ? (
            <Link
              href="/seller"
              className="block px-4 py-2 bg-[#2F8F4E] text-white rounded-lg hover:bg-[#1E5631]"
            >
              + Sell
            </Link>
          ) : (
            <button
              onClick={() => setShowSellerModal(true)}
              className="block w-full px-4 py-2 bg-[#2F8F4E] text-white rounded-lg hover:bg-[#1E5631]"
            >
              + Sell
            </button>
          )}
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Link
            href="/login"
            className="block px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="block px-4 py-2 rounded-lg hover:bg-gray-200"
          >
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
            <h2 className="text-2xl font-bold mb-2 text-[#2F8F4E]">Become a Seller</h2>
            <p className="text-gray-600 mb-5">
              Agree to our seller terms and conditions to start selling.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleBecomeSeller}
                disabled={loading}
                className="px-4 py-2 bg-[#2F8F4E] text-white rounded-lg hover:bg-[#1E5631]"
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
