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

  // Close modal on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        const { data: chatsData, error } = await supabase
          .from("chats")
          .select("chat_id,buyer_auth_id,seller_auth_id,product_id,created_at")
          .or(`buyer_auth_id.eq.${user.id},seller_auth_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const userIds = [
          ...new Set(chatsData.flatMap(c => [c.buyer_auth_id, c.seller_auth_id]))
        ].filter(Boolean);

        let profiles = [];
        if (userIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("auth_id,fname,lname,pfp")
            .in("auth_id", userIds);
          if (profileError) throw profileError;
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
          setSelectedChat(
            existingChat || {
              chat_id: null,
              seller_auth_id: chatTarget.seller_auth_id,
              buyer_auth_id: user.id,
              product_id: chatTarget.product_id,
            }
          );
        }
      } catch (err) {
        console.error("❌ fetchChats error:", err);
      }
    };

    fetchChats();
  }, [chatTarget, supabase]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-2 sm:p-6 bg-black/30">
      <div className="relative w-full max-w-[800px] h-[90vh] sm:h-[600px] flex flex-col md:flex-row bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">

        {/* Mobile Sidebar Toggle */}
        <button
          className="absolute top-4 left-4 md:hidden z-50 p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <List size={24} />
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          ✕
        </button>

        {/* Sidebar: Chat List */}
        <div
          className={`bg-gray-50 border-r md:flex flex-col w-full md:w-1/3 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-4 bg-blue-600 text-white font-semibold text-lg flex-shrink-0 rounded-tr-2xl">
            My Chats
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="text-gray-400 text-center mt-6 px-4 text-sm">
                No conversations yet.
              </p>
            ) : (
              chats.map((chat) => {
                const otherUserProfile =
                  currentUser?.id === chat.buyer_auth_id ? chat.seller : chat.buyer;
                const otherUserName = otherUserProfile
                  ? `${otherUserProfile.fname || ""} ${otherUserProfile.lname || ""}`.trim() || "Unknown User"
                  : "Unknown User";

                return (
                  <div
                    key={chat.chat_id || `${chat.buyer_auth_id}-${chat.seller_auth_id}-${chat.product_id}`}
                    className={`p-3 border-b cursor-pointer flex items-center space-x-3 hover:bg-blue-50 transition-colors rounded-lg ${
                      selectedChat?.chat_id === chat.chat_id ? "bg-blue-100" : ""
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium overflow-hidden">
                      {otherUserProfile?.pfp ? (
                        <img
                          src={otherUserProfile.pfp}
                          alt={otherUserName}
                          className="w-full h-full object-cover"
                        />
                      ) : otherUserName[0] || "U"}
                    </div>
                    <p className="font-medium text-gray-800 truncate">{otherUserName}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white relative">
          {selectedChat ? (
            <ChatWindow
              chatId={selectedChat.chat_id}
              buyerAuthId={selectedChat.buyer_auth_id}
              sellerAuthId={selectedChat.seller_auth_id}
              productId={selectedChat.product_id}
              onClose={onClose}
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
