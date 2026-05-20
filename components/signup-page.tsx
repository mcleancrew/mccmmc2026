"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Eye, Users, Trophy, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const { signUp, continueAsGuest, isAuthenticated, isLoading: authLoading, isGuest, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

    try {
      await signUp(formData.name, formData.email, formData.password)
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account before signing in.",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">Million Meters</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Join the rowing challenge</p>
        </div>

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
                Continue as Guest
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Guest Features Info */}
        <Card className="mt-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="pt-4">
            <h3 className="font-semibold text-sm mb-3 text-slate-700 dark:text-slate-300">As a guest, you can:</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <Users className="h-4 w-4 mr-2 text-green-600" />
                View team progress and dashboard
              </div>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <Trophy className="h-4 w-4 mr-2 text-green-600" />
                Browse the leaderboard
              </div>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <Upload className="h-4 w-4 mr-2 text-slate-400" />
                <span className="line-through">Submit workouts</span>
                <span className="ml-2 text-xs">(Sign up required)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
