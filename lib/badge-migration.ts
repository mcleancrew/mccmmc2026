import { collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { UserData, UserBadgeData, BadgeProgress } from './types'
import { calculateAllBadges } from './badge-calculations'
import { getCurrentDateEST, convertToEST } from './badge-calculations'

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

// Helper function to calculate day streak from activities
const calculateDayStreak = (activities: any[]): number => {
  if (activities.length === 0) return 0

  // Get unique dates where user worked out (converted to EST)
  const workoutDates = new Set<string>()
  activities.forEach((activity) => {
    if (activity.date) {
      let date: Date
      if (activity.date.toDate) {
        date = activity.date.toDate()
      } else {
        date = new Date(activity.date)
      }
      const estDate = convertToEST(date)
      workoutDates.add(estDate.toISOString().split('T')[0]) // YYYY-MM-DD format
    }
  })

  const sortedDates = Array.from(workoutDates)
    .map(dateStr => new Date(dateStr + 'T00:00:00-05:00')) // Convert back to EST Date
    .sort((a, b) => b.getTime() - a.getTime()) // Sort descending (most recent first)

  if (sortedDates.length === 0) return 0

  let streak = 0
  const today = getCurrentDateEST()

  // Check if user worked out today (EST)
  const todayStr = today.toISOString().split('T')[0]
  const hasWorkedOutToday = sortedDates.some(date => date.toISOString().split('T')[0] === todayStr)

  if (hasWorkedOutToday) {
    streak = 1
    // Count consecutive days from today backwards
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i]
      const previousDate = sortedDates[i - 1]
      
      const diffTime = previousDate.getTime() - currentDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }
  } else {
    // Count consecutive days from most recent workout
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = sortedDates[i]
      const nextDate = sortedDates[i + 1]
      
      const diffTime = currentDate.getTime() - nextDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }
  }

  return streak
}

export async function migrateAllUserBadges() {
  console.log('Starting badge migration for all users...')
  
  try {
    // Get all users from the users collection
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserData[]

    console.log(`Found ${users.length} users to migrate`)

    // Process each user
    for (const user of users) {
      const userName = user.name || `User ${user.id.substring(0, 8)}`
      console.log(`\n=== Migrating badges for user: ${userName} (${user.id}) ===`)
      
      try {
        // Debug: Log available fields
        console.log(`User fields:`, Object.keys(user))
        console.log(`Activities field:`, user.activities)
        console.log(`Workouts field:`, user.workouts)
        
        // Try to get activities from the correct field
        let activities = []
        if (user.activities && Array.isArray(user.activities)) {
          activities = user.activities
          console.log(`Using activities field: ${activities.length} activities`)
        } else if (user.workouts && Array.isArray(user.workouts)) {
          activities = user.workouts
          console.log(`Using workouts field: ${activities.length} activities`)
        } else {
          console.log(`No activities/workouts found for user`)
        }
        
        // Debug: Log first few activities to see structure
        if (activities.length > 0) {
          console.log('Sample activity structure:', activities[0])
          console.log('Activity fields:', Object.keys(activities[0]))
          
          // Log total meters calculation
          const totalMeters = activities.reduce((sum, activity) => {
            const points = Number(activity.points) || 0
            return sum + points
          }, 0)
          console.log(`Total meters calculated: ${totalMeters}`)
          
          // Log activity types
          const activityTypes = activities.map(activity => activity.activity).filter(Boolean)
          console.log(`Activity types found:`, [...new Set(activityTypes)])
        }
        
        // Calculate required user data for badge calculations
        const totalMeters = activities.reduce((sum, activity) => {
          const points = Number(activity.points) || 0
          return sum + points
        }, 0)
        
        const dayStreak = calculateDayStreak(activities)
        
        // Create enhanced user data with calculated values
        const enhancedUserData: UserData = {
          ...user,
          totalMeters,
          dayStreak,
          dailyMeters: 0, // Not needed for migration
          weeklyMeters: 0, // Not needed for migration
          deficit: Math.max(0, 1000000 - totalMeters),
          dailyRequired: 0, // Not needed for migration
          dailyRequiredWithRest: 0, // Not needed for migration
          topWorkoutType: 'erg' as any, // Default value
          workouts: [], // Not needed for migration
          profileImage: user.profileImage || '/placeholder.png'
        }
        
        console.log(`Calculated user data: totalMeters=${totalMeters}, dayStreak=${dayStreak}`)
        
        // Calculate badges for this user
        const badges = calculateAllBadges(enhancedUserData, activities)
        
        // Debug: Log badge results
        console.log('Badge calculation results:')
        Object.entries(badges).forEach(([badgeId, badge]) => {
          console.log(`  ${badgeId}: ${badge.progress}/${badge.maxProgress} (earned: ${badge.earned})`)
        })

        // Create badge data document
        const badgeData: UserBadgeData = {
          userId: user.id,
          badges,
          lastCalculated: new Date()
        }

        // Clean the data for Firestore
        const cleanedData = cleanBadgeDataForFirestore(badgeData)

        // Save to Firestore
        const badgeRef = doc(db, 'badges', user.id)
        await setDoc(badgeRef, cleanedData)
        
        console.log(`✅ Successfully migrated badges for user ${userName}`)
        
        const earnedCount = Object.values(badges).filter(badge => badge.earned).length
        console.log(`   - Earned ${earnedCount} badges`)
        
      } catch (error) {
        console.error(`❌ Failed to migrate badges for user ${userName}:`, error)
      }
    }

    console.log('\n=== Badge migration completed ===')
    
  } catch (error) {
    console.error('❌ Badge migration failed:', error)
    throw error
  }
}

