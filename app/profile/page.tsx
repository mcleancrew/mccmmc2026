"use client"

import { useAuth } from "@/hooks/use-auth"
import ProfilePage from "@/components/profile-page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, UserPlus } from "lucide-react"

export default function Profile() {
  const { isGuest, signOut } = useAuth()

  if (isGuest) {
    return (
      <div className="container px-4 py-6">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-6">Profile</h1>

        <Card>
          <CardContent className="py-8 text-center">
            <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign Up Required</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create an account to view your personal profile and track your progress.
            </p>
            <Button onClick={signOut} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ProfilePage />
}
