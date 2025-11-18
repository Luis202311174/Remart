"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  getChat,
  fetchMessages,
  sendMessageLazy,
  subscribeToMessages,
} from "@/lib/chatService";

export default function ChatWindow({
  onClose,
  chatId: propChatId = null,
  buyerAuthId = null,
  sellerAuthId = null,
  productId = null,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(propChatId);
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerName, setPartnerName] = useState("Chat");
  const messagesEndRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (!currentUser) return;

    const loadChat = async () => {
      let activeChatId = chatId;
      if (!activeChatId && sellerAuthId && productId) {
        const existing = await getChat(
          buyerAuthId || currentUser.id,
          sellerAuthId,
          productId
        );
        if (existing) {
          activeChatId = existing.chat_id;
          setChatId(existing.chat_id);
        }
      }

      if (activeChatId) {
        const msgs = await fetchMessages(activeChatId);
        setMessages(msgs);
      }
    };

    loadChat();
  }, [currentUser, chatId, buyerAuthId, sellerAuthId, productId]);

  useEffect(() => {
    const loadPartner = async () => {
      if (!chatId && !sellerAuthId) return;

      const partnerId =
        currentUser?.id === buyerAuthId ? sellerAuthId : buyerAuthId;

      if (!partnerId) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("fname, lname")
        .eq("auth_id", partnerId)
        .maybeSingle();

      if (error) {
        console.error("❌ loadPartner error:", error);
        setPartnerName("Unknown User");
        return;
      }

      const name =
        profile?.fname || profile?.lname
          ? `${profile?.fname || ""} ${profile?.lname || ""}`.trim()
          : "Unknown User";

      setPartnerName(name);
    };

    loadPartner();
  }, [chatId, currentUser, buyerAuthId, sellerAuthId, supabase]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToMessages(chatId, (msg) =>
      setMessages((prev) => [...prev, msg])
    );
    return unsub;
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;

    const otherUserId =
      currentUser?.id === buyerAuthId ? sellerAuthId : buyerAuthId;

    const message = await sendMessageLazy({
      otherUserId,
      product_id: productId,
      content: input.trim(),
    });

    if (message) {
      setInput("");
      setChatId(message.chat_id || chatId);

      if (message.chat_id && !chatId) {
        const msgs = await fetchMessages(message.chat_id);
        setMessages(msgs);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white shadow-inner rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white rounded-t-2xl z-10">
        <h3 className="font-semibold text-lg truncate flex-1">
          Chat with {partnerName}
        </h3>
        <button
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-10 text-sm">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.message_id}
              className={`p-3 rounded-2xl max-w-[75%] break-words shadow-sm transition-all ${
                m.sender_auth_id === currentUser?.id
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {m.sender_name && (
                <p className="text-xs text-gray-500 mb-1">{m.sender_name}</p>
              )}
              <p className="text-sm">{m.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t flex gap-2 bg-white sticky bottom-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-2xl p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-2xl hover:bg-blue-700 text-sm disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
