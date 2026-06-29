import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth'
import { auth, OWNER_EMAIL } from '../lib/firebase'

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

  // Owner = authenticated AND matches the configured owner email.
  const isOwner = Boolean(
    user && OWNER_EMAIL && user.email?.toLowerCase() === OWNER_EMAIL
  )

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => fbSignOut(auth)

  return (
    <AuthContext.Provider value={{ user, isOwner, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
