"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { UserData, Workout, WorkoutType } from "@/lib/types"
import type { UserClass, UserGender } from "@/lib/user-profile"
import { calculateDayStreak } from "@/lib/badge-calculations"
import { getDaysLeft } from "@/lib/challenge-config"

interface ProgressDataPoint {
  date: string
  meters: number
}

export function useUserData(userId?: string, workoutType?: string) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [progressData, setProgressData] = useState<ProgressDataPoint[] | null>(null)
  const { user } = useAuth()

  const fetchUserData = useCallback(async () => {
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
        const daysLeft = getDaysLeft()
        const dailyRequired = daysLeft > 0 ? Math.ceil(deficit / daysLeft) : deficit
        const dailyRequiredWithRest =
          daysLeft > 0 ? Math.ceil(deficit / (daysLeft * 6 / 7)) : deficit

        const dayStreak = calculateDayStreak(activities)

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
          dayStreak,
          gender: firestoreData.Gender as UserGender | undefined,
          rowerClass: firestoreData.Class as UserClass | undefined,
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
  }, [userId, user, workoutType])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return { userData, progressData, refetchUserData: fetchUserData }
}
