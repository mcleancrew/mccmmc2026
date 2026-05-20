"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useLeaderboardData } from "@/hooks/use-leaderboard-data"
import { Trophy, Calendar, Clock } from "lucide-react"

interface TopPerformer {
  userId: string
  name: string
  profileImage: string
  meters: number
}

export default function TopPerformersCard() {
  const { leaderboardData } = useLeaderboardData()
  const router = useRouter()
  const [topPerformers, setTopPerformers] = useState<{
    weekly: TopPerformer | null
    daily: TopPerformer | null
    overall: TopPerformer | null
  }>({
    weekly: null,
    daily: null,
    overall: null
  })

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        // Fetch all users from Firestore
        const usersRef = collection(db, "users")
        const querySnapshot = await getDocs(usersRef)

        const allActivities: any[] = []
        const userMap = new Map<string, { name: string; profileImage: string }>()

        // Process each user's activities
        querySnapshot.forEach((doc) => {
          const firestoreData = doc.data()
          const activities = firestoreData.activities || []
          const userName = firestoreData.username || "Unknown User"

          userMap.set(doc.id, {
            name: userName,
            profileImage: firestoreData.profileImage || "/placeholder.png"
          })

          // Collect all activities with user info
          activities.forEach((activity: any) => {
            if (activity.date) {
              allActivities.push({
                ...activity,
                userId: doc.id,
                userName,
                date: activity.date.toDate ? activity.date.toDate() : new Date(activity.date)
              })
            }
          })
        })

        // Calculate date ranges
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0)

        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)

        // Calculate weekly top performer
        const weeklyActivities = allActivities.filter(activity => 
          activity.date >= startOfWeek
        )
        const weeklyMetersByUser = new Map<string, number>()
        weeklyActivities.forEach(activity => {
          const meters = Number(activity.points) || 0
          weeklyMetersByUser.set(activity.userId, 
            (weeklyMetersByUser.get(activity.userId) || 0) + meters
          )
        })

        // Calculate daily top performer
        const dailyActivities = allActivities.filter(activity => 
          activity.date >= startOfDay
        )
        const dailyMetersByUser = new Map<string, number>()
        dailyActivities.forEach(activity => {
          const meters = Number(activity.points) || 0
          dailyMetersByUser.set(activity.userId, 
            (dailyMetersByUser.get(activity.userId) || 0) + meters
          )
        })

        // Calculate overall top performer (from leaderboard data)
        const overallTop = leaderboardData?.[0] || null

        // Find top performers
        let weeklyTop: TopPerformer | null = null
        let maxWeeklyMeters = 0
        weeklyMetersByUser.forEach((meters, userId) => {
          if (meters > maxWeeklyMeters) {
            maxWeeklyMeters = meters
            const userInfo = userMap.get(userId)
            weeklyTop = {
              userId,
              name: userInfo?.name || "Unknown User",
              profileImage: userInfo?.profileImage || "/placeholder.png",
              meters
            }
          }
        })

        let dailyTop: TopPerformer | null = null
        let maxDailyMeters = 0
        dailyMetersByUser.forEach((meters, userId) => {
          if (meters > maxDailyMeters) {
            maxDailyMeters = meters
            const userInfo = userMap.get(userId)
            dailyTop = {
              userId,
              name: userInfo?.name || "Unknown User",
              profileImage: userInfo?.profileImage || "/placeholder.png",
              meters
            }
          }
        })

        const overallTopPerformer: TopPerformer | null = overallTop ? {
          userId: overallTop.id,
          name: overallTop.name,
          profileImage: overallTop.profileImage || "/placeholder.png",
          meters: overallTop.totalMeters
        } : null

        setTopPerformers({
          weekly: weeklyTop,
          daily: dailyTop,
          overall: overallTopPerformer
        })

      } catch (error) {
        console.error("Error fetching top performers:", error)
      }
    }

    if (leaderboardData) {
      fetchTopPerformers()
    }
  }, [leaderboardData])

  if (!leaderboardData) {
    return <div>Loading top performers...</div>
  }

  const performers = [
    {
      title: "Weekly Top",
      icon: Calendar,
      performer: topPerformers.weekly,
      iconColor: "text-green-600",
    },
    {
      title: "Top",
      icon: Trophy,
      performer: topPerformers.overall,
      iconColor: "text-yellow-600",
    },
    {
      title: "Daily Top",
      icon: Clock,
      performer: topPerformers.daily,
      iconColor: "text-blue-600",
    },
  ]

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {performers.map((performer, index) => (
            <div key={index} className="text-center flex flex-col items-center">
              <div className="flex items-center justify-center mb-2">
                <performer.icon className={`h-4 w-4 mr-1 ${performer.iconColor}`} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{performer.title}</span>
              </div>

              <div className="flex flex-col items-center w-full">
                <Avatar className="h-10 w-10 mb-2">
                  <AvatarImage src={performer.performer?.profileImage || "/placeholder.svg"} alt={performer.performer?.name || "Unknown"} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                    {performer.performer?.name?.substring(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>

                <p 
                  className={`text-sm font-medium text-slate-800 dark:text-slate-200 mb-1 w-full text-center ${
                    performer.performer ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''
                  }`}
                  onClick={() => performer.performer && handleProfileClick(performer.performer.userId)}
                >
                  {performer.performer?.name || "No data"}
                </p>

                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 w-full text-center">
                  {performer.performer ? new Intl.NumberFormat().format(performer.performer.meters) : "0"}m
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
