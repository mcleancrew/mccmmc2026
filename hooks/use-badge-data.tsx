"use client"

import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserBadgeData } from '@/lib/types'
import {
  calculateAllBadges,
  findNewlyEarnedBadges,
  getBadgeDisplayName,
  isNewDay,
  mergeCalculatedBadges,
} from '@/lib/badge-calculations'
import { cleanBadgeDataForFirestore, ensureUserBadgeDocument } from '@/lib/user-badges'
import { useUserData } from './use-user-data'
import { useToast } from './use-toast'

const getActivitiesFromUserData = (userData: { activities?: unknown[]; workouts?: unknown[] }) => {
  if (userData.activities && Array.isArray(userData.activities)) {
    return userData.activities
  }
  if (userData.workouts && Array.isArray(userData.workouts)) {
    return userData.workouts
  }
  return []
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

    const unsubscribe = onSnapshot(badgeRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserBadgeData
        setBadgeData(data)
        setLoading(false)
      } else if (userData) {
        await initializeBadgeData(userId)
      } else {
        setLoading(false)
      }
    }, (error) => {
      console.error('Error fetching badge data:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId, userData])

  useEffect(() => {
    if (!userId || !userData || badgeData) return
    void initializeBadgeData(userId)
  }, [userId, userData, badgeData])

  useEffect(() => {
    if (!userId || !userData || !badgeData) return

    const updateBadges = async () => {
      const activities = getActivitiesFromUserData(userData as { activities?: unknown[]; workouts?: unknown[] })
      const calculatedBadges = calculateAllBadges(userData, activities)
      const mergedBadges = mergeCalculatedBadges(badgeData.badges, calculatedBadges)
      const hasNewEarnedBadges = findNewlyEarnedBadges(badgeData.badges, mergedBadges)

      if (hasNewEarnedBadges.length > 0) {
        hasNewEarnedBadges.forEach((badgeId) => {
          const badge = mergedBadges[badgeId]
          if (badge.earnedDate) {
            toast({
              title: '🎉 Badge Earned!',
              description: `Congratulations! You've earned the ${getBadgeDisplayName(badgeId)} badge!`,
            })
          }
        })
      }

      const updatedBadgeData: UserBadgeData = {
        userId,
        badges: mergedBadges,
        lastCalculated: new Date(),
      }

      const badgeRef = doc(db, 'badges', userId)
      await setDoc(badgeRef, cleanBadgeDataForFirestore(updatedBadgeData), { merge: true })
    }

    if (isNewDay(badgeData.lastCalculated)) {
      updateBadges()
    }
  }, [userId, userData, badgeData, toast])

  const initializeBadgeData = async (targetUserId: string) => {
    if (!userData) return

    const activities = getActivitiesFromUserData(userData as { activities?: unknown[]; workouts?: unknown[] })
    const initialData = await ensureUserBadgeDocument(targetUserId, userData, activities)
    setBadgeData(initialData)
    setLoading(false)
  }

  return {
    badgeData,
    loading,
    badges: badgeData?.badges || {},
  }
}
