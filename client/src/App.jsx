import { useState } from "react";
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export default function App() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [results, setResults] = useState([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Choose a CSV file first");
    setError("");
    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`Uploaded! Inserted: ${data.inserted}`);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleSearch = async () => {
    if (!name.trim()) return;
    setError("");
    setLoadingSearch(true);
    try {
      const { data } = await API.get("/people", { params: { name } });
      setResults(data);
      if (data.length === 0) {
        alert("No person found");
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "ui-sans-serif" }}>
      <h2>People Lookup (CSV → MongoDB → Search)</h2>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>1) Upload CSV</h3>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginRight: 8 }}
        />
        <button onClick={handleUpload} disabled={loadingUpload}>
          {loadingUpload ? "Uploading..." : "Upload CSV"}
        </button>
        <p style={{ color: "#555", marginTop: 8 }}>
          CSV headers example: <code>name,description,category,blockchain,device,status,nft,f2p,p2e,p2e_score</code>
        </p>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>2) Search by Name</h3>
        <input
          type="text"
          placeholder="e.g. CryptoGame"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, marginRight: 8, width: 280 }}
        />
        <button onClick={handleSearch} disabled={loadingSearch}>
          {loadingSearch ? "Searching..." : "Search"}
        </button>

        {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

        {results.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4>Results ({results.length})</h4>
            {results.map((p) => (
              <div
                key={p._id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 18 }}>{p.name || "—"}</div>
                <div><b>Description:</b> {p.description || "—"}</div>
                <div><b>Category:</b> {p.category || "—"}</div>
                <div><b>Blockchain:</b> {p.blockchain || "—"}</div>
                <div><b>Device:</b> {p.device || "—"}</div>
                <div><b>Status:</b> {p.status || "—"}</div>
                <div><b>NFT:</b> {p.nft || "—"}</div>
                <div><b>F2P:</b> {p.f2p || "—"}</div>
                <div><b>P2E:</b> {p.p2e || "—"}</div>
                <div><b>P2E Score:</b> {p.p2e_score || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
