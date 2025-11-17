"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet-draw";
import { X } from "lucide-react";

// Dynamic imports (SSR disabled)
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const FeatureGroup = dynamic(() => import("react-leaflet").then(m => m.FeatureGroup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false });
const EditControl = dynamic(() => import("react-leaflet-draw").then(m => m.EditControl), { ssr: false });

export default function LeafletMapWithDraw({
  center = [14.5995, 120.9842],
  zoom = 15,
  radius = 300,
  onCircleChange = null,
  onClose = null,
  style,
  show = true, // control visibility for modals
  previewOnly = false, // NEW: true for preview maps
}) {
  const [circleData, setCircleData] = useState({ center, radius });
  const mapRef = useRef(null);

  const handleEdited = (e) => {
    e.layers.eachLayer((layer) => {
      if (layer instanceof L.Circle) {
        const c = layer.getLatLng();
        const r = layer.getRadius();

        setCircleData({ center: [c.lat, c.lng], radius: r });
        onCircleChange?.({ lat: c.lat, lng: c.lng, radius: r });
      }
    });
  };

  // Fix disappearing map issue: invalidate size when modal opens
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 100);
    }
  }, [show]);

  return (
    <div
      style={{
        width: "100%",
        height: style?.height || "100%",
        position: "relative",
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
        transition: "opacity 0.2s",
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 border"
        >
          <X size={20} className="text-gray-600" />
        </button>
      )}

      <MapContainer
        whenCreated={(map) => (mapRef.current = map)}
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl
        scrollWheelZoom={!previewOnly} // disable scroll on preview
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <FeatureGroup>
          <Circle
            center={circleData.center}
            radius={circleData.radius}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.3 }}
          />

          {/* Only show EditControl if NOT preview */}
          {!previewOnly && (
            <EditControl
              position="topleft"
              draw={{
                rectangle: false,
                polyline: false,
                polygon: false,
                marker: false,
                circlemarker: false,
                circle: false,
              }}
              edit={{ edit: true, remove: false }}
              onEdited={handleEdited}
            />
          )}
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
