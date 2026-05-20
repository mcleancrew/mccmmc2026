import { Card, CardContent } from "@/components/ui/card"
import { Award, Trophy, Upload, UserCircle, Users } from "lucide-react"

const features = [
  { icon: Upload, label: "Submit workouts" },
  { icon: Users, label: "View team progress and stats" },
  { icon: Trophy, label: "Browse the leaderboard" },
  { icon: UserCircle, label: "View friends accounts" },
  { icon: Award, label: "Earn badges" },
] as const

export function AuthSiteInfoCard() {
  return (
    <Card className="mb-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardContent className="py-3 px-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug mb-2">
          Welcome to the summer 2026 official meters website, track your summer workouts and try to reach 1M meters!
        </p>
        <ul className="space-y-1.5">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center text-sm text-slate-600 dark:text-slate-400">
              <Icon className="h-4 w-4 mr-2 shrink-0 text-brand" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
