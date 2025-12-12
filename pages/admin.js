"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  // UI states
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(null);
  const [selected, setSelected] = useState("dashboard");

  // Data states
  const [counts, setCounts] = useState({});
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartRows, setCartRows] = useState([]);
  const [chats, setChats] = useState([]);

  /* ---------------------------------------------------------
     AUTH CHECK
  --------------------------------------------------------- */
  useEffect(() => {
    const isAuthenticated =
      typeof window !== "undefined" &&
      localStorage.getItem("isAdminAuthenticated") === "1";

    if (!isAuthenticated) {
      setIsAuth(false);
      router.push("/admin/login");
      return;
    }

    setIsAuth(true);

    fetchCounts();
    fetchAllData();
  }, []);

  /* ---------------------------------------------------------
     FETCH COUNTS
  --------------------------------------------------------- */
  const fetchCounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/get-counts");
      const data = await res.json();
      setCounts(data);
    } catch (e) {
      console.error("Error fetching counts:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     FETCH ALL DATA
  --------------------------------------------------------- */
  const fetchAllData = async () => {
    try {
      const res = await fetch("/api/admin/get-all");
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON received from API");
      }

      setUsers(data.users);
      setSellers(data.sellers);
      setProducts(data.products);
      setCartRows(data.cart);
      setChats(data.chats);
    } catch (e) {
      console.error("Error fetching all data:", e);
      alert("Failed to load admin data. Check console for details.");
    }
  };

  /* ---------------------------------------------------------
     EXPORT HANDLER
  --------------------------------------------------------- */
  const handleExport = async ({ format = "csv", includeGraphs = false, dataset = "all" }) => {
    try {
      const q = `?format=${encodeURIComponent(format)}&includeGraphs=${includeGraphs}&dataset=${dataset}`;
      const url = `/api/admin/export-data${q}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const disposition = res.headers.get("content-disposition");
      let filename = `remart_export_${dataset}.${format}`;
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (e) {
      console.error("Export error:", e);
      alert("Export failed");
    }
  };

  /* ---------------------------------------------------------
     LOGOUT
  --------------------------------------------------------- */
  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    router.push("/admin/login");
  };

  /* ---------------------------------------------------------
     RENDER VIEWS
  --------------------------------------------------------- */
  const renderContent = () => {
    if (selected === "dashboard") {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dashboard</h2>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Users", value: counts.users ?? 0 },
              { label: "Sellers", value: counts.sellers ?? 0 },
              { label: "Products", value: counts.products ?? 0 },
              { label: "Saved (Cart)", value: counts.cart ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Export */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-gray-800">Export data</h3>
            <div className="flex gap-3 items-center mb-3">
              <button onClick={() => handleExport({ format: "csv" })} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 transition">
                Export CSV
              </button>
              <button onClick={() => handleExport({ format: "pdf" })} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 transition">
                Export PDF
              </button>
            </div>
            <p className="text-sm text-gray-500">Includes users, sellers, products, saved items and chats.</p>
          </div>
        </div>
      );
    }

    if (selected === "users") {
      return <SectionTable title="Users" data={users} dataset="users" handleExport={handleExport} columns={[
        { key: "auth_id", label: "Auth ID" },
        { key: "fname", label: "First" },
        { key: "lname", label: "Last" },
        { key: "created_at", label: "Created" },
      ]} />;
    }

    if (selected === "sellers") {
      return <SectionTable title="Sellers" data={sellers} dataset="sellers" handleExport={handleExport} columns={[
        { key: "id", label: "ID" },
        { key: "auth_id", label: "Auth ID" },
        { key: "fname", label: "First" },
        { key: "lname", label: "Last" },
      ]} />;
    }

    if (selected === "products") {
      return <SectionTable title="Products" data={products} dataset="products" handleExport={handleExport} columns={[
        { key: "product_id", label: "ID" },
        { key: "title", label: "Title" },
        { key: "price", label: "Price" },
        { key: "status", label: "Status" },
        { key: "seller_name", label: "Seller" },
      ]} />;
    }

    if (selected === "saved") {
      return <SectionTable title="Saved Products (Cart)" data={cartRows} dataset="cart" handleExport={handleExport} columns={[
        { key: "cart_id", label: "Cart ID" },
        { key: "product_title", label: "Product" },
        { key: "quantity", label: "Quantity" },
        { key: "buyer_name", label: "Buyer" },
      ]} />;
    }

    if (selected === "chats") {
      return <SectionTable title="Chats" data={chats} dataset="chats" handleExport={handleExport} columns={[
        { key: "chat_id", label: "Chat ID" },
        { key: "product_title", label: "Product" },
        { key: "buyer_name", label: "Buyer" },
        { key: "seller_name", label: "Seller" },
        { key: "created_at", label: "Created" },
      ]} />;
    }

    return null;
  };

  if (isAuth === null) return <div className="min-h-screen bg-[#FAFAF8] p-6 text-gray-700">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6 text-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <AdminSidebar
          counts={counts}
          selected={selected}
          onSelect={setSelected}
          onLogout={handleLogout}
        />

        <main className="bg-white rounded-2xl border border-gray-200 shadow text-gray-800">
          {loading ? <div className="p-6 text-gray-700">Loading...</div> : renderContent()}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   REUSABLE SECTION TABLE COMPONENT
============================================================ */
function SectionTable({ title, data, columns, dataset, handleExport }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">{title}</h2>

      <div className="overflow-auto bg-white rounded-lg shadow p-3">
        <div className="flex justify-end mb-3">
          <button onClick={() => handleExport({ format: "csv", dataset })} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition mr-2">CSV</button>
          <button onClick={() => handleExport({ format: "pdf", dataset })} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition">PDF</button>
        </div>

        <table className="w-full text-sm leading-relaxed">
          <thead>
            <tr className="text-left text-gray-500">
              {columns.map(c => <th key={c.key} className="py-2">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id || row.chat_id || row.cart_id || row.auth_id} className="border-t border-gray-200 hover:bg-gray-50">
                {columns.map(c => (
                  <td key={c.key} className="py-2">
                    {c.key === "created_at" ? new Date(row[c.key]).toLocaleString() : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
