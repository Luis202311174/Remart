"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatWindow from "./ChatWindow";
import { List } from "lucide-react";

export default function ChatLayout({ onClose, chatTarget = null }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setCurrentUser(null);
      setCurrentUser(user);

      const { data: chatsData, error } = await supabase
        .from("chats")
        .select("chat_id,buyer_auth_id,seller_auth_id,product_id,created_at")
        .or(`buyer_auth_id.eq.${user.id},seller_auth_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) return console.error(error);

      const userIds = [...new Set(chatsData.flatMap(c => [c.buyer_auth_id, c.seller_auth_id]))];
      let profiles = [];
      if (userIds.length) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("auth_id,fname,lname,pfp")
          .in("auth_id", userIds);
        profiles = profileData || [];
      }

      const mergedChats = chatsData.map(c => ({
        ...c,
        buyer: profiles.find(p => p.auth_id === c.buyer_auth_id) || null,
        seller: profiles.find(p => p.auth_id === c.seller_auth_id) || null,
      }));

      setChats(mergedChats);

      if (chatTarget?.seller_auth_id && chatTarget?.product_id) {
        const existingChat = mergedChats.find(
          c =>
            c.seller_auth_id === chatTarget.seller_auth_id &&
            c.buyer_auth_id === user.id &&
            String(c.product_id) === String(chatTarget.product_id)
        );
        setSelectedChat(existingChat || {
          chat_id: null,
          seller_auth_id: chatTarget.seller_auth_id,
          buyer_auth_id: user.id,
          product_id: chatTarget.product_id,
        });
      }
    };

    fetchChats();
  }, [chatTarget]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-2 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-[700px] h-[75vh] sm:h-[500px] flex flex-col md:flex-row bg-black text-white rounded-xl shadow-2xl overflow-hidden border border-green-600">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-green-600 hover:bg-green-700 shadow-lg z-50 text-white"
        >
          ✕
        </button>

        {/* Mobile Sidebar Toggle */}
        <button
          className="absolute top-3 left-3 md:hidden z-50 p-2 rounded-full bg-green-600 hover:bg-green-700 shadow-lg focus:outline-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <List size={20} />
        </button>

        {/* Sidebar */}
        <div
          className={`bg-gray-900 border-r border-green-600 md:flex flex-col w-full md:w-1/3 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-3 bg-green-600 text-white font-semibold text-md flex-shrink-0 rounded-tr-lg">
            My Chats
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="text-gray-400 text-center mt-4 px-3 text-sm">
                No conversations yet.
              </p>
            ) : (
              chats.map(chat => {
                const otherUser =
                  currentUser?.id === chat.buyer_auth_id ? chat.seller : chat.buyer;
                const name = otherUser ? `${otherUser.fname || ""} ${otherUser.lname || ""}`.trim() || "Unknown User" : "Unknown User";

                return (
                  <div
                    key={chat.chat_id || `${chat.buyer_auth_id}-${chat.seller_auth_id}-${chat.product_id}`}
                    className={`p-2 border-b cursor-pointer flex items-center space-x-2 hover:bg-green-800 transition-colors rounded-lg ${
                      selectedChat?.chat_id === chat.chat_id ? "bg-green-700" : ""
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden">
                      {otherUser?.pfp ? (
                        <img src={otherUser.pfp} alt={name} className="w-full h-full object-cover" />
                      ) : name[0] || "U"}
                    </div>
                    <p className="font-medium text-white truncate">{name}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-gray-900 relative">
          {selectedChat ? (
            <ChatWindow
              key={`${selectedChat.chat_id || "new"}-${selectedChat.buyer_auth_id}-${selectedChat.seller_auth_id}-${selectedChat.product_id}`}
              chatId={selectedChat.chat_id}
              buyerAuthId={selectedChat.buyer_auth_id}
              sellerAuthId={selectedChat.seller_auth_id}
              productId={selectedChat.product_id}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-center p-4">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
