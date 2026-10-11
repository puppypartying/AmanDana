import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { cleanupLegacyCaches } from "@/lib/pwa"
import "./index.css"

// Service worker didaftarkan oleh UpdateToast (vite-plugin-pwa, mode prompt).
// Di sini hanya membersihkan cache dari service worker manual versi lama.
if ("caches" in window) void cleanupLegacyCaches(window.caches)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
