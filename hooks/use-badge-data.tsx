"use client"

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserBadgeData, BadgeProgress, BadgeId } from '@/lib/types'
import { calculateAllBadges, isNewDay, getDateKey } from '@/lib/badge-calculations'
import { useUserData } from './use-user-data'
import { useToast } from './use-toast'

// Helper function to clean badge data for Firestore (remove undefined values)
const cleanBadgeDataForFirestore = (badgeData: UserBadgeData): any => {
  const cleanedBadges: { [key: string]: any } = {}
  
  Object.entries(badgeData.badges).forEach(([badgeId, badge]) => {
    const cleanedBadge: any = {
      earned: badge.earned,
      progress: badge.progress,
      maxProgress: badge.maxProgress,
      lastUpdated: badge.lastUpdated
    }
    
    // Only include earnedDate if it's not undefined
    if (badge.earnedDate) {
      cleanedBadge.earnedDate = badge.earnedDate
    }
    
    cleanedBadges[badgeId] = cleanedBadge
  })
  
  return {
    userId: badgeData.userId,
    badges: cleanedBadges,
    lastCalculated: badgeData.lastCalculated
  }
}

// Helper function to get activities from user data
const getActivitiesFromUserData = (userData: any) => {
  if (userData.activities && Array.isArray(userData.activities)) {
    return userData.activities
  } else if (userData.workouts && Array.isArray(userData.workouts)) {
    return userData.workouts
  }
  return []
}

// Helper function to normalize activity type names
const normalizeActivityType = (activityName: string): string => {
  if (!activityName) return 'unknown'
  const normalized = activityName.toLowerCase().trim()
  
  // Handle variations
  if (normalized.includes('otw') || normalized.includes('on the water')) {
    return 'otw'
  }
  if (normalized.includes('erg') || normalized.includes('rowing')) {
    return 'erg'
  }
  if (normalized.includes('run') || normalized.includes('running')) {
    return 'run'
  }
  if (normalized.includes('bike') || normalized.includes('cycling')) {
    return 'bike'
  }
  if (normalized.includes('swim') || normalized.includes('swimming')) {
    return 'swim'
  }
  if (normalized.includes('lift') || normalized.includes('lifting')) {
    return 'lift'
  }
  
  return normalized
}

