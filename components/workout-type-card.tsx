"use client"

import { cn } from "@/lib/utils"
import type { WorkoutType } from "@/lib/types"
import type { LucideIcon } from "lucide-react"

interface WorkoutTypeCardProps {
  workoutType: {
    id: WorkoutType
    name: string
    icon: LucideIcon
    color: string
  }
  isSelected: boolean
  onSelect: () => void
}

export function WorkoutTypeCard({ workoutType, isSelected, onSelect }: WorkoutTypeCardProps) {
  const { id, name, icon: Icon, color } = workoutType

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-2 hover:shadow-lg",
        isSelected
          ? "bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 scale-105"
          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
      )}
      onClick={onSelect}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-transform duration-300 hover:rotate-12", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-medium">{name}</span>
    </div>
  )
}
