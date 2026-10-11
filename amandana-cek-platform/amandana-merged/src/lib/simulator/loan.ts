export type LoanResult = {
  valid: boolean
  /** Biaya total = total bayar - dana cair */
  fee: number
  /** Biaya per periode (%) = (total bayar - dana cair) / dana cair x 100 */
  period: number
  /** Setara per tahun (%) = biaya per periode x 365 / tenor (bunga sederhana) */
  annual: number
}

export function computeLoan(principal: number, net: number, tenorDays: number): LoanResult {
  const valid = principal > 0 && net > 0 && net <= principal && tenorDays > 0
  const fee = valid ? principal - net : 0
  const period = valid ? (fee / net) * 100 : 0
  const annual = valid ? (period * 365) / tenorDays : 0
  return { valid, fee, period, annual }
}
