"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ChatWindow from "./ChatWindow";

export default function ChatLayout({ onClose, chatTarget = null }) {
  const supabase = createClientComponentClient();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        // ✅ Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        // ✅ Fetch all chats involving current user
        const { data: chatsData, error } = await supabase
          .from("chats")
          .select("chat_id,buyer_auth_id,seller_auth_id,product_id,created_at")
          .or(`buyer_auth_id.eq.${user.id},seller_auth_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // ✅ Collect unique user IDs to fetch emails
        const userIds = [
          ...new Set(chatsData.flatMap(c => [c.buyer_auth_id, c.seller_auth_id]))
        ].filter(Boolean);

        let profiles = [];
        if (userIds.length > 0) {
          const { data: accProfiles } = await supabase
            .from("acc")
            .select("auth_id,email")
            .in("auth_id", userIds);
          profiles = accProfiles || [];
        }

        // ✅ Merge emails into chat objects
        const mergedChats = chatsData.map(c => ({
          ...c,
          buyer: profiles.find(p => p.auth_id === c.buyer_auth_id) || null,
          seller: profiles.find(p => p.auth_id === c.seller_auth_id) || null,
        }));

        setChats(mergedChats);

        // ✅ Handle chatTarget (from product page)
        if (chatTarget?.seller_auth_id && chatTarget?.product_id) {
          const existingChat = mergedChats.find(
            c =>
              c.seller_auth_id === chatTarget.seller_auth_id &&
              c.buyer_auth_id === user.id &&
              String(c.product_id) === String(chatTarget.product_id)
          );

          if (existingChat) {
            setSelectedChat(existingChat);
          } else {
            // Lazy-create chat placeholder
            setSelectedChat({
              chat_id: null,
              seller_auth_id: chatTarget.seller_auth_id,
              buyer_auth_id: user.id,
              product_id: chatTarget.product_id,
            });
          }
        }
      } catch (err) {
        console.error("❌ fetchChats error:", err);
      }
    };

    fetchChats();
  }, [chatTarget, supabase]);

  return (
    <div className="fixed bottom-6 right-6 flex justify-end items-end z-[9999]">
      <div className="relative bg-white border shadow-2xl rounded-2xl w-[700px] h-[500px] flex overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-50"
        >
          ✕
        </button>

        {/* Sidebar: Chat List */}
        <div className="w-1/3 border-r bg-gray-50 flex flex-col">
          <div className="p-3 border-b bg-blue-600 text-white rounded-tl-2xl font-semibold">
            My Chats
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="text-gray-400 text-center mt-10 text-sm">
                No conversations yet.
              </p>
            ) : (
              chats.map((chat) => {
                const otherUser =
                  currentUser?.id === chat.buyer_auth_id
                    ? chat.seller?.email
                    : chat.buyer?.email;

                return (
                  <div
                    key={chat.chat_id || `${chat.buyer_auth_id}-${chat.seller_auth_id}-${chat.product_id}`}
                    className={`p-3 border-b cursor-pointer hover:bg-blue-50 ${
                      selectedChat?.chat_id === chat.chat_id ? "bg-blue-100" : ""
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <p className="font-medium text-gray-800">
                      Chat with {otherUser || "Unknown User"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow
              chatId={selectedChat.chat_id}
              buyerAuthId={selectedChat.buyer_auth_id}
              sellerAuthId={selectedChat.seller_auth_id}
              productId={selectedChat.product_id}
              onClose={onClose}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
