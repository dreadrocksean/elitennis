// ─────────────────────────────────────────────────────────────────────────
// Default site content. These values seed Firestore (collection `site`,
// doc `content`) the first time the admin saves, and act as a fallback if
// Firestore is empty. Edit copy here OR live from the /admin panel.
// ─────────────────────────────────────────────────────────────────────────

export const CONTACT = {
  brand: 'EliTennisKC',
  website: 'EliTennisKC.com',
  phone: '(913) 603-3735',
  phoneHref: 'tel:+19136033735',
  email: 'adrian@bartholomusic.com',
  location: 'Kansas City Metro',
}

export const defaultContent = {
  hero: {
    badge: 'Kids & Adults · Kansas City',
    title: 'Private Tennis Lessons',
    subtitle:
      'Build a rock-solid foundation on the court. Clean technique, smart footwork, and the mental focus to play confident tennis.',
    ctaPrimary: 'Book a Session',
    ctaSecondary: 'Meet Coach Eli',
  },

  bio: {
    name: 'Meet Coach Eli',
    paragraphs: [
      "Hey, I’m Eli. I help tennis players here in Kansas City build a rock-solid foundation on the court. My coaching centers on mastering the fundamentals—the clean technique, smart footwork, and mental focus you need to play confident tennis.",
      "My background comes from years of high-level competition. I spent four years as our team's #1 varsity player and captain, won back-to-back regional titles, and placed 4th in the state for singles while leading our team to a State Championship victory. I know exactly what it’s like to play under pressure, and I use that experience to help my students get to the next level.",
      "Whether you're picking up a racket for the first time, an adult looking to improve your game, or a high school player getting ready to lock in for the upcoming season, we’ll tailor our lessons to get you exactly where you want to be.",
    ],
    highlights: [
      {
        title: 'Experienced Coach',
        body: '8 years of competitive play and private instruction experience.',
      },
      {
        title: 'Fundamentals Expert',
        body: 'Passionate about building proper mechanics, footwork, and a strong mental game from day one.',
      },
      {
        title: 'Results-Driven',
        body: "Every session is customized to the student's age, skill level, and personal athletic goals.",
      },
    ],
  },

  stats: [
    { value: '#1', label: 'Varsity Singles & Captain' },
    { value: '2×', label: 'Back-to-Back Regional Titles' },
    { value: '4th', label: 'State — Singles' },
    { value: 'State', label: 'Team Champions' },
  ],

  pricing: {
    title: 'Single Session',
    price: '$40',
    unit: '/ hour',
    note: 'One-on-one, fully customized to your goals. Pay securely online when you book.',
    perks: [
      'Personalized 60-minute private lesson',
      'Stroke mechanics, footwork & strategy',
      'All skill levels — first-timers to varsity',
      'Flexible scheduling around your week',
    ],
  },

  // Gallery + testimonials live in Firestore and are editable from /admin.
  // These arrays are the initial seed.
  gallery: [
    { id: 'g1', src: '/images/court-1.jpg', alt: 'Eli mid-rally on a match court', caption: 'In the point' },
    { id: 'g2', src: '/images/court-2.jpg', alt: 'Eli in the ready position', caption: 'Always ready' },
    { id: 'g3', src: '/images/court-3.jpg', alt: 'Eli focused between points', caption: 'Locked in' },
    { id: 'g4', src: '/images/court-4.jpg', alt: 'Eli with the KSHSAA State Champion trophy', caption: '2024 State Champions' },
  ],

  testimonials: [
    {
      id: 't1',
      name: 'Sarah M.',
      role: 'Parent of a junior player',
      quote:
        "Eli completely rebuilt my son's serve in a month. The improvement in his confidence on the court has been incredible.",
      rating: 5,
    },
    {
      id: 't2',
      name: 'David R.',
      role: 'Adult beginner',
      quote:
        'Picked up a racket for the first time at 41. Eli is patient, clear, and makes every lesson fun. Highly recommend.',
      rating: 5,
    },
    {
      id: 't3',
      name: 'Coach Lindgren',
      role: 'High school program',
      quote:
        'Fundamentals-obsessed in the best way. Our varsity players who trained with Eli came back sharper every season.',
      rating: 5,
    },
  ],
}

// The booking product — used to build the Stripe Checkout session.
export const LESSON_PRODUCT = {
  name: '60-Minute Private Tennis Lesson',
  amount: 4000, // in cents = $40.00
  currency: 'usd',
  durationMinutes: 60,
}
