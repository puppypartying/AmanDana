import { OFFICIAL_LINKS } from "@/config/app"
import { maskNumbers } from "@/lib/format"
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Landmark,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import {
  PageHeading,
} from "@/components/PageHeading"
import { HowItWorks } from "@/components/HowItWorks"
import { PlatformCard } from "@/components/PlatformCard"
import { ReasonIcon } from "@/components/ReasonIcon"
import {
  card,
  primaryButton,
  secondaryButton,
} from "@/components/ui"
import {
  type Analysis,
} from "@/lib/risk/analysis"
import { evidenceFor } from "@/lib/risk/present"

export function Results({
  analysis,
  offer,
  navigate,
}: {
  analysis: Analysis | null
  offer: string
  navigate: (path: string) => void
}) {
  const masked = maskNumbers(offer)
  if (!analysis) return <EmptyResults navigate={navigate} />
  const tone = analysis.level === "Tinggi" ? "#cf605b" : analysis.level === "Sedang" ? "#ddb65f" : "#82a68b"
  const levelClass = analysis.level === "Tinggi" ? "bg-[var(--tone-bg-fbeceb)] text-destructive" : analysis.level === "Sedang" ? "bg-[var(--tone-bg-fcf7e9)] text-[var(--tone-text-aa7c29)]" : "bg-secondary text-primary"
  return (
    <div className="animate-enter">
      <PageHeading
        eyebrow="HASIL ANALISIS"
        title="Kenali risikonya, bukan janjinya."
        description="Ini titik awal untuk mengambil keputusan yang lebih aman."
      />
      <HowItWorks />
      <div className="grid items-start gap-6 md:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-5">
          <section className={`${card} flex flex-col items-center p-6`}>
            <span className="text-xs font-semibold text-muted-foreground">
              Skor risiko tawaran
            </span>
            <div className="relative my-5 flex h-[180px] w-[180px] items-center justify-center">
              <svg
                className="absolute inset-0 -rotate-90"
                viewBox="0 0 180 180"
              >
                <circle
                  cx="90"
                  cy="90"
                  r="76"
                  fill="none"
                  stroke="#f2eceb"
                  strokeWidth="11"
                />
                <circle
                  cx="90"
                  cy="90"
                  r="76"
                  fill="none"
                  stroke={tone}
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={`${(analysis.score / 100) * 477.52} 477.52`}
                />
              </svg>
              <div className="text-center">
                <span className="text-5xl font-extrabold tracking-[-2px]">
                  {analysis.score}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
                <div className="mt-2 text-xs font-semibold text-muted-foreground">
                  SKOR RISIKO
                </div>
              </div>
            </div>
            <span className={`flex items-center gap-1.5 rounded-none px-4 py-2 text-xs font-bold tracking-wide ${levelClass}`}>
              <ShieldAlert size={14} />
              RISIKO {analysis.level.toUpperCase()}
            </span>
            <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
              {analysis.level === "Tinggi" ? "Jangan transfer dulu." : "Luangkan waktu untuk memeriksa detailnya."}
              <br />Ada {analysis.reasons.length} tanda bahaya pada tawaran ini.
            </p>
            <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-border pt-5 text-center text-xs">
              {[
                { label: "Rendah", range: "0–39", color: "bg-[var(--tone-bg-82a68b)]" },
                { label: "Sedang", range: "40–69", color: "bg-[var(--tone-bg-ddb65f)]" },
                { label: "Tinggi", range: "70–100", color: "bg-[var(--tone-bg-cf605b)]" },
              ].map((item) => (
                <div key={item.label}>
                  <div className={`mb-2 h-1.5 rounded-none ${item.color}`} />
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-muted-foreground">{item.range}</p>
                </div>
              ))}
            </div>
          </section>
          {analysis.platform ? <PlatformCard check={analysis.platform} className="!bg-card" /> : (
          <section className={`${card} p-5`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Landmark size={17} /> Status legalitas
              </div>
              <p className="mt-3 text-[13px] font-semibold leading-6 text-destructive">
                Belum diverifikasi dalam prototipe ini
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Gunakan kanal resmi untuk pemeriksaan mandiri.
              </p>
              <a
                href={OFFICIAL_LINKS.ojk}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex min-h-11 items-center gap-2 text-xs font-semibold text-primary"
              >
                Verifikasi langsung di OJK <ArrowUpRight size={14} />
              </a>
            </section>
          )}
        </div>
        <div className="space-y-5">
          <section className={`${card} p-5 md:p-6`}>
            <h2 className="mb-2 text-base font-bold">Alasan Skor</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {analysis.reasons.length} tanda bahaya yang muncul pada tawaran {analysis.kind.toLowerCase()}.
            </p>
            <div className="divide-y divide-border">
              {analysis.reasons.length ? analysis.reasons.map((item) => (
                <div key={item.title} className="flex gap-3 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-[var(--tone-bg-fcf0ed)] text-destructive">
                    <ReasonIcon name={item.icon} size={17} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold leading-5">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.detail}
                    </p>
                    {evidenceFor(analysis, item.title) && (
                      <p className="mt-1 break-words text-xs leading-5 text-foreground">
                        Terdeteksi: “{evidenceFor(analysis, item.title)}”
                      </p>
                    )}
                  </div>
                  <span className="h-fit rounded-none bg-[var(--tone-bg-fbeceb)] px-2 py-1 text-xs font-bold text-destructive">
                    +{item.weight}
                  </span>
                </div>
              )) : <p className="py-4 text-xs leading-6 text-muted-foreground">Tidak ada kata kunci risiko yang dikenali. Ini bukan bukti bahwa tawaran aman—periksa legalitas dan detailnya secara mandiri.</p>}
            </div>
          </section>
          {masked !== offer && (
            <div className={`${card} p-5`}>
              <h3 className="mb-2 text-xs font-bold">Teks yang kamu kirim</h3>
              <p className="break-words text-xs leading-6 text-muted-foreground">
                {masked}
              </p>
            </div>
          )}
          <button
            className={primaryButton}
            onClick={() => navigate("/bantuan")}
          >
            <ShieldCheck size={18} />
            Lihat Langkah Aman
            <ArrowRight size={17} className="ml-auto" />
          </button>
          {analysis.kind === "Pinjol" && (
            <button className={secondaryButton} onClick={() => navigate("/simulator")}>
              <Calculator size={17} /> Hitung Biaya Pinjaman
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


function EmptyResults({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="animate-enter">
      <PageHeading eyebrow="HASIL ANALISIS" title="Belum ada tawaran yang dianalisis." description="Masukkan pesan, platform, atau tautan di tab Cek untuk melihat indikasi risiko sintetis." />
      <section className={`${card} max-w-xl p-7 text-center`}>
        <ScanLine size={34} className="mx-auto text-primary" />
        <h2 className="mt-4 text-lg font-bold">Mulai dari tawaran yang kamu terima</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">Hasil akan disesuaikan dengan kategori pinjol atau investasi yang kamu pilih.</p>
        <button onClick={() => navigate("/")} className={`${primaryButton} mt-6`}><ScanLine size={17} /> Buka Cek Tawaran</button>
      </section>
    </div>
  )
}
