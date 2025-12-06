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

  // ✅ Load seller info
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

  // ✅ Flash message helper
  const showFlash = (type, msg) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 2000);
  };

  // ✅ Delete all products
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

      showFlash("success", "✅ All your products have been deleted successfully!");
    } catch (err) {
      console.error(err);
      showFlash("error", "❌ Failed to delete your products. Please try again.");
    } finally {
      setDeleting(false);
      setModal(null);
    }
  };

  // ✅ Delete seller account
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
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      console.error(err);
      showFlash("error", "❌ Failed to delete your account. Please try again.");
    } finally {
      setDeleting(false);
      setModal(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 bg-gray-900">
        Loading seller settings...
      </div>
    );

  if (error)
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-xl mt-10">
        {error}
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto bg-gray-900 text-white rounded-xl shadow p-6 relative">

      {/* Flash Message */}
      {flash && (
        <div
          className={`fixed top-20 right-6 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 z-50 transition-all duration-300 ${
            flash.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {flash.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {flash.msg}
        </div>
      )}

      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6 text-green-500" />
        Seller Account Settings
      </h2>

      {/* Account Info */}
      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-500 mb-2">Account Information</h3>
        <p className="text-sm text-gray-300 mb-1">
          <span className="font-medium">Seller ID:</span> {seller?.id}
        </p>
        <p className="text-sm text-gray-400">
          This ID is used internally to associate your products and orders.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-700 bg-red-900/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-400 mb-4">
          Actions here are permanent and cannot be undone.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setModal("products")}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            Delete All My Products
          </button>

          <button
            onClick={() => setModal("account")}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg transition disabled:opacity-50"
          >
            <UserX className="w-5 h-5" />
            Delete My Seller Account
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-md rounded-xl p-6 w-full max-w-md shadow-xl text-white">
            <div className="flex items-center gap-2 text-red-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">
                Confirm {modal === "products" ? "Product Deletion" : "Account Deletion"}
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              {modal === "products"
                ? "This will permanently delete all your listed products and cannot be undone."
                : "This will permanently delete your seller account, all associated products, and related data. Are you sure you want to continue?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={modal === "products" ? handleDeleteAllProducts : handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
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
