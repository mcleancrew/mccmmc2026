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
import { Shield, Minus, RotateCcw, Eye, EyeOff, AlertTriangle, Camera, User, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BadgeId, UserBadgeData, BadgeProgress } from "@/lib/types"
import { getAllBadgeIds } from "@/lib/badge-calculations"

export default function AdminPage() {
  const { toast } = useToast()
  const { leaderboardData } = useLeaderboardData()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRower, setSelectedRower] = useState("")
  const [metersToSubtract, setMetersToSubtract] = useState("")
  const [meterOperation, setMeterOperation] = useState<"add" | "subtract">("subtract")
  const [resetClickCount, setResetClickCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [isManagingBadges, setIsManagingBadges] = useState(false)
  const [userBadges, setUserBadges] = useState<{ [badgeId: string]: boolean }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ADMIN_PASSWORD = "diddyparty"
  const RESET_CLICKS_REQUIRED = 20

  // Get all available badges
  const allBadges = getAllBadgeIds()
  
  // Badge display names
  const badgeNames: Record<BadgeId, string> = {
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
    setResetClickCount(0)
    toast({
      title: "Logged Out",
      description: "Admin session ended",
    })
  }

  const handleMeterOperation = async () => {
    if (!selectedRower || !metersToSubtract) {
      toast({
        title: "Missing Information",
        description: "Please select a rower and enter meters",
        variant: "destructive",
      })
      return
    }

    const meters = Number.parseInt(metersToSubtract)
    if (isNaN(meters) || meters <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of meters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const rowerName = leaderboardData?.find((user) => user.id === selectedRower)?.name || "Unknown"
    const operationText = meterOperation === "add" ? "Added" : "Removed"

    toast({
      title: `Meters ${meterOperation === "add" ? "Added" : "Subtracted"}`,
      description: `${operationText} ${new Intl.NumberFormat().format(meters)}m ${meterOperation === "add" ? "to" : "from"} ${rowerName}`,
    })

    // Reset form
    setSelectedRower("")
    setMetersToSubtract("")
    setIsLoading(false)
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
    } else {
      setUserBadges({})
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
      
      // Update Firestore
      await setDoc(badgeRef, badgeData)
      
      // Update local state
      setUserBadges(prev => ({
        ...prev,
        [badgeId]: earned
      }))
      
      const rowerName = leaderboardData?.find((user) => user.id === selectedRower)?.name || "Unknown"
      const action = earned ? "granted" : "revoked"
      
      toast({
        title: "Badge Updated",
        description: `${badgeNames[badgeId]} badge ${action} to ${rowerName}`,
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

  const handleResetClick = () => {
    const newCount = resetClickCount + 1
    setResetClickCount(newCount)

    if (newCount === RESET_CLICKS_REQUIRED) {
      // Reset all scores
      toast({
        title: "🚨 ALL SCORES RESET! 🚨",
        description: "All rower scores have been reset to zero",
        variant: "destructive",
      })
      setResetClickCount(0)
    } else {
      const remaining = RESET_CLICKS_REQUIRED - newCount
      toast({
        title: `Reset Progress: ${newCount}/${RESET_CLICKS_REQUIRED}`,
        description: `${remaining} more clicks to reset all scores`,
      })
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
              <User className="h-5 w-5 text-blue-600" />
              Adjust Profile
            </CardTitle>
            <CardDescription>Modify a rower's profile picture or subtract meters from their score</CardDescription>
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
                <TabsTrigger value="meters">Meters</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <Button
                    variant="outline"
                    onClick={triggerFileInput}
                    disabled={isUploadingProfile || !selectedRower}
                    className="w-full text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    {isUploadingProfile ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
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

              <TabsContent value="meters" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Operation</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="add"
                          checked={meterOperation === "add"}
                          onChange={(e) => setMeterOperation(e.target.value as "add" | "subtract")}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium">Add Meters</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="subtract"
                          checked={meterOperation === "subtract"}
                          onChange={(e) => setMeterOperation(e.target.value as "add" | "subtract")}
                          className="text-orange-600"
                        />
                        <span className="text-sm font-medium">Subtract Meters</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meters">Meters to {meterOperation === "add" ? "Add" : "Subtract"}</Label>
                    <Input
                      id="meters"
                      type="number"
                      min="1"
                      placeholder={`e.g., 5000`}
                      value={metersToSubtract}
                      onChange={(e) => setMetersToSubtract(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleMeterOperation}
                    disabled={isLoading || !selectedRower || !metersToSubtract}
                    className={cn(
                      "w-full",
                      meterOperation === "add" 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-orange-600 hover:bg-orange-700"
                    )}
                  >
                    {isLoading ? "Processing..." : `${meterOperation === "add" ? "Add" : "Subtract"} Meters`}
                  </Button>
                </div>
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
                            {badgeNames[badgeId]}
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

        {/* Reset All Scores Card */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions that affect all data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Reset All Scores</h4>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                This will permanently reset all rower scores to zero. Click the button below {RESET_CLICKS_REQUIRED}{" "}
                times to confirm.
              </p>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleResetClick}
                  variant="destructive"
                  className={cn("transition-all duration-200", resetClickCount > 0 && "animate-pulse")}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset All Scores ({resetClickCount}/{RESET_CLICKS_REQUIRED})
                </Button>

                {resetClickCount > 0 && (
                  <div className="flex-1">
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(resetClickCount / RESET_CLICKS_REQUIRED) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      {RESET_CLICKS_REQUIRED - resetClickCount} clicks remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Leaderboard Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Leaderboard</CardTitle>
            <CardDescription>Preview of current rower standings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboardData?.slice(0, 5).map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm w-6">#{index + 1}</span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {new Intl.NumberFormat().format(user.totalMeters)}m
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
