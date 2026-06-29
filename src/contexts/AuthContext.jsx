import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification,
} from 'firebase/auth'
import { auth, OWNER_EMAILS } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  // Owner = authenticated AND email is in the configured owner list.
  const isOwner = Boolean(
    user && user.email && OWNER_EMAILS.includes(user.email.toLowerCase())
  )

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => fbSignOut(auth)

  // Send the signed-in user a verification email (required before admin writes,
  // since the Firestore rules check email_verified).
  const sendVerification = () => sendEmailVerification(auth.currentUser)

  return (
    <AuthContext.Provider value={{ user, isOwner, loading, login, logout, sendVerification }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
