"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGauge, faUsers, faStore, faBoxOpen, faBookmark, faComments, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export default function AdminSidebar({ counts = {}, selected, onSelect, onLogout }) {
  return (
    <aside className="w-72 bg-[#A67C52] text-[#FAF3E3] rounded-xl p-4 border border-[#8C5E3C] shadow-md h-fit">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#FFF8E7]">Admin Panel</h3>
        <p className="text-sm text-[#F5E5D3]">Overview & management</p>
      </div>

      <nav className="flex flex-col gap-2">
        {[
          { key: "dashboard", icon: faGauge, label: "Dashboard", count: `${counts.users ?? 0} / ${counts.sellers ?? 0}` },
          { key: "users", icon: faUsers, label: "Users", count: counts.users },
          { key: "sellers", icon: faStore, label: "Sellers", count: counts.sellers },
          { key: "products", icon: faBoxOpen, label: "Products", count: counts.products },
          { key: "saved", icon: faBookmark, label: "Saved Products", count: counts.cart },
          { key: "chats", icon: faComments, label: "Chats", count: counts.chats },
        ].map(item => (
          <button
            key={item.key}
            className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm transition-colors
              ${selected === item.key 
                ? 'bg-[#8C5E3C] text-[#FAF3E3]' 
                : 'hover:bg-[#8F6B4B] text-[#FFF8E7]'}`}
            onClick={() => onSelect(item.key)}
          >
            <FontAwesomeIcon icon={item.icon} />
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="ml-auto text-xs text-[#F5E5D3]">{item.count}</span>
            )}
          </button>
        ))}

        <div className="border-t border-[#8C5E3C] mt-4 pt-4">
          <button
            className="flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm hover:bg-[#8F6B4B] transition-colors"
            onClick={onLogout}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
