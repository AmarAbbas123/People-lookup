// client/src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I’m your People Search Assistant. Ask me about anyone and I’ll fetch their details instantly.",
    },
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

      if (res.data.results && Array.isArray(res.data.results)) {
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
    <div style={styles.chatContainer}>
      {/* Header */}
      <div style={styles.chatHeader}>
        People Search Bot
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={styles.messagesContainer}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div style={{ ...styles.bubble, ...(m.sender === "user" ? styles.userBubble : styles.botBubble) }}>
              {!m.isCard && <div>{m.text}</div>}

              {m.isCard && m.person && (
                <div style={styles.card}>
                  <div style={styles.cardTitle}>{m.person.name}</div>
                  {m.person.description && <div><b>Description:</b> {m.person.description}</div>}
                  {m.person.category && <div><b>Category:</b> {m.person.category}</div>}
                  {m.person.blockchain && <div><b>Blockchain:</b> {m.person.blockchain}</div>}
                  {m.person.device && <div><b>Device:</b> {m.person.device}</div>}
                  <div style={styles.cardFooter}><small>P2E score: {m.person.p2e_score ?? "—"}</small></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about a person, e.g. 'Tell me about John Doe'"
          style={styles.textarea}
        />
        <button onClick={handleSend} disabled={sending} style={styles.sendButton}>
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  chatContainer: {
    maxWidth: 800,
    margin: "30px auto",
    display: "flex",
    flexDirection: "column",
    height: "80vh",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    backgroundColor: "#1e293b",
  },
  chatHeader: {
    background: "linear-gradient(90deg, #3b82f6, #38bdf8)",
    color: "#fff",
    padding: "16px 20px",
    fontWeight: 700,
    fontSize: 18,
    textAlign: "center",
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
    background: "#0f172a",
  },
  bubble: {
    padding: "12px 16px",
    borderRadius: 16,
    maxWidth: "80%",
    whiteSpace: "pre-wrap",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  userBubble: {
    background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
    color: "#fff",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    background: "#1e293b",
    color: "#e2e8f0",
    borderBottomLeftRadius: 4,
  },
  card: {
    marginTop: 8,
    background: "#334155",
    padding: 12,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 4,
    color: "#38bdf8",
  },
  cardFooter: {
    marginTop: 6,
    color: "#94a3b8",
  },
  inputContainer: {
    display: "flex",
    gap: 8,
    padding: 12,
    background: "#0f172a",
  },
  textarea: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    border: "none",
    resize: "vertical",
    minHeight: 48,
    fontSize: 14,
    color: "#fff",
    backgroundColor: "#1e293b",
  },
  sendButton: {
    background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
    color: "#fff",
    border: "none",
    padding: "0 20px",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
