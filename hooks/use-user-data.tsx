"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { UserData, Workout, WorkoutType } from "@/lib/types"
import { getCurrentDateEST, convertToEST } from "@/lib/badge-calculations"

interface ProgressDataPoint {
  date: string
  meters: number
}

export function useUserData(userId?: string, workoutType?: string) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [progressData, setProgressData] = useState<ProgressDataPoint[] | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let targetUserId = userId

        // If no userId provided or it's "current-user", use the logged-in user's ID
        if (!targetUserId || targetUserId === "current-user") {
          if (!user) {
            setUserData(null)
            return
          }
          targetUserId = user.id
        }

        // Fetch user data from Firestore
        const userRef = doc(db, "users", targetUserId)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          console.error("User not found:", targetUserId)
          setUserData(null)
          return
        }

        const firestoreData = userSnap.data()
        const activities = firestoreData.activities || []

        // Calculate total meters from activities
        const totalMeters = activities.reduce((sum: number, activity: any) => {
          return sum + (Number(activity.points) || 0)
        }, 0)

        // Calculate deficit (assuming 1M goal)
        const deficit = Math.max(0, 1000000 - totalMeters)

        // Calculate daily requirements
        const daysLeft = 70 // You can make this dynamic based on challenge end date
        const dailyRequired = Math.ceil(deficit / daysLeft)
        const dailyRequiredWithRest = Math.ceil(deficit / (daysLeft * 6/7)) // With 1 rest day per week (6 active days out of 7)

        // Calculate workout streak
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
            for (let i = 1; i <= 365; i++) { // Limit to 1 year to prevent infinite loop
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

        // Convert activities to workout format
        const workouts: Workout[] = activities.map((activity: any, index: number) => ({
          id: `${targetUserId}-${index}`,
          type: activity.activity?.toLowerCase() || "unknown",
          meters: Number(activity.points) || 0,
          date: activity.date?.toDate() || new Date(),
          images: activity.images || (activity.image ? [activity.image] : [])
        })).sort((a: Workout, b: Workout) => b.date.getTime() - a.date.getTime()) // Sort by date, most recent first

        // Determine top workout type
        const workoutTypeCounts: { [key: string]: number } = {}
        activities.forEach((activity: any) => {
          const type = activity.activity?.toLowerCase() || "unknown"
          workoutTypeCounts[type] = (workoutTypeCounts[type] || 0) + 1
        })
        const topWorkoutType = Object.keys(workoutTypeCounts).reduce((a, b) => 
          workoutTypeCounts[a] > workoutTypeCounts[b] ? a : b, "erg"
        ) as WorkoutType

        const realUserData: UserData = {
          id: targetUserId,
          name: firestoreData.username || "Unknown User",
          profileImage: firestoreData.profileImage || "/placeholder.png",
          totalMeters,
          dailyMeters: 0, // Will be calculated if needed for time-based features
          weeklyMeters: 0, // Will be calculated if needed for time-based features
          deficit,
          dailyRequired,
          dailyRequiredWithRest,
          topWorkoutType,
          workouts,
          dayStreak
        }

        setUserData(realUserData)

        // Generate progress data from activities
        const progressDataPoints: ProgressDataPoint[] = []
        const now = new Date()
        
        // Generate last 14 days of data
        for (let i = 13; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0) // Set to start of day
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          // Find activities for this date
          let dayActivities = activities.filter((activity: any) => {
            if (!activity.date) return false
            
            let activityDate: Date
            if (activity.date.toDate) {
              // Firestore Timestamp
              activityDate = activity.date.toDate()
            } else if (activity.date instanceof Date) {
              // Already a Date object
              activityDate = activity.date
            } else {
              // String or other format
              activityDate = new Date(activity.date)
            }
            
            // Set to start of day for comparison
            activityDate.setHours(0, 0, 0, 0)
            
            return activityDate.getTime() === date.getTime()
          })

          // Filter by workout type if specified
          if (workoutType && workoutType !== "all") {
            dayActivities = dayActivities.filter((activity: any) => {
              const activityType = activity.activity?.toLowerCase() || "unknown"
              
              // Map the workout type to the actual activity names stored in the database
              switch (workoutType) {
                case "otw":
                  return activityType === "otw row" || activityType === "otw"
                case "erg":
                  return activityType === "erg" || activityType === "erging"
                case "run":
                  return activityType === "run" || activityType === "running"
                case "bike":
                  return activityType === "bike" || activityType === "biking"
                case "swim":
                  return activityType === "swim" || activityType === "swimming"
                case "lift":
                  return activityType === "lift" || activityType === "lifting"
                default:
                  return activityType === workoutType
              }
            })
          }
          
          const dayMeters = dayActivities.reduce((sum: number, activity: any) => {
            const points = Number(activity.points) || 0
            return sum + points
          }, 0)
          
          progressDataPoints.push({
            date: dateStr,
            meters: dayMeters
          })
        }

        setProgressData(progressDataPoints)

      } catch (error) {
        console.error("Error fetching user data:", error)
        setUserData(null)
      }
    }

    fetchUserData()
  }, [userId, user, workoutType])

  return { userData, progressData }
}
