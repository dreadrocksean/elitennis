import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, firebaseConfigured } from './firebase'
import { defaultContent } from '../data/siteContent'

const CONTENT_REF = () => doc(db, 'site', 'content')

/**
 * Realtime site content. Falls back to defaultContent when Firestore has no
 * document yet (or when env vars are missing during local preview).
 */
export function useSiteContent() {
  const [content, setContent] = useState(defaultContent)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false)
      return
    }
    const unsub = onSnapshot(
      CONTENT_REF(),
      (snap) => {
        if (snap.exists()) {
          // Merge so newly-added default fields still appear if admin doc is partial.
          setContent({ ...defaultContent, ...snap.data() })
        } else {
          setContent(defaultContent)
        }
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  return { content, loading }
}

/** Persist a partial content update (merge). Owner-only via Firestore rules. */
export async function saveSiteContent(partial) {
  await setDoc(CONTENT_REF(), partial, { merge: true })
}
