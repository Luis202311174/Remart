"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGauge, faUsers, faStore, faBoxOpen, faBookmark, faComments, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

export default function AdminSidebar({ counts = {}, selected, onSelect, onLogout }) {
  return (
    <aside className="w-72 bg-gray-900 text-gray-100 rounded-xl p-4 border border-gray-800 shadow-sm h-fit">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-300">Admin Panel</h3>
        <p className="text-sm text-gray-400">Overview & management</p>
      </div>

      <nav className="flex flex-col gap-2">
        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm ${selected === 'dashboard' ? 'bg-green-600 text-black' : 'hover:bg-gray-800'}`}
          onClick={() => onSelect('dashboard')}
        >
          <FontAwesomeIcon icon={faGauge} />
          <span>Dashboard</span>
          <span className="ml-auto text-xs text-gray-300">{counts.users ?? 0} / {counts.sellers ?? 0}</span>
        </button>

        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm ${selected === 'users' ? 'bg-green-600 text-black' : 'hover:bg-gray-800'}`}
          onClick={() => onSelect('users')}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span>Users</span>
          <span className="ml-auto text-xs text-gray-300">{counts.users ?? 0}</span>
        </button>

        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm ${selected === 'sellers' ? 'bg-green-600 text-black' : 'hover:bg-gray-800'}`}
          onClick={() => onSelect('sellers')}
        >
          <FontAwesomeIcon icon={faStore} />
          <span>Sellers</span>
          <span className="ml-auto text-xs text-gray-300">{counts.sellers ?? 0}</span>
        </button>

        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm ${selected === 'products' ? 'bg-green-600 text-black' : 'hover:bg-gray-800'}`}
          onClick={() => onSelect('products')}
        >
          <FontAwesomeIcon icon={faBoxOpen} />
          <span>Products</span>
          <span className="ml-auto text-xs text-gray-300">{counts.products ?? 0}</span>
        </button>

        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm ${selected === 'saved' ? 'bg-green-600 text-black' : 'hover:bg-gray-800'}`}
          onClick={() => onSelect('saved')}
        >
          <FontAwesomeIcon icon={faBookmark} />
          <span>Saved Products</span>
          <span className="ml-auto text-xs text-gray-300">{counts.cart ?? 0}</span>
        </button>

        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm ${
            selected === 'chats' ? 'bg-green-600 text-black' : 'hover:bg-gray-800'
          }`}
          onClick={() => onSelect('chats')}
        >
          <FontAwesomeIcon icon={faComments} />
          <span>Chats</span>
          <span className="ml-auto text-xs text-gray-300">{counts.chats ?? 0}</span>
        </button>

        <div className="border-t border-gray-800 mt-4 pt-4">
          <button
            className="flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm hover:bg-gray-800"
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
