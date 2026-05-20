"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Zap, Star, Heart, Target, Award, User, Users, TrendingUp } from "lucide-react"

export function AnimationShowcase() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Interactive Elements</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Hover over the elements below to see the scale and rotation animations in action!
        </p>
      </div>

      {/* Button Animations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Button Animations</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">
            <Zap className="h-4 w-4" />
            Default Scale & Rotate
          </Button>
          <Button variant="animated">
            <Star className="h-4 w-4" />
            Animated Gradient
          </Button>
          <Button variant="bounce">
            <Heart className="h-4 w-4" />
            Bounce Effect
          </Button>
          <Button variant="rotate">
            <Target className="h-4 w-4" />
            Rotate Effect
          </Button>
          <Button variant="outline">
            <Award className="h-4 w-4" />
            Outline Style
          </Button>
        </div>
      </div>

      {/* Badge Animations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Badge Animations</h3>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default Badge</Badge>
          <Badge variant="secondary">Secondary Badge</Badge>
          <Badge variant="destructive">Destructive Badge</Badge>
          <Badge variant="outline">Outline Badge</Badge>
          <Badge variant="animated">Animated Badge</Badge>
          <Badge variant="bounce">Bounce Badge</Badge>
        </div>
      </div>

      {/* Avatar Animations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Avatar Animations</h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar hover="scale">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="text-xs">Scale</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar hover="rotate">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="text-xs">Rotate</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar hover="bounce">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="text-xs">Bounce</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar hover="animated">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="text-xs">Animated</span>
          </div>
        </div>
      </div>

      {/* Card Animations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Card Animations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card hover="scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Scale Effect
              </CardTitle>
              <CardDescription>
                Hover to see a subtle scale and shadow effect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This card scales up slightly and adds a shadow on hover.
              </p>
            </CardContent>
          </Card>

          <Card hover="rotate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Rotate Effect
              </CardTitle>
              <CardDescription>
                Hover to see a gentle rotation effect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This card rotates slightly and scales up on hover.
              </p>
            </CardContent>
          </Card>

          <Card hover="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                Lift Effect
              </CardTitle>
              <CardDescription>
                Hover to see the card lift up with enhanced shadow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This card lifts up and gets a larger shadow on hover.
              </p>
            </CardContent>
          </Card>

          <Card hover="bounce">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Bounce Effect
              </CardTitle>
              <CardDescription>
                Hover to see a playful bounce animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This card bounces up with a spring-like animation.
              </p>
            </CardContent>
          </Card>

          <Card hover="animated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Animated Effect
              </CardTitle>
              <CardDescription>
                Hover to see a dramatic scale and rotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This card has the most dramatic hover effect.
              </p>
            </CardContent>
          </Card>

          <Card hover="none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                No Animation
              </CardTitle>
              <CardDescription>
                This card has no hover animation for comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This card remains static to show the difference.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Elements Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Animation Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Scale Effects</h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Subtle scale (105%) for gentle feedback</li>
              <li>• Medium scale (110%) for more impact</li>
              <li>• Dramatic scale (125%) for special elements</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Rotation Effects</h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Gentle rotation (1-2°) for subtle movement</li>
              <li>• Medium rotation (3-6°) for playful effects</li>
              <li>• Dramatic rotation (12°) for icons and badges</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation Demo */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Navigation Demo</h3>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
          <div className="flex items-center justify-around bg-slate-100 dark:bg-slate-800 rounded-lg h-16 px-4">
            <div className="flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
              <User className="h-5 w-5 transition-transform duration-300 hover:scale-125" />
              <span className="text-xs mt-1 transition-transform duration-300 hover:scale-110">Profile</span>
            </div>
            <div className="flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
              <Users className="h-5 w-5 transition-transform duration-300 hover:scale-125" />
              <span className="text-xs mt-1 transition-transform duration-300 hover:scale-110">Team</span>
            </div>
            <div className="flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
              <TrendingUp className="h-5 w-5 transition-transform duration-300 hover:scale-125" />
              <span className="text-xs mt-1 transition-transform duration-300 hover:scale-110">Stats</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 