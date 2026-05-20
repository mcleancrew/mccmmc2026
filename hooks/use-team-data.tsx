"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface TeamData {
  totalMeters: number
  targetMeters: number
  membersCount: number
  deficit: number
  remainingDays: number
  dailyTeamRequired: number
  dailyPersonRequired: number
  daysAheadOrBehind: number
}

interface ProgressDataPoint {
  date: string
  meters: number
}

export function useTeamData() {
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [progressData, setProgressData] = useState<ProgressDataPoint[] | null>(null)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Fetch all users from Firestore
        const usersRef = collection(db, "users")
        const querySnapshot = await getDocs(usersRef)

        let totalMeters = 0
        let membersCount = 0
        const allActivities: any[] = []

        querySnapshot.forEach((doc) => {
          const firestoreData = doc.data()
          const activities = firestoreData.activities || []

          // Calculate total meters from activities for this user
          const userMeters = activities.reduce((sum: number, activity: any) => {
            return sum + (Number(activity.points) || 0)
          }, 0)

          totalMeters += userMeters
          membersCount++

          // Collect all activities for daily progress calculation
          activities.forEach((activity: any) => {
            if (activity.date) {
              allActivities.push({
                ...activity,
                date: activity.date.toDate ? activity.date.toDate() : new Date(activity.date)
              })
            }
          })
        })

        // Calculate team metrics
        const targetMeters = 17000000 // Fixed team goal: 17 million meters
        const deficit = Math.max(0, targetMeters - totalMeters)
        
        // Calculate remaining days until Friday, September 5, 2025 EST
        const targetDate = new Date('2025-09-05T00:00:00-05:00') // Friday, September 5, 2025 EST
        const now = new Date()
        
        // Convert current time to EST for accurate calculation
        const nowEST = new Date(now.getTime() - (5 * 60 * 60 * 1000)) // Convert to EST (UTC-5)
        
        // Calculate difference in days, rounding up to include the current day
        const timeDiff = targetDate.getTime() - nowEST.getTime()
        const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
        
        const dailyTeamRequired = Math.ceil(deficit / remainingDays)
        const dailyPersonRequired = Math.ceil(dailyTeamRequired / membersCount)

        const realTeamData: TeamData = {
          totalMeters,
          targetMeters,
          membersCount,
          deficit,
          remainingDays,
          dailyTeamRequired,
          dailyPersonRequired,
          daysAheadOrBehind: 0, // Will calculate this later if needed
        }

        setTeamData(realTeamData)

        // Generate last 30 days of data in EST timezone
        const generateLast30DaysData = () => {
          const data: ProgressDataPoint[] = []
          const today = new Date()
          
          // Convert to EST
          const todayEST = new Date(today.getTime() - (5 * 60 * 60 * 1000))
          
          // Create a map of daily totals from activities
          const dailyTotals = new Map<string, number>()
          
          allActivities.forEach((activity) => {
            // Convert activity date to EST
            const activityDate = new Date(activity.date.getTime() - (5 * 60 * 60 * 1000))
            const dateKey = activityDate.toISOString().split('T')[0] // YYYY-MM-DD format
            const meters = Number(activity.points) || 0
            dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + meters)
          })
          
          // Generate data for last 30 days
          for (let i = 29; i >= 0; i--) {
            const date = new Date(todayEST)
            date.setDate(date.getDate() - i)
            
            const dateKey = date.toISOString().split('T')[0]
            const meters = dailyTotals.get(dateKey) || 0
            
            data.push({
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              meters
            })
          }
          
          return data
        }

        const realProgressData = generateLast30DaysData()
        setProgressData(realProgressData)

      } catch (error) {
        console.error("Error fetching team data:", error)
        setTeamData(null)
      }
    }

    fetchTeamData()
  }, [])

  return { teamData, progressData }
}
