"use client";

import { useState, useEffect, useRef } from "react";
import { PlusCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";

// Dynamic Leaflet imports (SSR disabled)
const LeafletMapWithDraw = dynamic(() => import("@/components/LeafletMap"), { ssr: false });
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false });
let L;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

const defaultCenter = [14.5995, 120.9842];

export default function AddProduct() {
  const [categories, setCategories] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const [userLocation, setUserLocation] = useState(defaultCenter);

  const mapPreviewRef = useRef(null);

  const [form, setForm] = useState({
    cat_id: "",
    title: "",
    description: "",
    price: "",
    original_price: "",
    condition: "Good",
    images: [],
    lat: null,
    lng: null,
    radius: 300,
  });

  // Auto-hide success message
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // Get user's geolocation
  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  // Load seller + categories
  useEffect(() => {
    async function load() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return;

        const { data: sellerData } = await supabase
          .from("seller")
          .select("id")
          .eq("auth_id", auth.user.id)
          .single();

        setSeller(sellerData);

        const { data: cats } = await supabase
          .from("categories")
          .select("*")
          .order("cat_name", { ascending: true });

        setCategories(cats || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      setForm(f => ({ ...f, images: Array.from(files) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // Automatically pan/zoom the preview map to fit the circle
  useEffect(() => {
    if (mapPreviewRef.current && form.lat && form.lng) {
      const radiusInMeters = form.radius || 50;
      const lat = form.lat;
      const lng = form.lng;

      const pointA = L.latLng(lat + radiusInMeters / 111111, lng);
      const pointB = L.latLng(lat - radiusInMeters / 111111, lng);
      const pointC = L.latLng(lat, lng + radiusInMeters / (111111 * Math.cos(lat * Math.PI / 180)));
      const pointD = L.latLng(lat, lng - radiusInMeters / (111111 * Math.cos(lat * Math.PI / 180)));
      const bounds = L.latLngBounds([pointA, pointB, pointC, pointD]);

      mapPreviewRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [form.lat, form.lng, form.radius]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seller) return alert("Seller not found");
    if (!form.cat_id || !form.title || !form.price) return alert("Fill all required fields");
    if (form.lat === null || form.lng === null) return alert("Pick a location on the map");

    setLoading(true);

    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([{
          seller_id: seller.id,
          cat_id: form.cat_id,
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          original_price: form.original_price ? parseFloat(form.original_price) : null,
          condition: form.condition,
          lat: form.lat,
          lng: form.lng,
        }])
        .select("product_id")
        .single();

      if (productError) throw productError;
      const product_id = productData.product_id;

      // Upload images
      for (const img of form.images) {
        const fileName = `${Date.now()}_${img.name.replace(/\s+/g, "_")}`;
        const { data: file, error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(fileName, img);
        if (uploadErr) continue;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(file.path);

        await supabase.from("product_images").insert({
          product_id,
          img_path: urlData.publicUrl,
          storage_path: file.path,
        });
      }

      setSuccessMsg("✅ Product added successfully!");
      setForm({
        cat_id: "",
        title: "",
        description: "",
        price: "",
        original_price: "",
        condition: "Good",
        images: [],
        lat: null,
        lng: null,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white border rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <PlusCircle className="w-6 h-6" /> Add New Product
      </h2>

      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="text-sm text-gray-700">Category</label>
          <select
            name="cat_id"
            value={form.cat_id}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg mt-1"
          >
            <option value="">Select Category</option>
            {categories.map(c => (
              <option key={c.cat_id} value={c.cat_id}>{c.cat_name}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm text-gray-700">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className="w-full border p-2 rounded-lg mt-1"
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700">Price</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700">Original Price</label>
            <input
              type="number"
              name="original_price"
              value={form.original_price}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg mt-1"
            />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="text-sm text-gray-700">Condition</label>
          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg mt-1"
          >
            <option>New</option>
            <option>Like New</option>
            <option>Good</option>
            <option>Fair</option>
          </select>
        </div>

        {/* Pickup Location */}
        <div>
          <label className="text-sm text-gray-700">Pickup Location</label>
          <div
            className="w-full h-48 border rounded-lg overflow-hidden cursor-pointer relative"
            onClick={() => setShowMapModal(true)}
          >
            {!showMapModal && (
              <MapContainer
                center={form.lat && form.lng ? [form.lat, form.lng] : userLocation}
                zoom={15}
                style={{ width: "100%", height: "100%" }}
                whenCreated={(map) => (mapPreviewRef.current = map)}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {form.lat && form.lng && (
                  <Circle
                    center={[form.lat, form.lng]}
                    radius={form.radius}
                    pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.3 }}
                  />
                )}
              </MapContainer>
            )}
            {form.lat && form.lng && !showMapModal && (
              <div className="absolute top-2 left-2 text-sm text-gray-700 bg-white px-1 rounded">
                Lat: {form.lat.toFixed(5)}, Lng: {form.lng.toFixed(5)}
              </div>
            )}
          </div>
        </div>

        {/* Map Modal */}
        {showMapModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="relative w-11/12 h-5/6 bg-white rounded-lg overflow-hidden shadow-lg">
              <button
                onClick={() => setShowMapModal(false)}
                className="absolute top-3 right-3 z-[1000] bg-white shadow-md rounded-full p-2 hover:bg-gray-100 border"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>

              <LeafletMapWithDraw
                center={form.lat && form.lng ? [form.lat, form.lng] : userLocation}
                radius={form.radius}
                onCircleChange={({ lat, lng, radius }) => setForm(prev => ({ ...prev, lat, lng, radius }))}
                style={{ height: "100%" }}
              />
            </div>
          </div>
        )}

        {/* Images */}
        <div>
          <label className="text-sm text-gray-700">Images</label>
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="w-full border p-2 rounded-lg mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