// Function to migrate a single user's badges
export async function migrateUserBadges(userId: string) {
  try {
    console.log(`Migrating badges for user: ${userId}`)
    
    // Get user data
    const userDoc = await getDocs(collection(db, 'users'))
    const user = userDoc.docs.find(doc => doc.id === userId)
    
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    
    const userData = { id: user.id, ...user.data() } as UserData
    
    // Try to get activities from the correct field
    let activities = []
    if (userData.activities && Array.isArray(userData.activities)) {
      activities = userData.activities
      console.log(`Using activities field: ${activities.length} activities`)
    } else if (userData.workouts && Array.isArray(userData.workouts)) {
      activities = userData.workouts
      console.log(`Using workouts field: ${activities.length} activities`)
    } else {
      console.log(`No activities/workouts found for user`)
    }
    
    // Calculate required user data for badge calculations
    const totalMeters = activities.reduce((sum, activity) => {
      const points = Number(activity.points) || 0
      return sum + points
    }, 0)
    
    const dayStreak = calculateDayStreak(activities)
    
    // Create enhanced user data with calculated values
    const enhancedUserData: UserData = {
      ...userData,
      totalMeters,
      dayStreak,
      dailyMeters: 0,
      weeklyMeters: 0,
      deficit: Math.max(0, 1000000 - totalMeters),
      dailyRequired: 0,
      dailyRequiredWithRest: 0,
      topWorkoutType: 'erg' as any,
      workouts: [],
      profileImage: userData.profileImage || '/placeholder.png'
    }
    
    // Calculate badges
    const badges = calculateAllBadges(enhancedUserData, activities)

    // Create and save badge data
    const badgeData: UserBadgeData = {
      userId: userData.id,
      badges,
      lastCalculated: new Date()
    }

    // Clean the data for Firestore
    const cleanedData = cleanBadgeDataForFirestore(badgeData)

    const badgeRef = doc(db, 'badges', userId)
    await setDoc(badgeRef, cleanedData)
    
    console.log(`✅ Successfully migrated badges for user ${userId}`)
    
    const earnedCount = Object.values(badges).filter(badge => badge.earned).length
    console.log(`   - Earned ${earnedCount} badges`)
    
    return badgeData
    
  } catch (error) {
    console.error(`❌ Failed to migrate badges for user ${userId}:`, error)
    throw error
  }
} 