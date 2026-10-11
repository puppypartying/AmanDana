import { computeLoan } from "@/lib/simulator/loan"
import { rupiah } from "@/lib/format"
import { useState } from "react"
import {
  Calculator,
  TriangleAlert,
  Wallet,
} from "lucide-react"
import { PageHeading } from "@/components/PageHeading"
import { card } from "@/components/ui"

export function Simulator() {
  const [loan, setLoan] = useState("2000000")
  const [received, setReceived] = useState("1600000")
  const [days, setDays] = useState("14")
  const principal = Number(loan),
    net = Number(received),
    tenor = Number(days)
  const { valid, fee, period, annual } = computeLoan(principal, net, tenor)
  return (
    <div className="animate-enter">
      <PageHeading
        eyebrow="SIMULATOR BIAYA"
        title="Yang cair belum tentu yang dibayar."
        description="Lihat biaya sebenarnya. Angka kecil per periode bisa jadi besar dalam setahun."
      />
      <div className="grid items-start gap-6 md:grid-cols-2">
        <section className={`${card} p-6`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-none bg-secondary p-2.5">
              <Calculator size={20} className="text-primary" />
            </div>
            <h2 className="text-base font-bold">Detail pinjaman</h2>
          </div>
          <div className="space-y-5">
            {[
              {
                id: "loan",
                label: "Jumlah pinjaman (Rp)",
                value: loan,
                set: setLoan,
                hint: "Jumlah yang harus dibayar kembali",
                prefix: "Rp",
              },
              {
                id: "received",
                label: "Dana yang benar-benar cair (Rp)",
                value: received,
                set: setReceived,
                hint: "Setelah potongan admin dan biaya lainnya",
                prefix: "Rp",
              },
              {
                id: "days",
                label: "Tenor (hari)",
                value: days,
                set: setDays,
                hint: "Lama pinjaman sampai jatuh tempo",
                prefix: "Hari",
              },
            ].map((input) => (
              <div key={input.id}>
                <label
                  htmlFor={input.id}
                  className="mb-2 block text-xs font-semibold"
                >
                  {input.label}
                </label>
                <div className="flex items-center overflow-hidden rounded-none border border-border bg-[var(--tone-bg-fbfcfc)] focus-within:border-primary">
                  <span className="border-r border-border px-4 text-xs text-muted-foreground">
                    {input.prefix}
                  </span>
                  <input
                    id={input.id}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={input.id === "days" ? 3650 : 1000000000}
                    value={input.value}
                    onChange={(event) => {
                      input.set(event.target.value)
                    }}
                    className="min-h-12 w-full min-w-0 bg-transparent px-4 text-sm font-semibold focus-visible:ring-0"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {input.hint}
                </p>
              </div>
            ))}
          </div>
          {!valid && (
            <p role="alert" className="mt-3 text-xs leading-5 text-destructive">
              Isi angka positif. Dana cair tidak boleh melebihi jumlah pinjaman.
            </p>
          )}
        </section>
        <div className="space-y-5">
          <section className={`${card} overflow-hidden`}>
            <div className="border-b border-border bg-secondary/50 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Wallet size={18} />
                Gambaran biaya
              </h2>
            </div>
            {valid ? (
              <div aria-live="polite" className="p-5">
                <div className="space-y-5">
                  {[
                    { label: "Total bayar", value: rupiah(principal) },
                    { label: "Biaya total", value: rupiah(fee) },
                    {
                      label: "Biaya per periode",
                      value: `${period.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-sm font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div
                  className={`mt-6 rounded-none p-5 ${
                    annual > 100
                      ? "bg-[var(--tone-bg-fcf0ed)] text-destructive"
                      : "bg-secondary text-primary"
                  }`}
                >
                  <span className="text-xs font-semibold">
                    Setara per tahun
                  </span>
                  <div className="mt-2 text-[38px] font-extrabold tracking-[-1px]">
                    ≈ {Math.round(annual).toLocaleString("id-ID")}%
                  </div>
                </div>
              </div>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">
                Lengkapi input valid untuk melihat hasil.
              </p>
            )}
          </section>
          {valid && annual > 100 && (
            <div className="flex items-start gap-3 rounded-none border border-[var(--tone-border-eddabb)] bg-[var(--tone-bg-fcf7e9)] p-5">
              <TriangleAlert size={21} className="shrink-0 text-[var(--tone-text-aa7c29)]" />
              <p className="text-xs leading-6 text-[var(--tone-text-8c682a)]">
                Biaya setara per tahun ini jauh di atas wajar. Pertimbangkan
                ulang sebelum meminjam.
              </p>
            </div>
          )}
          <details className={`${card} p-5`}>
            <summary className="cursor-pointer text-xs font-bold">
              Rumus yang dipakai
            </summary>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Biaya per periode = (total bayar − dana cair) / dana cair
              <br />
              Setara per tahun = biaya per periode × 365 / tenor
              <br />
              Kalikan dengan 100 untuk nilai persentase.
              <br />Perhitungan menggunakan bunga sederhana sebagai ilustrasi,
              bukan bunga majemuk atau rekomendasi finansial.
            </p>
          </details>
        </div>
      </div>
    </div>
  )
}
