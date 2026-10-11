import { createBrowserRouter, RouterProvider } from "react-router"
import { Shell } from "@/app/Shell"
import { UpdateToast } from "@/components/UpdateToast"
import { AppStateProvider } from "@/state/AppState"

function Root() {
  return (
    <AppStateProvider>
      <Shell />
      <UpdateToast />
    </AppStateProvider>
  )
}

// basename mengikuti `base` Vite supaya rute benar saat dihosting di subpath ("/" di domain sendiri).
const router = createBrowserRouter(
  [
    // Panel admin dimuat sebagai chunk terpisah (admin-assets/) agar tidak ikut diunduh pengguna biasa.
    // Aksesnya dibatasi Cloudflare Access pada /admin dan /admin-assets/*, lihat docs/admin.md.
    { path: "admin", lazy: async () => ({ Component: (await import("@/admin/AdminPage")).default }) },
    { path: "*", Component: Root },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)
export default function App() {
  return <RouterProvider router={router} />
}
