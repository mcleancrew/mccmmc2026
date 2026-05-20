import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import type { UserData } from "@/lib/types"

interface UserLeaderboardCardProps {
  user: UserData
  rank: number
}

export function UserLeaderboardCard({ user, rank }: UserLeaderboardCardProps) {
  const percentComplete = Math.min(100, (user.totalMeters / 1000000) * 100)

  return (
    <Link href={`/profile/${user.id}`}>
      <Card className="hover:bg-slate-50 dark:hover:bg-slate-900" hover="lift">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-4">
              <div className="relative">
                <Avatar className="h-12 w-12" hover="rotate">
                  <AvatarImage src={user.profileImage || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium transition-transform duration-300 hover:scale-125 hover:rotate-12">
                  {rank}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{user.name}</h3>
              <div className="flex items-center mt-1">
                <Progress value={percentComplete} className="h-2 flex-1" />
                <span className="ml-2 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {new Intl.NumberFormat().format(user.totalMeters)}m
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
