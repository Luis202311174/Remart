"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PlusCircle } from "lucide-react";

export default function AddProduct() {
  const supabase = createClientComponentClient(); // ✅ new Supabase instance (auth helpers)
  const [categories, setCategories] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    cat_id: "",
    title: "",
    description: "",
    price: "",
    original_price: "",
    condition: "Good",
    location: "",
    images: [],
  });
  const [successMsg, setSuccessMsg] = useState("");

  // ✅ Fetch categories + verify seller
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        console.warn("⚠️ No logged-in user or auth error:", userErr?.message);
        setLoading(false);
        return;
      }

      // ✅ Check if the user is registered as a seller
      const { data: sellerData, error: sellerErr } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (sellerErr || !sellerData) {
        console.warn("⚠️ Seller record not found:", sellerErr?.message);
        alert("⚠️ You are not registered as a seller.");
        setLoading(false);
        return;
      }

      setSeller(sellerData);

      // ✅ Fetch product categories
      const { data: categoriesData, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .order("cat_name", { ascending: true });

      if (catErr) console.error("❌ Category fetch error:", catErr);
      setCategories(categoriesData || []);
      setLoading(false);
    };

    loadData();
  }, [supabase]);

  // ✅ Handle form field updates
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      setForm((f) => ({ ...f, images: Array.from(files) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  // ✅ Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");

    if (!seller) {
      alert("⚠️ Seller not found.");
      return;
    }

    if (!form.cat_id || !form.title || !form.price) {
      alert("⚠️ Please fill out all required fields.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Insert product into database
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([
          {
            seller_id: seller.id,
            cat_id: form.cat_id,
            title: form.title,
            description: form.description,
            price: parseFloat(form.price),
            original_price:
              form.original_price !== ""
                ? parseFloat(form.original_price)
                : null,
            condition: form.condition,
            location: form.location,
          },
        ])
        .select("product_id")
        .single();

      if (productError) throw productError;
      const product_id = productData.product_id;

      // ✅ Upload images to Supabase Storage
      if (form.images.length > 0) {
        for (const image of form.images) {
          const fileName = `${Date.now()}_${image.name.replace(/\s+/g, "_")}`;
          const { data: file, error: uploadErr } = await supabase.storage
            .from("product-images")
            .upload(fileName, image);

          if (uploadErr) {
            console.error("❌ Upload error:", uploadErr);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(file.path);

          await supabase.from("product_images").insert({
            product_id,
            img_path: urlData.publicUrl,
          });
        }
      }

      // ✅ Success
      setSuccessMsg("✅ Product added successfully!");
      setForm({
        cat_id: "",
        title: "",
        description: "",
        price: "",
        original_price: "",
        condition: "Good",
        location: "",
        images: [],
      });
    } catch (err) {
      console.error("❌ Add product failed:", err);
      alert("❌ Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading...
      </div>
    );

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <PlusCircle className="w-6 h-6" /> Add New Product
      </h2>

      {successMsg && (
        <p className="bg-green-100 text-green-700 p-2 rounded mb-4">
          {successMsg}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            name="cat_id"
            value={form.cat_id}
            onChange={handleChange}
            className="w-full p-2 mt-1 border rounded-lg"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.cat_id} value={c.cat_id}>
                {c.cat_name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full p-2 mt-1 border rounded-lg"
            placeholder="Enter product title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            rows="3"
            value={form.description}
            onChange={handleChange}
            className="w-full p-2 mt-1 border rounded-lg"
            placeholder="Enter product description"
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price (₱)
            </label>
            <input
              type="number"
              name="price"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="w-full p-2 mt-1 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Original Price (₱)
            </label>
            <input
              type="number"
              name="original_price"
              step="0.01"
              value={form.original_price}
              onChange={handleChange}
              className="w-full p-2 mt-1 border rounded-lg"
            />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Condition
          </label>
          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className="w-full p-2 mt-1 border rounded-lg"
          >
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full p-2 mt-1 border rounded-lg"
            placeholder="Enter item location"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Images
          </label>
          <input
            type="file"
            name="images"
            multiple
            accept="image/*"
            onChange={handleChange}
            className="w-full p-2 mt-1 border rounded-lg"
          />
          <p className="text-gray-500 text-sm mt-1">
            You can upload multiple images.
          </p>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
