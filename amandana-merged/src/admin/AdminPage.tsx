import { useState } from "react"
import { DataTab } from "./DataTab"
import { ExportTab } from "./ExportTab"
import { MatrixTab } from "./MatrixTab"
import { PlatformTab } from "./PlatformTab"
import { PublishTab, StatusBar } from "./PublishTab"
import { RulesTab } from "./RulesTab"
import { useAdminStore } from "./store"

const TABS = [["matriks", "Matriks"], ["aturan", "Aturan"], ["data", "Data uji"], ["platform", "Platform"], ["terbit", "Terbit"], ["ekspor", "Ekspor"]] as const
type Tab = (typeof TABS)[number][0]

/** Panel admin statis. Akses dibatasi oleh Cloudflare Access pada /admin* (lihat docs/admin.md), bukan oleh kode ini. */
export default function AdminPage() {
  const store = useAdminStore()
  const [tab, setTab] = useState<Tab>("matriks")
  const { data, scorer, issues, update } = store
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <h1 className="text-xl font-extrabold">Admin AmanDana</h1>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Olah aturan dan data uji, lihat matriks scan. Draf dibagi antar admin lewat server; aturan baru dipakai pengguna setelah diterbitkan di tab Terbit.</p>
      <nav aria-label="Bagian admin" className="mt-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.map(([id, label]) => (
          <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)} className={`min-h-10 px-4 text-xs font-bold ${tab === id ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{label}</button>
        ))}
      </nav>
      <StatusBar store={store} onOpenPublish={() => setTab("terbit")} />
      {issues.length > 0 && (
        <div role="alert" className="mt-4 border border-destructive bg-[var(--tone-bg-fbeceb)] p-3 text-xs leading-5 text-destructive">
          <b>{issues.length} masalah pada aturan draf:</b>
          <ul className="list-disc pl-5">{issues.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      )}
      <div className="mt-4">
        {tab === "matriks" && <MatrixTab data={data} scorer={scorer} />}
        {tab === "aturan" && <RulesTab rules={data.rules} scorer={scorer} onChange={(rules) => update((d) => ({ ...d, rules }))} />}
        {tab === "data" && <DataTab samples={data.samples} onChange={(samples) => update((d) => ({ ...d, samples }))} />}
        {tab === "platform" && <PlatformTab platforms={data.platforms} onChange={(platforms) => update((d) => ({ ...d, platforms }))} />}
        {tab === "terbit" && <PublishTab store={store} />}
        {tab === "ekspor" && <ExportTab data={data} issues={issues} serverMode={store.serverMode} onReplace={store.replace} onReset={store.reset} />}
      </div>
    </div>
  )
}
