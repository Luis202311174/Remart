"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Settings,
  Trash2,
  AlertTriangle,
  UserX,
  XCircle,
  CheckCircle,
} from "lucide-react";

export default function SellerSettings() {
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [modal, setModal] = useState(null); // "products" | "account" | null
  const [flash, setFlash] = useState(null); // success/error message
  const [error, setError] = useState("");
  const [dangerOpen, setDangerOpen] = useState(false);

  const exportData = async (format) => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    const res = await fetch(`/api/export-seller?format=${format}`, {
      method: "GET",
      headers: { token },
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  useEffect(() => {
    const loadSeller = async () => {
      setLoading(true);
      setError("");
      const { data: auth, error: authError } = await supabase.auth.getUser();
      const user = auth?.user;

      if (authError || !user) {
        setError("⚠️ Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (sellerError || !sellerData) {
        setError("⚠️ You are not registered as a seller.");
        setLoading(false);
        return;
      }

      setSeller(sellerData);
      setLoading(false);
    };

    loadSeller();
  }, []);

  const showFlash = (type, msg) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 2000);
  };

  const handleDeleteAllProducts = async () => {
    if (!seller) return;
    setDeleting(true);

    try {
      const { data: productIds } = await supabase
        .from("products")
        .select("product_id")
        .eq("seller_id", seller.id);
      const ids = productIds?.map((p) => p.product_id) || [];

      if (ids.length > 0) {
        await supabase.from("product_images").delete().in("product_id", ids);
        await supabase.from("reviews").delete().in("product_id", ids);
      }

      await supabase.from("products").delete().eq("seller_id", seller.id);
      showFlash("success", "✅ All your products have been deleted!");
    } catch (err) {
      console.error(err);
      showFlash("error", "❌ Failed to delete products. Try again.");
    } finally {
      setDeleting(false);
      setModal(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!seller) return;
    setDeleting(true);

    try {
      const { data: productIds } = await supabase
        .from("products")
        .select("product_id")
        .eq("seller_id", seller.id);
      const ids = productIds?.map((p) => p.product_id) || [];

      if (ids.length > 0) {
        await supabase.from("product_images").delete().in("product_id", ids);
        await supabase.from("reviews").delete().in("product_id", ids);
        await supabase.from("products").delete().eq("seller_id", seller.id);
      }

      await supabase.from("seller").delete().eq("id", seller.id);
      await supabase.auth.signOut();

      showFlash("success", "✅ Your seller account has been deleted.");
      setTimeout(() => (window.location.href = "/"), 2000);
    } catch (err) {
      console.error(err);
      showFlash("error", "❌ Failed to delete account. Try again.");
    } finally {
      setDeleting(false);
      setModal(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 bg-[#FAFAF8]">
        Loading seller settings...
      </div>
    );

  if (error)
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-red-600 bg-red-100 border border-red-200 rounded-xl mt-10">
        {error}
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto bg-white text-gray-800 rounded-2xl shadow p-6 relative">

      {/* Flash Message */}
      {flash && (
        <div
          className={`fixed top-20 right-6 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 z-50 transition-all duration-300 ${
            flash.type === "success" ? "bg-green-500 text-white" : "bg-red-400 text-white"
          }`}
        >
          {flash.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {flash.msg}
        </div>
      )}

      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#2F8F4E]">
        <Settings className="w-6 h-6" />
        Seller Account Settings
      </h2>

      {/* Account Info */}
      <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[#2F8F4E] mb-2">Account Information</h3>
        <p className="text-sm mb-1">
          <span className="font-medium">Seller ID:</span> {seller?.id}
        </p>
        <p className="text-sm text-gray-500">
          This ID is used internally to associate your products and orders.
        </p>
      </div>

      {/* Export Section */}
      <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[#2F8F4E] mb-2">Export My Data</h3>
        <p className="text-sm text-gray-500 mb-4">
          Export your seller information including your products and chats.
        </p>

        <button
          onClick={() => exportData("pdf")}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
        >
          Export as PDF
        </button>

        <button
          onClick={() => exportData("csv")}
          className="ml-3 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg transition"
        >
          Export as CSV
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-300 bg-red-100/40 rounded-xl p-6 relative overflow-hidden">
        {!dangerOpen && (
          <div className="absolute inset-0 backdrop-blur-sm bg-red-100/30 rounded-xl"></div>
        )}

        <div className={`transition-all duration-300 ${!dangerOpen && "opacity-40 blur-sm"}`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          </div>
          <p className="text-sm text-red-500 mb-4">
            Actions here are permanent and cannot be undone.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setModal("products")}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-400 hover:bg-red-500 text-white rounded-lg transition disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              Delete All My Products
            </button>

            <button
              onClick={() => setModal("account")}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
            >
              <UserX className="w-5 h-5" />
              Delete My Seller Account
            </button>
          </div>
        </div>

        {!dangerOpen && (
          <button
            onClick={() => setDangerOpen(true)}
            className="absolute inset-0 flex items-center justify-center text-white font-medium bg-red-100/40 hover:bg-red-200 backdrop-blur-sm rounded-xl transition"
          >
            🔓 Show Danger Zone
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-gray-800">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">
                Confirm {modal === "products" ? "Product Deletion" : "Account Deletion"}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {modal === "products"
                ? "This will permanently delete all your listed products and cannot be undone."
                : "This will permanently delete your seller account, all associated products, and related data. Are you sure you want to continue?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={modal === "products" ? handleDeleteAllProducts : handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50"
              >
                {deleting ? "Processing..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
