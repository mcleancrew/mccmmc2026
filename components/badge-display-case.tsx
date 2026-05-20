"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Flame,
  Target,
  Calendar,
  Sunrise,
  Zap,
  Star,
  Crown,
  Shield,
  Gem,
  Medal,
  Dumbbell,
  Fish,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useBadgeData } from "@/hooks/use-badge-data"
import { BadgeProgress, BadgeId } from "@/lib/types"

// Custom SVG Icon Components - Made slightly bigger
const JustDoTrackBruhIcon = ({ className }: { className?: string }) => (
  <img src="/icons/just do track bruh.svg" alt="Just Do Track Bruh" className={cn("w-6 h-6", className)} />
)

const FreshLegsIcon = ({ className }: { className?: string }) => (
  <img src="/icons/fresh legs.svg" alt="Fresh Legs" className={cn("w-6 h-6", className)} />
)

const LendAHandIcon = ({ className }: { className?: string }) => (
  <img src="/icons/lend a hand.svg" alt="Lend A Hand" className={cn("w-6 h-6", className)} />
)

const TriIcon = ({ className }: { className?: string }) => (
  <img src="/icons/tri.svg" alt="Tri" className={cn("w-6 h-6", className)} />
)

const ErgMasterIcon = ({ className }: { className?: string }) => (
  <img src="/icons/erg master.svg" alt="Erg Master" className={cn("w-6 h-6", className)} />
)

// Zigzag Icon Component
const ZigzagIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("w-6 h-6", className)}
  >
    <path d="M3 12L7 8L11 12L15 8L19 12L23 8" />
    <path d="M3 16L7 12L11 16L15 12L19 16L23 12" />
  </svg>
)

