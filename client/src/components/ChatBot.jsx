// client/src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi 👋 I’m your People Search Bot. Ask me about anyone (e.g. 'Tell me about CryptoGame')." },
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
      const res = await API.post("/chat", { question: userText });
      const answer = res.data.answer || "Sorry, I couldn't find information.";
      addMessage({ sender: "bot", text: answer });

      // if structure results exist, add them as additional messages (cards)
      if (res.data.results && Array.isArray(res.data.results)) {
        // show up to 5 structured items as separate messages
        res.data.results.slice(0, 5).forEach((p) => {
          addMessage({ sender: "bot", isCard: true, person: p });
        });
      }
    } catch (err) {
      addMessage({ sender: "bot", text: "❌ Error: Could not reach server." });
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
    <div style={{ maxWidth: 800, margin: "30px auto", border: "1px solid #ddd", borderRadius: 8, display: "flex", flexDirection: "column", height: "80vh" }}>
      <div style={{ background: "#0b5fff", color: "white", padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8, fontWeight: 600 }}>People Search Bot</div>

      <div ref={scrollRef} style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f7f7f7" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.sender === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              background: m.sender === "user" ? "#0b5fff" : "#fff",
              color: m.sender === "user" ? "white" : "#111",
              padding: 12,
              borderRadius: 12,
              maxWidth: "85%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              whiteSpace: "pre-wrap",
            }}>
              {!m.isCard && <div>{m.text}</div>}

              {m.isCard && m.person && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{m.person.name}</div>
                  {m.person.description && <div><b>Description:</b> {m.person.description}</div>}
                  {m.person.category && <div><b>Category:</b> {m.person.category}</div>}
                  {m.person.blockchain && <div><b>Blockchain:</b> {m.person.blockchain}</div>}
                  {m.person.device && <div><b>Device:</b> {m.person.device}</div>}
                  <div style={{ marginTop: 6, color: "#666" }}><small>P2E score: {m.person.p2e_score ?? "—"}</small></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 12, display: "flex", gap: 8, background: "#fff", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about a person, e.g. 'Tell me about John Doe' or 'List people in gaming'"
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ddd", resize: "vertical", minHeight: 40 }}
        />
        <button onClick={handleSend} disabled={sending} style={{ background: "#0b5fff", color: "white", padding: "8px 14px", borderRadius: 8, border: "none" }}>
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
