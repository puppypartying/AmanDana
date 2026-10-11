import { OFFICIAL_LINKS } from "@/config/app"
import {
  useRef,
} from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  MiniLabel,
} from "@/components/MiniLabel"
import {
  PageHeading,
} from "@/components/PageHeading"
import {
  card,
} from "@/components/ui"
import { useAppState } from "@/state/AppState"

export function Learn() {
  const { quizAnswer: answer, setQuizAnswer: setAnswer } = useAppState()
  const carousel = useRef<HTMLDivElement>(null)
  const dangers = [
    {
      title: "Imbal hasil pasti",
      text: "Semua investasi punya risiko. Janji untung pasti adalah tanda bahaya.",
      icon: TrendingUp,
      color: "bg-[var(--tone-bg-fbf2df)] text-[var(--tone-text-a38241)]",
    },
    {
      title: "Minta akses kontak",
      text: "Data kontak bukan syarat yang wajar untuk menilai kemampuan bayar.",
      icon: Users,
      color: "bg-[var(--tone-bg-eaf0f7)] text-[var(--tone-text-6884a8)]",
    },
    {
      title: "Ancaman penagihan",
      text: "Ancaman dan penyebaran data pribadi bukan penagihan yang dapat dibenarkan.",
      icon: ShieldAlert,
      color: "bg-[var(--tone-bg-f8eae7)] text-[var(--tone-text-b4756b)]",
    },
    {
      title: "Potongan di muka",
      text: "Cek dana bersih yang cair. Biaya tersembunyi bisa membuat pinjaman mahal.",
      icon: ArrowDownLeft,
      color: "bg-[var(--tone-bg-eaf2ec)] text-[var(--tone-text-6d9279)]",
    },
  ]
  return (
    <div className="animate-enter">
      <PageHeading
        eyebrow="BEKAL KECIL, DAMPAK BESAR"
        title="Makin paham, makin terlindungi."
        description="Bukan harus ahli keuangan. Mulai dari mengenali tanda-tandanya."
      />
      <section className="mb-7 flex items-center justify-between gap-4 rounded-none border border-[var(--tone-border-dbe9e2)] bg-[var(--tone-bg-eaf3ec)] p-6 md:p-8">
        <div>
          <MiniLabel>PEGANG PRINSIP INI</MiniLabel>
          <h2 className="mb-3 mt-3 text-2xl font-extrabold tracking-[-0.4px]">
            Prinsip 2L: Legal dan Logis
          </h2>
          <p className="max-w-md text-xs leading-6 text-[var(--tone-text-607b70)]">
            Cek izinnya. Pikirkan kewajarannya. Jangan biarkan janji manis
            mengalahkan akal sehat.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="flex items-center gap-2 rounded-none bg-card/80 px-3 py-2 text-xs font-bold">
              <BadgeCheck size={17} className="text-primary" />
              Legal: izin sesuai
            </span>
            <span className="flex items-center gap-2 rounded-none bg-card/80 px-3 py-2 text-xs font-bold">
              <TrendingUp size={17} className="text-primary" />
              Logis: masuk akal
            </span>
          </div>
        </div>
        <ShieldCheck
          size={90}
          strokeWidth={1.1}
          className="mr-4 hidden shrink-0 text-[var(--tone-text-719d87)] md:block"
        />
      </section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">Kartu Tanda Bahaya</h2>
        <div className="flex gap-2">
          <button
            aria-label="Kartu sebelumnya"
            onClick={() =>
              carousel.current?.scrollBy({ left: -240, behavior: "smooth" })
            }
            className="flex h-11 w-11 items-center justify-center rounded-none border border-border bg-card hover:bg-secondary"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            aria-label="Kartu berikutnya"
            onClick={() =>
              carousel.current?.scrollBy({ left: 240, behavior: "smooth" })
            }
            className="flex h-11 w-11 items-center justify-center rounded-none border border-border bg-card hover:bg-secondary"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div
        ref={carousel}
        className="mb-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3"
      >
        {dangers.map((danger, index) => (
          <article
            key={danger.title}
            className={`${card} w-[220px] shrink-0 snap-start p-5 xl:flex-1`}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className={`rounded-none p-3 ${danger.color}`}>
                <danger.icon size={21} />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                0{index + 1}
              </span>
            </div>
            <h3 className="text-sm font-bold">{danger.title}</h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {danger.text}
            </p>
          </article>
        ))}
      </div>
      <div className="grid items-start gap-6 md:grid-cols-[1.15fr_0.85fr]">
        <section className={`${card} p-5 md:p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <Sparkles size={19} className="text-primary" />
            <h2 className="text-base font-bold">Kuis Singkat</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              1 pertanyaan
            </span>
          </div>
          <p className="mb-5 text-sm font-semibold leading-6">
            Ada tawaran investasi untung 10% per minggu, dijamin pasti. Apa yang
            sebaiknya kamu lakukan?
          </p>
          <div className="space-y-2.5">
            {[
              "Segera transfer, takut kehabisan slot",
              "Cek legalitas dan kewajaran imbal hasil",
              "Ajak teman agar dapat bonus",
            ].map((option, index) => (
              <button
                key={option}
                onClick={() => setAnswer(index)}
                aria-pressed={answer === index}
                className={`flex min-h-12 w-full items-center gap-3 rounded-none border px-3 py-3 text-left text-xs leading-5 transition ${
                  answer === index
                    ? index === 1
                      ? "border-[var(--tone-border-93b09a)] bg-[var(--tone-bg-eef5ed)]"
                      : "border-[var(--tone-border-d7a7a0)] bg-[var(--tone-bg-fbefeb)]"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-none border border-border bg-card text-xs font-bold">
                  {["A", "B", "C"][index]}
                </span>
                {option}
              </button>
            ))}
          </div>
          {answer !== null && (
            <div
              role="status"
              className={`mt-4 rounded-none p-4 text-xs leading-6 ${
                answer === 1
                  ? "bg-[var(--tone-bg-eef5ed)] text-[var(--tone-text-52765a)]"
                  : "bg-[var(--tone-bg-fbefeb)] text-destructive"
              }`}
            >
              <b>
                {answer === 1
                  ? "Benar! Kamu sudah berpikir kritis."
                  : "Belum tepat. Jangan terburu-buru."}
              </b>
              <p>
                Imbal hasil tinggi yang dijamin pasti adalah tanda bahaya.
                Periksa izin dan kewajarannya sebelum transfer.
              </p>
            </div>
          )}
        </section>
        <section className={`${card} p-5 md:p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <Shield size={19} className="text-primary" />
            <h2 className="text-base font-bold">Hak Konsumen</h2>
          </div>
          <div className="space-y-5">
            {[
              "Mendapat informasi biaya dan risiko yang jelas.",
              "Data pribadi dijaga dan tidak disalahgunakan.",
              "Diperlakukan secara adil, tanpa ancaman.",
              "Mengajukan pengaduan melalui kanal resmi.",
            ].map((right) => (
              <p
                key={right}
                className="flex items-start gap-3 text-xs leading-6 text-muted-foreground"
              >
                <Check className="mt-1 shrink-0 text-[var(--tone-text-6a9579)]" size={15} />
                {right}
              </p>
            ))}
          </div>
          <a
            href={OFFICIAL_LINKS.ojk}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex min-h-11 items-center gap-2 border-t border-border pt-3 text-xs font-bold text-primary"
          >
            Pelajari di situs OJK <ArrowUpRight size={15} />
          </a>
        </section>
      </div>
    </div>
  )
}
