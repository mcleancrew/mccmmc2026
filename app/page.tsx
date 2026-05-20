import TeamOverview from "@/components/team-overview"
import TopPerformersCard from "@/components/top-performers-card"
import { RecentWorkoutsGallery } from "@/components/recent-workouts-gallery"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="container px-4 py-6">
      {/* McLean Crew Header Card */}
      <Card className="mb-6 bg-gradient-to-r from-brand-50 to-cyan-50 dark:from-brand-950 dark:to-cyan-950 border-brand-200 dark:border-brand-800">
        <CardContent className="py-1">
          <div className="flex flex-col items-center text-center">
            <div className="mb-0">
              <img src="/images/mclean-crew-logo.png" alt="McLean Crew Logo" className="h-40 w-40 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-brand dark:text-brand-100 mb-1 -mt-2">McLean Crew</h1>
            <p className="text-lg text-brand dark:text-brand-muted font-medium">Million Meters Challenge</p>
          </div>
        </CardContent>
      </Card>

      <TopPerformersCard />
      <TeamOverview />
    </div>
  )
}
