import { RefreshCw } from "lucide-react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { UPDATE_CHECK_INTERVAL_MS } from "@/lib/pwa"

/** Pemberitahuan "Versi baru tersedia". Versi baru baru dipakai setelah pengguna memilih Muat ulang. */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => {
        if (!navigator.onLine) return
        registration.update().catch(() => {})
      }, UPDATE_CHECK_INTERVAL_MS)
    },
  })

  if (!needRefresh) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md border border-border bg-card p-4 shadow-[0_8px_28px_-10px_rgba(22,58,65,0.45)] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:mx-0"
    >
      <p className="text-sm font-bold">Versi baru tersedia.</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Muat ulang untuk memakai versi terbaru. Data yang tersimpan di perangkat ini tidak hilang.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="flex min-h-12 items-center justify-center gap-2 bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:bg-[var(--tone-hover-176477)]"
        >
          <RefreshCw size={15} aria-hidden="true" /> Muat ulang
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="flex min-h-12 items-center justify-center border border-border px-3 text-xs font-semibold text-primary transition hover:bg-secondary"
        >
          Nanti saja
        </button>
      </div>
    </div>
  )
}
