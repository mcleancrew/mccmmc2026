"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Upload, Dumbbell, Bike, Waves, Rows, PersonStanding, ArrowRight } from "lucide-react"
import type { WorkoutType } from "@/lib/types"
import { WorkoutTypeCard } from "@/components/workout-type-card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { doc, updateDoc, arrayUnion, Timestamp, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { calculateAllBadges, getCurrentDateEST, convertToEST } from "@/lib/badge-calculations"
import { UserBadgeData } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

// Helper function to get date in YYYY-MM-DD format (EST)
const getDateKey = (date: Date = new Date()): string => {
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

// Function to calculate real-time badges
const calculateRealTimeBadges = (activities: any[]): { [badgeId: string]: any } => {
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
    }
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

// Function to update badges after workout submission
const updateUserBadges = async (userId: string, newWorkoutData: any) => {
  try {
    // Get current user data
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      console.error("User not found for badge update")
      return []
    }
    
    const userData = userSnap.data()
    const activities = userData.activities || []
    
    // Get current badge data to compare
    const badgeRef = doc(db, 'badges', userId)
    const badgeSnap = await getDoc(badgeRef)
    const oldBadges = badgeSnap.exists() ? badgeSnap.data().badges || {} : {}
    
    // Calculate required user data for badge calculations
    const totalMeters = activities.reduce((sum: number, activity: any) => {
      return sum + (Number(activity.points) || 0)
    }, 0)
    
    const dayStreak = calculateDayStreak(activities)
    
    // Create enhanced user data with calculated values
    const enhancedUserData = {
      id: userId,
      name: userData.username || "Unknown User",
      profileImage: userData.profileImage || "/placeholder.png",
      totalMeters,
      dayStreak,
      dailyMeters: 0,
      weeklyMeters: 0,
      deficit: Math.max(0, 1000000 - totalMeters),
      dailyRequired: 0,
      dailyRequiredWithRest: 0,
      topWorkoutType: 'erg' as any,
      workouts: []
    }
    
    // Calculate new badges
    const newBadges = calculateAllBadges(enhancedUserData, activities)
    
    // Calculate real-time badges
    const realTimeBadges = calculateRealTimeBadges(activities)
    
    // Merge badges, preserving any already earned badges
    const mergedBadges = { ...newBadges }
    
    // For all badges, if they're already earned, keep them as-is
    Object.entries({ ...newBadges, ...realTimeBadges }).forEach(([badgeId, newBadge]) => {
      const existingBadge = oldBadges[badgeId]
      
      if (existingBadge?.earned) {
        // If badge is already earned, don't change it
        mergedBadges[badgeId] = existingBadge
      } else {
        // If not earned, use the new calculation
        mergedBadges[badgeId] = newBadge
      }
    })
    
    // Find newly earned badges by comparing old and new states
    const newlyEarnedBadges = Object.entries(mergedBadges)
      .filter(([badgeId, newBadge]) => {
        const oldBadge = oldBadges[badgeId]
        // Only count as newly earned if:
        // 1. Badge is currently earned
        // 2. Badge wasn't earned before OR was earned just now (has earnedDate)
        return newBadge.earned && 
               (!oldBadge || !oldBadge.earned) && 
               newBadge.earnedDate
      })
      .map(([badgeId, badge]) => ({
        id: badgeId,
        name: getBadgeName(badgeId),
        earnedDate: badge.earnedDate
      }))
    
    // Create badge data document
    const badgeData: UserBadgeData = {
      userId,
      badges: mergedBadges,
      lastCalculated: new Date()
    }

    // Clean the data for Firestore
    const cleanedData = cleanBadgeDataForFirestore(badgeData)

    // Save to Firestore
    await updateDoc(badgeRef, cleanedData)
    
    console.log("✅ Badges updated after workout submission")
    if (newlyEarnedBadges.length > 0) {
      console.log("🎉 Newly earned badges:", newlyEarnedBadges.map(b => b.name))
    }
    
    return newlyEarnedBadges
    
  } catch (error) {
    console.error("❌ Failed to update badges:", error)
    return []
  }
}

