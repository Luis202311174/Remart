// pages/_app.jsx
"use client";

import "@/styles/globals.css";
import { useState, useEffect } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import Layout from "@/components/Layout";
import ChatLayout from "@/components/ChatLayout";
import ChatbotLayout from "@/components/ChatbotLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faRobot } from "@fortawesome/free-solid-svg-icons";

export default function App({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotContext, setChatbotContext] = useState(null);

  useEffect(() => {
    const handleOpenChat = (e) => {
      setChatTarget(e.detail);
      setChatOpen(true);
    };
    const handleOpenChatbot = (e) => {
      setChatbotContext(e.detail || null);
      setChatbotOpen(true);
    };

    window.addEventListener("openChat", handleOpenChat);
    window.addEventListener("openChatbot", handleOpenChatbot);

    return () => {
      window.removeEventListener("openChat", handleOpenChat);
      window.removeEventListener("openChatbot", handleOpenChatbot);
    };
  }, []);

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <div className="relative min-h-screen flex flex-col font-inter bg-gradient-to-br from-emerald-50 to-white">
        <Layout>
          <Component {...pageProps} />
        </Layout>

        {/* Floating Chat & Chatbot Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-4 z-50">
          <button
            onClick={() => setChatOpen(true)}
            className="p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition"
            title="Open Chat"
          >
            <FontAwesomeIcon icon={faComments} size="lg" />
          </button>

          <button
            onClick={() => setChatbotOpen(true)}
            className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
            title="Open AI Assistant"
          >
            <FontAwesomeIcon icon={faRobot} size="lg" />
          </button>
        </div>

        {chatOpen && <ChatLayout onClose={() => setChatOpen(false)} chatTarget={chatTarget} />}
        {chatbotOpen && (
          <ChatbotLayout onClose={() => setChatbotOpen(false)} productData={chatbotContext?.product || null} />
        )}
      </div>
    </SessionContextProvider>
  );
}
