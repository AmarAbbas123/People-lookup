import { useState } from "react";
import axios from "axios";
import ChatBot from "./components/ChatBot";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function App() {
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a CSV file first.");
    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(
        `CSV Uploaded! Parsed: ${data.parsedRows}, Total upserted: ${data.totalUpserted}`
      );
      setFile(null);
      setCsvUploaded(true);
    } catch (err) {
      alert("Upload failed. Please check the server logs.");
    } finally {
      setLoadingUpload(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column text-light"
      style={{
        background:
          "linear-gradient(135deg, #0f2027, #203a43, #2c5364)", // modern gradient background
      }}
    >
      {/* Header */}
      <header
        className="text-center py-5 shadow"
        style={{
          background: "linear-gradient(90deg, #1e3c72, #2a5298)",
        }}
      >
        <div className="container">
          <h1 className="display-4 fw-bold text-warning">⚡ People Finder</h1>
          <p className="lead text-light">
            Upload, Search, and Explore People Data with Ease
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container flex-grow-1 py-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* CSV Upload Section */}
            {!csvUploaded && (
              <section className="card bg-dark bg-opacity-50 shadow-lg mb-4 p-4 rounded-4 border-0">
                <h2 className="h4 border-bottom border-secondary pb-2 mb-3 text-info">
                  📂 Upload Your CSV
                </h2>
                <div className="row g-3 align-items-center">
                  <div className="col-md-8">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-4 text-md-end">
                    <button
                      className="btn btn-warning w-100 w-md-auto fw-bold"
                      onClick={handleUpload}
                      disabled={loadingUpload}
                    >
                      {loadingUpload ? "⏳ Uploading..." : "🚀 Upload CSV"}
                    </button>
                  </div>
                </div>
                <p className="mt-3 small">
                  <span className="fw-bold text-light">
                    Expected CSV headers:
                  </span>{" "}
                  <code className="text-success">
                    name, description, category, blockchain, device, status, nft,
                    f2p, p2e, p2e_score
                  </code>
                </p>
              </section>
            )}

            {/* ChatBot Section */}
            <section className="card bg-dark bg-opacity-50 shadow-lg p-4 rounded-4 border-0">
              <h2 className="h4 border-bottom border-secondary pb-2 mb-3 text-info">
                🤖 People Search Bot
              </h2>
              <p className="text-light">
                Ask me about anyone in your dataset. <br />
                <span className="badge bg-primary me-2">
                  Example: "Tell me about CryptoGame"
                </span>
                <span className="badge bg-success">
                  Example: "List all people in Gaming"
                </span>
              </p>
              <ChatBot />
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-3 text-center mt-auto"
        style={{
          background: "linear-gradient(90deg, #1e3c72, #2a5298)",
        }}
      >
        <p className="mb-1 text-warning">
          © {new Date().getFullYear()} People Finder | Made with ❤️ by Amar Abbas
        </p>
        <small className="text-light">
          All data is for demonstration purposes only.
        </small>
      </footer>
    </div>
  );
}
