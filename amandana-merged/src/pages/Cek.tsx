import { useNavigate } from "react-router"
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  HandCoins,
  LockKeyhole,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { PlatformCard } from "@/components/PlatformCard"
import { RiskSummary } from "@/components/RiskSummary"
import { SafetyIllustration } from "@/components/SafetyIllustration"
import { card, primaryButton } from "@/components/ui"
import { example } from "@/config/content"
import { useAppState } from "@/state/AppState"

export function Cek() {
  const navigate = useNavigate()
  const { kind, setKind, offer, setOffer, error, setError, analysis, analyzedKey, analyze } = useAppState()
  // Hasil hanya ditampilkan bila masih cocok dengan teks dan jenis yang sedang diisi.
  const fresh = analysis && analyzedKey === `${kind}\n${offer}` ? analysis : null
  return (
    <div className="animate-enter">
      <div className="mb-5 flex items-center justify-between md:mb-6">
        <div>
          <div className="mb-2 hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <span>Halo, selamat datang</span>
            <span aria-hidden="true">✦</span>
          </div>
          <h1 className="hidden text-[26px] font-extrabold leading-[1.35] tracking-[-0.6px] md:block md:text-[32px]">
            Lebih waspada, lebih berdaya.
          </h1>
          <p className="max-w-md text-xs leading-6 text-muted-foreground md:mt-2 md:text-[13px]">
            Dapat tawaran mencurigakan? Cek dulu sebelum transaksi.
          </p>
        </div>
        <div className="hidden rounded-none border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground xl:block">
          Uangmu. Keputusanmu.
        </div>
      </div>
      <section className="relative mb-5 flex items-center justify-between overflow-hidden rounded-none border border-[var(--tone-border-dbe9e2)] bg-[var(--tone-bg-eaf3ec)] px-5 py-5 md:mb-6 md:min-h-[184px] md:px-8 md:py-3">
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-[1.4px] text-[var(--tone-text-507666)] md:mb-3">
            <ShieldCheck size={14} />
            SATU CEK, LEBIH TENANG
          </div>
          <h2 className="text-[23px] font-extrabold leading-[1.35] tracking-[-0.4px] md:text-[29px]">
            <span className="md:hidden">
              Cek dulu. Baru percaya.
              <br />
              <span className="text-[var(--tone-text-568574)]">Danamu berharga.</span>
            </span>
            <span className="hidden md:inline">
              Jangan buru-buru percaya.
              <br />
              <span className="text-[var(--tone-text-568574)]">
                Kenali risikonya dulu.
              </span>
            </span>
          </h2>
          <p className="mt-3 hidden max-w-[380px] text-xs leading-[1.8] text-[var(--tone-text-607b70)] md:block">
            Bantu kenali tanda bahaya pinjaman online dan investasi.
            <br /> Supaya keputusanmu bukan karena tekanan.
          </p>
        </div>
        <SafetyIllustration />
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className={`${card} p-5 md:p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-none bg-secondary text-primary">
              <ScanLine size={21} />
            </div>
            <div>
              <h2 className="text-base font-bold">Cek tawaranmu</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Mulai dari pesan yang kamu terima.
              </p>
            </div>
          </div>
          <label className="mb-2.5 block text-xs font-semibold">
            Jenis tawaran
          </label>
          <div
            className="mb-5 grid grid-cols-2 rounded-none bg-[var(--tone-bg-f1f4f4)] p-1"
            role="group"
            aria-label="Jenis tawaran"
          >
            {["Pinjol", "Investasi"].map((item, index) => (
              <button
                key={item}
                aria-pressed={kind === item}
                onClick={() => setKind(item)}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-none text-xs font-semibold transition ${
                  kind === item
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {index === 0 ? (
                  <HandCoins size={17} />
                ) : (
                  <TrendingUp size={17} />
                )}
                {item}
              </button>
            ))}
          </div>
          <label
            htmlFor="offer"
            className="mb-2.5 flex items-center justify-between text-xs font-semibold"
          >
            Pesan, platform, atau tautan
            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
              Tanpa data pribadi, ya
            </span>
          </label>
          <div
            className={`relative rounded-none border bg-[var(--tone-bg-fbfcfc)] transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/5 ${
              error ? "border-destructive" : "border-border"
            }`}
          >
            <textarea
              id="offer"
              value={offer}
              onChange={(event) => {
                setOffer(event.target.value)
                setError("")
              }}
              maxLength={3000}
              placeholder="Tempel pesan tawaran, nama platform, atau tautan di sini"
              className="min-h-[128px] w-full resize-y rounded-none bg-transparent p-4 pb-10 text-[13px] leading-[1.85] placeholder:text-[var(--tone-text-7b8e93)] focus-visible:ring-0"
            />
            <span className="absolute bottom-3 right-4 text-xs text-muted-foreground">
              {offer.length} / 3.000
            </span>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <button
            onClick={() => {
              setOffer(example)
              setError("")
            }}
            className="mb-3 mt-3 flex min-h-11 items-center gap-2 text-xs font-semibold text-primary hover:text-[var(--tone-text-23818a)]"
          >
            <Sparkles size={15} />
            Pakai contoh tawaran <ArrowUpRight size={13} />
          </button>
          <button onClick={analyze} className={primaryButton}>
            <ScanLine size={18} />
            Analisis Sekarang
            <ArrowRight className="ml-auto" size={18} />
          </button>
          {fresh && <RiskSummary analysis={fresh} onDetail={() => navigate("/hasil")} />}
          {fresh?.platform && fresh.platform.status !== "tidak-dicek" && <PlatformCard check={fresh.platform} className="mt-4" />}
          <div className="mt-4 flex items-start justify-center gap-2 text-xs leading-5 text-muted-foreground">
            <LockKeyhole className="mt-1 shrink-0" size={12} />
            <p>
              Teks Anda tidak disimpan. Nomor telepon dan rekening
              <br className="hidden sm:block" /> disamarkan otomatis
              pada tampilan analisis.
            </p>
          </div>
        </section>
        <div className="space-y-5">
          <section className={`${card} p-5`}>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-none bg-[var(--tone-bg-fff5de)] text-[var(--tone-text-a17a34)]">
                <Sparkles size={15} />
              </div>
              <h2 className="text-[13px] font-bold">
                Ingat prinsip 2L
              </h2>
            </div>
            <p className="mb-5 text-xs leading-6 text-muted-foreground">
              Tawaran yang baik bukan cuma menarik.
              <br />
              Pastikan juga{" "}
              <b className="font-semibold text-foreground">
                legal dan logis.
              </b>
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Legal",
                  desc: "Punya izin dari otoritas yang tepat.",
                  icon: BadgeCheck,
                },
                {
                  title: "Logis",
                  desc: "Keuntungannya masuk akal, bukan janji pasti.",
                  icon: TrendingUp,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-secondary">
                    <item.icon size={17} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/belajar")}
              className="mt-4 flex min-h-11 w-full items-center justify-between border-t border-border pt-3 text-xs font-bold text-primary"
            >
              Kenali tanda bahaya <ArrowRight size={15} />
            </button>
          </section>
          <section className="rounded-none border border-[var(--tone-border-e9e5d9)] bg-[var(--tone-bg-faf8f1)] p-5">
            <div className="mb-3 flex items-center gap-2 text-[var(--tone-text-8b7650)]">
              <MessageCircle size={18} />
              <h2 className="text-xs font-bold">
                Sudah terlanjur transfer?
              </h2>
            </div>
            <p className="text-xs leading-6 text-[var(--tone-text-8a8069)]">
              Kamu tidak sendirian. Ada langkah yang bisa kamu ambil
              sekarang.
            </p>
            <button
              onClick={() => navigate("/bantuan")}
              className="mt-3 flex min-h-11 items-center gap-2 text-xs font-bold text-[var(--tone-text-76603e)]"
            >
              Lihat langkah aman <ArrowRight size={14} />
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
