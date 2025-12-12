"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Edit2 } from "lucide-react";

export default function EditProductModal({ product, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    original_price: "",
    condition: "Good",
  });

  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) return;

    setForm({
      title: product.title || "",
      description: product.description || "",
      price: product.price || "",
      original_price: product.original_price || "",
      condition: product.condition || "Good",
    });

    const fetchImages = async () => {
      const { data: imagesData, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", product.product_id);

      if (error) return console.error(error);

      const savedImages = imagesData.map((img) => ({
        img_id: img.img_id,
        product_id: img.product_id,
        img_path: img.img_path,
        storage_path: img.storage_path,
        isNew: false,
        selected: false,
      }));

      setImages(savedImages);
    };

    fetchImages();
  }, [product]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "newImages") {
      const fileArr = Array.from(files).map((file) => ({
        temp_id: crypto.randomUUID(),
        file,
        img_path: URL.createObjectURL(file),
        isNew: true,
        selected: false,
      }));
      setImages((prev) => [...prev, ...fileArr]);
      setNewImages((prev) => [...prev, ...files]);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelectImage = (img) => {
    setImages((prev) =>
      prev.map((i) =>
        (i.img_id && img.img_id && i.img_id === img.img_id) ||
        (i.temp_id && img.temp_id && i.temp_id === img.temp_id)
          ? { ...i, selected: !i.selected }
          : i
      )
    );
  };

  const deleteSelectedImages = () => {
    const selected = images.filter((i) => i.selected);
    if (!selected.length) return alert("No images selected!");

    const existingToDelete = selected.filter((i) => !i.isNew);
    setImagesToDelete((prev) => [...prev, ...existingToDelete]);

    setImages((prev) => prev.filter((i) => !i.selected));
    setNewImages((prev) =>
      prev.filter((f) => !selected.some((i) => i.file?.name === f.name))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const img of imagesToDelete) {
        if (!img.storage_path || !img.img_id) continue;
        await supabase.storage.from("product-images").remove([img.storage_path]);
        await supabase.from("product_images").delete().eq("img_id", img.img_id);
      }

      await supabase
        .from("products")
        .update({
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          original_price: form.original_price ? parseFloat(form.original_price) : null,
          condition: form.condition,
        })
        .eq("product_id", product.product_id);

      for (const file of newImages) {
        const fileName = `${product.product_id}_${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const upload = await supabase.storage.from("product-images").upload(fileName, file);
        if (!upload.error) {
          const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(upload.data.path);
          await supabase.from("product_images").insert({
            product_id: product.product_id,
            img_path: publicUrlData.publicUrl,
            storage_path: upload.data.path,
          });
        }
      }

      setImagesToDelete([]);
      setNewImages([]);
      onUpdated();
      onClose();
      alert("✅ Product updated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[#2F8F4E]">
          <Edit2 className="w-5 h-5" /> Edit Product
        </h2>

        {/* Images Section */}
        <div className="mb-4">
          <span className="font-medium text-gray-700">Images</span>
          {images.length ? (
            <>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {images.map((img, index) => (
                  <div
                    key={img.img_id || img.temp_id || `img-${index}`}
                    className="relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    <img src={img.img_path} className="w-full h-24 object-cover" />
                    <input
                      type="checkbox"
                      checked={img.selected || false}
                      onChange={() => toggleSelectImage(img)}
                      className="absolute top-1 left-1 w-5 h-5 accent-[#2F8F4E]"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={deleteSelectedImages}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Delete Selected
              </button>
            </>
          ) : (
            <p className="text-gray-500 text-sm mt-1">No images yet.</p>
          )}
        </div>

        {/* Add new images */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Add Images</label>
          <input
            type="file"
            name="newImages"
            multiple
            accept="image/*"
            onChange={handleChange}
            className="w-full mt-1 border border-gray-300 rounded-lg p-2 bg-white"
          />
        </div>

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 bg-white"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 bg-white"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              name="price"
              placeholder="Price ₱"
              value={form.price}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 bg-white"
            />
            <input
              type="number"
              name="original_price"
              placeholder="Original ₱"
              value={form.original_price}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 bg-white"
            />
          </div>
          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 bg-white"
          >
            <option>New</option>
            <option>Like New</option>
            <option>Good</option>
            <option>Fair</option>
          </select>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#2F8F4E] text-white rounded-lg hover:bg-[#1E5631] transition"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
