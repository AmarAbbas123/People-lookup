import { useState } from "react";
import axios from "axios";
import ChatBot from "./components/ChatBot";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function App() {
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Choose a CSV file first");
    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`CSV Uploaded! Parsed: ${data.parsedRows}, Total upserted: ${data.totalUpserted}`);
      setFile(null);
    } catch (err) {
      alert("Upload failed. Check server logs.");
    } finally {
      setLoadingUpload(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>People Lookup </h1>

      {/* CSV Upload Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}> Upload CSV</h2>
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
          CSV headers: <code>name,description,category,blockchain,device,status,nft,f2p,p2e,p2e_score</code>
        </p>
      </section>

      {/* ChatBot Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Chat with Bot</h2>
        <ChatBot />
      </section>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "40px auto",
    padding: 16,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#333",
  },
  title: {
    textAlign: "center",
    fontSize: 32,
    marginBottom: 24,
    color: "#dadee4ff",
  },
  section: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.05)",
    backgroundColor: "#f9fafb",
  },
  sectionTitle: {
    fontSize: 22,
    marginBottom: 12,
    color: "#111827",
  },
  uploadContainer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  fileInput: {
    padding: 8,
    borderRadius: 8,
    border: "1px solid #d1d5db",
  },
  button: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
    transition: "background-color 0.2s",
  },
  helperText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6b7280",
  },
};
