export type UserGender = "M" | "F"

export const USER_CLASS_OPTIONS = [
  "Freshman/Novice Rower",
  "Varsity Rower",
  "Coxswain",
  "Coach",
] as const

export type UserClass = (typeof USER_CLASS_OPTIONS)[number]

export function getTeamLabel(gender: UserGender | undefined): string | null {
  if (gender === "M") return "Boys Team"
  if (gender === "F") return "Girls Team"
  return null
}

export function getTeamColorClass(gender: UserGender | undefined): string {
  if (gender === "F") return "text-pink-600 dark:text-pink-400"
  if (gender === "M") return "text-blue-600 dark:text-blue-400"
  return "text-slate-600 dark:text-slate-400"
}
