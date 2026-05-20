import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyD5v_KqCntEDZxOjbXjjXiSwdy3vnv6jrY",
  authDomain: "lb26-mcc.firebaseapp.com",
  projectId: "lb26-mcc",
  storageBucket: "lb26-mcc.firebasestorage.app",
  messagingSenderId: "949740533969",
  appId: "1:949740533969:web:0ae1045893bb3d46a26df0",
  measurementId: "G-JG46Y1N9YM"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app 