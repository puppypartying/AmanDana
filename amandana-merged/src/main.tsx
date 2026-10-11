import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { cleanupLegacyCaches } from "@/lib/pwa"
import { applyCachedRules, refreshRules } from "@/lib/risk/remote"
import "./index.css"

// Service worker didaftarkan oleh UpdateToast (vite-plugin-pwa, mode prompt).
// Di sini hanya membersihkan cache dari service worker manual versi lama.
if ("caches" in window) void cleanupLegacyCaches(window.caches)

// Aturan deteksi: pakai salinan terbit terakhir (sinkron, sebelum render), lalu perbarui dari server di latar belakang.
// Gagal atau tidak valid berarti tetap memakai aturan yang ada; aplikasi tidak pernah menunggu server.
applyCachedRules()
void refreshRules()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