// Helper function to safely parse dates
const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null
  
  try {
    // Handle Firestore Timestamp
    if (dateValue.toDate) {
      return dateValue.toDate()
    }
    const date = new Date(dateValue)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

// Helper function to check if workout is before 7 AM EST
const isBefore7AM = (activity: any): boolean => {
  const activityDate = safeParseDate(activity.date)
  if (!activityDate) return false
  
  try {
    // Convert to EST
    const estDate = new Date(activityDate.getTime() - (5 * 60 * 60 * 1000))
    return estDate.getHours() < 7
  } catch {
    return false
  }
}

// Function to calculate real-time badges
const calculateRealTimeBadges = (activities: any[], userData: any): { [badgeId: string]: BadgeProgress } => {
  const now = new Date()
  const today = getDateKey(now)
  
  // Get today's activities
  const todayActivities = activities.filter(activity => {
    const activityDate = safeParseDate(activity.date)
    if (!activityDate) return false
    return getDateKey(activityDate) === today
  })

  const todayMeters = todayActivities.reduce((sum, activity) => sum + (Number(activity.points) || 0), 0)
  const todayWorkoutTypes = new Set(todayActivities.map(activity => normalizeActivityType(activity.activity)).filter(Boolean))

  return {
    "100k-day": {
      earned: todayMeters >= 100000,
      earnedDate: todayMeters >= 100000 ? now : undefined,
      progress: Math.min(todayMeters, 100000),
      maxProgress: 100000,
      lastUpdated: now
    },
    "jack-of-all-trades": {
      earned: todayWorkoutTypes.size >= 6,
      earnedDate: todayWorkoutTypes.size >= 6 ? now : undefined,
      progress: Math.min(todayWorkoutTypes.size, 6),
      maxProgress: 6,
      lastUpdated: now
    },
    "tri": {
      earned: todayMeters >= 30000,
      earnedDate: todayMeters >= 30000 ? now : undefined,
      progress: Math.min(todayMeters, 30000),
      maxProgress: 30000,
      lastUpdated: now
    },
    "week-warrior": {
      earned: userData.dayStreak >= 7,
      earnedDate: userData.dayStreak >= 7 ? now : undefined,
      progress: Math.min(userData.dayStreak, 7),
      maxProgress: 7,
      lastUpdated: now
    }
  }
}

export function useBadgeData(userId?: string) {
  const [badgeData, setBadgeData] = useState<UserBadgeData | null>(null)
  const [loading, setLoading] = useState(true)
  const { userData } = useUserData(userId)
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const badgeRef = doc(db, 'badges', userId)
    
    const unsubscribe = onSnapshot(badgeRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserBadgeData
        setBadgeData(data)
        setLoading(false)
      } else {
        // Create initial badge data if it doesn't exist
        await initializeBadgeData(userId)
      }
    }, (error) => {
      console.error('Error fetching badge data:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  // Calculate and update badges when user data changes
  useEffect(() => {
    if (!userId || !userData || !badgeData) return

    const updateBadges = async () => {
      const activities = getActivitiesFromUserData(userData)
      
      // Get lifetime badges from migration
      const lifetimeBadges = calculateAllBadges(userData, activities)
      
      // Calculate real-time badges
      const realTimeBadges = calculateRealTimeBadges(activities, userData)
      
      // Merge badges, preserving any already earned badges
      const mergedBadges = { ...lifetimeBadges }
      
      // For all badges, if they're already earned, keep them as-is
      Object.entries({ ...lifetimeBadges, ...realTimeBadges }).forEach(([badgeId, newBadge]) => {
        const existingBadge = badgeData.badges[badgeId]
        
        if (existingBadge?.earned) {
          // If badge is already earned, don't change it
          mergedBadges[badgeId] = existingBadge
        } else {
          // If not earned, use the new calculation
          mergedBadges[badgeId] = newBadge
        }
      })
      
      const hasNewEarnedBadges = checkForNewEarnedBadges(badgeData.badges, mergedBadges)
      
      if (hasNewEarnedBadges.length > 0) {
        // Show toast for each newly earned badge
        hasNewEarnedBadges.forEach(badgeId => {
          const badge = mergedBadges[badgeId]
          if (badge.earnedDate) {
            toast({
              title: "🎉 Badge Earned!",
              description: `Congratulations! You've earned the ${getBadgeName(badgeId)} badge!`,
            })
          }
        })
      }

      // Create updated badge data
      const updatedBadgeData: UserBadgeData = {
        userId,
        badges: mergedBadges,
        lastCalculated: new Date()
      }

      // Clean the data for Firestore
      const cleanedData = cleanBadgeDataForFirestore(updatedBadgeData)

      // Update Firestore
      const badgeRef = doc(db, 'badges', userId)
      await setDoc(badgeRef, cleanedData, { merge: true })
    }

    // Check if we need to recalculate (new day)
    const needsRecalculation = isNewDay(badgeData.lastCalculated)

    if (needsRecalculation) {
      updateBadges()
    }
  }, [userId, userData, badgeData, toast])

  const initializeBadgeData = async (userId: string) => {
    if (!userData) return

    const activities = getActivitiesFromUserData(userData)
    const newBadges = calculateAllBadges(userData, activities)

    const initialData: UserBadgeData = {
      userId,
      badges: newBadges,
      lastCalculated: new Date()
    }

    // Clean the data for Firestore
    const cleanedData = cleanBadgeDataForFirestore(initialData)

    const badgeRef = doc(db, 'badges', userId)
    await setDoc(badgeRef, cleanedData)
    setBadgeData(initialData)
    setLoading(false)
  }

  const checkForNewEarnedBadges = (
    oldBadges: { [badgeId: string]: BadgeProgress },
    newBadges: { [badgeId: string]: BadgeProgress }
  ): BadgeId[] => {
    const newlyEarned: BadgeId[] = []
    
    Object.keys(newBadges).forEach(badgeId => {
      const oldBadge = oldBadges[badgeId]
      const newBadge = newBadges[badgeId]
      
      if (!oldBadge?.earned && newBadge.earned) {
        newlyEarned.push(badgeId as BadgeId)
      }
    })
    
    return newlyEarned
  }

  const getBadgeName = (badgeId: BadgeId): string => {
    const badgeNames: Record<BadgeId, string> = {
      "million-meter-champion": "Million Meter Champion",
      "100k-day": "Centurion",
      "jack-of-all-trades": "Jack of All Trades",
      "marathon": "Marathon",
      "monthly-master": "Monthly Master",
      "nates-favorite": "Nate's Favorite",
      "gym-rat": "Gym Rat",
      "tri": "Tri",
      "early-bird": "Early Bird",
      "erg-master": "Erg Master",
      "fish": "Fish",
      "zigzag-method": "Zigzag Method",
      "mystery-badge": "???",
      "just-do-track-bruh": "Just Do Track Bruh",
      "lend-a-hand": "Lend a Hand",
      "week-warrior": "Week Warrior",
      "fresh-legs": "Fresh Legs"
    }
    
    return badgeNames[badgeId] || badgeId
  }

  return {
    badgeData,
    loading,
    badges: badgeData?.badges || {}
  }
} 