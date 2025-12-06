"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getChat, fetchMessages, sendMessageLazy, subscribeToMessages } from "@/lib/chatService";

export default function ChatWindow({ chatId: propChatId = null, buyerAuthId, sellerAuthId, productId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(propChatId);
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerName, setPartnerName] = useState("Chat");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setChatId(propChatId || null);
    setMessages([]);
  }, [propChatId, productId]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const loadChat = async () => {
      setLoading(true);
      let activeId = chatId;

      if (!activeId && sellerAuthId && productId) {
        const existing = await getChat(buyerAuthId || currentUser.id, sellerAuthId, productId);
        if (existing) {
          activeId = existing.chat_id;
          setChatId(existing.chat_id);
        }
      }

      if (activeId) {
        const msgs = await fetchMessages(activeId);
        setMessages(msgs || []);
      }

      setLoading(false);
    };

    loadChat();
  }, [currentUser, buyerAuthId, sellerAuthId, chatId, productId]);

  useEffect(() => {
    if (!currentUser) return;

    const loadPartner = async () => {
      let partnerId = currentUser.id === buyerAuthId ? sellerAuthId : buyerAuthId;
      if (!partnerId) partnerId = sellerAuthId || buyerAuthId || null;

      if (!partnerId) {
        setPartnerName("Unknown User");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("fname,lname")
        .eq("auth_id", partnerId)
        .maybeSingle();

      const name = profile?.fname || profile?.lname
        ? `${profile?.fname || ""} ${profile?.lname || ""}`.trim()
        : "Unknown User";

      setPartnerName(name);
    };

    loadPartner();
  }, [chatId, currentUser, buyerAuthId, sellerAuthId]);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = subscribeToMessages(chatId, (msg) => setMessages((prev) => [...prev, msg]));
    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;

    const otherUserId = currentUser.id === buyerAuthId ? sellerAuthId : buyerAuthId;

    const message = await sendMessageLazy({
      otherUserId,
      product_id: productId,
      content: input.trim(),
    });

    if (message?.chat_id && !chatId) setChatId(message.chat_id);

    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 shadow-inner rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-black rounded-t-2xl">
        <h3 className="font-semibold text-lg truncate text-green-500">Chat with {partnerName}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-800 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-transparent">
        {loading ? (
          <p className="text-gray-400 text-center mt-10 text-sm">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-10 text-sm">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.message_id}
              className={`p-3 rounded-2xl max-w-[75%] break-words shadow-sm ${
                m.sender_auth_id === currentUser?.id
                  ? "ml-auto bg-gray-300 text-black"
                  : "bg-gray-600 text-white"
              }`}
            >
              <p className="text-sm">{m.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-700 flex gap-2 bg-gray-900">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-700 rounded-2xl p-3 text-sm bg-black text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 resize-none overflow-hidden"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-2xl hover:bg-green-700 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #16a34a;
          border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #22c55e;
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #16a34a transparent;
        }
      `}</style>
    </div>
  );
}
