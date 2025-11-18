"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import remarkGfm from "remark-gfm";

export default function ChatbotLayout({ onClose, productData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHeight, setChatHeight] = useState(400); // initial height in px
  const messagesEndRef = useRef(null);
  const resizerRef = useRef(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingRef.current) {
        const newHeight = window.innerHeight - e.clientY - 20;
        setChatHeight(Math.max(200, Math.min(newHeight, 600)));
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto"; // re-enable text selection
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResizing = () => {
    isResizingRef.current = true;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none"; // disable text selection
  };

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
    } catch (err) {
      console.error(err);
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
    <div
      className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-xl shadow-lg flex flex-col"
      style={{ height: chatHeight }}
    >
      {/* Resizer */}
      <div
        ref={resizerRef}
        onMouseDown={startResizing}
        className="h-2 cursor-ns-resize bg-gray-200 rounded-t-xl"
      />

      {/* Header */}
      <div className="flex justify-between items-center p-2 border-b border-gray-200">
        <h2 className="font-semibold text-sm">AI Assistant</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
          <FontAwesomeIcon icon={faX} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-2 overflow-y-auto space-y-2 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-1 rounded-lg max-w-[80%] break-words ${
              msg.sender === "user"
                ? "bg-blue-100 text-blue-800 self-end"
                : "bg-gray-100 text-gray-800"
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
          <div className="p-1 rounded-lg max-w-[50%] bg-gray-200 text-gray-600 animate-pulse">
            Typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-gray-200 flex gap-2">
        <textarea
          className="flex-1 p-1 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          rows={1}
          placeholder="Ask about this product..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendMessage}
          className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
