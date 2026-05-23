"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useLeaderboardData } from "@/hooks/use-leaderboard-data"
import { Shield, Eye, EyeOff, Camera, User, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BadgeId, UserBadgeData } from "@/lib/types"
import { BADGE_DISPLAY_NAMES, getAllBadgeIds } from "@/lib/badge-calculations"
import { cleanBadgeDataForFirestore } from "@/lib/user-badges"
import { migrateUserBadges } from "@/lib/badge-migration"
import { AdminWorkoutList, type RowerActivity } from "@/components/admin-workout-list"

export default function AdminPage() {
  const { toast } = useToast()
  const { leaderboardData } = useLeaderboardData()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRower, setSelectedRower] = useState("")
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [isManagingBadges, setIsManagingBadges] = useState(false)
  const [userBadges, setUserBadges] = useState<{ [badgeId: string]: boolean }>({})
  const [rowerActivities, setRowerActivities] = useState<any[]>([])
  const [rowerWorkouts, setRowerWorkouts] = useState<RowerActivity[]>([])
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false)
  const [isSavingWorkout, setIsSavingWorkout] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ADMIN_PASSWORD = "diddyparty"

  // Get all available badges
  const allBadges = getAllBadgeIds()
  
  useEffect(() => {
    // Check if admin is already authenticated
    const adminAuth = localStorage.getItem("adminAuth")
    if (adminAuth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("adminAuth", "true")
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin panel",
      })
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin password",
        variant: "destructive",
      })
      setPassword("")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adminAuth")
    setPassword("")
    toast({
      title: "Logged Out",
      description: "Admin session ended",
    })
  }

  const parseActivitiesToWorkouts = (activities: any[]): RowerActivity[] =>
    activities
      .map((activity: any, index: number) => ({
        arrayIndex: index,
        activity: activity.activity || "other",
        points: Number(activity.points) || 0,
        date: activity.date?.toDate ? activity.date.toDate() : new Date(activity.date),
        images: activity.images || (activity.image ? [activity.image] : []),
        notes: activity.notes,
        highlight: activity.highlight,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())

  const loadRowerWorkouts = async (userId: string) => {
    if (!userId) {
      setRowerActivities([])
      setRowerWorkouts([])
      return
    }

    setIsLoadingWorkouts(true)
    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)
      if (!userSnap.exists()) {
        setRowerActivities([])
        setRowerWorkouts([])
        return
      }
      const activities = userSnap.data().activities || []
      setRowerActivities(activities)
      setRowerWorkouts(parseActivitiesToWorkouts(activities))
    } catch (error) {
      console.error("Error loading rower workouts:", error)
      toast({
        title: "Error",
        description: "Failed to load workouts",
        variant: "destructive",
      })
    } finally {
      setIsLoadingWorkouts(false)
    }
  }

  const saveRowerActivities = async (activities: any[]) => {
    if (!selectedRower) return

    setIsSavingWorkout(true)
    try {
      const userRef = doc(db, "users", selectedRower)
      await updateDoc(userRef, { activities })
      await migrateUserBadges(selectedRower)
      setRowerActivities(activities)
      setRowerWorkouts(parseActivitiesToWorkouts(activities))
    } catch (error) {
      console.error("Error saving workouts:", error)
      toast({
        title: "Error",
        description: "Failed to save workout changes",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsSavingWorkout(false)
    }
  }

  const handleWorkoutAdjust = async (arrayIndex: number, meters: number) => {
    const updated = [...rowerActivities]
    updated[arrayIndex] = { ...updated[arrayIndex], points: meters }
    await saveRowerActivities(updated)
    toast({ title: "Workout updated", description: `Meters set to ${new Intl.NumberFormat().format(meters)}m` })
  }

  const handleWorkoutDelete = async (arrayIndex: number) => {
    const updated = rowerActivities.filter((_, i) => i !== arrayIndex)
    await saveRowerActivities(updated)
    toast({ title: "Workout deleted", description: "Workout removed from rower history" })
  }

  const handleWorkoutHighlight = async (
    arrayIndex: number,
    highlight: boolean,
    reason?: string
  ) => {
    const updated = [...rowerActivities]
    const activity = { ...updated[arrayIndex] }

    if (highlight) {
      activity.highlight = reason || true
      if (reason) {
        activity.highlightReason = reason
      }
    } else {
      delete activity.highlight
      delete activity.highlightReason
    }

    updated[arrayIndex] = activity
    await saveRowerActivities(updated)
    toast({
      title: highlight ? "Workout highlighted" : "Highlight removed",
      description: highlight
        ? reason || "Workout is now highlighted on the team feed"
        : "Highlight removed from workout",
    })
  }

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedRower) return

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

    setIsUploadingProfile(true)

    try {
      // Convert file to base64 for storage
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64String = e.target?.result as string
        
        // Update the user document in Firestore
        const userRef = doc(db, "users", selectedRower)
        await updateDoc(userRef, {
          profileImage: base64String
        })

        const rowerName = leaderboardData?.find((user) => user.id === selectedRower)?.name || "Unknown"

        toast({
          title: "Profile picture updated",
          description: `${rowerName}'s profile picture has been successfully updated!`,
        })

        // Reset form
        setSelectedRower("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      toast({
        title: "Upload failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingProfile(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const loadUserBadges = async (userId: string) => {
    try {
      const badgeRef = doc(db, 'badges', userId)
      const badgeSnap = await getDoc(badgeRef)
      
      if (badgeSnap.exists()) {
        const badgeData = badgeSnap.data() as UserBadgeData
        const earnedBadges: { [badgeId: string]: boolean } = {}
        
        allBadges.forEach(badgeId => {
          earnedBadges[badgeId] = badgeData.badges[badgeId]?.earned || false
        })
        
        setUserBadges(earnedBadges)
      } else {
        // Initialize with all badges as unearned
        const initialBadges: { [badgeId: string]: boolean } = {}
        allBadges.forEach(badgeId => {
          initialBadges[badgeId] = false
        })
        setUserBadges(initialBadges)
      }
    } catch (error) {
      console.error('Error loading user badges:', error)
      toast({
        title: "Error",
        description: "Failed to load user badges",
        variant: "destructive",
      })
    }
  }

  const handleUserSelection = (userId: string) => {
    setSelectedRower(userId)
    if (userId) {
      loadUserBadges(userId)
      loadRowerWorkouts(userId)
    } else {
      setUserBadges({})
      setRowerActivities([])
      setRowerWorkouts([])
    }
  }

  const handleBadgeToggle = async (badgeId: BadgeId, earned: boolean) => {
    if (!selectedRower) return

    setIsManagingBadges(true)
    
    try {
      const badgeRef = doc(db, 'badges', selectedRower)
      const badgeSnap = await getDoc(badgeRef)
      
      let badgeData: UserBadgeData
      
      if (badgeSnap.exists()) {
        badgeData = badgeSnap.data() as UserBadgeData
      } else {
        // Create new badge data if it doesn't exist
        badgeData = {
          userId: selectedRower,
          badges: {},
          lastCalculated: new Date()
        }
      }
      
      // Update the specific badge
      const now = new Date()
      badgeData.badges[badgeId] = {
        earned,
        earnedDate: earned ? now : undefined,
        progress: earned ? 1 : 0,
        maxProgress: 1,
        lastUpdated: now
      }
      
      // Firestore rejects undefined; omit earnedDate when revoking
      await setDoc(badgeRef, cleanBadgeDataForFirestore(badgeData))
      
      // Update local state
      setUserBadges(prev => ({
        ...prev,
        [badgeId]: earned
      }))
      
      const rowerName = leaderboardData?.find((user) => user.id === selectedRower)?.name || "Unknown"
      const action = earned ? "granted" : "revoked"
      
      toast({
        title: "Badge Updated",
        description: `${BADGE_DISPLAY_NAMES[badgeId]} badge ${action} to ${rowerName}`,
      })
      
    } catch (error) {
      console.error('Error updating badge:', error)
      toast({
        title: "Error",
        description: "Failed to update badge",
        variant: "destructive",
      })
    } finally {
      setIsManagingBadges(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-red-900 dark:text-red-100">Admin Access</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Enter admin password to continue</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-800 dark:text-red-200">🔒 Restricted Area</CardTitle>
              <CardDescription>This area is for administrators only</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-6">
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  <Shield className="mr-2 h-4 w-4" />
                  Access Admin Panel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-red-900 dark:text-red-100">Admin Panel</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage rower scores and data</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
        >
          Logout
        </Button>
      </div>

      <div className="space-y-6">
        {/* Adjust Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand" />
              Adjust Profile
            </CardTitle>
            <CardDescription>Modify profile, manage workouts, or adjust badges for a rower</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Rower</Label>
              <Select value={selectedRower} onValueChange={handleUserSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a rower" />
                </SelectTrigger>
                <SelectContent>
                  {leaderboardData?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {new Intl.NumberFormat().format(user.totalMeters)}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile Picture</TabsTrigger>
                <TabsTrigger value="workouts">Workouts</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <Button
                    variant="outline"
                    onClick={triggerFileInput}
                    disabled={isUploadingProfile || !selectedRower}
                    className="w-full text-brand dark:text-brand-muted border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950"
                  >
                    {isUploadingProfile ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand mr-2"></div>
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    {isUploadingProfile ? "Uploading..." : "Change Profile Picture"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select an image file (JPEG, PNG, etc.) under 5MB
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="workouts" className="space-y-3">
                {!selectedRower ? (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm">Select a rower to view and manage their workouts</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {rowerWorkouts.length} workout{rowerWorkouts.length === 1 ? "" : "s"} — tap image to expand
                    </p>
                    <AdminWorkoutList
                      workouts={rowerWorkouts}
                      isLoading={isLoadingWorkouts}
                      isSaving={isSavingWorkout}
                      onAdjust={handleWorkoutAdjust}
                      onDelete={handleWorkoutDelete}
                      onHighlight={handleWorkoutHighlight}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="badges" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Badge Management</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Check/uncheck badges to grant or revoke them for the selected user
                    </p>
                  </div>

                  {selectedRower ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {allBadges.map((badgeId) => (
                        <div
                          key={badgeId}
                          className={cn(
                            "flex items-center space-x-2 p-3 rounded-lg border transition-colors",
                            userBadges[badgeId]
                              ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          )}
                        >
                          <Checkbox
                            id={badgeId}
                            checked={userBadges[badgeId] || false}
                            onCheckedChange={(checked) => 
                              handleBadgeToggle(badgeId, checked as boolean)
                            }
                            disabled={isManagingBadges}
                          />
                          <Label
                            htmlFor={badgeId}
                            className={cn(
                              "text-sm font-medium cursor-pointer",
                              userBadges[badgeId]
                                ? "text-green-700 dark:text-green-300"
                                : "text-slate-700 dark:text-slate-300"
                            )}
                          >
                            {BADGE_DISPLAY_NAMES[badgeId]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a user to manage their badges</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
