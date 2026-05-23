import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"
import {
  buildUserDataForBadgeCalculation,
  calculateAllBadges,
  findNewlyEarnedBadges,
  getBadgeDisplayName,
  mergeCalculatedBadges,
} from "./badge-calculations"
import type { BadgeProgress, UserBadgeData, UserData } from "./types"

export function cleanBadgeDataForFirestore(badgeData: UserBadgeData): Record<string, unknown> {
  const cleanedBadges: { [key: string]: Record<string, unknown> } = {}

  Object.entries(badgeData.badges).forEach(([badgeId, badge]) => {
    const cleanedBadge: Record<string, unknown> = {
      earned: badge.earned,
      progress: badge.progress,
      maxProgress: badge.maxProgress,
      lastUpdated: badge.lastUpdated,
    }

    if (badge.earnedDate) {
      cleanedBadge.earnedDate = badge.earnedDate
    }

    cleanedBadges[badgeId] = cleanedBadge
  })

  return {
    userId: badgeData.userId,
    badges: cleanedBadges,
    lastCalculated: badgeData.lastCalculated,
  }
}

export function createDefaultUserDataForBadges(userId: string, username: string): UserData {
  return {
    id: userId,
    name: username,
    profileImage: "/placeholder.png",
    totalMeters: 0,
    dayStreak: 0,
    dailyMeters: 0,
    weeklyMeters: 0,
    deficit: 1_000_000,
    dailyRequired: 0,
    dailyRequiredWithRest: 0,
    topWorkoutType: "erg",
    workouts: [],
  }
}

export function createInitialBadgeData(
  userId: string,
  userData: UserData,
  activities: unknown[] = []
): UserBadgeData {
  return {
    userId,
    badges: calculateAllBadges(userData, activities),
    lastCalculated: new Date(),
  }
}

/** Creates the badges/{userId} document if it does not exist yet. */
export async function ensureUserBadgeDocument(
  userId: string,
  userData: UserData,
  activities: unknown[] = []
): Promise<UserBadgeData> {
  const badgeRef = doc(db, "badges", userId)
  const snap = await getDoc(badgeRef)

  if (snap.exists()) {
    return snap.data() as UserBadgeData
  }

  const initialData = createInitialBadgeData(userId, userData, activities)
  await setDoc(badgeRef, cleanBadgeDataForFirestore(initialData))
  return initialData
}

export interface NewlyEarnedBadge {
  id: string
  name: string
  earnedDate?: Date
}

/** Recalculate badges from activities and persist, preserving already-earned badges. */
export async function syncUserBadges(
  userId: string,
  options?: {
    username?: string
    profileImage?: string
    activities?: any[]
  }
): Promise<NewlyEarnedBadge[]> {
  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    console.error("User not found for badge update:", userId)
    return []
  }

  const userData = userSnap.data()
  const activities = options?.activities ?? userData.activities ?? []

  const badgeUserData = buildUserDataForBadgeCalculation(userId, {
    username: options?.username ?? userData.username,
    profileImage: options?.profileImage ?? userData.profileImage,
    activities,
  })

  const calculatedBadges = calculateAllBadges(badgeUserData, activities)

  const badgeRef = doc(db, "badges", userId)
  const badgeSnap = await getDoc(badgeRef)
  const oldBadges: { [badgeId: string]: BadgeProgress } = badgeSnap.exists()
    ? badgeSnap.data().badges || {}
    : {}

  const mergedBadges = mergeCalculatedBadges(oldBadges, calculatedBadges)
  const newlyEarnedIds = findNewlyEarnedBadges(oldBadges, mergedBadges)

  const badgeData: UserBadgeData = {
    userId,
    badges: mergedBadges,
    lastCalculated: new Date(),
  }

  await updateDoc(badgeRef, cleanBadgeDataForFirestore(badgeData))

  return newlyEarnedIds.map((badgeId) => ({
    id: badgeId,
    name: getBadgeDisplayName(badgeId),
    earnedDate: mergedBadges[badgeId]?.earnedDate,
  }))
}

/** Called after a workout is submitted to refresh badges and return any newly earned. */
export async function updateUserBadgesAfterWorkout(userId: string): Promise<NewlyEarnedBadge[]> {
  try {
    const earned = await syncUserBadges(userId)
    if (earned.length > 0) {
      console.log(
        "🎉 Newly earned badges:",
        earned.map((b) => b.name)
      )
    }
    return earned
  } catch (error) {
    console.error("❌ Failed to update badges:", error)
    return []
  }
}
