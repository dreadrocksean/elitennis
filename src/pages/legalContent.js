// Plain content for the legal pages. Reasonable boilerplate accurate to what the
// app actually does — have a lawyer review before relying on it.
export const LAST_UPDATED = 'June 30, 2026';

export const PRIVACY = {
  title: 'Privacy Policy',
  sections: [
    {
      heading: 'Information we collect',
      body: 'When you book a lesson we collect the name, email, and phone number you provide, plus your booking details (date, time, and any notes). Payment card details are entered directly with our payment processor (Stripe) and are never stored on our servers.',
    },
    {
      heading: 'How we use it',
      body: 'We use your information solely to schedule and manage your lessons, process payment, and send booking confirmations, reminders, and cancellation notices. We do not sell or rent your personal information to anyone.',
    },
    {
      heading: 'Service providers',
      body: 'We share the minimum necessary information with trusted providers that run the site: Stripe (payments), Google Firebase (booking database and hosting of images), and Resend (transactional email). Each processes data only to provide their service.',
    },
    {
      heading: 'Data retention',
      body: 'Booking records are kept as long as needed to run the business and meet tax and accounting obligations. You may ask us to delete your booking information at any time using the contact details below.',
    },
    {
      heading: 'Your choices',
      body: 'You can cancel a booking from the link in your confirmation email, and you can contact us to access or delete the information we hold about you. Confirmation and reminder emails are tied to an active booking and are not marketing.',
    },
    {
      heading: 'Contact',
      body: 'Questions about your privacy? Reach out any time — contact details are in the site footer.',
    },
  ],
};

export const TERMS = {
  title: 'Terms of Service',
  sections: [
    {
      heading: 'Booking and payment',
      body: 'Lessons are 60-minute private sessions with Coach Eli. Payment is made in full at the time of booking through Stripe. Your slot is confirmed once payment is received.',
    },
    {
      heading: 'Cancellations and refunds',
      body: 'You may cancel from the link in your confirmation email. Cancellations made more than 24 hours before the lesson are refunded automatically. Cancellations within 24 hours free the slot but are refunded at Coach Eli’s discretion. Missed sessions without notice are non-refundable.',
    },
    {
      heading: 'Rescheduling',
      body: 'Need a different time? Cancel and rebook, or contact us and we’ll do our best to accommodate a change based on availability.',
    },
    {
      heading: 'Conduct and safety',
      body: 'Please arrive on time and ready to play. Lessons may be paused or ended for unsafe behavior or weather. We are not liable for injury arising from ordinary participation in tennis; play within your abilities.',
    },
    {
      heading: 'Changes and contact',
      body: 'We may update these terms from time to time; the latest version always lives on this page. Questions? Contact details are in the site footer.',
    },
  ],
};
