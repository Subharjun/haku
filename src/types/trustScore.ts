/**
 * TypeScript types for Trust Score & Reputation System
 */

export interface TrustScore {
  id: string;
  user_id: string | null;
  overall_score: number | null;
  repayment_score: number | null;
  performance_score: number | null;
  activity_score: number | null;
  social_score: number | null;
  verification_score: number | null;
  base_score: number | null;
  community_rating_score: number | null;
  loan_performance_score: number | null;
  payment_history_score: number | null;
  total_score: number | null;
  score_level: string | null;
  score_tier: string | null;
  last_calculated_at: string | null;
  last_updated: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TrustScoreHistory {
  id: string;
  user_id: string | null;
  previous_score: number | null;
  new_score: number | null;
  old_score: number | null;
  change_amount: number | null;
  change_reason: string | null;
  event_type: string | null;
  event_reference_id: string | null;
  created_at: string | null;
}

export interface TrustScoreBreakdown {
  overall_score: number;
  repayment_score: number;
  performance_score: number;
  activity_score: number;
  social_score: number;
  verification_score: number;
  score_tier: string;
}

export type TrustScoreEventType = 
  | 'loan_completed'
  | 'loan_defaulted'
  | 'payment_made'
  | 'payment_late'
  | 'rating_received'
  | 'verification_completed'
  | 'score_recalculation'
  | 'achievement_earned'
  | 'profile_updated';

export interface UserRating {
  id: string;
  loan_agreement_id: string;
  rater_user_id: string;
  rated_user_id: string;
  rating: number; // 1-5 stars
  review_text?: string;
  rating_categories: RatingCategories;
  rating_type: 'lender_to_borrower' | 'borrower_to_lender';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatingCategories {
  communication?: number;
  reliability?: number;
  transparency?: number;
  responsiveness?: number;
  professionalism?: number;
}

export interface UserVerificationRecord {
  id: string;
  user_id: string;
  verification_type: VerificationType;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  verification_data: Record<string, any>;
  document_url?: string;
  verified_at?: string;
  expires_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export type VerificationType = 
  | 'phone'
  | 'email'
  | 'identity'
  | 'bank_account'
  | 'income'
  | 'address'
  | 'employment';

export interface TrustScoreAchievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  achievement_name: string;
  achievement_description: string;
  score_bonus: number;
  badge_icon: string;
  earned_at: string;
}

export type AchievementType =
  | 'first_loan'
  | 'perfect_repayment'
  | 'highly_rated'
  | 'verified_user'
  | 'community_helper'
  | 'consistent_lender'
  | 'reliable_borrower'
  | 'early_adopter'
  | 'platform_advocate';

export interface TrustScoreTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  minScore: number;
  maxScore: number;
  color: string;
  benefits: string[];
  description: string;
}

export interface TrustScoreCalculation {
  userId: string;
  currentScore: number;
  newScore: number;
  breakdown: {
    repayment: {
      score: number;
      weight: number;
      factors: string[];
    };
    performance: {
      score: number;
      weight: number;
      factors: string[];
    };
    activity: {
      score: number;
      weight: number;
      factors: string[];
    };
    social: {
      score: number;
      weight: number;
      factors: string[];
    };
    verification: {
      score: number;
      weight: number;
      factors: string[];
    };
  };
  recommendations: string[];
}

export interface TrustScoreDisplayProps {
  score: number;
  tier: TrustScoreTier['name'];
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  animate?: boolean;
}

export interface RatingFormData {
  rating: number;
  review_text?: string;
  categories: RatingCategories;
}

export interface VerificationUpload {
  type: VerificationType;
  file?: File;
  data: Record<string, any>;
  description?: string;
}

// Constants
export const TRUST_SCORE_TIERS: Record<TrustScoreTier['name'], TrustScoreTier> = {
  bronze: {
    name: 'bronze',
    minScore: 0,
    maxScore: 400,
    color: '#CD7F32',
    benefits: [
      'Basic platform access',
      'Standard loan terms',
      'Community support'
    ],
    description: 'New to the platform or building trust'
  },
  silver: {
    name: 'silver',
    minScore: 401,
    maxScore: 600,
    color: '#C0C0C0',
    benefits: [
      'Better loan visibility',
      'Slightly improved rates',
      'Priority support',
      'Enhanced profile features'
    ],
    description: 'Established user with good track record'
  },
  gold: {
    name: 'gold',
    minScore: 601,
    maxScore: 750,
    color: '#FFD700',
    benefits: [
      'Premium loan matching',
      'Preferential interest rates',
      'Advanced analytics',
      'Exclusive features',
      'Fast-track verification'
    ],
    description: 'Highly trusted community member'
  },
  platinum: {
    name: 'platinum',
    minScore: 751,
    maxScore: 850,
    color: '#E5E4E2',
    benefits: [
      'Elite loan opportunities',
      'Best available rates',
      'Personal account manager',
      'Beta feature access',
      'Community leadership role',
      'Custom loan terms'
    ],
    description: 'Top-tier user with exceptional reputation'
  }
};

export const TRUST_SCORE_WEIGHTS = {
  repayment: 0.40,      // 40% - Most important
  performance: 0.20,    // 20% - Loan success rate
  activity: 0.10,       // 10% - Platform engagement
  social: 0.15,         // 15% - Community ratings
  verification: 0.05,   // 5% - Identity/financial verification
  base: 0.10           // 10% - Base score component
};

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, {
  name: string;
  description: string;
  icon: string;
  scoreBonus: number;
  criteria: string;
}> = {
  first_loan: {
    name: 'First Steps',
    description: 'Completed your first loan transaction',
    icon: '🎯',
    scoreBonus: 10,
    criteria: 'Complete first loan as borrower or lender'
  },
  perfect_repayment: {
    name: 'Perfect Record',
    description: 'Maintained 100% on-time payment record',
    icon: '💎',
    scoreBonus: 25,
    criteria: '10+ payments, all on time'
  },
  highly_rated: {
    name: 'Community Favorite',
    description: 'Received consistently high ratings',
    icon: '⭐',
    scoreBonus: 15,
    criteria: 'Average rating 4.5+ with 5+ reviews'
  },
  verified_user: {
    name: 'Verified Member',
    description: 'Completed comprehensive verification',
    icon: '✅',
    scoreBonus: 20,
    criteria: 'Complete identity, phone, and bank verification'
  },
  community_helper: {
    name: 'Community Helper',
    description: 'Active in helping other platform users',
    icon: '🤝',
    scoreBonus: 12,
    criteria: 'High engagement in community features'
  },
  consistent_lender: {
    name: 'Reliable Lender',
    description: 'Consistently provides loans to borrowers',
    icon: '🏦',
    scoreBonus: 18,
    criteria: '5+ loans as lender with good success rate'
  },
  reliable_borrower: {
    name: 'Trustworthy Borrower',
    description: 'Proven track record as a borrower',
    icon: '👤',
    scoreBonus: 18,
    criteria: '3+ completed loans as borrower, no defaults'
  },
  early_adopter: {
    name: 'Early Adopter',
    description: 'One of the first users on the platform',
    icon: '🚀',
    scoreBonus: 8,
    criteria: 'Joined during beta or early launch period'
  },
  platform_advocate: {
    name: 'Platform Advocate',
    description: 'Referred multiple successful users',
    icon: '📢',
    scoreBonus: 15,
    criteria: 'Successful referrals with good activity'
  }
};
