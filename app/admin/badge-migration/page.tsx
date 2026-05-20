"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge, Database, Users, CheckCircle, AlertCircle } from "lucide-react"
import { migrateAllUserBadges } from "@/lib/badge-migration"

export default function BadgeMigrationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const handleMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      console.log("Starting badge migration...")
      await migrateAllUserBadges()
      
      setResult({
        success: true,
        message: "Badge migration completed successfully!",
        details: "Check the browser console for detailed migration logs."
      })
    } catch (error) {
      console.error("Migration failed:", error)
      setResult({
        success: false,
        message: "Badge migration failed",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
          Badge Migration Tool
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Calculate and migrate lifetime badge progress for all users based on their workout history.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Migration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Badge Migration
            </CardTitle>
            <CardDescription>
              This will calculate lifetime badge progress for all users and store it in the badges collection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">All Users</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Process every user</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <Badge className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Lifetime Badges</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Calculate progress</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Firestore</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Store results</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">What this migration does:</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>• Calculates total meters for "Million Meter Champion" and "Fresh Legs" badges</li>
                <li>• Counts workout types for "Gym Rat", "Erg Master", "Fish", and "Just Do Track Bruh" badges</li>
                <li>• Identifies early morning workouts for "Early Bird" badge</li>
                <li>• Uses day streak for "Monthly Master" badge</li>
                <li>• Stores results in the badges collection for each user</li>
              </ul>
            </div>

            <Button 
              onClick={handleMigration} 
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Migration...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Start Badge Migration
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Alert */}
        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50 dark:bg-green-950" : "border-red-200 bg-red-50 dark:bg-red-950"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
              <div className="font-medium">{result.message}</div>
              {result.details && (
                <div className="text-sm mt-1 opacity-80">{result.details}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p className="font-medium mb-2">After running the migration:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Check the browser console for detailed migration logs</li>
                <li>Visit user profiles to see badge progress</li>
                <li>Real-time badges (100k Day, Jack of All Trades, Tri) will be calculated automatically</li>
                <li>Manual badges can be assigned through the admin interface</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 