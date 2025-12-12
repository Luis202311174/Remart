"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX, faRobot, faUser } from "@fortawesome/free-solid-svg-icons";
import remarkGfm from "remark-gfm";

export default function ChatbotLayout({ productData, isOpen, onClose, condition }) {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Use condition passed from event, or default
  const defaultCondition = condition || "Respond in a friendly and helpful manner. Keep responses concise and relevant to the user's questions about the product.";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          context: productData,
          condition: defaultCondition
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      const botMessages = data.reply
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => ({ sender: "bot", text: line }));

      setMessages((prev) => [...prev, ...botMessages]);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Sorry, something went wrong." },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) return null;

  const suggestedPrompts = [
    "Is this legit?",
    "Is it available?",
    "Tell me more about this product",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-green-600 bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="flex justify-between items-center bg-black text-green-400 p-4 rounded-t-3xl shadow-md border-b border-green-600">
        <h2 className="font-semibold text-base">AI Assistant</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-green-600 rounded-full transition"
        >
          <FontAwesomeIcon icon={faX} />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 p-4 overflow-y-auto space-y-3 messages-container"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-end ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="flex-shrink-0 mr-2">
                <div className="bg-green-600 text-black w-7 h-7 flex items-center justify-center rounded-full text-sm">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
              </div>
            )}

            <div
              className={`p-3 rounded-2xl max-w-[75%] break-words whitespace-pre-wrap shadow-sm ${
                msg.sender === "user"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-700 text-white/90"
              }`}
            >
              {msg.sender === "bot" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>

            {msg.sender === "user" && (
              <div className="flex-shrink-0 ml-2">
                <div className="bg-green-600 text-black w-7 h-7 flex items-center justify-center rounded-full text-sm">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2">
            <div className="bg-gray-800 p-2 rounded-2xl max-w-[50%]">
              <div className="flex space-x-1">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce"></span>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce delay-300"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      <div className="p-3 border-t border-green-600 flex flex-wrap gap-2 bg-gray-900">
        {suggestedPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt)}
            className="px-3 py-1 bg-gray-800 text-green-400 rounded-full text-sm hover:bg-green-700 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-green-600 flex gap-3 bg-gray-900">
        <textarea
          ref={inputRef}
          className="flex-1 p-3 border border-green-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-gray-800 text-white overflow-hidden"
          rows={1}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        />
        <button
          onClick={() => sendMessage(input)}
          className="px-5 py-2 bg-green-600 text-black rounded-2xl hover:bg-green-500 transition text-sm"
        >
          Send
        </button>
      </div>

      {/* Custom scrollbar */}
      <style jsx>{`
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        .messages-container::-webkit-scrollbar-track {
          background: none;
        }
        .messages-container::-webkit-scrollbar-thumb {
          background-color: #16a34a;
          border-radius: 8px;
        }
        .messages-container::-webkit-scrollbar-thumb:hover {
          background-color: #22c55e;
        }
        /* Firefox */
        .messages-container {
          scrollbar-width: thin;
          scrollbar-color: #16a34a transparent;
        }
      `}</style>
    </div>
  );
}