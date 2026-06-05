export const PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    price: 0,
    currency: 'INR',
    duration_days: null,
    features: [
      '3 full mock tests',
      'Basic analytics',
      'PYQ practice (limited)'
    ]
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 99900, // paise (₹999)
    currency: 'INR',
    duration_days: 365,
    razorpay_plan_id: null,
    features: [
      'Unlimited mock tests',
      'Full analytics + SWOT report',
      'Complete PYQ bank 2000–2025',
      'Adaptive test engine',
      'Leaderboard access'
    ]
  },
  ELITE: {
    id: 'ELITE',
    name: 'Elite',
    price: 179900, // paise (₹1799)
    currency: 'INR',
    duration_days: 365,
    features: [
      'Everything in Pro',
      'Coaching centre dashboard',
      'Priority doubt support',
      'Topper comparison reports',
      'WhatsApp result notifications'
    ]
  }
};
