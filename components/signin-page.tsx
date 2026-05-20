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
import { Eye, EyeOff, Users, Trophy, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function SigninPage() {
  const { signIn, continueAsGuest, isAuthenticated, isLoading: authLoading, isGuest, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
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

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await signIn(formData.email, formData.password)
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account",
      })
      router.push("/")
    } catch (error: any) {
      let errorMessage = "Sign in failed. Please try again."
      
      if (error.message.includes("user-not-found") || error.message.includes("wrong-password") || error.message.includes("invalid-credential")) {
        errorMessage = "Invalid email or password."
      } else if (error.message.includes("invalid-email")) {
        errorMessage = "Invalid email format."
      } else if (error.message.includes("user-disabled")) {
        errorMessage = "This account has been disabled."
      } else if (error.message.includes("too-many-requests")) {
        errorMessage = "Too many failed attempts. Please try again later."
      }
      
      toast({
        title: "Sign in failed",
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

  const handlePasswordReset = async () => {
    let email = formData.email
    if (!email) {
      email = window.prompt("Please enter your email to reset your password:") || ""
    }
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      })
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Password Reset Email Sent",
        description: `A password reset link has been sent to ${email}. Please check your inbox.`,
      })
    } catch (error: any) {
      let errorMessage = "Failed to send password reset email."
      if (error.message.includes("user-not-found")) {
        errorMessage = "No account found with this email."
      } else if (error.message.includes("invalid-email")) {
        errorMessage = "Invalid email format."
      }
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">Welcome Back</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Sign in to your Million Meters account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              {isGuest 
                ? "Sign in with your existing account to submit workouts and track your progress!" 
                : "Enter your credentials to access your account"
              }
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignin}>
            <CardContent className="space-y-4">
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
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
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

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500 hover:underline"
                    onClick={handlePasswordReset}
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing In..." : "Sign In"}
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
                <span className="ml-2 text-xs">(Account required)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}
