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
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { updateUserBadgesAfterWorkout } from "@/lib/user-badges"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const allowsDecimalDistance = (type: WorkoutType) => type === "run" || type === "bike"

/** Normalize miles input: trim, map comma decimals (common on mobile), strip stray spaces. */
const normalizeDistanceInput = (value: string): string =>
  value.trim().replace(/\s/g, "").replace(",", ".")

const parseDistanceNumber = (value: string): number => {
  const normalized = normalizeDistanceInput(value)
  if (!normalized || normalized === ".") return NaN
  return Number.parseFloat(normalized)
}

const isValidDistanceInput = (value: string, type: WorkoutType): boolean => {
  if (!value.trim()) return false
  const num = parseDistanceNumber(value)
  if (!Number.isFinite(num) || num <= 0) return false
  if (allowsDecimalDistance(type)) return true
  return Number.isInteger(num)
}

const isValidDistanceChange = (value: string, type: WorkoutType): boolean => {
  if (value === "") return true
  if (allowsDecimalDistance(type)) return /^(\d+([.,]\d*)?|[.,]\d*)$/.test(value)
  return /^\d+$/.test(value)
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
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const workoutTypes = [
    { id: "erg" as WorkoutType, name: "Erg", icon: Rows, color: "bg-brand-100 text-brand" },
    { id: "run" as WorkoutType, name: "Run", icon: PersonStanding, color: "bg-green-100 text-green-700" },
    { id: "bike" as WorkoutType, name: "Bike", icon: Bike, color: "bg-purple-100 text-purple-700" },
    { id: "swim" as WorkoutType, name: "Swim", icon: PersonStanding, color: "bg-cyan-100 text-cyan-700" },
    { id: "otw" as WorkoutType, name: "OTW Row", icon: Waves, color: "bg-indigo-100 text-indigo-700" },
    { id: "lift" as WorkoutType, name: "Lift", icon: Dumbbell, color: "bg-orange-100 text-orange-700" },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files))
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
              setSelectedFiles([file])
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

    if (!isValidDistanceInput(distance, selectedWorkoutType)) {
      toast({
        title: "Invalid distance",
        description: allowsDecimalDistance(selectedWorkoutType)
          ? "Enter a distance greater than zero (miles can use decimals)."
          : "Enter a whole number greater than zero (no decimals).",
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
      const uploadPromises = selectedFiles.map(file => {
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
      const newlyEarnedBadges = await updateUserBadgesAfterWorkout(user.id)

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
    const distanceNum = parseDistanceNumber(distance)
    if (!Number.isFinite(distanceNum) || distanceNum <= 0) return 0

    switch (selectedWorkoutType) {
      case "erg":
        return distanceNum
      case "swim":
        return Math.round((distanceNum / 300) * 1000)
      case "run":
        return Math.round(distanceNum * 1000) // 1 mile = 1000m
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
      <h1 className="text-2xl font-bold text-brand dark:text-brand-100 mb-6">Log Workout</h1>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
            <CardDescription>Log your workout on this page, which automatically converts meters and updates your profile.</CardDescription>
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
                      setDistance("")
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
                <Label>Boat Type *eights practices unfortunatley do not count towards the challenge*</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`p-3 rounded-lg border transition-colors ${
                      boatType === "1x"
                        ? "bg-brand-100 dark:bg-brand-900 border-brand text-brand dark:text-brand-muted"
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
                        ? "bg-brand-100 dark:bg-brand-900 border-brand text-brand dark:text-brand-muted"
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
                  type={allowsDecimalDistance(selectedWorkoutType) ? "text" : "number"}
                  inputMode={allowsDecimalDistance(selectedWorkoutType) ? "decimal" : "numeric"}
                  lang={allowsDecimalDistance(selectedWorkoutType) ? "en" : undefined}
                  autoComplete="off"
                  step={allowsDecimalDistance(selectedWorkoutType) ? undefined : "1"}
                  min={allowsDecimalDistance(selectedWorkoutType) ? undefined : "1"}
                  placeholder={
                    selectedWorkoutType === "lift"
                      ? "e.g., 1"
                      : allowsDecimalDistance(selectedWorkoutType)
                        ? "e.g., 3.5"
                        : "e.g., 2000"
                  }
                  value={distance}
                  onChange={(e) => {
                    const value = e.target.value
                    if (isValidDistanceChange(value, selectedWorkoutType)) {
                      setDistance(value)
                    }
                  }}
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
