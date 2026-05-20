"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import BottomNavigation from "@/components/bottom-navigation"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isGuest, user, isLoading: authLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Only redirect if auth is not loading and user is not authenticated
    if (!authLoading && !isAuthenticated && pathname !== "/signup" && pathname !== "/signin" && !hasRedirected) {
      setHasRedirected(true)
      router.push("/signin")
    }
  }, [authLoading, isAuthenticated, pathname, router, hasRedirected])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated and not on auth pages, show loading (redirect is handled above)
  if (!isAuthenticated && pathname !== "/signup" && pathname !== "/signin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If authenticated (including guest), show the app with navigation
  if (isAuthenticated) {
    return (
      <>
        <main className="flex-1 pb-16">{children}</main>
        <BottomNavigation />
      </>
    )
  }

  // For auth pages when not authenticated
  return <>{children}</>
}
