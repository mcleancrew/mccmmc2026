"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getCurrentDateEST, convertToEST } from "@/lib/badge-calculations"
import type { UserData } from "@/lib/types"

// Helper function to normalize activity names for filtering
const normalizeActivityName = (activityName: string): string => {
  const normalized = activityName.toLowerCase().trim()
  
  // Handle OTW variations
  if (normalized.includes("otw") || normalized.includes("on the water")) {
    return "otw"
  }
  
  // Handle other variations
  if (normalized.includes("erg") || normalized.includes("rowing")) {
    return "erg"
  }
  if (normalized.includes("run") || normalized.includes("running")) {
    return "run"
  }
  if (normalized.includes("bike") || normalized.includes("cycling")) {
    return "bike"
  }
  if (normalized.includes("swim") || normalized.includes("swimming")) {
    return "swim"
  }
  if (normalized.includes("lift") || normalized.includes("lifting")) {
    return "lift"
  }
  
  return normalized
}

export function useLeaderboardData() {
  const [leaderboardData, setLeaderboardData] = useState<UserData[] | null>(null)

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Fetch all users from Firestore
        const usersRef = collection(db, "users")
        const querySnapshot = await getDocs(usersRef)

        const users: UserData[] = []

        querySnapshot.forEach((doc) => {
          const firestoreData = doc.data()
          const activities = firestoreData.activities || []

          // Calculate total meters from activities
          const totalMeters = activities.reduce((sum: number, activity: any) => {
            return sum + (Number(activity.points) || 0)
          }, 0)

          // Calculate meters by workout type (normalized)
          const metersByType: { [key: string]: number } = {}
          activities.forEach((activity: any) => {
            const normalizedType = normalizeActivityName(activity.activity || "unknown")
            metersByType[normalizedType] = (metersByType[normalizedType] || 0) + (Number(activity.points) || 0)
          })

          // Calculate deficit (assuming 1M goal)
          const deficit = Math.max(0, 1000000 - totalMeters)

          // Calculate daily requirements
          const daysLeft = 70 // You can make this dynamic based on challenge end date
          const dailyRequired = Math.ceil(deficit / daysLeft)
          const dailyRequiredWithRest = Math.ceil((deficit / daysLeft) * 1.17) // With 1 rest day per week

          // Calculate daily and weekly meters
          const now = new Date()
          const startOfDay = new Date(now)
          startOfDay.setHours(0, 0, 0, 0)
          
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
          startOfWeek.setHours(0, 0, 0, 0)

          const dailyMeters = activities
            .filter((activity: any) => {
              if (!activity.date) return false
              const activityDate = activity.date.toDate ? activity.date.toDate() : new Date(activity.date)
              return activityDate >= startOfDay
            })
            .reduce((sum: number, activity: any) => sum + (Number(activity.points) || 0), 0)

          const weeklyMeters = activities
            .filter((activity: any) => {
              if (!activity.date) return false
              const activityDate = activity.date.toDate ? activity.date.toDate() : new Date(activity.date)
              return activityDate >= startOfWeek
            })
            .reduce((sum: number, activity: any) => sum + (Number(activity.points) || 0), 0)

          // Calculate day streak
          const calculateStreak = (activities: any[]): number => {
            if (activities.length === 0) return 0

            // Get unique dates where user worked out (converted to EST)
            const workoutDates = new Set<string>()
            activities.forEach((activity: any) => {
              if (activity.date) {
                const date = activity.date.toDate ? activity.date.toDate() : new Date(activity.date)
                const estDate = convertToEST(date)
                workoutDates.add(estDate.toISOString().split('T')[0]) // YYYY-MM-DD format
              }
            })

            const sortedDates = Array.from(workoutDates)
              .map(dateStr => new Date(dateStr + 'T00:00:00-05:00')) // Convert back to EST Date
              .sort((a, b) => b.getTime() - a.getTime()) // Sort descending (most recent first)

            if (sortedDates.length === 0) return 0

            let streak = 0
            const today = getCurrentDateEST()

            // Check if user worked out today (EST)
            const todayStr = today.toISOString().split('T')[0]
            const hasWorkedOutToday = sortedDates.some(date => date.toISOString().split('T')[0] === todayStr)

            if (hasWorkedOutToday) {
              streak = 1
              // Count consecutive days backwards from today
              for (let i = 1; i <= 365; i++) {
                const checkDate = new Date(today)
                checkDate.setDate(today.getDate() - i)
                const checkDateStr = checkDate.toISOString().split('T')[0]
                
                const hasWorkedOutOnDate = sortedDates.some(date => date.toISOString().split('T')[0] === checkDateStr)
                if (hasWorkedOutOnDate) {
                  streak++
                } else {
                  break // Streak broken
                }
              }
            } else {
              // User didn't work out today, check if they worked out yesterday
              const yesterday = new Date(today)
              yesterday.setDate(today.getDate() - 1)
              const yesterdayStr = yesterday.toISOString().split('T')[0]
              const hasWorkedOutYesterday = sortedDates.some(date => date.toISOString().split('T')[0] === yesterdayStr)

              if (hasWorkedOutYesterday) {
                streak = 1
                // Count consecutive days backwards from yesterday
                for (let i = 2; i <= 365; i++) {
                  const checkDate = new Date(today)
                  checkDate.setDate(today.getDate() - i)
                  const checkDateStr = checkDate.toISOString().split('T')[0]
                  
                  const hasWorkedOutOnDate = sortedDates.some(date => date.toISOString().split('T')[0] === checkDateStr)
                  if (hasWorkedOutOnDate) {
                    streak++
                  } else {
                    break // Streak broken
                  }
                }
              }
            }

            return streak
          }

          const dayStreak = calculateStreak(activities)

          // Determine top workout type
          const workoutTypeCounts: { [key: string]: number } = {}
          activities.forEach((activity: any) => {
            const normalizedType = normalizeActivityName(activity.activity || "unknown")
            workoutTypeCounts[normalizedType] = (workoutTypeCounts[normalizedType] || 0) + 1
          })
          const topWorkoutType = Object.keys(workoutTypeCounts).reduce((a, b) => 
            workoutTypeCounts[a] > workoutTypeCounts[b] ? a : b, "erg"
          ) as any

          const userData: UserData = {
            id: doc.id,
            name: firestoreData.username || "Unknown User",
            profileImage: firestoreData.profileImage || "/placeholder.png",
            totalMeters,
            dailyMeters,
            weeklyMeters,
            deficit,
            dailyRequired,
            dailyRequiredWithRest,
            topWorkoutType,
            workouts: [], // We don't need full workout data for leaderboard
            metersByType, // Add this for filtering
            dayStreak
          }

          users.push(userData)
        })

        // Sort by total meters (descending)
        users.sort((a, b) => b.totalMeters - a.totalMeters)

        setLeaderboardData(users)

      } catch (error) {
        console.error("Error fetching leaderboard data:", error)
        setLeaderboardData(null)
      }
    }

    fetchLeaderboardData()
  }, [])

  return { leaderboardData }
}
