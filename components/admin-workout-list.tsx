"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Star, Trash2, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"

export interface RowerActivity {
  arrayIndex: number
  activity: string
  points: number
  date: Date
  images: string[]
  notes?: string
  highlight?: boolean | string | { reason?: string }
}

interface AdminWorkoutListProps {
  workouts: RowerActivity[]
  isLoading: boolean
  isSaving: boolean
  onAdjust: (arrayIndex: number, meters: number) => Promise<void>
  onDelete: (arrayIndex: number) => Promise<void>
  onHighlight: (arrayIndex: number, highlight: boolean, reason?: string) => Promise<void>
}

function getImageSrc(image: string | undefined): string {
  if (!image) return "/placeholder.png"
  if (image.startsWith("data:image/")) return image
  if (/^[A-Za-z0-9+/=]+$/.test(image) && image.length > 100) {
    return `data:image/png;base64,${image}`
  }
  return image
}

function getWorkoutTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case "erg":
      return "bg-brand-100 text-brand dark:bg-brand-900 dark:text-brand-muted"
    case "otw":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
    case "run":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
    case "bike":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
    case "swim":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
    case "lift":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
  }
}

function isHighlighted(highlight: RowerActivity["highlight"]): boolean {
  return !!highlight
}

export function AdminWorkoutList({
  workouts,
  isLoading,
  isSaving,
  onAdjust,
  onDelete,
  onHighlight,
}: AdminWorkoutListProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [adjustTarget, setAdjustTarget] = useState<RowerActivity | null>(null)
  const [adjustMeters, setAdjustMeters] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<RowerActivity | null>(null)
  const [highlightTarget, setHighlightTarget] = useState<RowerActivity | null>(null)
  const [highlightReason, setHighlightReason] = useState("")

  const openAdjust = (workout: RowerActivity) => {
    setAdjustTarget(workout)
    setAdjustMeters(String(workout.points))
  }

  const openHighlight = (workout: RowerActivity) => {
    if (isHighlighted(workout.highlight)) {
      void onHighlight(workout.arrayIndex, false)
      return
    }
    setHighlightTarget(workout)
    setHighlightReason("")
  }

  const handleAdjustSave = async () => {
    if (!adjustTarget) return
    const meters = Number.parseInt(adjustMeters, 10)
    if (Number.isNaN(meters) || meters <= 0) return
    await onAdjust(adjustTarget.arrayIndex, meters)
    setAdjustTarget(null)
    setAdjustMeters("")
  }

  const handleHighlightSave = async () => {
    if (!highlightTarget) return
    await onHighlight(highlightTarget.arrayIndex, true, highlightReason.trim() || undefined)
    setHighlightTarget(null)
    setHighlightReason("")
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await onDelete(deleteTarget.arrayIndex)
    setDeleteTarget(null)
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading workouts...
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 dark:text-slate-400">
        <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No workouts recorded for this rower</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {workouts.map((workout) => {
          const typeLabel = (workout.activity || "other").toUpperCase()
          const thumb = workout.images[0]
          const highlighted = isHighlighted(workout.highlight)

          return (
            <div
              key={workout.arrayIndex}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors",
                highlighted
                  ? "border-yellow-300 bg-yellow-50/80 dark:border-yellow-700 dark:bg-yellow-950/40"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              )}
            >
              {thumb ? (
                <button
                  type="button"
                  onClick={() => setExpandedImage(getImageSrc(thumb))}
                  className="h-10 w-10 shrink-0 overflow-hidden rounded border border-slate-200 dark:border-slate-600 hover:ring-2 hover:ring-brand/40"
                >
                  <img
                    src={getImageSrc(thumb)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-slate-800">
                  <Dumbbell className="h-4 w-4" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                      getWorkoutTypeColor(workout.activity)
                    )}
                  >
                    {typeLabel}
                  </span>
                  <span className="font-semibold text-brand dark:text-brand-muted">
                    {new Intl.NumberFormat().format(workout.points)}m
                  </span>
                  {highlighted && (
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
                  )}
                </div>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(workout.date)}
                  {workout.notes ? ` · ${workout.notes}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isSaving}
                  onClick={() => openAdjust(workout)}
                  title="Adjust meters"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    highlighted && "text-yellow-600 hover:text-yellow-700"
                  )}
                  disabled={isSaving}
                  onClick={() => openHighlight(workout)}
                  title={highlighted ? "Remove highlight" : "Highlight workout"}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5",
                      highlighted && "fill-yellow-400 text-yellow-500"
                    )}
                  />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  disabled={isSaving}
                  onClick={() => setDeleteTarget(workout)}
                  title="Delete workout"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-lg p-2">
          <DialogTitle className="sr-only">Workout proof image</DialogTitle>
          {expandedImage && (
            <img
              src={expandedImage}
              alt="Workout proof"
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustTarget} onOpenChange={(open) => !open && setAdjustTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust meters</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="adjust-meters">Meters</Label>
            <Input
              id="adjust-meters"
              type="number"
              min={1}
              value={adjustMeters}
              onChange={(e) => setAdjustMeters(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!highlightTarget} onOpenChange={(open) => !open && setHighlightTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Highlight workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="highlight-reason">Reason (optional)</Label>
            <Input
              id="highlight-reason"
              placeholder="e.g. Epic team row"
              value={highlightReason}
              onChange={(e) => setHighlightReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHighlightTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleHighlightSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Highlight"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              {deleteTarget
                ? `${new Intl.NumberFormat().format(deleteTarget.points)}m of ${deleteTarget.activity}`
                : "this workout"}
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteConfirm}
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
