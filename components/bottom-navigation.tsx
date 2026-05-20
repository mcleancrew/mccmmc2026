"use client"

import { Home, Upload, BarChart2, User, LogOut, UserPlus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export default function BottomNavigation() {
  const pathname = usePathname()
  const { isGuest, signOut, isAuthenticated, user } = useAuth()

  // Don't show navigation on admin page
  if (pathname === "/admin") {
    return null
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      allowGuest: true,
    },
    {
      name: "Submit",
      href: "/submit",
      icon: Upload,
      allowGuest: false,
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: BarChart2,
      allowGuest: true,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      allowGuest: false,
    },
  ]

  const availableNavItems = navItems.filter((item) => !isGuest || item.allowGuest)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" key={`nav-${isGuest}-${isAuthenticated}-${user?.id}`}>
      <div className="max-w-md mx-auto">
        <nav className="flex items-center justify-around bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-16 px-4">
          {availableNavItems.map((item) => {
            const isActive = pathname === item.href
            const isDisabled = isGuest && !item.allowGuest

            return (
              <Link
                key={item.name}
                href={isDisabled ? "#" : item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-2",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400",
                  isDisabled && "opacity-50 cursor-not-allowed hover:scale-100 hover:rotate-0",
                )}
              >
                <item.icon className="h-5 w-5 transition-transform duration-300 hover:scale-125" />
                <span className="text-xs mt-1 transition-transform duration-300 hover:scale-110">{item.name}</span>
              </Link>
            )
          })}

          {isGuest && (
            <Link 
              href="/signup" 
              className="flex flex-col items-center justify-center w-full h-full text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-2"
            >
              <UserPlus className="h-5 w-5 transition-transform duration-300 hover:scale-125" />
              <span className="text-xs mt-1 transition-transform duration-300 hover:scale-110">Sign Up</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}
