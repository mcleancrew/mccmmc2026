"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTeamData } from "@/hooks/use-team-data"
import { TeamProgressChart } from "@/components/team-progress-chart"
import { RecentWorkoutsGallery } from "@/components/recent-workouts-gallery"

export default function TeamOverview() {
  const { teamData } = useTeamData()

  if (!teamData) {
    return <div>Loading team data...</div>
  }

  const {
    totalMeters,
    targetMeters,
    membersCount,
    deficit,
    remainingDays,
    dailyTeamRequired,
    dailyPersonRequired,
    daysAheadOrBehind,
  } = teamData

  const percentComplete = Math.min(100, (totalMeters / targetMeters) * 100)

  return (
    <div className="space-y-6">
      <RecentWorkoutsGallery />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">Team Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-2">
            <span className="text-3xl font-bold text-brand dark:text-brand-muted">
              {new Intl.NumberFormat().format(totalMeters)}m
            </span>
          </div>
          <Progress value={percentComplete} className="h-3 mb-4" />

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-brand-50 dark:bg-brand-950 p-3 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Team Deficit</p>
              <p className="text-xl font-semibold text-brand-800 dark:text-brand-300">
                {new Intl.NumberFormat().format(deficit)}m
              </p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-950 p-3 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Remaining Days</p>
              <p className="text-xl font-semibold text-brand-800 dark:text-brand-300">{remainingDays}</p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-950 p-3 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Daily Team Goal</p>
              <p className="text-xl font-semibold text-brand-800 dark:text-brand-300">
                {new Intl.NumberFormat().format(dailyTeamRequired)}m
              </p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-950 p-3 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Daily required /Person</p>
              <p className="text-xl font-semibold text-brand-800 dark:text-brand-300">
                {new Intl.NumberFormat().format(dailyPersonRequired)}m
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Team Progress Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamProgressChart />
        </CardContent>
      </Card>
    </div>
  )
}
