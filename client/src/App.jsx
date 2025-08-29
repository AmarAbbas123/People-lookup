import { useState } from "react";
import axios from "axios";
import ChatBot from "./components/ChatBot";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function App() {
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false); // track CSV upload

  const handleUpload = async () => {
    if (!file) return alert("Please select a CSV file first.");
    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`CSV Uploaded! Parsed: ${data.parsedRows}, Total upserted: ${data.totalUpserted}`);
      setFile(null);
      setCsvUploaded(true); // hide CSV section after success
    } catch (err) {
      alert("Upload failed. Please check the server logs.");
    } finally {
      setLoadingUpload(false);
    }
  };

  return (
    <div style={styles.appBackground}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>People Finder</h1>
        <p style={styles.headerSubtitle}>Upload, Search, and Explore People Data Easily</p>
      </header>

      {/* Main Content */}
      <div style={styles.container}>
        {/* CSV Upload Section */}
        {!csvUploaded && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Upload Your CSV</h2>
            <div style={styles.uploadContainer}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={styles.fileInput}
              />
              <button style={styles.button} onClick={handleUpload} disabled={loadingUpload}>
                {loadingUpload ? "Uploading..." : "Upload CSV"}
              </button>
            </div>
            <p style={styles.helperText}>
              Expected CSV headers:{" "}
              <code>name,description,category,blockchain,device,status,nft,f2p,p2e,p2e_score</code>
            </p>
          </section>
        )}

        {/* ChatBot Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>People Search Bot</h2>
          <p style={styles.chatIntro}>
            Ask me about anyone in your dataset. For example, type "Tell me about CryptoGame" or "List all people in Gaming".
          </p>
          <ChatBot />
        </section>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} People Finder. Made with ❤️ by Amar Abbas</p>
        <p style={{ fontSize: 12, color: "#94a3b8" }}>All data is for demonstration purposes only.</p>
      </footer>
    </div>
  );
}

const styles = {
  appBackground: {
    minHeight: "100vh",
    padding: 40,
    background: "linear-gradient(135deg, #0f172a, #1e293b, #334155)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: 800,
    color: "#38bdf8",
    textShadow: "0 4px 14px rgba(0,0,0,0.6)",
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 18,
    color: "#cbd5e1",
    marginTop: 8,
  },
  container: {
    maxWidth: 1000,
    width: "100%",
    padding: 32,
    fontFamily: "'Inter', sans-serif",
    color: "#e2e8f0",
  },
  section: {
    marginBottom: 36,
    padding: 28,
    borderRadius: 20,
    backgroundColor: "rgba(30,41,59,0.95)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.5)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  sectionTitle: {
    fontSize: 28,
    marginBottom: 18,
    fontWeight: 700,
    color: "#ffffff",
    borderBottom: "2px solid #475569",
    paddingBottom: 6,
  },
  chatIntro: {
    fontSize: 16,
    marginBottom: 20,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  uploadContainer: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  fileInput: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #475569",
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 15,
    flex: 1,
  },
  button: {
    padding: "12px 24px",
    borderRadius: 12,
    border: "none",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 15,
    transition: "all 0.2s ease-in-out",
    boxShadow: "0 6px 16px rgba(59,130,246,0.5)",
  },
  helperText: {
    marginTop: 10,
    fontSize: 14,
    color: "#94a3b8",
  },
  footer: {
    marginTop: 60,
    textAlign: "center",
    padding: "20px 0",
    width: "100%",
    borderTop: "1px solid #475569",
    color: "#cbd5e1",
  },
};
