import { levelFor, scoreOffer, type MatchedRule, type OfferKind, type RiskLevel } from './engine'

export type { RiskLevel } from './engine'
/** `icon` berupa nama ikon (string) agar hasil analisis bisa diserialisasi ke storage. */
export type Reason = { title: string; detail: string; weight: number; icon: string }
/** `text` hanya terisi bila pengguna menyalakan "Simpan teks pesan"; isinya sudah disamarkan. */
export type Analysis = { id: string; createdAt: number; kind: string; score: number; level: RiskLevel; reasons: Reason[]; matchedRules: MatchedRule[]; text?: string }

/** Adaptor engine -> bentuk yang dipakai UI. */
export function createAnalysis(kind: string, offer: string, now: number = Date.now()): Analysis {
  const result = scoreOffer(offer, kind === 'Investasi' ? 'Investasi' : ('Pinjol' as OfferKind))
  const reasons: Reason[] = result.reasons.map((r) => ({ title: r.title, detail: r.detail, weight: r.weight, icon: r.icon }))
  return { id: String(now), createdAt: now, kind, score: result.score, level: levelFor(result.score), reasons, matchedRules: result.matchedRules }
}
