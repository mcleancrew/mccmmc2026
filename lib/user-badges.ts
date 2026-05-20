import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"
import { calculateAllBadges } from "./badge-calculations"
import type { UserBadgeData, UserData } from "./types"

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
