"use client"

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { useTeamData } from "@/hooks/use-team-data"
import React, { useState } from "react"

export function TeamProgressChart() {
  const { progressData } = useTeamData()
  const [fullscreen, setFullscreen] = useState(false)

  if (!progressData || progressData.length === 0) {
    return <div>Loading chart data...</div>
  }

  const maxMeters = Math.max(...progressData.map((d) => d.meters))
  const yAxisMax = Math.max(10000, Math.ceil(maxMeters * 1.1))

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

  // Chart rendering as a function for reuse
  const renderChart = (height = 300) => (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={progressData} margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            domain={[0, yAxisMax]} 
            width={42}
            tick={({ x, y, payload }) => {
              if (payload.value === 0) return <g />;
              return (
                <text x={x} y={y} textAnchor="end" fontSize={12} fill="#555" dy={4}>
                  {formatYAxisTick(payload.value)}
                </text>
              );
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="meters" name="Daily Team Meters" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <div className="relative">
      {/* Fullscreen button */}
      <button
        className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Fullscreen graph"
        onClick={() => setFullscreen(true)}
        type="button"
      >
        {/* Fullscreen SVG icon, slightly larger, neutral color */}
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" />
        </svg>
      </button>
      {renderChart(300)}
      {/* Fullscreen Modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full h-full md:w-5/6 md:h-5/6 flex flex-col">
            <button
              className="absolute top-4 right-4 z-10 p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
              aria-label="Close fullscreen"
              onClick={() => setFullscreen(false)}
              type="button"
            >
              {/* Close (X) icon */}
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1 flex items-center justify-center p-2">
              {renderChart(600)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
