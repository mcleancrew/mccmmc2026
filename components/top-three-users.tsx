import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Medal, Crown, Award } from "lucide-react"
import Link from "next/link"
import type { UserData } from "@/lib/types"

interface TopThreeUsersProps {
  users: UserData[]
}

export function TopThreeUsers({ users }: TopThreeUsersProps) {
  // Ensure we have exactly 3 users, padding with null if needed
  const paddedUsers: (UserData | null)[] = [...users]
  while (paddedUsers.length < 3) {
    paddedUsers.push(null)
  }

  // Get the first 3 users in their correct order (1st, 2nd, 3rd)
  const [first, second, third] = paddedUsers

  return (
    <div className="relative mb-6 pt-8 pb-6">
      {/* Podium Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 via-blue-50 to-cyan-50 dark:from-yellow-950 dark:via-blue-950 dark:to-cyan-950 rounded-2xl opacity-50" />

      <div className="relative flex justify-center items-end">
        {/* Second Place */}
        {second && (
          <div className="flex flex-col items-center mx-3 z-10 transform hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out">
            <div className="relative mb-2">
              <div className="absolute -top-3 -left-2 z-20 transition-transform duration-300 hover:scale-110 hover:rotate-12">
                <div className="bg-gradient-to-r from-slate-400 to-slate-600 p-1.5 rounded-full">
                  <Medal className="h-4 w-4 text-white" />
                </div>
              </div>
              <Link href={`/profile/${second.id}`}>
                <Avatar className="h-16 w-16 ring-4 ring-slate-300 shadow-xl" hover="animated">
                  <AvatarImage src={second.profileImage || "/placeholder.png"} alt={second.name} />
                  <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 font-bold">
                    {second.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-slate-400 to-slate-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold text-sm mx-auto mb-1 transition-transform duration-300 hover:scale-125 hover:rotate-12">
                2
              </div>
              <p className="font-bold text-sm max-w-[60px] truncate text-slate-700 dark:text-slate-300">
                {second.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {new Intl.NumberFormat().format(second.totalMeters)}m
              </p>
            </div>
          </div>
        )}

        {/* First Place */}
        {first && (
          <div className="flex flex-col items-center mx-3 z-20 -mt-6 transform hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out">
            <div className="relative mb-2">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 transition-transform duration-300 hover:scale-110 hover:rotate-12">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-2 rounded-full shadow-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
              </div>
              <Link href={`/profile/${first.id}`}>
                <Avatar className="h-20 w-20 ring-4 ring-yellow-400 shadow-2xl" hover="animated">
                  <AvatarImage src={first.profileImage || "/placeholder.png"} alt={first.name} />
                  <AvatarFallback className="bg-gradient-to-br from-yellow-200 to-yellow-500 text-yellow-900 font-bold">
                    {first.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mx-auto mb-1 shadow-lg transition-transform duration-300 hover:scale-125 hover:rotate-12">
                1
              </div>
              <p className="font-black text-base max-w-[70px] truncate text-slate-800 dark:text-slate-200">
                {first.name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                {new Intl.NumberFormat().format(first.totalMeters)}m
              </p>
            </div>
          </div>
        )}

        {/* Third Place */}
        {third && (
          <div className="flex flex-col items-center mx-3 z-10 transform hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out">
            <div className="relative mb-2">
              <div className="absolute -top-3 -left-2 z-20 transition-transform duration-300 hover:scale-110 hover:rotate-12">
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-1.5 rounded-full">
                  <Award className="h-4 w-4 text-white" />
                </div>
              </div>
              <Link href={`/profile/${third.id}`}>
                <Avatar className="h-14 w-14 ring-4 ring-orange-300 shadow-xl" hover="animated">
                  <AvatarImage src={third.profileImage || "/placeholder.png"} alt={third.name} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-200 to-orange-500 text-orange-900 font-bold">
                    {third.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs mx-auto mb-1 transition-transform duration-300 hover:scale-125 hover:rotate-12">
                3
              </div>
              <p className="font-bold text-sm max-w-[60px] truncate text-slate-700 dark:text-slate-300">{third.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {new Intl.NumberFormat().format(third.totalMeters)}m
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Podium Base */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-full opacity-60" />
    </div>
  )
}
