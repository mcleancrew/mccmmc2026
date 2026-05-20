import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDbL_-yIxKgL_6lu0TOWZpGuF3KeT7iluo",
  authDomain: "mcc-summer-leaderboard.firebaseapp.com",
  projectId: "mcc-summer-leaderboard",
  storageBucket: "mcc-summer-leaderboard.firebasestorage.app",
  messagingSenderId: "376614411221",
  appId: "1:376614411221:web:9afe27edc84cf5de3b7b5c",
  measurementId: "G-SKPNS56ZDN"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app 