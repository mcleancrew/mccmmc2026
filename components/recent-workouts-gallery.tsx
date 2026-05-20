"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useRecentWorkouts } from "@/hooks/use-recent-workouts"
import { formatDate } from "@/lib/utils"

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

export function RecentWorkoutsGallery() {
  const { recentWorkouts } = useRecentWorkouts()
  const router = useRouter()

  if (!recentWorkouts || recentWorkouts.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-slate-500">
          No recent workouts to display.
        </CardContent>
      </Card>
    )
  }

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

  const handleCardClick = (userId: string) => {
    router.push(`/profile/${userId}?section=workouts`)
  }

  const handleTitleClick = () => {
    router.push('/workouts')
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 
            className="text-lg font-semibold text-blue-900 dark:text-blue-100 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            onClick={handleTitleClick}
          >
            Recent Workouts
          </h3>
          <button
            onClick={() => router.push('/workouts')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            All Workouts
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 dark:[&::-webkit-scrollbar-thumb]:hover:bg-slate-500">
          {recentWorkouts.map((workout) => {
            const userId = workout.id.split('-')[0]
            const hasImages = (workout.images ?? []).length > 0;
            const firstImage = hasImages ? (workout.images ?? [])[0] : null;
            const imageCount = hasImages ? (workout.images ?? []).length : 0;
            const isHighlighted = !!workout.highlight;
            let highlightReason = '';
            if (typeof workout.highlight === 'string') {
              highlightReason = workout.highlight;
            } else if (typeof workout.highlight === 'object' && workout.highlight && 'reason' in workout.highlight) {
              highlightReason = workout.highlight.reason ?? '';
            }
            return (
              <div key={workout.id} className="flex-shrink-0 w-48">
                <div className={`h-full ${isHighlighted ? 'p-1' : ''}`} style={{overflow: isHighlighted ? 'visible' : undefined}}>
                  <Card 
                    className={`h-full cursor-pointer hover:shadow-md transition-shadow ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
                    style={{overflow: 'visible'}}
                    onClick={() => handleCardClick(userId)}
                  >
                    <CardContent className="p-3 relative group">
                      {isHighlighted && (
                        <div className="mb-2 flex items-center gap-1">
                          {highlightReason && (
                            <span className="ml-1">
                              <span className="text-xs text-yellow-700 underline decoration-dotted cursor-help group-hover:inline hidden absolute z-10 bg-yellow-50 border border-yellow-300 rounded px-2 py-1 left-1/2 -translate-x-1/2 top-6 whitespace-pre-line shadow-lg">
                                {highlightReason}
                              </span>
                              <span className="sr-only">{highlightReason}</span>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={workout.userProfileImage || "/placeholder.svg"} alt={workout.userName} />
                          <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                            {workout.userName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{workout.userName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(workout.date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getWorkoutTypeColor(workout.type)}`}>{workout.type.toUpperCase()}</span>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{new Intl.NumberFormat().format(workout.meters)}m</p>
                      </div>

                      {firstImage && (
                        <div className="mb-2 relative">
                          <img
                            src={firstImage}
                            alt={`${workout.userName}'s workout`}
                            className="w-full h-32 object-cover rounded-md bg-slate-50 dark:bg-slate-800"
                            style={{ objectFit: 'cover' }}
                          />
                          {imageCount > 1 && (
                            <span className="absolute bottom-1 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                              (1 of {imageCount})
                            </span>
                          )}
                        </div>
                      )}

                      {workout.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{workout.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          })}

          {/* "Want to see more?" card */}
          <div className="flex-shrink-0 w-48">
            <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-3 flex flex-col justify-center items-center text-center h-full">
                <div className="mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Want to see more?</p>
                </div>
                <button
                  onClick={() => router.push('/workouts')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                >
                  All Workouts
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
