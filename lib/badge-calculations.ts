import { UserData, BadgeProgress, BadgeId } from './types'

// --- Shared activity / date helpers ---

export const normalizeActivityType = (activityName: string): string => {
  if (!activityName) return 'unknown'
  const normalized = activityName.toLowerCase().trim()

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

export const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null

  try {
    if (dateValue.toDate) {
      return dateValue.toDate()
    }
    const date = new Date(dateValue)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

export const getDateKey = (date: Date = new Date()): string => {
  try {
    const estDate = new Date(date.getTime() - (5 * 60 * 60 * 1000))
    return estDate.toISOString().split('T')[0]
  } catch {
    const now = new Date()
    const estDate = new Date(now.getTime() - (5 * 60 * 60 * 1000))
    return estDate.toISOString().split('T')[0]
  }
}

export const getCurrentDateEST = (): Date => {
  const now = new Date()
  const estDate = new Date(now.getTime() - (5 * 60 * 60 * 1000))
  estDate.setHours(0, 0, 0, 0)
  return estDate
}

export const convertToEST = (date: Date): Date => {
  const estDate = new Date(date.getTime() - (5 * 60 * 60 * 1000))
  estDate.setHours(0, 0, 0, 0)
  return estDate
}

export const isNewDay = (lastUpdate: Date): boolean => {
  const now = new Date()
  const last = new Date(lastUpdate)
  return getDateKey(now) !== getDateKey(last)
}

export const isBefore7AM = (activity: any): boolean => {
  const activityDate = safeParseDate(activity.date)
  if (!activityDate) return false

  try {
    const estDate = new Date(activityDate.getTime() - (5 * 60 * 60 * 1000))
    return estDate.getHours() < 7
  } catch {
    return false
  }
}

export const calculateTotalMeters = (activities: any[]): number =>
  activities.reduce((sum, activity) => sum + (Number(activity.points) || 0), 0)

/** Consecutive workout days ending today (or yesterday if none today). */
export const calculateDayStreak = (activities: any[]): number => {
  if (activities.length === 0) return 0

  const workoutDates = new Set<string>()
  activities.forEach((activity) => {
    if (activity.date) {
      const date = activity.date.toDate ? activity.date.toDate() : new Date(activity.date)
      const estDate = convertToEST(date)
      workoutDates.add(estDate.toISOString().split('T')[0])
    }
  })

  const sortedDates = Array.from(workoutDates)
    .map((dateStr) => new Date(dateStr + 'T00:00:00-05:00'))
    .sort((a, b) => b.getTime() - a.getTime())

  if (sortedDates.length === 0) return 0

  let streak = 0
  const today = getCurrentDateEST()
  const todayStr = today.toISOString().split('T')[0]
  const hasWorkedOutToday = sortedDates.some((date) => date.toISOString().split('T')[0] === todayStr)

  if (hasWorkedOutToday) {
    streak = 1
    for (let i = 1; i <= 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const checkDateStr = checkDate.toISOString().split('T')[0]
      const hasWorkedOutOnDate = sortedDates.some((date) => date.toISOString().split('T')[0] === checkDateStr)
      if (hasWorkedOutOnDate) {
        streak++
      } else {
        break
      }
    }
  } else {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const hasWorkedOutYesterday = sortedDates.some((date) => date.toISOString().split('T')[0] === yesterdayStr)

    if (hasWorkedOutYesterday) {
      streak = 1
      for (let i = 2; i <= 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const checkDateStr = checkDate.toISOString().split('T')[0]
        const hasWorkedOutOnDate = sortedDates.some((date) => date.toISOString().split('T')[0] === checkDateStr)
        if (hasWorkedOutOnDate) {
          streak++
        } else {
          break
        }
      }
    }
  }

  return streak
}

export function buildUserDataForBadgeCalculation(
  userId: string,
  options: {
    username?: string
    profileImage?: string
    activities: any[]
  }
): UserData {
  const totalMeters = calculateTotalMeters(options.activities)
  const dayStreak = calculateDayStreak(options.activities)

  return {
    id: userId,
    name: options.username || 'Unknown User',
    profileImage: options.profileImage || '/placeholder.png',
    totalMeters,
    dayStreak,
    dailyMeters: 0,
    weeklyMeters: 0,
    deficit: Math.max(0, 1_000_000 - totalMeters),
    dailyRequired: 0,
    dailyRequiredWithRest: 0,
    topWorkoutType: 'erg',
    workouts: [],
  }
}

// --- Badge display names ---

export const BADGE_DISPLAY_NAMES: Record<BadgeId, string> = {
  'million-meter-champion': 'Million Meter Champion',
  '100k-day': 'Centurion',
  'jack-of-all-trades': 'Jack of All Trades',
  marathon: 'Marathon',
  'monthly-master': 'Monthly Master',
  'nates-favorite': "Nate's Favorite",
  'gym-rat': 'Gym Rat',
  tri: 'Tri',
  'early-bird': 'Early Bird',
  'erg-master': 'Erg Master',
  fish: 'Fish',
  'zigzag-method': 'Zigzag Method',
  'mystery-badge': '???',
  'just-do-track-bruh': 'Just Do Track Bruh',
  'lend-a-hand': 'Lend a Hand',
  'week-warrior': 'Week Warrior',
  'fresh-legs': 'Fresh Legs',
}

export const getBadgeDisplayName = (badgeId: string): string =>
  BADGE_DISPLAY_NAMES[badgeId as BadgeId] || badgeId

// --- Badge merge helpers ---

export const mergeCalculatedBadges = (
  existingBadges: { [badgeId: string]: BadgeProgress },
  calculatedBadges: { [badgeId: string]: BadgeProgress }
): { [badgeId: string]: BadgeProgress } => {
  const merged = { ...calculatedBadges }

  Object.entries(calculatedBadges).forEach(([badgeId, newBadge]) => {
    const existingBadge = existingBadges[badgeId]
    if (existingBadge?.earned) {
      merged[badgeId] = existingBadge
    } else {
      merged[badgeId] = newBadge
    }
  })

  return merged
}

export const findNewlyEarnedBadges = (
  oldBadges: { [badgeId: string]: BadgeProgress },
  mergedBadges: { [badgeId: string]: BadgeProgress }
): BadgeId[] => {
  const newlyEarned: BadgeId[] = []

  Object.keys(mergedBadges).forEach((badgeId) => {
    const oldBadge = oldBadges[badgeId]
    const newBadge = mergedBadges[badgeId]
    if (!oldBadge?.earned && newBadge.earned) {
      newlyEarned.push(badgeId as BadgeId)
    }
  })

  return newlyEarned
}

// --- Badge calculations ---

const getTodayStats = (activities: any[]) => {
  const today = getDateKey(new Date())
  const todayActivities = activities.filter((activity) => {
    const activityDate = safeParseDate(activity.date)
    if (!activityDate) return false
    return getDateKey(activityDate) === today
  })

  const totalMeters = todayActivities.reduce((sum, activity) => sum + (Number(activity.points) || 0), 0)
  const workoutTypes = new Set(
    todayActivities.map((activity) => normalizeActivityType(activity.activity)).filter(Boolean)
  )

  return { totalMeters, workoutTypes }
}

export const calculateBadgeProgress = (
  badgeId: BadgeId,
  userData: UserData,
  activities: any[]
): BadgeProgress => {
  const now = new Date()
  const { totalMeters: todayMeters, workoutTypes: todayWorkoutTypes } = getTodayStats(activities)

  switch (badgeId) {
    case 'million-meter-champion':
      return {
        earned: userData.totalMeters >= 1000000,
        earnedDate: userData.totalMeters >= 1000000 ? now : undefined,
        progress: Math.min(userData.totalMeters, 1000000),
        maxProgress: 1000000,
        lastUpdated: now,
      }

    case '100k-day':
      return {
        earned: todayMeters >= 100000,
        earnedDate: todayMeters >= 100000 ? now : undefined,
        progress: Math.min(todayMeters, 100000),
        maxProgress: 100000,
        lastUpdated: now,
      }

    case 'jack-of-all-trades':
      return {
        earned: todayWorkoutTypes.size >= 6,
        earnedDate: todayWorkoutTypes.size >= 6 ? now : undefined,
        progress: Math.min(todayWorkoutTypes.size, 6),
        maxProgress: 6,
        lastUpdated: now,
      }

    case 'marathon':
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now,
      }

    case 'monthly-master':
      return {
        earned: userData.dayStreak >= 30,
        earnedDate: userData.dayStreak >= 30 ? now : undefined,
        progress: Math.min(userData.dayStreak, 30),
        maxProgress: 30,
        lastUpdated: now,
      }

    case 'nates-favorite':
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now,
      }

    case 'gym-rat': {
      const liftActivities = activities.filter(
        (activity) => normalizeActivityType(activity.activity) === 'lift'
      ).length
      return {
        earned: liftActivities >= 20,
        earnedDate: liftActivities >= 20 ? now : undefined,
        progress: Math.min(liftActivities, 20),
        maxProgress: 20,
        lastUpdated: now,
      }
    }

    case 'tri':
      return {
        earned: todayMeters >= 30000,
        earnedDate: todayMeters >= 30000 ? now : undefined,
        progress: Math.min(todayMeters, 30000),
        maxProgress: 30000,
        lastUpdated: now,
      }

    case 'early-bird': {
      const earlyBirdActivities = activities.filter(
        (activity) => isBefore7AM(activity) && (Number(activity.points) || 0) >= 5000
      ).length
      return {
        earned: earlyBirdActivities >= 10,
        earnedDate: earlyBirdActivities >= 10 ? now : undefined,
        progress: Math.min(earlyBirdActivities, 10),
        maxProgress: 10,
        lastUpdated: now,
      }
    }

    case 'erg-master': {
      const ergActivities = activities.filter(
        (activity) => normalizeActivityType(activity.activity) === 'erg'
      ).length
      return {
        earned: ergActivities >= 50,
        earnedDate: ergActivities >= 50 ? now : undefined,
        progress: Math.min(ergActivities, 50),
        maxProgress: 50,
        lastUpdated: now,
      }
    }

    case 'fish': {
      const swimActivities = activities.filter(
        (activity) => normalizeActivityType(activity.activity) === 'swim'
      ).length
      return {
        earned: swimActivities >= 10,
        earnedDate: swimActivities >= 10 ? now : undefined,
        progress: Math.min(swimActivities, 10),
        maxProgress: 10,
        lastUpdated: now,
      }
    }

    case 'zigzag-method':
    case 'mystery-badge':
    case 'lend-a-hand':
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now,
      }

    case 'just-do-track-bruh': {
      const runActivities = activities.filter(
        (activity) => normalizeActivityType(activity.activity) === 'run'
      ).length
      return {
        earned: runActivities >= 10,
        earnedDate: runActivities >= 10 ? now : undefined,
        progress: Math.min(runActivities, 10),
        maxProgress: 10,
        lastUpdated: now,
      }
    }

    case 'fresh-legs':
      return {
        earned: userData.totalMeters >= 10000,
        earnedDate: userData.totalMeters >= 10000 ? now : undefined,
        progress: Math.min(userData.totalMeters, 10000),
        maxProgress: 10000,
        lastUpdated: now,
      }

    case 'week-warrior':
      return {
        earned: userData.dayStreak >= 7,
        earnedDate: userData.dayStreak >= 7 ? now : undefined,
        progress: Math.min(userData.dayStreak, 7),
        maxProgress: 7,
        lastUpdated: now,
      }

    default:
      return {
        earned: false,
        progress: 0,
        maxProgress: 1,
        lastUpdated: now,
      }
  }
}

export const getAllBadgeIds = (): BadgeId[] => [
  'million-meter-champion',
  '100k-day',
  'jack-of-all-trades',
  'marathon',
  'monthly-master',
  'nates-favorite',
  'gym-rat',
  'tri',
  'early-bird',
  'erg-master',
  'fish',
  'zigzag-method',
  'mystery-badge',
  'just-do-track-bruh',
  'lend-a-hand',
  'week-warrior',
  'fresh-legs',
]

export const calculateAllBadges = (
  userData: UserData,
  activities: any[]
): { [badgeId: string]: BadgeProgress } => {
  const badgeIds = getAllBadgeIds()
  const badges: { [badgeId: string]: BadgeProgress } = {}

  badgeIds.forEach((badgeId) => {
    badges[badgeId] = calculateBadgeProgress(badgeId, userData, activities)
  })

  return badges
}
