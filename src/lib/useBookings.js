import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  deleteDoc,
  where,
} from 'firebase/firestore'
import { db, firebaseConfigured } from './firebase'

/**
 * Availability is stored as a weekly recurring template plus per-day overrides.
 *   site/availability => {
 *     weekly: { 0:[], 1:['16:00','17:00'], ... },  // 0=Sun .. 6=Sat, 24h "HH:mm"
 *     blackouts: ['2026-07-04', ...],               // dates fully unavailable
 *     leadHours: 12,                                // min notice before a slot
 *   }
 */
export function useAvailability() {
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false)
      return
    }
    const unsub = onSnapshot(doc(db, 'site', 'availability'), (snap) => {
      setAvailability(snap.exists() ? snap.data() : defaultAvailability)
      setLoading(false)
    })
    return unsub
  }, [])

  return { availability: availability || defaultAvailability, loading }
}

export const defaultAvailability = {
  weekly: {
    0: [],
    1: ['16:00', '17:00', '18:00'],
    2: ['16:00', '17:00', '18:00'],
    3: ['16:00', '17:00', '18:00'],
    4: ['16:00', '17:00', '18:00'],
    5: ['15:00', '16:00', '17:00'],
    6: ['09:00', '10:00', '11:00', '12:00'],
  },
  blackouts: [],
  leadHours: 12,
}

export async function saveAvailability(data) {
  await setDoc(doc(db, 'site', 'availability'), data, { merge: true })
}

/**
 * Confirmed/pending bookings. A booking doc id is `${date}_${time}` so a slot
 * can only be taken once (Firestore create is atomic on the doc id).
 *   bookings/{YYYY-MM-DD_HH:mm} => { date, time, status, name, email, ... }
 */
export function useBookings(monthFilter) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false)
      return
    }
    let q = collection(db, 'bookings')
    if (monthFilter) {
      // monthFilter = 'YYYY-MM'; range query on the date string field.
      q = query(
        collection(db, 'bookings'),
        where('date', '>=', `${monthFilter}-01`),
        where('date', '<=', `${monthFilter}-31`)
      )
    }
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [monthFilter])

  return { bookings, loading }
}

export const slotId = (date, time) => `${date}_${time}`

/** Create a pending hold for a slot. Throws if the slot already exists. */
export async function createPendingBooking({ date, time, name, email, phone, notes }) {
  const id = slotId(date, time)
  // setDoc with merge:false would overwrite; we want fail-if-exists semantics,
  // enforced by Firestore rules (allow create only if !exists). The client
  // optimistically writes; the Cloud Function finalizes after payment.
  await setDoc(doc(db, 'bookings', id), {
    date,
    time,
    name,
    email,
    phone: phone || '',
    notes: notes || '',
    status: 'pending',
    amount: 4000,
    createdAt: new Date().toISOString(),
  })
  return id
}

export async function deleteBooking(id) {
  await deleteDoc(doc(db, 'bookings', id))
}
