import { collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { UserData, UserBadgeData } from './types'
import { buildUserDataForBadgeCalculation, calculateAllBadges } from './badge-calculations'
import { cleanBadgeDataForFirestore } from './user-badges'

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
        const enhancedUserData: UserData = {
          ...user,
          ...buildUserDataForBadgeCalculation(user.id, {
            username: user.name,
            profileImage: user.profileImage,
            activities,
          }),
        }

        console.log(
          `Calculated user data: totalMeters=${enhancedUserData.totalMeters}, dayStreak=${enhancedUserData.dayStreak}`
        )
        
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
    const enhancedUserData: UserData = {
      ...userData,
      ...buildUserDataForBadgeCalculation(userId, {
        username: userData.name,
        profileImage: userData.profileImage,
        activities,
      }),
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