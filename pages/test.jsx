"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

export default function CircleEditMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    // Import leaflet only in the browser
    const L = require("leaflet");
    require("leaflet-draw");

    if (mapRef.current) return;

    const map = L.map("map", {
      center: [14.5995, 120.9842],
      zoom: 14,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    const circle = L.circle([14.5995, 120.9842], {
      radius: 300,
      color: "blue",
      fillColor: "blue",
      fillOpacity: 0.3,
    }).addTo(map);

    const fg = L.featureGroup([circle]).addTo(map);

    const drawControl = new L.Control.Draw({
      draw: false,
      edit: {
        featureGroup: fg,
        edit: true,
        remove: false,
      },
    });

    map.addControl(drawControl);

    circle.on("click", () => {
      const toolbar = drawControl._toolbars.edit;
      toolbar._modes.edit.handler.enable();
      document.getElementById("editModal").style.display = "block";
    });
  }, []);

  const closeModal = () => {
    document.getElementById("editModal").style.display = "none";
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div id="map" style={{ width: "100%", height: "100%" }}></div>

      <div
        id="editModal"
        style={{
          display: "none",
          position: "absolute",
          top: 20,
          right: 20,
          background: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <span
          onClick={closeModal}
          style={{
            float: "right",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "20px",
          }}
        >
          ×
        </span>
        <p>Circle is editable. Drag handles to resize or move.</p>
      </div>
    </div>
  );
}
