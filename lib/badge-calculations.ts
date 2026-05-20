import { UserData, Workout, BadgeProgress, BadgeId } from './types'

// Helper function to safely parse and validate dates
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

// Helper function to get date in YYYY-MM-DD format (EST)
export const getDateKey = (date: Date = new Date()): string => {
  try {
    // Convert to EST (UTC-5)
    const estDate = new Date(date.getTime() - (5 * 60 * 60 * 1000))
    return estDate.toISOString().split('T')[0]
  } catch {
    // Fallback to current date if there's an error
    const now = new Date()
    const estDate = new Date(now.getTime() - (5 * 60 * 60 * 1000))
    return estDate.toISOString().split('T')[0]
  }
}

// Helper function to get current date in EST timezone for day-based calculations
export const getCurrentDateEST = (): Date => {
  const now = new Date()
  // Convert to EST (UTC-5) and set to midnight
  const estDate = new Date(now.getTime() - (5 * 60 * 60 * 1000))
  estDate.setHours(0, 0, 0, 0)
  return estDate
}

// Helper function to convert any date to EST timezone for day-based calculations
export const convertToEST = (date: Date): Date => {
  const estDate = new Date(date.getTime() - (5 * 60 * 60 * 1000))
  estDate.setHours(0, 0, 0, 0)
  return estDate
}

// Helper function to check if it's a new day (midnight EST)
export const isNewDay = (lastUpdate: Date): boolean => {
  const now = new Date()
  const last = new Date(lastUpdate)
  return getDateKey(now) !== getDateKey(last)
}

// Helper function to get today's stats from activities
const getTodayStats = (activities: any[]) => {
  const today = getDateKey(new Date())
  const todayActivities = activities.filter(activity => {
    const activityDate = safeParseDate(activity.date)
    if (!activityDate) return false
    return getDateKey(activityDate) === today
  })

  const totalMeters = todayActivities.reduce((sum, activity) => sum + (Number(activity.points) || 0), 0)
  const workoutTypes = new Set(todayActivities.map(activity => normalizeActivityType(activity.activity)).filter(Boolean))

  return { totalMeters, workoutTypes }
}

// Helper function to check if workout is before 7 AM EST
export const isBefore7AM = (activity: any): boolean => {
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

// Calculate badge progress for a specific badge
export const calculateBadgeProgress = (
  badgeId: BadgeId,
  userData: UserData,
  activities: any[]
): BadgeProgress => {
  const now = new Date()

  switch (badgeId) {
    case "million-meter-champion":
      return {
        earned: userData.totalMeters >= 1000000,
        earnedDate: userData.totalMeters >= 1000000 ? now : undefined,
        progress: Math.min(userData.totalMeters, 1000000),
        maxProgress: 1000000,
        lastUpdated: now
      }

    case "100k-day":
      // This should be calculated in real-time, not migrated
      return {
        earned: false,
        progress: 0,
        maxProgress: 100000,
        lastUpdated: now
      }

    case "jack-of-all-trades":
      // This should be calculated in real-time, not migrated
      return {
        earned: false,
        progress: 0,
        maxProgress: 6,
        lastUpdated: now
      }

    case "marathon":
      // Manual badge - no calculation needed
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now
      }

    case "monthly-master":
      return {
        earned: userData.dayStreak >= 30,
        earnedDate: userData.dayStreak >= 30 ? now : undefined,
        progress: Math.min(userData.dayStreak, 30),
        maxProgress: 30,
        lastUpdated: now
      }

    case "nates-favorite":
      // Manual badge - no calculation needed
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now
      }

    case "gym-rat":
      const liftActivities = activities.filter(activity => normalizeActivityType(activity.activity) === 'lift').length
      return {
        earned: liftActivities >= 20,
        earnedDate: liftActivities >= 20 ? now : undefined,
        progress: Math.min(liftActivities, 20),
        maxProgress: 20,
        lastUpdated: now
      }

    case "tri":
      // This should be calculated in real-time, not migrated
      return {
        earned: false,
        progress: 0,
        maxProgress: 30000,
        lastUpdated: now
      }

    case "early-bird":
      const earlyBirdActivities = activities.filter(activity => 
        isBefore7AM(activity) && (Number(activity.points) || 0) >= 5000
      ).length
      return {
        earned: earlyBirdActivities >= 10,
        earnedDate: earlyBirdActivities >= 10 ? now : undefined,
        progress: Math.min(earlyBirdActivities, 10),
        maxProgress: 10,
        lastUpdated: now
      }

    case "erg-master":
      const ergActivities = activities.filter(activity => normalizeActivityType(activity.activity) === 'erg').length
      return {
        earned: ergActivities >= 50,
        earnedDate: ergActivities >= 50 ? now : undefined,
        progress: Math.min(ergActivities, 50),
        maxProgress: 50,
        lastUpdated: now
      }

    case "fish":
      const swimActivities = activities.filter(activity => normalizeActivityType(activity.activity) === 'swim').length
      return {
        earned: swimActivities >= 10,
        earnedDate: swimActivities >= 10 ? now : undefined,
        progress: Math.min(swimActivities, 10),
        maxProgress: 10,
        lastUpdated: now
      }

    case "zigzag-method":
      // Manual badge - no calculation needed
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now
      }

    case "mystery-badge":
      // Manual badge - no calculation needed
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now
      }

    case "just-do-track-bruh":
      const runActivities = activities.filter(activity => normalizeActivityType(activity.activity) === 'run').length
      return {
        earned: runActivities >= 10,
        earnedDate: runActivities >= 10 ? now : undefined,
        progress: Math.min(runActivities, 10),
        maxProgress: 10,
        lastUpdated: now
      }

    case "fresh-legs":
      return {
        earned: userData.totalMeters >= 10000,
        earnedDate: userData.totalMeters >= 10000 ? now : undefined,
        progress: Math.min(userData.totalMeters, 10000),
        maxProgress: 10000,
        lastUpdated: now
      }

    case "week-warrior":
      return {
        earned: userData.dayStreak >= 7,
        earnedDate: userData.dayStreak >= 7 ? now : undefined,
        progress: Math.min(userData.dayStreak, 7),
        maxProgress: 7,
        lastUpdated: now
      }

    case "lend-a-hand":
      // Manual badge - no calculation needed
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now
      }

    default:
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now
      }
  }
}

// Get all badge IDs
export const getAllBadgeIds = (): BadgeId[] => [
  "million-meter-champion",
  "100k-day",
  "jack-of-all-trades",
  "marathon",
  "monthly-master",
  "nates-favorite",
  "gym-rat",
  "tri",
  "early-bird",
  "erg-master",
  "fish",
  "zigzag-method",
  "mystery-badge",
  "just-do-track-bruh",
  "lend-a-hand",
  "week-warrior",
  "fresh-legs"
]

// Calculate all badges for a user
export const calculateAllBadges = (
  userData: UserData,
  activities: any[]
): { [badgeId: string]: BadgeProgress } => {
  const badgeIds = getAllBadgeIds()
  const badges: { [badgeId: string]: BadgeProgress } = {}

  badgeIds.forEach(badgeId => {
    badges[badgeId] = calculateBadgeProgress(badgeId, userData, activities)
  })

  return badges
} 