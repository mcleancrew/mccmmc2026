"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import type { WorkoutType } from "@/lib/types"

interface Workout {
  id: string
  userId: string
  userName: string
  userProfileImage: string
  type: WorkoutType
  meters: number
  date: Date
  images?: string[]
  notes?: string
  highlight?: boolean | string
  highlightReason?: string
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  // If same day, show relative time
  if (diffInDays === 0) {
    if (diffInMinutes < 1) {
      return "Just now"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    }
  }

  // If different day, show date
  return formatDate(date)
}

export default function WorkoutsPage() {
  const [allWorkouts, setAllWorkouts] = useState<Workout[] | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchAllWorkouts = async () => {
      try {
        // Fetch all users from Firestore
        const usersRef = collection(db, "users")
        const querySnapshot = await getDocs(usersRef)

        const workouts: Workout[] = []

        // Process each user's activities
        querySnapshot.forEach((doc) => {
          const firestoreData = doc.data()
          const activities = firestoreData.activities || []
          const userName = firestoreData.username || "Unknown User"

          // Convert activities to Workout format
          activities.forEach((activity: any, index: number) => {
            if (activity.date) {
              const workout: Workout = {
                id: `${doc.id}-${index}`,
                userId: doc.id,
                userName,
                userProfileImage: firestoreData.profileImage || "/placeholder.png",
                type: (activity.activity?.toLowerCase() || "unknown") as WorkoutType,
                meters: Number(activity.points) || 0,
                date: activity.date?.toDate() || new Date(),
                images: activity.images || (activity.image ? [activity.image] : []),
                notes: activity.notes || undefined,
                highlight: activity.highlight,
                highlightReason: activity.highlightReason
              }
              workouts.push(workout)
            }
          })
        })

        // Sort by date (most recent first)
        const sortedWorkouts = workouts.sort((a, b) => b.date.getTime() - a.date.getTime())

        setAllWorkouts(sortedWorkouts)

      } catch (error) {
        console.error("Error fetching all workouts:", error)
        setAllWorkouts([])
      }
    }

    fetchAllWorkouts()
  }, [])

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case "erg":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "otw":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
      case "run":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "bike":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      case "swim":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
      case "lift":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
    }
  }

  const handleImageClick = (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation()
    setSelectedImage(imageUrl)
  }

  const handleUserNameClick = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  if (!allWorkouts) {
    return (
      <div className="container px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading workouts...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">All Workouts</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {allWorkouts.length} workouts from the team • Newest first
          </p>
        </div>

        <div className="grid gap-4">
          {allWorkouts.map((workout) => {
            const isHighlighted = !!workout.highlight;
            const highlightReason = typeof workout.highlight === 'string' ? workout.highlight : (workout.highlight?.reason || '');
            return (
              <Card key={workout.id} className={`overflow-hidden ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}>
                <CardContent className="p-4">
                  {isHighlighted && (
                    <div className="mb-2 flex items-center gap-1">
                      <span className="text-xs font-bold text-yellow-700">Highlight</span>
                      {highlightReason && (
                        <span className="text-xs text-yellow-700 ml-1">- {highlightReason}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={workout.userProfileImage || "/placeholder.svg"} alt={workout.userName} />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {workout.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 
                          className="font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleUserNameClick(workout.userId)}
                        >
                          {workout.userName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatRelativeTime(workout.date)}
                        </p>
                      </div>
                    </div>

                    {/* Workout Details */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${getWorkoutTypeColor(workout.type)}`}>
                        {workout.type.toUpperCase()}
                      </span>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {new Intl.NumberFormat().format(workout.meters)}m
                      </p>
                    </div>
                  </div>

                  {/* Image and Notes */}
                  <div className="mt-4 flex gap-4">
                    {workout.images && workout.images.length > 0 && (
                      <div className="flex gap-2 flex-shrink-0">
                        {workout.images.map((imageUrl, index) => (
                          <div key={`${workout.id}-${index}`} className="flex-shrink-0">
                            <img
                              src={imageUrl}
                              alt={`${workout.userName}'s workout`}
                              className="w-32 h-24 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={(e) => handleImageClick(e, imageUrl)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {workout.notes && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {workout.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {allWorkouts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 dark:text-slate-400">No workouts found.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Expanded workout image"
              className="w-full h-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 