// Helper function to get badge names
const getBadgeName = (badgeId: string): string => {
  const badgeNames: Record<string, string> = {
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

export default function WorkoutSubmission() {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>("erg")
  const [distance, setDistance] = useState("")
  const [notes, setNotes] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [boatType, setBoatType] = useState<"1x" | "2x">("1x")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const workoutTypes = [
    { id: "erg" as WorkoutType, name: "Erg", icon: Rows, color: "bg-blue-100 text-blue-700" },
    { id: "run" as WorkoutType, name: "Run", icon: PersonStanding, color: "bg-green-100 text-green-700" },
    { id: "bike" as WorkoutType, name: "Bike", icon: Bike, color: "bg-purple-100 text-purple-700" },
    { id: "swim" as WorkoutType, name: "Swim", icon: PersonStanding, color: "bg-cyan-100 text-cyan-700" },
    { id: "otw" as WorkoutType, name: "OTW Row", icon: Waves, color: "bg-indigo-100 text-indigo-700" },
    { id: "lift" as WorkoutType, name: "Lift", icon: Dumbbell, color: "bg-orange-100 text-orange-700" },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFiles(files)
      // Show preview of first image
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData) {
        const items = event.clipboardData.items
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (file) {
              // Set as selected file and show preview
              setSelectedFiles({ 0: file, length: 1, item: (idx: number) => (idx === 0 ? file : undefined) } as FileList)
              const reader = new FileReader()
              reader.onload = (e) => {
                setImagePreview(e.target?.result as string)
              }
              reader.readAsDataURL(file)
              toast({
                title: "Image attached from clipboard!",
                description: file.name,
              })
              event.preventDefault()
              break
            }
          }
        }
      }
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit workouts",
        variant: "destructive",
      })
      return
    }

    if (!distance || Number.parseFloat(distance) <= 0) {
      toast({
        title: "Invalid distance",
        description: "Please enter a valid distance",
        variant: "destructive",
      })
      return
    }

    const convertedMeters = getConvertedMeters()
    if (convertedMeters <= 0) {
      toast({
        title: "Invalid conversion",
        description: "Please check your input values",
        variant: "destructive",
      })
      return
    }

    // Check for required image upload
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Image required",
        description: "An image upload is required as proof for your workout.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload images to Firebase Storage (same as original)
      const uploadPromises = Array.from(selectedFiles).map(file => {
        const storageRef = ref(storage, `workout_images/${user.id}/${Date.now()}_${file.name}`)
        return uploadBytes(storageRef, file).then(snapshot => getDownloadURL(snapshot.ref))
      })
      const imageUrls = await Promise.all(uploadPromises)

      // Create workout data in the same format as the old HTML site
      const workoutData: any = {
        activity: getWorkoutTypeName(selectedWorkoutType),
        points: convertedMeters,
        date: Timestamp.now(),
        images: imageUrls // Store image URLs like the original
      }

      // Only add notes if it has a value
      if (notes && notes.trim()) {
        workoutData.notes = notes.trim()
      }

      // Update user's activities in Firestore
      const userRef = doc(db, "users", user.id)
      await updateDoc(userRef, {
        activities: arrayUnion(workoutData)
      })

      // Update badges after workout submission
      const newlyEarnedBadges = await updateUserBadges(user.id, workoutData)

      toast({
        title: "Workout submitted!",
        description: `${new Intl.NumberFormat().format(convertedMeters)} meters of ${getWorkoutTypeName(selectedWorkoutType)} recorded.`,
      })

      // Show badge notifications if any were earned
      if (newlyEarnedBadges.length > 0) {
        setTimeout(() => {
          toast({
            title: "🎉 New Badges Earned!",
            description: `Congratulations! You've earned: ${newlyEarnedBadges.map(badge => badge.name).join(", ")}`,
          })
        }, 1000) // Delay to show after the workout submission toast
      }

      // Reset form
      setDistance("")
      setNotes("")
      setImagePreview(null)
      setSelectedFiles(null)
      setSelectedWorkoutType("erg")
      setBoatType("1x")

      // Redirect to profile to see the updated data
      router.push("/profile")

    } catch (error) {
      console.error("Error submitting workout:", error)
      toast({
        title: "Submission failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getWorkoutTypeName = (type: WorkoutType): string => {
    return workoutTypes.find((wt) => wt.id === type)?.name || type
  }

  const getDistanceLabel = () => {
    switch (selectedWorkoutType) {
      case "lift":
        return "Number of Lifts"
      case "run":
      case "bike":
        return "Distance (miles)"
      default:
        return "Distance (meters)"
    }
  }

  const getConversionText = () => {
    switch (selectedWorkoutType) {
      case "erg":
        return "1000m = 1000m"
      case "swim":
        return "300m = 1000m"
      case "run":
        return "1 mile = 1000m"
      case "bike":
        return "2 miles = 1000m"
      case "lift":
        return "1 lift = 5000m"
      case "otw":
        return boatType === "1x" ? "1000m = 1000m" : "2000m = 1000m"
      default:
        return ""
    }
  }

  const getConvertedMeters = () => {
    const distanceNum = Number.parseFloat(distance) || 0
    if (distanceNum <= 0) return 0

    switch (selectedWorkoutType) {
      case "erg":
        return distanceNum
      case "swim":
        return Math.round((distanceNum / 300) * 1000)
      case "run":
        return distanceNum * 1000 // 1 mile = 1000m
      case "bike":
        return Math.round((distanceNum / 2) * 1000) // 2 miles = 1000m
      case "lift":
        return distanceNum * 5000 // 1 lift = 5000m
      case "otw":
        if (boatType === "1x") {
          return distanceNum // 1000m = 1000m for 1x
        } else {
          return Math.round(distanceNum / 2) // 2000m = 1000m for 2x
        }
      default:
        return distanceNum
    }
  }

  return (
    <div className="container px-4 py-6">
      <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-6">Log Workout</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
            <CardDescription>Log your workout to contribute to the Million Meters Challenge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Workout Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {workoutTypes.map((type) => (
                  <WorkoutTypeCard
                    key={type.id}
                    workoutType={type}
                    isSelected={selectedWorkoutType === type.id}
                    onSelect={() => {
                      setSelectedWorkoutType(type.id)
                      if (type.id !== "otw") {
                        setBoatType("1x") // Reset to default when switching away from OTW
                      }
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">Conversion: {getConversionText()}</p>
            </div>

            {selectedWorkoutType === "otw" && (
              <div className="space-y-2">
                <Label>Boat Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`p-3 rounded-lg border transition-colors ${
                      boatType === "1x"
                        ? "bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => setBoatType("1x")}
                  >
                    <div className="text-center">
                      <div className="font-medium">1x</div>
                      <div className="text-xs text-slate-500">Single</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`p-3 rounded-lg border transition-colors ${
                      boatType === "2x"
                        ? "bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => setBoatType("2x")}
                  >
                    <div className="text-center">
                      <div className="font-medium">2x</div>
                      <div className="text-xs text-slate-500">Double</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="distance">{getDistanceLabel()}</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="distance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={selectedWorkoutType === "lift" ? "e.g., 1" : "e.g., 2000"}
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  required
                  className="flex-1"
                />
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  value={`${new Intl.NumberFormat().format(getConvertedMeters())}m`}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-1"
                />
              </div>
              <div className="flex justify-end">
                <p className="text-xs text-slate-500 mt-0">Final meters after conversion</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">Proof of Workout (Required)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
              <input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={handleImageUpload} 
                ref={fileInputRef}
              />

              {imagePreview && (
                <div className="mt-2 relative">
                  <img
                    src={imagePreview}
                    alt="Workout proof"
                    className="w-full h-40 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview(null)
                      setSelectedFiles(null)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              {selectedFiles && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedFiles.length === 1 
                    ? `Selected: ${selectedFiles[0].name}`
                    : `Selected: ${selectedFiles.length} files`
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any details about your workout..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Workout"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
