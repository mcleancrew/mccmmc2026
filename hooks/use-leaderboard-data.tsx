"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { calculateDayStreak, normalizeActivityType } from "@/lib/badge-calculations"
import { getDaysLeft } from "@/lib/challenge-config"
import type { UserData } from "@/lib/types"

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
            const normalizedType = normalizeActivityType(activity.activity || "unknown")
            metersByType[normalizedType] = (metersByType[normalizedType] || 0) + (Number(activity.points) || 0)
          })

          // Calculate deficit (assuming 1M goal)
          const deficit = Math.max(0, 1000000 - totalMeters)

          // Calculate daily requirements
          const daysLeft = getDaysLeft()
          const dailyRequired = daysLeft > 0 ? Math.ceil(deficit / daysLeft) : deficit
          const dailyRequiredWithRest =
            daysLeft > 0 ? Math.ceil((deficit / daysLeft) * 1.17) : deficit

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

          const dayStreak = calculateDayStreak(activities)

          // Determine top workout type
          const workoutTypeCounts: { [key: string]: number } = {}
          activities.forEach((activity: any) => {
            const normalizedType = normalizeActivityType(activity.activity || "unknown")
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
