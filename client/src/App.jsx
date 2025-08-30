import { useState, useRef } from "react";
import axios from "axios";
import ChatBot from "./components/ChatBot";
import { FaBars, FaTimes, FaUpload, FaRobot } from "react-icons/fa";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function App() {
  const [file, setFile] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const uploadRef = useRef(null);
  const chatRef = useRef(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

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
      className="min-vh-100 text-light"
      style={{
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        paddingTop: "60px",
      }}
    >
      {/* Header */}
      <header
        className="fixed-top shadow-sm"
        style={{
          backdropFilter: "blur(10px)",
          zIndex: 999,
          background: "#0F1C2B",
          transition: "0.3s",
        }}
      >
        <nav className="container d-flex justify-content-between align-items-center py-3">
          <div className="fw-bold fs-4 text-warning">⚡ People Finder</div>
          <button
            className="d-md-none btn text-light fs-4"
            onClick={toggleMenu}
            style={{
              transition: "0.3s",
              borderRadius: "8px",
              padding: "4px 8px",
              background: "rgba(255,255,255,0.1)",
            }}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
          <ul className="d-none d-md-flex list-unstyled gap-4 mb-0">
            <li style={{ cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</li>
            <li style={{ cursor: "pointer" }} onClick={() => scrollToSection(uploadRef)}>About</li>
            <li style={{ cursor: "pointer" }} onClick={() => scrollToSection(uploadRef)}>Upload</li>
            <li style={{ cursor: "pointer" }} onClick={() => scrollToSection(chatRef)}>ChatBot</li>
          </ul>
        </nav>
        {menuOpen && (
          <ul className="d-md-none list-unstyled text-center bg-gradient p-3 rounded-3 mx-3 mb-3 shadow-lg">
            <li className="py-2" style={{ cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</li>
            <li className="py-2" style={{ cursor: "pointer" }} onClick={() => scrollToSection(uploadRef)}>Upload</li>
            <li className="py-2" style={{ cursor: "pointer" }} onClick={() => scrollToSection(chatRef)}>ChatBot</li>
          </ul>
        )}
      </header>

{/* Hero Section */}
<section
  className="py-5"
  style={{
    backgroundImage: "url('https://nmgprod.s3.amazonaws.com/media/file/f6/4a/fc37aff9506cebee4f9ef1be7d16/cover_image__nagVey8S__AdobeStock_615000146.jpeg.960x540_q85_crop_upscale.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative",
    color: "#fff",
  }}
>
  {/* Gradient Overlay */}
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
     background: "linear-gradient(135deg, rgba(15,32,39,0.3), rgba(44,83,100,0.2))",
      zIndex: 1,
    }}
  ></div>

  <div className="container" style={{ position: "relative", zIndex: 2 }}>
    <div className="row align-items-center">
      {/* Left Side */}
      <div className="col-lg-6 mb-4 mb-lg-0">
        <h1 className="display-4 fw-bold mb-3">⚡ Explore Your People Dataset</h1>
        <p className="lead mb-4">
          Upload CSV files, interact with our intelligent chatbot, and get instant insights on anyone in your dataset.
        </p>
        <div className="d-flex gap-3 flex-wrap">
          {/* Upload CSV Button */}
          <button
            className="btn btn-warning w-auto fw-bold d-flex align-items-center gap-2"
            onClick={() => scrollToSection(uploadRef)}
            style={{
              background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(255,191,0,0.4)",
              border: "none",
              borderRadius: "12px",
              padding: "0.6rem 1.2rem",
            }}
          >
            <FaUpload /> Upload CSV
          </button>

          {/* Start ChatBot Button */}
          <button
            className="btn btn-primary w-auto fw-bold d-flex align-items-center gap-2"
            onClick={() => scrollToSection(chatRef)}
            style={{
              background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(59,130,246,0.4)",
              border: "none",
              borderRadius: "12px",
              padding: "0.6rem 1.2rem",
            }}
          >
            <FaRobot /> Start Chat
          </button>
        </div>
      </div>

      {/* Right Side - optional image */}
      <div className="col-lg-6 text-center">
        {/* You can hide this if background image is enough */}
        {/* <img
          src="/chatbot-illustration.png"
          alt="Chatbot Illustration"
          className="img-fluid rounded-4 shadow-lg"
          style={{ maxHeight: "400px" }}
        /> */}
      </div>
    </div>
  </div>
</section>

{/* Modern About Us Section */}

<section
  
  className="position-relative py-5 overflow-hidden"
  style={{
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    color: "#fff",
  }}
>
  {/* Decorative Background Shapes */}
  <div
    style={{
      position: "absolute",
      top: "-50px",
      left: "-50px",
      width: "300px",
      height: "300px",
      background: "rgba(255,255,255,0.05)",
      borderRadius: "50%",
      transform: "rotate(45deg)",
      zIndex: 0,
    }}
  ></div>
  <div
    style={{
      position: "absolute",
      bottom: "-60px",
      right: "-60px",
      width: "350px",
      height: "350px",
      background: "rgba(255,255,255,0.05)",
      borderRadius: "50%",
      transform: "rotate(-45deg)",
      zIndex: 0,
    }}
  ></div>

  <div className="container about-section position-relative" style={{ zIndex: 1 }}>
    <div className="row align-items-center">
      {/* Left Column - Text */}
      <div className="col-lg-6 mb-4 mb-lg-0">
        <h2 className="display-5 fw-bold mb-3">About Us</h2>
        <p className="lead mb-3">
          People Finder is an AI-powered platform to explore and interact with your datasets like never before.
        </p>
        <p className="mb-4">
          Our mission is to make data exploration fun, fast, and visually appealing. Perfect for communities, blockchain enthusiasts, and professional networks.
        </p>
        <button
          className="btn fw-bold d-flex align-items-center gap-2"
          style={{
            background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
            border: "none",
            borderRadius: "12px",
            padding: "0.6rem 1.5rem",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(255,191,0,0.4)",
            transition: "0.3s",
          }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 12px 25px rgba(255,191,0,0.6)"}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 8px 20px rgba(255,191,0,0.4)"}
        >
          Learn More
        </button>
      </div>

      {/* Right Column - Floating Image */}
      <div className="col-lg-6 text-center position-relative">
        <div
          className="shadow-lg rounded-4 overflow-hidden"
          style={{
            maxHeight: "400px",
            transition: "0.3s",
            transform: "translateY(0px)",
          }}
        >
          <img
            src="https://nkk.com.vn/wp-content/uploads/2025/08/nkktech-global-image-post-danh-gia-hieu-qua-chatbot-ai-bang-cac-chi-so-do-luong.jpg.webp"
            alt="About Us Illustration"
            className="img-fluid"
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
              borderRadius: "12px",
              transition: "transform 0.3s",
            }}
          />
        </div>
      </div>
    </div>
  </div>
</section>


     
{/* CSV Upload Section */}
      <main className="container flex-grow-1 py-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            
            {!csvUploaded && (
              <section
                ref={uploadRef}
                className="card bg-dark bg-opacity-50 shadow-lg mb-4 p-4 rounded-4 border-0"
              >
                <h2 className="h4 border-bottom border-secondary pb-2 mb-3 text-info">
                  📂 Upload Your CSV
                </h2>
                <div className="row g-3 align-items-center">
                  <div className="col-md-8">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="form-control bg-dark text-light border-1 border-secondary"
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
                  <span className="fw-bold text-light">Expected CSV headers:</span>{" "}
                  <code className="text-success">
                    name, description, category, blockchain, device, status, nft, f2p, p2e, p2e_score
                  </code>
                </p>
              </section>
            )}

            {/* ChatBot Section */}
            <section
              ref={chatRef}
              className="card bg-dark bg-opacity-50 shadow-lg p-4 rounded-4 border-0"
            >
              <h2 className="h4 border-bottom border-secondary pb-2 mb-3 text-info">
                🤖 People Search Bot
              </h2>
              <p className="text-light mb-3">
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
        className="py-4 mt-auto text-light"
        style={{ background: "#0F1C2B" }}
      >
        <div className="container">
          <div className="row align-items-start">
            {/* Logo */}
            <div className="col-md-4 mb-3 mb-md-0 text-center text-md-start">
              <span className="fw-bold fs-5 text-warning">⚡ People Finder</span>
              <p className="small text-light mt-1">
                Explore & search people data seamlessly
              </p>
            </div>

            {/* Footer Menu */}
            <div className="col-md-4 mb-3 mb-md-0 text-center">
              <h4 className="text-light mb-2">Menu</h4>
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                <li style={{ cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</li>
                <li style={{ cursor: "pointer" }} onClick={() => scrollToSection(uploadRef)}>Upload</li>
                <li style={{ cursor: "pointer" }} onClick={() => scrollToSection(chatRef)}>ChatBot</li>
              </ul>
            </div>

            {/* Footer Content */}
            <div className="col-md-4 text-center text-md-end">
              <p className="mb-1 small">Made with ❤️ by Amar Abbas</p>
              <p className="mb-1 small text-light">All data is for demonstration purposes only.</p>
              <div className="mt-2">
                <span className="badge bg-warning me-1">Fast</span>
                <span className="badge bg-info me-1">Secure</span>
                <span className="badge bg-success">Modern UI</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
