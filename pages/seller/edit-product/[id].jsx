"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { Pencil } from "lucide-react";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [seller, setSeller] = useState(null);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    product_id: "",
    cat_id: "",
    title: "",
    description: "",
    price: "",
    original_price: "",
    condition: "Good",
    location: "",
    newImages: [],
  });

  const [loading, setLoading] = useState(true);

  // ✅ 1. Load product + seller + categories
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // find seller
      const { data: sellerData } = await supabase
        .from("seller")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!sellerData) {
        alert("⚠️ Not registered as a seller.");
        router.push("/");
        return;
      }
      setSeller(sellerData);

      // fetch product
      const { data: product, error: productErr } = await supabase
        .from("products")
        .select("*")
        .eq("product_id", id)
        .eq("seller_id", sellerData.id)
        .single();

      if (productErr || !product) {
        alert("Product not found or access denied.");
        router.push("/seller/my-listings");
        return;
      }

      // fetch images
      const { data: imgData } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id);

      setImages(imgData || []);

      // fetch categories
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("cat_name", { ascending: true });

      setCategories(cats || []);

      // set form
      setForm({
        product_id: product.product_id,
        cat_id: product.cat_id,
        title: product.title,
        description: product.description || "",
        price: product.price || "",
        original_price: product.original_price || "",
        condition: product.condition || "Good",
        location: product.location || "",
        newImages: [],
      });

      setLoading(false);
    };

    loadData();
  }, [id, router]);

  // ✅ 2. Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "newImages") {
      setForm((f) => ({ ...f, newImages: Array.from(files) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  // ✅ 3. Update product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.cat_id || !form.price) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateErr } = await supabase
        .from("products")
        .update({
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
        })
        .eq("product_id", form.product_id)
        .eq("seller_id", seller.id);

      if (updateErr) throw updateErr;

      // upload new images
      if (form.newImages.length > 0) {
        for (const image of form.newImages) {
          const fileName = `${Date.now()}_${image.name.replace(/\s+/g, "_")}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("product-images")
            .upload(fileName, image);

          if (uploadErr) console.error(uploadErr);
          else {
            const { data: urlData } = supabase.storage
              .from("product-images")
              .getPublicUrl(uploadData.path);

            const imageUrl = urlData.publicUrl;
            await supabase.from("product_images").insert({
              product_id: form.product_id,
              img_path: imageUrl,
            });
          }
        }
      }

      alert("✅ Product updated successfully!");
      router.push("/seller/my-listings");
    } catch (err) {
      console.error("Update failed:", err);
      alert("❌ Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading product...
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Pencil className="w-6 h-6" /> Edit Product
      </h2>

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
          />
        </div>

        {/* Existing Images */}
        {images.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Existing Images
            </label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {images.map((img) => (
                <img
                  key={img.id}
                  src={img.img_path}
                  alt="Product"
                  className="w-full h-24 object-cover rounded-md border"
                />
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload New Images
          </label>
          <input
            type="file"
            name="newImages"
            multiple
            accept="image/*"
            onChange={handleChange}
            className="w-full p-2 mt-1 border rounded-lg"
          />
          <p className="text-gray-500 text-sm mt-1">
            Adding new images will not remove old ones.
          </p>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Saving..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