interface Achievement {
  id: BadgeId
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  earned: boolean
  earnedDate?: Date
  progress?: number
  maxProgress?: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface BadgeDisplayCaseProps {
  userId?: string
}

export function BadgeDisplayCase({ userId }: BadgeDisplayCaseProps) {
  const { badges, loading } = useBadgeData(userId)

  // Define all achievements with their metadata
  const achievements: Achievement[] = [
    // Legendary Achievements
    {
      id: "million-meter-champion",
      name: "Million Meter Champion",
      description: "Complete the full 1,000,000 meter challenge",
      icon: Crown,
      earned: badges["million-meter-champion"]?.earned || false,
      earnedDate: badges["million-meter-champion"]?.earnedDate,
      progress: badges["million-meter-champion"]?.progress,
      maxProgress: badges["million-meter-champion"]?.maxProgress,
      rarity: "legendary",
    },
    {
      id: "100k-day",
      name: "Centurion",
      description: "Complete 100,000 meters in a single day",
      icon: Zap,
      earned: badges["100k-day"]?.earned || false,
      earnedDate: badges["100k-day"]?.earnedDate,
      progress: badges["100k-day"]?.progress,
      maxProgress: badges["100k-day"]?.maxProgress,
      rarity: "legendary",
    },

    // Epic Achievements
    {
      id: "jack-of-all-trades",
      name: "Jack of All Trades",
      description: "Complete all 6 workout types in one day",
      icon: Star,
      earned: badges["jack-of-all-trades"]?.earned || false,
      earnedDate: badges["jack-of-all-trades"]?.earnedDate,
      progress: badges["jack-of-all-trades"]?.progress,
      maxProgress: badges["jack-of-all-trades"]?.maxProgress,
      rarity: "epic",
    },
    {
      id: "marathon",
      name: "Marathon",
      description: "Complete 42,195 meters in one sitting",
      icon: Target,
      earned: badges["marathon"]?.earned || false,
      earnedDate: badges["marathon"]?.earnedDate,
      progress: badges["marathon"]?.progress,
      maxProgress: badges["marathon"]?.maxProgress,
      rarity: "epic",
    },
    {
      id: "monthly-master",
      name: "Monthly Master",
      description: "30 consecutive days of workouts (each at least 5000m)",
      icon: Calendar,
      earned: badges["monthly-master"]?.earned || false,
      earnedDate: badges["monthly-master"]?.earnedDate,
      progress: badges["monthly-master"]?.progress,
      maxProgress: badges["monthly-master"]?.maxProgress,
      rarity: "epic",
    },
    {
      id: "nates-favorite",
      name: "Nate's Favorite",
      description: "Get a 2k PR",
      icon: Trophy,
      earned: badges["nates-favorite"]?.earned || false,
      earnedDate: badges["nates-favorite"]?.earnedDate,
      progress: badges["nates-favorite"]?.progress,
      maxProgress: badges["nates-favorite"]?.maxProgress,
      rarity: "epic",
    },

    // Rare Achievements
    {
      id: "gym-rat",
      name: "Gym Rat",
      description: "Complete 20+ lifting workouts",
      icon: Dumbbell,
      earned: badges["gym-rat"]?.earned || false,
      earnedDate: badges["gym-rat"]?.earnedDate,
      progress: badges["gym-rat"]?.progress,
      maxProgress: badges["gym-rat"]?.maxProgress,
      rarity: "rare",
    },
    {
      id: "tri",
      name: "Tri",
      description: "Complete 30,000 meters in one day",
      icon: TriIcon,
      earned: badges["tri"]?.earned || false,
      earnedDate: badges["tri"]?.earnedDate,
      progress: badges["tri"]?.progress,
      maxProgress: badges["tri"]?.maxProgress,
      rarity: "rare",
    },
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Complete 10 workouts before 7 AM (each at least 5000m)",
      icon: Sunrise,
      earned: badges["early-bird"]?.earned || false,
      earnedDate: badges["early-bird"]?.earnedDate,
      progress: badges["early-bird"]?.progress,
      maxProgress: badges["early-bird"]?.maxProgress,
      rarity: "rare",
    },
    {
      id: "erg-master",
      name: "Erg Master",
      description: "Complete 50+ erg workouts",
      icon: ErgMasterIcon,
      earned: badges["erg-master"]?.earned || false,
      earnedDate: badges["erg-master"]?.earnedDate,
      progress: badges["erg-master"]?.progress,
      maxProgress: badges["erg-master"]?.maxProgress,
      rarity: "rare",
    },
    {
      id: "fish",
      name: "Fish",
      description: "Complete 10+ swim workouts",
      icon: Fish,
      earned: badges["fish"]?.earned || false,
      earnedDate: badges["fish"]?.earnedDate,
      progress: badges["fish"]?.progress,
      maxProgress: badges["fish"]?.maxProgress,
      rarity: "rare",
    },
    {
      id: "zigzag-method",
      name: "Zigzag Method",
      description: "Complete an 8 x 6:35",
      icon: ZigzagIcon,
      earned: badges["zigzag-method"]?.earned || false,
      earnedDate: badges["zigzag-method"]?.earnedDate,
      progress: badges["zigzag-method"]?.progress,
      maxProgress: badges["zigzag-method"]?.maxProgress,
      rarity: "rare",
    },
    {
      id: "mystery-badge",
      name: "???",
      description: "???",
      icon: HelpCircle,
      earned: badges["mystery-badge"]?.earned || false,
      earnedDate: badges["mystery-badge"]?.earnedDate,
      progress: badges["mystery-badge"]?.progress,
      maxProgress: badges["mystery-badge"]?.maxProgress,
      rarity: "rare",
    },

    // Common Achievements
    {
      id: "just-do-track-bruh",
      name: "Just Do Track Bruh",
      description: "Complete 10+ running workouts",
      icon: JustDoTrackBruhIcon,
      earned: badges["just-do-track-bruh"]?.earned || false,
      earnedDate: badges["just-do-track-bruh"]?.earnedDate,
      progress: badges["just-do-track-bruh"]?.progress,
      maxProgress: badges["just-do-track-bruh"]?.maxProgress,
      rarity: "common",
    },
    {
      id: "lend-a-hand",
      name: "Lend a Hand",
      description: "Go on a 3-mile run with someone who has less than 10k meters",
      icon: LendAHandIcon,
      earned: badges["lend-a-hand"]?.earned || false,
      earnedDate: badges["lend-a-hand"]?.earnedDate,
      progress: badges["lend-a-hand"]?.progress,
      maxProgress: badges["lend-a-hand"]?.maxProgress,
      rarity: "common",
    },
    {
      id: "week-warrior",
      name: "Week Warrior",
      description: "7 consecutive days of workouts (each at least 5000m)",
      icon: Flame,
      earned: badges["week-warrior"]?.earned || false,
      earnedDate: badges["week-warrior"]?.earnedDate,
      progress: badges["week-warrior"]?.progress,
      maxProgress: badges["week-warrior"]?.maxProgress,
      rarity: "common",
    },
    {
      id: "fresh-legs",
      name: "Fresh Legs",
      description: "Complete your first 10,000 meters",
      icon: FreshLegsIcon,
      earned: badges["fresh-legs"]?.earned || false,
      earnedDate: badges["fresh-legs"]?.earnedDate,
      progress: badges["fresh-legs"]?.progress,
      maxProgress: badges["fresh-legs"]?.maxProgress,
      rarity: "common",
    },
  ]

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading badges...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRarityColors = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return {
          bg: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950",
          border: "border-green-400 dark:border-green-500",
          glow: "shadow-green-300 dark:shadow-green-600",
          text: "text-green-700 dark:text-green-300",
        }
      case "rare":
        return {
          bg: "bg-blue-50 dark:bg-blue-950",
          border: "border-blue-300 dark:border-blue-600",
          glow: "shadow-blue-200 dark:shadow-blue-700",
          text: "text-blue-700 dark:text-blue-300",
        }
      case "epic":
        return {
          bg: "bg-purple-50 dark:bg-purple-950",
          border: "border-purple-300 dark:border-purple-600",
          glow: "shadow-purple-200 dark:shadow-purple-700",
          text: "text-purple-700 dark:text-purple-300",
        }
      case "legendary":
        return {
          bg: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950",
          border: "border-yellow-400 dark:border-yellow-600",
          glow: "shadow-yellow-300 dark:shadow-yellow-600",
          text: "text-yellow-700 dark:text-yellow-300",
        }
    }
  }

  const earnedBadges = achievements.filter((a) => a.earned)
  const unlockedCount = earnedBadges.length
  const totalCount = achievements.length
  const completionPercentage = (unlockedCount / totalCount) * 100

  return (
    <Card className="mt-6 max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Gem className="h-5 w-5 text-purple-600" />
            Badge Display Case
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {unlockedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Display Case with Glass Effect */}
        <div className="relative">
          {/* Glass Case Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm" />

          {/* Shelves */}
          <div className="relative p-4 space-y-6">
            {/* Legendary Shelf */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-300">
                <Crown className="h-4 w-4" />
                Legendary
              </div>
              <div className="grid grid-cols-4 gap-3">
                {achievements
                  .filter((a) => a.rarity === "legendary")
                  .map((achievement) => (
                    <BadgeCard key={achievement.id} achievement={achievement} />
                  ))}
              </div>
            </div>

            {/* Epic Shelf */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                <Shield className="h-4 w-4" />
                Epic
              </div>
              <div className="grid grid-cols-4 gap-3">
                {achievements
                  .filter((a) => a.rarity === "epic")
                  .map((achievement) => (
                    <BadgeCard key={achievement.id} achievement={achievement} />
                  ))}
              </div>
            </div>

            {/* Rare Shelf */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                <Star className="h-4 w-4" />
                Rare
              </div>
              <div className="grid grid-cols-4 gap-3">
                {achievements
                  .filter((a) => a.rarity === "rare")
                  .map((achievement) => (
                    <BadgeCard key={achievement.id} achievement={achievement} />
                  ))}
              </div>
            </div>

            {/* Common Shelf */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Medal className="h-4 w-4" />
                Common
              </div>
              <div className="grid grid-cols-4 gap-3">
                {achievements
                  .filter((a) => a.rarity === "common")
                  .map((achievement) => (
                    <BadgeCard key={achievement.id} achievement={achievement} />
                  ))}
              </div>
            </div>
          </div>

          {/* Spotlight Effect */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-gradient-to-b from-yellow-200/30 to-transparent dark:from-yellow-400/20 rounded-b-full blur-sm" />
        </div>
      </CardContent>
    </Card>
  )
}

function BadgeCard({ achievement }: { achievement: Achievement }) {
  const colors = getRarityColors(achievement.rarity)
  const Icon = achievement.icon

  return (
    <div className="relative group">
      <div
        className={cn(
          "aspect-square p-3 rounded-lg border-2 transition-all duration-300 relative overflow-hidden",
          achievement.earned
            ? cn(
                colors.bg,
                colors.border,
                "shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer",
                colors.glow,
              )
            : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 opacity-40",
        )}
      >
        {/* Shine effect for earned badges */}
        {achievement.earned && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
        )}

        {/* Badge Icon */}
        <div className="flex items-center justify-center h-full relative">
          <Icon className={cn("h-6 w-6", achievement.earned ? colors.text : "text-slate-400 dark:text-slate-600")} />
          
          {/* Checkmark overlay for earned badges */}
          {achievement.earned && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Progress indicator for unearned badges */}
        {!achievement.earned && typeof achievement.progress === 'number' && typeof achievement.maxProgress === 'number' && achievement.maxProgress > 1 && (
          <div className="absolute bottom-1 left-1 right-1">
            <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1" />
          </div>
        )}

        {/* Rarity indicator */}
        {achievement.earned && achievement.rarity === "legendary" && (
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          </div>
        )}

        {/* Earned badge glow effect */}
        {achievement.earned && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent rounded-lg animate-pulse" />
        )}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{achievement.name}</div>
        <div className="text-slate-300">{achievement.description}</div>
        {achievement.earned && (
          <div className="text-green-400 font-medium">✓ Earned!</div>
        )}
        {!achievement.earned && typeof achievement.progress === 'number' && typeof achievement.maxProgress === 'number' && achievement.maxProgress > 1 && (
          <div className="text-slate-400">
            {new Intl.NumberFormat().format(achievement.progress)} /{" "}
            {new Intl.NumberFormat().format(achievement.maxProgress)}
          </div>
        )}
      </div>
    </div>
  )
}

function getRarityColors(rarity: Achievement["rarity"]) {
  switch (rarity) {
    case "common":
      return {
        bg: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950",
        border: "border-green-400 dark:border-green-500",
        glow: "shadow-green-300 dark:shadow-green-600",
        text: "text-green-700 dark:text-green-300",
      }
    case "rare":
      return {
        bg: "bg-blue-50 dark:bg-blue-950",
        border: "border-blue-300 dark:border-blue-600",
        glow: "shadow-blue-200 dark:shadow-blue-700",
        text: "text-blue-700 dark:text-blue-300",
      }
    case "epic":
      return {
        bg: "bg-purple-50 dark:bg-purple-950",
        border: "border-purple-300 dark:border-purple-600",
        glow: "shadow-purple-200 dark:shadow-purple-700",
        text: "text-purple-700 dark:text-purple-300",
      }
    case "legendary":
      return {
        bg: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950",
        border: "border-yellow-400 dark:border-yellow-600",
        glow: "shadow-yellow-300 dark:shadow-yellow-600",
        text: "text-yellow-700 dark:text-yellow-300",
      }
  }
}
