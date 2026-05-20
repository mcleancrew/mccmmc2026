"use client"

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { useUserData } from "@/hooks/use-user-data"

interface UserProgressChartProps {
  userId?: string
  workoutType?: string
}

export function UserProgressChart({ userId, workoutType }: UserProgressChartProps) {
  const { progressData } = useUserData(userId, workoutType)

  if (!progressData || progressData.length === 0) {
    return <div>Loading chart data...</div>
  }

  const maxMeters = Math.max(...progressData.map((d) => d.meters))
  const yAxisMax = Math.max(20000, Math.ceil(maxMeters * 1.1))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">
            {new Intl.NumberFormat().format(payload[0].value)} meters
          </p>
        </div>
      )
    }
    return null
  }

  const formatYAxisTick = (value: number) => {
    return `${Math.round(value / 1000)}k`
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={progressData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            domain={[0, yAxisMax]} 
            tickFormatter={formatYAxisTick}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="meters" name="Daily Meters" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
