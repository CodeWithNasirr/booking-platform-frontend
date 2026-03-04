"use client";

import { useState } from "react";
import { useTenantTheme } from "../contexts/TenantThemeContext";

export default function ChatModule({ settings, tenantId, lang }) {
  const theme = useTenantTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const {
    variant = "floating",
    position = "bottom-right",
    welcome_message,
    offline_message,
  } = settings || {};

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  };

  if (variant === "floating") {
    return (
      <>
        {/* Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed ${positionClasses[position]} z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110`}
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>

        {/* Chat Window */}
        {isOpen && (
          <div className={`fixed ${positionClasses[position]} z-50 mb-20 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden`}>
            {/* Header */}
            <div 
              className="p-4 text-white"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              <h3 className="font-semibold">Chat with us</h3>
              <p className="text-sm opacity-80">We typically reply within minutes</p>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && welcome_message && (
                <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                  {typeof welcome_message === "object" 
                    ? welcome_message[lang] || welcome_message.en 
                    : welcome_message}
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 text-sm ${
                    msg.from === "user"
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-gray-100 text-gray-700"
                  } max-w-[80%] ${msg.from === "user" ? "ml-auto" : ""}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && input.trim()) {
                      setMessages([...messages, { from: "user", text: input }]);
                      setInput("");
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (input.trim()) {
                      setMessages([...messages, { from: "user", text: input }]);
                      setInput("");
                    }
                  }}
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center"
                  style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}