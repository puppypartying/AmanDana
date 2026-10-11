import {
  useEffect,
  useRef,
  useState,
} from "react"
import {
  useLocation,
  useNavigate,
} from "react-router"
import {
  ChevronRight,
  Moon,
  Settings2,
  ShieldCheck,
  Sun,
} from "lucide-react"
import {
  Brand,
} from "@/components/Brand"
import {
  MiniLabel,
} from "@/components/MiniLabel"
import {
  tabs,
} from "@/config/tabs"
import {
  Help,
} from "@/pages/Bantuan"
import {
  Learn,
} from "@/pages/Belajar"
import {
  Cek,
} from "@/pages/Cek"
import {
  Results,
} from "@/pages/Hasil"
import {
  Settings,
} from "@/pages/Pengaturan"
import {
  Privacy,
} from "@/pages/Privasi"
import {
  Simulator,
} from "@/pages/Simulator"
import {
  useAppState,
} from "@/state/AppState"

export function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const active = tabs.findIndex((tab) => tab.path === location.pathname)
  const extraLabel = location.pathname === "/pengaturan" ? "Pengaturan" : location.pathname === "/privasi" ? "Privasi" : null
  const page = extraLabel ? -1 : active < 0 ? 0 : active
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("amandana-theme")
      return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
    } catch {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light"
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", darkMode ? "#101e24" : "#0F4C5C")
    try {
      localStorage.setItem("amandana-theme", darkMode ? "dark" : "light")
    } catch {
      // penyimpanan tema tidak tersedia (mis. mode privat); abaikan
    }
  }, [darkMode])
  const mainRef = useRef<HTMLElement>(null)
  const firstRoute = useRef(true)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    if (firstRoute.current) {
      firstRoute.current = false
      return // jangan merebut fokus saat aplikasi pertama kali dibuka
    }
    // Pindahkan fokus ke <h1> halaman baru agar pembaca layar mengumumkannya.
    // Jika <h1> tersembunyi (mis. di layar kecil), fokus ke <main>.
    const main = mainRef.current
    const heading = main?.querySelector("h1")
    const target = heading && heading.offsetParent !== null ? heading : main
    if (!target) return
    target.setAttribute("tabindex", "-1")
    target.focus({ preventScroll: true })
  }, [location.pathname])
  const { analysis, offer } = useAppState()

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col border-r border-border bg-card px-6 py-9 lg:flex">
        <Brand />
        <div className="mb-7 mt-12 px-3">
          <MiniLabel>TEMAN AMAN FINANSIALMU</MiniLabel>
        </div>
        <nav className="space-y-2" aria-label="Navigasi utama">
          {tabs.map((tab, index) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={index === page ? "page" : undefined}
              className={`group flex h-[52px] w-full items-center gap-3 rounded-none px-4 text-[13px] transition ${
                index === page
                  ? "bg-primary font-bold text-primary-foreground shadow-[0_5px_12px_-7px_#0f4c5c]"
                  : "font-medium text-muted-foreground hover:bg-secondary hover:text-primary"
              }`}
            >
              <tab.icon size={19} strokeWidth={1.8} />
              {tab.label}
              {index === page && (
                <ChevronRight size={16} className="ml-auto opacity-70" />
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-l-2 border-primary bg-[var(--tone-bg-f1f6f1)] p-4">
          <p className="text-xs font-bold">Baca tawaran dengan tenang.</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">AmanDana membantu mengenali tanda bahaya sebelum kamu mengambil keputusan.</p>
        </div>
        <div className="mt-6 flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <ShieldCheck size={13} />
          AmanDana
        </div>
      </aside>

      <div className="app-safe-top lg:ml-[238px]">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-5 md:h-[76px] md:px-10 xl:px-14">
          <div className="lg:hidden">
            <Brand small />
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            Ruang amanmu <ChevronRight size={13} />
            <span className="font-semibold text-foreground">
              {extraLabel ?? tabs[page].label}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/pengaturan")}
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-border text-muted-foreground transition hover:bg-secondary hover:text-primary"
              aria-label="Pengaturan"
              title="Pengaturan"
            >
              <Settings2 size={19} />
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              aria-pressed={darkMode}
              title={darkMode ? "Mode terang" : "Mode gelap"}
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-border text-primary transition hover:bg-secondary"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <main ref={mainRef} className="mx-auto max-w-[1220px] px-5 pb-28 pt-5 md:px-10 md:pt-8 lg:pb-10 xl:px-14">
          {page === 0 && <Cek />}
          {page === 1 && <Results analysis={analysis} offer={offer || analysis?.text || ""} navigate={navigate} />}
          {page === 2 && <Simulator />}
          {page === 3 && <Help />}
          {page === 4 && <Learn />}
          {extraLabel === "Pengaturan" && <Settings />}
          {extraLabel === "Privasi" && <Privacy />}
        </main>
      </div>
      <nav
        aria-label="Navigasi seluler"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg lg:hidden"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            aria-current={index === page ? "page" : undefined}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-1.5 rounded-none text-xs ${
              index === page
                ? "bg-secondary font-bold text-primary"
                : "font-medium text-muted-foreground"
            }`}
          >
            <tab.icon size={20} strokeWidth={index === page ? 2.2 : 1.7} />
            {tab.mobile}
          </button>
        ))}
      </nav>
    </div>
  )
}
