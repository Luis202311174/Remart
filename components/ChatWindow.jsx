"use client";
import { useEffect, useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  const supabase = createClientComponentClient();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(propChatId);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatPartnerEmail, setChatPartnerEmail] = useState("");
  const messagesEndRef = useRef(null);

  // ✅ Get logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    };
    fetchUser();
  }, [supabase]);

  // ✅ Load messages / lazy-create chat
  useEffect(() => {
    if (!currentUser) return;

    const loadChat = async () => {
      if (chatId) {
        const msgs = await fetchMessages(chatId);
        setMessages(msgs);
      } else if (sellerAuthId && productId) {
        const existingChat = await getChat(
          buyerAuthId || currentUser.id,
          sellerAuthId,
          productId
        );
        if (existingChat) {
          setChatId(existingChat.chat_id);
          const msgs = await fetchMessages(existingChat.chat_id);
          setMessages(msgs);
        }
      }
    };

    loadChat();
  }, [currentUser, chatId, buyerAuthId, sellerAuthId, productId]);

  // ✅ Fetch chat partner info
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const fetchPartner = async () => {
      const { data: chat, error } = await supabase
        .from("chats")
        .select("buyer_auth_id,seller_auth_id")
        .eq("chat_id", chatId)
        .maybeSingle();

      if (!chat || error) return;

      const partnerId =
        chat.buyer_auth_id === currentUser.id
          ? chat.seller_auth_id
          : chat.buyer_auth_id;

      const { data: acc } = await supabase
        .from("acc")
        .select("email")
        .eq("auth_id", partnerId)
        .maybeSingle();

      setChatPartnerEmail(acc?.email || "Unknown User");
    };

    fetchPartner();
  }, [chatId, currentUser, supabase]);

  // ✅ Subscribe to new messages
  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToMessages(chatId, (msg) =>
      setMessages((prev) => [...prev, msg])
    );
    return unsub;
  }, [chatId]);

  // ✅ Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;

    const message = await sendMessageLazy({
      chat_id: chatId,
      buyer_auth_id: buyerAuthId || currentUser.id,
      seller_auth_id: sellerAuthId,
      product_id: productId,
      sender_auth_id: currentUser.id,
      content: input.trim(),
    });

    if (message) {
      setInput("");
      setChatId(message.chat_id || chatId);

      // Reload messages if chat just created
      if (message.chat_id && !chatId) {
        const msgs = await fetchMessages(message.chat_id);
        setMessages(msgs);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b bg-blue-600 text-white z-10">
        <h3 className="font-semibold text-lg truncate flex-1">
          {chatPartnerEmail ? `${chatPartnerEmail}'s Chat` : "Chat"}
        </h3>
        <button
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.message_id}
              className={`p-2 rounded-lg max-w-[80%] ${
                m.sender_auth_id === currentUser?.id
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {m.content}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
