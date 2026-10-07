import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { useNavigate } from "react-router"
import { complaint } from "@/config/content"
import { createAnalysis, type Analysis } from "@/lib/risk/analysis"
import { clearAllData, fromStored, loadData, pushHistory, saveData, stripText, toStored, withSavedText, type StoredAnalysis } from "@/lib/storage"

type AppState = {
  offer: string
  setOffer: Dispatch<SetStateAction<string>>
  kind: string
  setKind: Dispatch<SetStateAction<string>>
  loading: boolean
  error: string
  setError: Dispatch<SetStateAction<string>>
  analysis: Analysis | null
  analyze: () => void
  history: StoredAnalysis[]
  openFromHistory: (id: string) => boolean
  saveText: boolean
  setSaveText: (value: boolean) => void
  deleteAllData: () => void
  helpOpen: number[]
  setHelpOpen: Dispatch<SetStateAction<number[]>>
  evidenceChecks: string[]
  setEvidenceChecks: Dispatch<SetStateAction<string[]>>
  complaintTemplate: string
  setComplaintTemplate: Dispatch<SetStateAction<string>>
  quizAnswer: number | null
  setQuizAnswer: Dispatch<SetStateAction<number | null>>
}

const AppStateContext = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [initial] = useState(loadData)
  const [offer, setOffer] = useState("")
  const [kind, setKind] = useState("Pinjol")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(() => (initial.last ? fromStored(initial.last) : null))
  const [history, setHistory] = useState<StoredAnalysis[]>(initial.history)
  const [saveText, setSaveTextState] = useState(initial.saveText)
  const [helpOpen, setHelpOpen] = useState<number[]>([0, 1])
  const [evidenceChecks, setEvidenceChecks] = useState<string[]>(initial.evidenceChecks)
  const [complaintTemplate, setComplaintTemplate] = useState(initial.complaintTemplate ?? complaint)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(initial.quizAnswer)
  const [error, setError] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  // Simpan setiap perubahan. Data yang sama dengan kondisi awal otomatis menghapus kunci storage.
  useEffect(() => {
    saveData({
      v: 1,
      saveText,
      last: analysis ? toStored(analysis) : null,
      history,
      evidenceChecks,
      complaintTemplate: complaintTemplate === complaint ? null : complaintTemplate,
      quizAnswer,
    })
  }, [saveText, analysis, history, evidenceChecks, complaintTemplate, quizAnswer])

  function analyze() {
    if (!offer.trim()) {
      setError("Masukkan tawaran atau pakai contoh terlebih dahulu.")
      return
    }
    setError("")
    setLoading(true)
    timer.current = setTimeout(() => {
      const result = withSavedText(createAnalysis(kind, offer), offer, saveText)
      setLoading(false)
      setAnalysis(result)
      setHistory((current) => pushHistory(current, toStored(result)))
      navigate("/hasil")
    }, 800)
  }
  const openFromHistory = useCallback((id: string) => {
    const entry = history.find((h) => h.id === id)
    if (!entry) return false
    setAnalysis(fromStored(entry))
    return true
  }, [history])
  function setSaveText(value: boolean) {
    setSaveTextState(value)
    if (!value) {
      // Mematikan toggle juga menghapus teks yang sudah terlanjur tersimpan.
      setAnalysis((current) => (current ? stripText(current) : current))
      setHistory((current) => current.map(stripText))
    }
  }
  function deleteAllData() {
    if (timer.current) clearTimeout(timer.current)
    setLoading(false)
    setOffer("")
    setAnalysis(null)
    setHistory([])
    setSaveTextState(false)
    setEvidenceChecks([])
    setComplaintTemplate(complaint)
    setQuizAnswer(null)
    clearAllData()
  }
  return (
    <AppStateContext.Provider
      value={{ offer, setOffer, kind, setKind, loading, error, setError, analysis, analyze, history, openFromHistory, saveText, setSaveText, deleteAllData, helpOpen, setHelpOpen, evidenceChecks, setEvidenceChecks, complaintTemplate, setComplaintTemplate, quizAnswer, setQuizAnswer }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppState {
  const value = useContext(AppStateContext)
  if (!value) throw new Error("useAppState harus dipakai di dalam AppStateProvider")
  return value
}
