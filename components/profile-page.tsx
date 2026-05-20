"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Activity, Calendar, Flame, Calculator, Plus, LogOut, Trophy, Sparkles, Award, Camera, Upload } from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import { UserProgressChart } from "@/components/user-progress-chart"
import { WorkoutGallery } from "@/components/workout-gallery"
import { BadgeDisplayCase } from "@/components/badge-display-case"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLeaderboardData } from "@/hooks/use-leaderboard-data"
import { useAuth } from "@/hooks/use-auth"
import { useBadgeData } from "@/hooks/use-badge-data"
import Link from "next/link"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface ProfilePageProps {
  userId?: string
}

export default function ProfilePage({ userId }: ProfilePageProps) {
  const [selectedUserId, setSelectedUserId] = useState(userId || "current-user")
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>("all")
  const { leaderboardData } = useLeaderboardData()
  const { userData } = useUserData(selectedUserId === "current-user" ? undefined : selectedUserId)
  const { user, signOut } = useAuth()
  const [metersPerDay, setMetersPerDay] = useState("5000")
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null)
  const [isMoreStatsOpen, setIsMoreStatsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // Get the actual user ID for badge data
  const actualUserId = selectedUserId === "current-user" ? user?.id : selectedUserId
  const { badges } = useBadgeData(actualUserId)

  // Calculate real badge count from actual badge data
  const badgeCount = Object.values(badges).filter(badge => badge.earned).length

  if (!userData) {
    return (
      <div className="container px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading profile data...</p>
        </div>
      </div>
    )
  }

  const { name, profileImage, totalMeters, deficit, dailyRequired, dailyRequiredWithRest, workouts, dayStreak } = userData

  const percentComplete = Math.min(100, (totalMeters / 1000000) * 100)
  const workoutCount = workouts.length

  // Calculate current rank from leaderboard data
  const getCurrentRank = (): number => {
    if (!leaderboardData) return 0
    
    // Get the correct user ID to search for
    const targetUserId = selectedUserId === "current-user" ? user?.id : selectedUserId
    
    if (!targetUserId) return 0
    
    const userIndex = leaderboardData.findIndex(leaderboardUser => 
      leaderboardUser.id === targetUserId
    )
    
    return userIndex >= 0 ? userIndex + 1 : 0
  }

  const currentRank = getCurrentRank()

  const calculateDays = () => {
    const metersPerDayNum = Number.parseFloat(metersPerDay)
    if (isNaN(metersPerDayNum) || metersPerDayNum <= 0) return

    const days = Math.ceil(deficit / metersPerDayNum)
    setCalculatedDays(days)
  }

  // Check if this is the current user and they have no workouts
  const isCurrentUser = selectedUserId === "current-user" || selectedUserId === user?.id
  const hasNoWorkouts = workoutCount === 0

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Show preview modal
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
      setShowPreviewModal(true)
      setPendingFile(file)
    }
    reader.readAsDataURL(file)
  }

  const handleAcceptProfilePicture = async () => {
    if (!pendingFile || !user) return
    setIsUploading(true)
    try {
      // Convert file to base64 for storage
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        const userRef = doc(db, "users", user.id)
        await updateDoc(userRef, {
          profileImage: base64String
        })
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been successfully updated!",
        })
        window.location.reload()
      }
      reader.readAsDataURL(pendingFile)
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      toast({
        title: "Upload failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setShowPreviewModal(false)
      setPreviewImage(null)
      setPendingFile(null)
    }
  }

  const handleCancelProfilePicture = () => {
    setShowPreviewModal(false)
    setPreviewImage(null)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="container px-4 py-6">
      {/* Profile Selector */}
      <div className="mb-6">
        <Select defaultValue={selectedUserId} onValueChange={(value) => setSelectedUserId(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select profile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-user">Your Profile</SelectItem>
            {leaderboardData?.map((leaderboardUser) => (
              <SelectItem key={leaderboardUser.id} value={leaderboardUser.id}>
                {leaderboardUser.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enhanced Profile Header */}
      <Card className="mb-6 bg-gradient-to-r from-white/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="relative mr-4">
              {/* Glowing ring around avatar */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-md opacity-30 animate-pulse"></div>
              <Avatar className="h-20 w-20 relative border-4 border-white/50 shadow-xl">
                <AvatarImage src={profileImage || "/placeholder.svg"} alt={name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-800 text-lg font-bold">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {name}
                </h1>

                {/* Enhanced badge counter */}
                <div className="relative group">
                  {/* Multiple glow rings */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-pulse scale-150"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300 animate-pulse delay-300 scale-125"></div>

                  {/* Main badge container */}
                  <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white text-sm font-bold rounded-full shadow-2xl transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12">
                    {/* Inner shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent rounded-full"></div>

                    {/* Floating sparkles */}
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 opacity-80 animate-bounce" />
                    <Award className="absolute top-0.5 left-0.5 w-2.5 h-2.5 text-yellow-300 opacity-60" />

                    {/* Badge count */}
                    <span className="relative z-10 font-black">{badgeCount}</span>

                    {/* Animated sparkle effects */}
                    <div className="absolute -top-2 -right-2 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-pink-300 rounded-full animate-pulse delay-700"></div>
                    <div className="absolute top-0 right-0 w-0.5 h-0.5 bg-cyan-300 rounded-full animate-pulse delay-1000"></div>
                  </div>

                  {/* Enhanced tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-2xl">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span className="font-semibold">
                        {badgeCount} Badge{badgeCount !== 1 ? "s" : ""} Earned
                      </span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-slate-600 dark:text-slate-400 font-medium">Rower</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Progress Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-blue-700 dark:text-blue-300">
              {new Intl.NumberFormat().format(totalMeters)}
            </span>
            <span className="text-lg text-slate-500 dark:text-slate-400 ml-2">meters</span>
          </div>
          <Progress value={percentComplete} className="h-4 mb-2" />
          <div className="text-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {percentComplete.toFixed(1)}% of 1,000,000m goal
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{workoutCount}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Workouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {currentRank > 0 ? `#${currentRank}` : "N/A"}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Current Rank</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{dayStreak}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* More Statistics - Collapsible */}
      <Collapsible open={isMoreStatsOpen} onOpenChange={setIsMoreStatsOpen} className="mb-6">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-transparent">
            More Statistics
            {isMoreStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Personal Deficit</p>
                <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                  {new Intl.NumberFormat().format(deficit)}m
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Daily Required</p>
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  {new Intl.NumberFormat().format(dailyRequired)}m
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">per day to reach goal</p>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardContent className="p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">With 1 Rest Day/Week</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat().format(dailyRequiredWithRest)}m
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">per active day (6 days/week)</p>
              </CardContent>
            </Card>
          </div>

          {/* Calculator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Completion Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-4">
                <div className="flex-1">
                  <Label htmlFor="meters-per-day" className="text-sm">
                    If I row this many meters per day:
                  </Label>
                  <Input
                    id="meters-per-day"
                    type="number"
                    min="1"
                    value={metersPerDay}
                    onChange={(e) => setMetersPerDay(e.target.value)}
                  />
                </div>
                <Button onClick={calculateDays} className="mb-[2px]">
                  Calculate
                </Button>
              </div>

              {calculatedDays !== null && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">You will complete the challenge in:</p>
                  <p className="text-xl font-semibold text-blue-800 dark:text-blue-200">{calculatedDays} days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Charts and Gallery */}
      <Tabs defaultValue="progress" className="mb-6">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="gallery">Workout Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Meters Per Day</CardTitle>
            </CardHeader>
            <CardContent>
              <UserProgressChart 
                userId={selectedUserId === "current-user" ? undefined : selectedUserId}
                workoutType={selectedWorkoutType}
              />

              <div className="mt-4">
                <Tabs value={selectedWorkoutType} onValueChange={setSelectedWorkoutType}>
                  <TabsList className="grid grid-cols-7 gap-1">
                    <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
                    <TabsTrigger value="erg" className="text-xs px-2">Erg</TabsTrigger>
                    <TabsTrigger value="run" className="text-xs px-2">Run</TabsTrigger>
                    <TabsTrigger value="swim" className="text-xs px-2">Swim</TabsTrigger>
                    <TabsTrigger value="otw" className="text-xs px-2">OTW</TabsTrigger>
                    <TabsTrigger value="lift" className="text-xs px-2">Lift</TabsTrigger>
                    <TabsTrigger value="bike" className="text-xs px-2">Bike</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          {hasNoWorkouts && isCurrentUser ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-4">
                  <Plus className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No workouts yet</h3>
                  <p className="text-slate-600 dark:text-slate-400">Start your journey by adding your first workout!</p>
                </div>
                <Link href="/submit">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Workout
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : hasNoWorkouts ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-600 dark:text-slate-400">No workouts recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <WorkoutGallery workouts={workouts} />
          )}
        </TabsContent>
      </Tabs>

      {/* Badge Display Case */}
      <BadgeDisplayCase userId={selectedUserId === "current-user" ? user?.id : selectedUserId} />

      {/* Profile Picture Upload and Sign Out Buttons - Only show when viewing own profile */}
      {isCurrentUser && (
        <div className="space-y-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="w-full text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Uploading..." : "Add/Change Profile Picture"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={signOut}
                className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Picture Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Profile Picture</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "4px solid #3b82f6",
                  marginBottom: 16,
                }}
              >
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button variant="outline" onClick={handleCancelProfilePicture} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleAcceptProfilePicture} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
