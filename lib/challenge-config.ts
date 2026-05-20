/** Challenge end: Tuesday, August 25, 2026 (midnight EST). */
export const CHALLENGE_END_DATE = new Date("2026-08-25T00:00:00-05:00")

export function getDaysLeft(now: Date = new Date()): number {
  const nowEST = new Date(now.getTime() - 5 * 60 * 60 * 1000)
  const timeDiff = CHALLENGE_END_DATE.getTime() - nowEST.getTime()
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
}
