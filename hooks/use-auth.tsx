"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  User as FirebaseUser
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  isGuest: boolean
  isAuthenticated: boolean
  isLoading: boolean
  signUp: (name: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  continueAsGuest: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // User is signed in (no email verification required)
          const userRef = doc(db, "users", firebaseUser.uid)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            const userData = userSnap.data()
            const appUser: User = {
              id: firebaseUser.uid,
              name: userData.username,
              email: firebaseUser.email || ""
            }
            setUser(appUser)
            setIsAuthenticated(true)
            setIsGuest(false)
          } else {
            // User document doesn't exist, sign them out
            await firebaseSignOut(auth)
            setUser(null)
            setIsAuthenticated(false)
            setIsGuest(false)
          }
        } else {
          // User is signed out
          setUser(null)
          setIsAuthenticated(false)
          setIsGuest(false)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        await firebaseSignOut(auth)
        setUser(null)
        setIsAuthenticated(false)
        setIsGuest(false)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (name: string, email: string, password: string) => {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Create user document in Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        username: name,
        email: email,
        activities: [],
        createdAt: new Date()
      })

      // Optionally send email verification (but not required)
      // await sendEmailVerification(firebaseUser)

      // User will be automatically signed in and onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("Signup error:", error)
      throw new Error(error.message || "Signup failed")
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("Signin error:", error)
      throw new Error(error.message || "Signin failed")
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setIsAuthenticated(false)
      setIsGuest(false)
    } catch (error) {
      console.error("Signout error:", error)
    }
  }

  const continueAsGuest = () => {
    setIsGuest(true)
    setIsAuthenticated(true)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isAuthenticated,
        isLoading,
        signUp,
        signIn,
        signOut,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
