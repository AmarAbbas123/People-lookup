import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hi! I’m your People Search Assistant. Ask me about anyone!" }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const addMessage = (msg) => setMessages((m) => [...m, msg]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    addMessage({ sender: "user", text: userText });
    setInput("");
    setSending(true);

    try {
     
      const answer = res.data.answer || "Sorry, no info found.";
      addMessage({ sender: "bot", text: answer });

      if (res.data.results && Array.isArray(res.data.results)) {
        // Remove duplicates by name
        const uniqueResults = Array.from(
          new Map(res.data.results.map(p => [p.name, p])).values()
        );

        uniqueResults.forEach(person => {
          addMessage({ sender: "bot", isCard: true, person });
        });
      }
    } catch (err) {
      addMessage({ sender: "bot", text: "❌ Server error." });
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container my-4">
      <div
        className="card rounded-4 shadow-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          display: "flex",
          flexDirection: "column",
          minHeight: "75vh",
        }}
      >
        {/* Header */}
        <div
          className="text-center fw-bold"
          style={{
            background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
            color: "#fff",
            padding: "14px 0",
            fontSize: "1.2rem",
          }}
        >
          🤖 People Search Bot
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-grow-1 p-3 overflow-auto"
          style={{ background: "#0f172a" }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`d-flex mb-3 ${m.sender === "user" ? "justify-content-end" : "justify-content-start"}`}
            >
              <div
                className="p-3 rounded-3 shadow-sm"
                style={{
                  maxWidth: "75%",
                  background: m.sender === "user" ? "linear-gradient(90deg, #3b82f6, #06b6d4)" : "#1e293b",
                  color: m.sender === "user" ? "#fff" : "#e2e8f0",
                }}
              >
                {!m.isCard && <div>{m.text}</div>}

                {m.isCard && m.person && (
                  <div
                    className="p-3 mb-2"
                    style={{
                      
                      borderLeft: "4px solid #3b82f6",
                      borderRadius: "12px",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.4)"
                    }}
                  >
                    <h6 className="fw-bold text-info">{m.person.name}</h6>
                    {m.person.description && <p className="mb-1"><b>Description:</b> {m.person.description}</p>}
                    {m.person.category && <p className="mb-1"><b>Category:</b> {m.person.category}</p>}
                    {m.person.blockchain && <p className="mb-1"><b>Blockchain:</b> {m.person.blockchain}</p>}
                    {m.person.device && <p className="mb-1"><b>Device:</b> {m.person.device}</p>}
                    {m.person.status && <p className="mb-1"><b>Status:</b> {m.person.status}</p>}
                    {m.person.nft && <p className="mb-1"><b>NFT:</b> {m.person.nft}</p>}
                    {m.person.f2p && <p className="mb-1"><b>F2P:</b> {m.person.f2p}</p>}
                    {m.person.p2e && <p className="mb-1"><b>P2E:</b> {m.person.p2e}</p>}
                    {m.person.p2e_score && <p className="mb-1"><b>P2E Score:</b> {m.person.p2e_score}</p>}
                    
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-top d-flex flex-column flex-md-row gap-2" style={{ background: "#1e293b" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about a person, e.g. 'Tell me about John Doe'"
            className="form-control bg-dark text-light border-0 rounded-3"
            style={{ minHeight: "48px" }}
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="btn fw-bold px-4 rounded-3"
            style={{ background: "linear-gradient(90deg, #3b82f6, #06b6d4)", color: "#fff" }}
          >
            {sending ? "⏳ Sending..." : "🚀 Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
