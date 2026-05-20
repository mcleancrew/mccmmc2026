"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useLeaderboardData } from "@/hooks/use-leaderboard-data"
import { TopThreeUsers } from "@/components/top-three-users"
import { UserLeaderboardCard } from "@/components/user-leaderboard-card"
import type { WorkoutType } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LeaderboardPage() {
  const { leaderboardData } = useLeaderboardData()
  const [activeTab, setActiveTab] = useState<WorkoutType | "all">("all")

  if (!leaderboardData) {
    return <div>Loading leaderboard data...</div>
  }

  // Filter and sort users based on selected workout type
  const filteredUsers = leaderboardData
    .filter((user) => {
      if (activeTab === "all") {
        return true // Show all users
      }
      
      // Check if user has done this workout type
      const metersForType = user.metersByType?.[activeTab] || 0
      return metersForType > 0
    })
    .map((user) => {
      if (activeTab === "all") {
        return user // Use total meters for "all" filter
      }
      
      // For specific workout type, create a modified user object with meters for that type
      const metersForType = user.metersByType?.[activeTab] || 0
      return {
        ...user,
        totalMeters: metersForType, // Use meters for this specific type
        deficit: Math.max(0, 1000000 - metersForType) // Recalculate deficit for this type
      }
    })
    .sort((a, b) => b.totalMeters - a.totalMeters)

  const topThree = filteredUsers.slice(0, 3)
  const restOfUsers = filteredUsers.slice(3)

  return (
    <div className="container px-4 py-6">
      <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-6">Leaderboard</h1>

      <div className="mb-6">
        <Select defaultValue="all" onValueChange={(value) => setActiveTab(value as WorkoutType | "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by workout type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workout Types</SelectItem>
            <SelectItem value="erg">Erging</SelectItem>
            <SelectItem value="run">Running</SelectItem>
            <SelectItem value="bike">Biking</SelectItem>
            <SelectItem value="swim">Swimming</SelectItem>
            <SelectItem value="otw">On The Water</SelectItem>
            <SelectItem value="lift">Lifting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {topThree.length > 0 && (
        <div className="mb-4">
          <TopThreeUsers users={topThree} />
        </div>
      )}

      <div className="space-y-3">
        {restOfUsers.map((user, index) => (
          <UserLeaderboardCard key={user.id} user={user} rank={index + 4} />
        ))}

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-slate-500">
              No users found matching your search criteria.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
