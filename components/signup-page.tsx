"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Eye } from "lucide-react"
import { AuthSiteInfoCard } from "@/components/auth-site-info-card"
import { AuthPageHeader } from "@/components/auth-page-header"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authPageShellClass } from "@/lib/auth-page-styles"
import { USER_CLASS_OPTIONS, type UserClass } from "@/lib/user-profile"

export default function SignupPage() {
  const { signUp, continueAsGuest, isAuthenticated, isLoading: authLoading, isGuest, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    team: "" as "" | "M" | "F",
    rowerClass: "" as "" | UserClass,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect authenticated users (but not guests) to homepage
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isGuest) {
      router.push("/")
    }
  }, [isAuthenticated, isGuest, authLoading, router])

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className={authPageShellClass}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    )
  }

  // Don't render the form if user is already authenticated (but allow guests)
  if (isAuthenticated && !isGuest) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!formData.team) {
      toast({
        title: "Team required",
        description: "Please select boys team or girls team.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!formData.rowerClass) {
      toast({
        title: "Class required",
        description: "Please select your class for this school year.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      await signUp(formData.name, formData.email, formData.password, formData.team, formData.rowerClass)
      toast({
        title: "Account created!",
        description: "You can now submit workouts and track your progress!",
      })
      // Redirect to signin page after successful signup
      router.push("/signin")
    } catch (error: any) {
      let errorMessage = "Signup failed. Please try again."
      
      if (error.message.includes("email-already-in-use")) {
        errorMessage = "Email already in use. Please use a different email or sign in."
      } else if (error.message.includes("invalid-email")) {
        errorMessage = "Invalid email format."
      } else if (error.message.includes("weak-password")) {
        errorMessage = "Password is too weak. Please choose a stronger password."
      }
      
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  const handleGuestAccess = () => {
    continueAsGuest()
    toast({
      title: "Welcome, Guest!",
      description: "You can view the home page and leaderboard. Sign up to submit workouts!",
    })
    router.push("/")
  }

  return (
    <div className={authPageShellClass}>
      <div className="w-full max-w-md">
        <AuthPageHeader />

        <AuthSiteInfoCard />

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              {isGuest 
                ? "Upgrade from guest mode to submit workouts and track your progress!" 
                : "Join your team in the Million Meters Challenge"
              }
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={formData.team || undefined}
                  onValueChange={(value: "M" | "F") =>
                    setFormData((prev) => ({ ...prev, team: value }))
                  }
                  required
                >
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Select your team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Boys team</SelectItem>
                    <SelectItem value="F">Girls team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rowerClass">Class from this current school year</Label>
                <Select
                  value={formData.rowerClass || undefined}
                  onValueChange={(value: UserClass) =>
                    setFormData((prev) => ({ ...prev, rowerClass: value }))
                  }
                  required
                >
                  <SelectTrigger id="rowerClass">
                    <SelectValue placeholder="Select your class" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_CLASS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="relative w-full">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white dark:bg-slate-900 px-2 text-xs text-slate-500">or</span>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleGuestAccess}>
                <Eye className="mr-2 h-4 w-4" />
                View leaderboard as Guest
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
