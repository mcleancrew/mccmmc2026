import { AnimationShowcase } from "@/components/animation-showcase"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8">
        <AnimationShowcase />
      </div>
    </div>
  )
} 