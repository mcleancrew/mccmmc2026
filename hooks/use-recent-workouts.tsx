"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { WorkoutType } from "@/lib/types"

interface RecentWorkout {
  id: string
  userName: string
  userProfileImage: string
  type: WorkoutType
  meters: number
  date: Date
  images?: string[]
  notes?: string
  highlight?: boolean | string | { reason?: string }
}

export function useRecentWorkouts() {
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[] | null>(null)

  useEffect(() => {
    const fetchRecentWorkouts = async () => {
      try {
        // Fetch all users from Firestore
        const usersRef = collection(db, "users")
        const querySnapshot = await getDocs(usersRef)

        const allWorkouts: RecentWorkout[] = []

        // Process each user's activities
        querySnapshot.forEach((doc) => {
          const firestoreData = doc.data()
          const activities = firestoreData.activities || []
          const userName = firestoreData.username || "Unknown User"

          // Convert activities to RecentWorkout format
          activities.forEach((activity: any, index: number) => {
            if (activity.date) {
              const workout: RecentWorkout = {
                id: `${doc.id}-${index}`,
                userName,
                userProfileImage: firestoreData.profileImage || "/placeholder.png",
                type: (activity.activity?.toLowerCase() || "unknown") as WorkoutType,
                meters: Number(activity.points) || 0,
                date: activity.date?.toDate() || new Date(),
                images: activity.images || (activity.image ? [activity.image] : []),
                notes: activity.notes || undefined,
                highlight: activity.highlight
              }
              allWorkouts.push(workout)
            }
          })
        })

        // Sort by date (most recent first) and take the most recent 5
        const sortedWorkouts = allWorkouts
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5)

        setRecentWorkouts(sortedWorkouts)

      } catch (error) {
        console.error("Error fetching recent workouts:", error)
        setRecentWorkouts([])
      }
    }

    fetchRecentWorkouts()
  }, [])

  return { recentWorkouts }
}
