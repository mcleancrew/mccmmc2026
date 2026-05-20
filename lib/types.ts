export type WorkoutType = "erg" | "run" | "bike" | "swim" | "otw" | "lift" | "other"

export interface Workout {
  id: string
  type: WorkoutType
  meters: number
  date: Date
  images?: string[]
  notes?: string
}

export interface UserData {
  id: string
  name: string
  profileImage: string
  totalMeters: number
  dailyMeters: number
  weeklyMeters: number
  deficit: number
  dailyRequired: number
  dailyRequiredWithRest: number
  topWorkoutType: WorkoutType
  workouts: Workout[]
  metersByType?: { [key: string]: number }
  dailyMetersByType?: { [key: string]: number }
  weeklyMetersByType?: { [key: string]: number }
  dayStreak: number
}

export interface BadgeProgress {
  earned: boolean
  earnedDate?: Date
  progress: number
  maxProgress: number
  lastUpdated: Date
}

export interface UserBadgeData {
  userId: string
  badges: {
    [badgeId: string]: BadgeProgress
  }
  lastCalculated: Date
}

export type BadgeId = 
  | "million-meter-champion"
  | "100k-day"
  | "jack-of-all-trades"
  | "marathon"
  | "monthly-master"
  | "nates-favorite"
  | "gym-rat"
  | "tri"
  | "early-bird"
  | "erg-master"
  | "fish"
  | "zigzag-method"
  | "mystery-badge"
  | "just-do-track-bruh"
  | "lend-a-hand"
  | "week-warrior"
  | "fresh-legs"
