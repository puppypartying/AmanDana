import { OFFICIAL_LINKS } from "@/config/app"
import {
  useState,
} from "react"
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  ClipboardCheck,
  Copy,
  FileText,
  Landmark,
  ShieldCheck,
} from "lucide-react"
import {
  PageHeading,
} from "@/components/PageHeading"
import {
  card,
  secondaryButton,
} from "@/components/ui"
import {
  useAppState,
} from "@/state/AppState"

export function Help() {
  const { helpOpen: open, setHelpOpen: setOpen, evidenceChecks: checks, setEvidenceChecks: setChecks, complaintTemplate: template, setComplaintTemplate: setTemplate } = useAppState()
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(template)
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopyError(true)
    }
  }
  const sections = [
    {
      title: "Langkah Jika Terlanjur",
      icon: ShieldCheck,
      content: (
        <ol className="space-y-5">
          {[
            {
              title: "Hentikan transfer",
              text: "Jangan kirim uang lagi, termasuk untuk biaya pencairan atau pengembalian dana.",
            },
            {
              title: "Simpan bukti",
              text: "Ambil tangkapan layar percakapan, profil, tautan, dan bukti transfer.",
            },
            {
              title: "Blokir kontak dan laporkan rekening",
              text: "Setelah bukti tersimpan, blokir kontak. Hubungi bank untuk melaporkan rekening tujuan.",
            },
            {
              title: "Lapor segera",
              text: "Hubungi bank dan IASC secepatnya. Kecepatan lapor menentukan peluang dana kembali, tetapi pengembalian tidak dijamin.",
            },
          ].map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-secondary text-xs font-bold text-primary">
                {index + 1}
              </span>
              <div>
                <h3 className="text-xs font-bold">{step.title}</h3>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ),
    },
    {
      title: "Checklist Bukti",
      icon: ClipboardCheck,
      content: (
        <div>
          <p className="mb-3 text-xs text-muted-foreground">
            {checks.length} dari 4 bukti sudah siap. Centang setelah disimpan.
          </p>
          <div className="space-y-2">
            {[
              "Tangkapan layar chat",
              "Bukti transfer",
              "Nomor rekening tujuan",
              "Tautan/nama platform",
            ].map((item) => (
              <label
                key={item}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-none border px-3 text-xs transition ${
                  checks.includes(item)
                    ? "border-primary/20 bg-secondary"
                    : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checks.includes(item)}
                  onChange={() =>
                    setChecks((current) =>
                      current.includes(item)
                        ? current.filter((check) => check !== item)
                        : [...current, item],
                    )
                  }
                  className="h-4 w-4 accent-primary"
                />
                {item}
                {checks.includes(item) && (
                  <Check size={14} className="ml-auto text-primary" />
                )}
              </label>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Template Aduan",
      icon: FileText,
      content: (
        <div>
          <label
            htmlFor="complaint"
            className="mb-3 block text-xs leading-5 text-muted-foreground"
          >
            Lengkapi bagian [isi] sebelum melaporkan. Jangan bagikan data
            pribadi di ruang publik.
          </label>
          <textarea
            id="complaint"
            value={template}
            onChange={(event) => {
              setTemplate(event.target.value)
              setCopied(false)
            }}
            className="min-h-[240px] w-full rounded-none border border-border bg-muted/40 p-4 text-xs leading-6"
          />
          <button onClick={copy} className={`${secondaryButton} mt-3`}>
            {copied ? <CheckCheck size={17} /> : <Copy size={17} />}
            {copied ? "Template tersalin" : "Salin Template"}
          </button>
          {copyError && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              Salin otomatis tidak tersedia. Pilih teks di atas lalu salin
              secara manual.
            </p>
          )}
        </div>
      ),
    },
    {
      title: "Kanal Resmi",
      icon: Landmark,
      content: (
        <div className="space-y-3">
          <p className="mb-4 text-xs leading-6 text-muted-foreground">
            Pastikan alamat situs benar. Pelaporan resmi tidak meminta transfer
            ke rekening pribadi.
          </p>
          {[
            {
              title: "Otoritas Jasa Keuangan (OJK)",
              desc: "Informasi legalitas dan pengaduan konsumen",
              href: OFFICIAL_LINKS.ojk,
            },
            {
              title: "Indonesia Anti-Scam Centre (IASC)",
              desc: "Pelaporan penipuan transaksi keuangan",
              href: OFFICIAL_LINKS.iasc,
            },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-16 items-center justify-between gap-3 rounded-none border border-border p-4 transition hover:bg-secondary"
            >
              <div>
                <h3 className="text-xs font-bold text-primary">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {item.desc}
                </p>
              </div>
              <ArrowUpRight size={17} className="shrink-0 text-primary" />
            </a>
          ))}
        </div>
      ),
    },
  ]
  return (
    <div className="animate-enter">
      <PageHeading
        eyebrow="KAMU TIDAK SENDIRIAN"
        title="Tarik napas. Kita ambil langkah aman."
        description="Jika sudah terlanjur, jangan menyalahkan diri sendiri. Fokus pada hal yang bisa kamu lakukan sekarang."
      />
      <div className="grid items-start gap-5 md:grid-cols-2">
        {sections.map((section, index) => (
          <section key={section.title} className={`${card} overflow-hidden`}>
            <button
              onClick={() =>
                setOpen((current) =>
                  current.includes(index)
                    ? current.filter((item) => item !== index)
                    : [...current, index],
                )
              }
              aria-expanded={open.includes(index)}
              aria-controls={`help-${index}`}
              className="flex min-h-[74px] w-full items-center gap-3 px-5 py-4 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-secondary text-primary">
                <section.icon size={18} />
              </div>
              <h2 className="text-sm font-bold">{section.title}</h2>
              <ChevronDown
                className={`ml-auto shrink-0 text-muted-foreground transition ${
                  open.includes(index) ? "rotate-180" : ""
                }`}
                size={17}
              />
            </button>
            {open.includes(index) && (
              <div id={`help-${index}`} className="border-t border-border p-5">
                {section.content}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
