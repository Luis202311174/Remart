"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import remarkGfm from "remark-gfm";

export default function ChatbotLayout({ productData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, context: productData }),
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
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Icon */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition text-lg"
        >
          🤖
        </button>
      </div>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-h-[70vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden transition-transform transform">
          {/* Header */}
          <div className="flex justify-between items-center bg-blue-600 text-white p-3 rounded-t-2xl">
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-blue-500 rounded-full">
              <FontAwesomeIcon icon={faX} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg max-w-[75%] break-words ${
                  msg.sender === "user"
                    ? "bg-blue-100 text-blue-800 self-end"
                    : "bg-gray-100 text-gray-800 self-start"
                }`}
              >
                {msg.sender === "bot" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {isTyping && (
              <div className="p-2 rounded-lg max-w-[50%] bg-gray-200 text-gray-600 animate-pulse">
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-gray-200 flex gap-2">
            <textarea
              className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={1}
              placeholder="Ask about this product..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
