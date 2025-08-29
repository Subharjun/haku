/**
 * Trust Score Service
 * Core service for managing user trust scores and reputation
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  TrustScore, 
  TrustScoreHistory, 
  TrustScoreEventType, 
  TrustScoreCalculation,
  TrustScoreTier,
  TRUST_SCORE_TIERS,
  TRUST_SCORE_WEIGHTS
} from '@/types/trustScore';

export class TrustScoreService {
  /**
   * Get user's current trust score
   */
  static async getUserTrustScore(userId: string): Promise<TrustScore | null> {
    try {
      const { data, error } = await supabase
        .from('user_trust_scores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No score exists, initialize one
          await this.initializeUserTrustScore(userId);
          return await this.getUserTrustScore(userId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user trust score:', error);
      return null;
    }
  }

  /**
   * Initialize trust score for a new user
   */
  static async initializeUserTrustScore(userId: string): Promise<TrustScore | null> {
    try {
      const { data, error } = await supabase.rpc('initialize_user_trust_score', {
        user_id: userId
      });

      if (error) throw error;

      return await this.getUserTrustScore(userId);
    } catch (error) {
      console.error('Error initializing user trust score:', error);
      return null;
    }
  }

  /**
   * Calculate and update user's trust score
   */
  static async calculateTrustScore(userId: string): Promise<TrustScoreCalculation | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_trust_score', {
        user_id: userId
      });

      if (error) throw error;
      if (!data) return null;

      // Convert the returned JSONB to our TypeScript interface
      const calculation: TrustScoreCalculation = {
        userId,
        currentScore: data.previous_score || 300,
        newScore: data.overall_score || 300,
        breakdown: {
          repayment: {
            score: data.repayment_score || 0,
            weight: TRUST_SCORE_WEIGHTS.repayment,
            factors: this.getRepaymentFactors(data)
          },
          performance: {
            score: data.performance_score || 0,
            weight: TRUST_SCORE_WEIGHTS.performance,
            factors: this.getPerformanceFactors(data)
          },
          activity: {
            score: data.activity_score || 0,
            weight: TRUST_SCORE_WEIGHTS.activity,
            factors: this.getActivityFactors(data)
          },
          social: {
            score: data.social_score || 0,
            weight: TRUST_SCORE_WEIGHTS.social,
            factors: this.getSocialFactors(data)
          },
          verification: {
            score: data.verification_score || 0,
            weight: TRUST_SCORE_WEIGHTS.verification,
            factors: this.getVerificationFactors(data)
          }
        },
        recommendations: this.generateRecommendations(data)
      };

      return calculation;
    } catch (error) {
      console.error('Error calculating trust score:', error);
      return null;
    }
  }

  /**
   * Record a trust score event
   */
  static async recordTrustScoreEvent(
    userId: string,
    eventType: TrustScoreEventType,
    changeAmount: number,
    changeReason: string,
    eventReferenceId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('record_trust_score_event', {
        user_id: userId,
        event_type: eventType,
        change_amount: changeAmount,
        change_reason: changeReason,
        event_reference_id: eventReferenceId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error recording trust score event:', error);
      return false;
    }
  }

  /**
   * Get user's trust score history
   */
  static async getTrustScoreHistory(
    userId: string, 
    limit: number = 10
  ): Promise<TrustScoreHistory[]> {
    try {
      const { data, error } = await supabase
        .from('trust_score_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trust score history:', error);
      return [];
    }
  }

  /**
   * Get trust score tier information
   */
  static getTrustScoreTier(score: number): TrustScoreTier {
    if (score >= 751) return TRUST_SCORE_TIERS.platinum;
    if (score >= 601) return TRUST_SCORE_TIERS.gold;
    if (score >= 401) return TRUST_SCORE_TIERS.silver;
    return TRUST_SCORE_TIERS.bronze;
  }

  /**
   * Get trust scores for multiple users (for lending decisions)
   */
  static async getMultipleUserTrustScores(userIds: string[]): Promise<TrustScore[]> {
    try {
      const { data, error } = await supabase
        .from('user_trust_scores')
        .select('*')
        .in('user_id', userIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching multiple trust scores:', error);
      return [];
    }
  }

  /**
   * Search users by trust score range (for premium features)
   */
  static async getUsersByTrustScoreRange(
    minScore: number, 
    maxScore: number, 
    limit: number = 20
  ): Promise<TrustScore[]> {
    try {
      const { data, error } = await supabase
        .from('user_trust_scores')
        .select('*')
        .gte('overall_score', minScore)
        .lte('overall_score', maxScore)
        .order('overall_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users by trust score:', error);
      return [];
    }
  }

  /**
   * Get platform trust score statistics
   */
  static async getPlatformTrustScoreStats(): Promise<{
    averageScore: number;
    totalUsers: number;
    tierDistribution: Record<string, number>;
    scoreDistribution: { range: string; count: number }[];
  } | null> {
    try {
      const { data, error } = await supabase
        .from('user_trust_scores')
        .select('overall_score, score_tier');

      if (error) throw error;

      const scores = data || [];
      const averageScore = scores.reduce((sum, user) => sum + user.overall_score, 0) / scores.length;
      
      const tierDistribution = scores.reduce((acc, user) => {
        acc[user.score_tier] = (acc[user.score_tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const scoreDistribution = [
        { range: '0-300', count: scores.filter(u => u.overall_score <= 300).length },
        { range: '301-400', count: scores.filter(u => u.overall_score > 300 && u.overall_score <= 400).length },
        { range: '401-500', count: scores.filter(u => u.overall_score > 400 && u.overall_score <= 500).length },
        { range: '501-600', count: scores.filter(u => u.overall_score > 500 && u.overall_score <= 600).length },
        { range: '601-700', count: scores.filter(u => u.overall_score > 600 && u.overall_score <= 700).length },
        { range: '701-800', count: scores.filter(u => u.overall_score > 700 && u.overall_score <= 800).length },
        { range: '801-850', count: scores.filter(u => u.overall_score > 800).length }
      ];

      return {
        averageScore: Math.round(averageScore),
        totalUsers: scores.length,
        tierDistribution,
        scoreDistribution
      };
    } catch (error) {
      console.error('Error fetching platform trust score stats:', error);
      return null;
    }
  }

  // Helper methods for generating factor explanations

  private static getRepaymentFactors(data: any): string[] {
    const factors: string[] = [];
    
    if (data.total_loans === 0) {
      factors.push('No loan history yet');
    } else {
      if (data.completed_loans > 0) {
        factors.push(`${data.completed_loans} successful loan(s) completed`);
      }
      if (data.defaulted_loans === 0) {
        factors.push('No loan defaults');
      } else {
        factors.push(`${data.defaulted_loans} loan default(s)`);
      }
    }
    
    return factors;
  }

  private static getPerformanceFactors(data: any): string[] {
    const factors: string[] = [];
    
    if (data.total_loans > 0) {
      const successRate = Math.round((data.completed_loans / data.total_loans) * 100);
      factors.push(`${successRate}% loan success rate`);
      
      if (data.total_loans >= 5) {
        factors.push('Consistent platform activity');
      }
    } else {
      factors.push('No performance history');
    }
    
    return factors;
  }

  private static getActivityFactors(data: any): string[] {
    const factors: string[] = [];
    
    if (data.total_loans >= 10) {
      factors.push('Very active platform user');
    } else if (data.total_loans >= 5) {
      factors.push('Regular platform user');
    } else if (data.total_loans >= 1) {
      factors.push('Beginning platform user');
    } else {
      factors.push('New to platform');
    }
    
    return factors;
  }

  private static getSocialFactors(data: any): string[] {
    const factors: string[] = [];
    
    if (data.total_ratings > 0) {
      factors.push(`${data.avg_rating.toFixed(1)}/5.0 average rating`);
      factors.push(`${data.total_ratings} rating(s) received`);
      
      if (data.avg_rating >= 4.5) {
        factors.push('Highly rated by peers');
      } else if (data.avg_rating >= 4.0) {
        factors.push('Well regarded by community');
      }
    } else {
      factors.push('No community ratings yet');
    }
    
    return factors;
  }

  private static getVerificationFactors(data: any): string[] {
    const factors: string[] = [];
    
    if (data.verified_count >= 4) {
      factors.push('Fully verified profile');
    } else if (data.verified_count >= 2) {
      factors.push('Partially verified profile');
    } else if (data.verified_count >= 1) {
      factors.push('Basic verification completed');
    } else {
      factors.push('No verification completed');
    }
    
    return factors;
  }

  private static generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    
    // Repayment recommendations
    if (data.total_loans === 0) {
      recommendations.push('Complete your first loan to start building trust');
    } else if (data.defaulted_loans > 0) {
      recommendations.push('Focus on timely repayments to improve your score');
    }
    
    // Social recommendations
    if (data.total_ratings < 3) {
      recommendations.push('Encourage lenders/borrowers to rate your transactions');
    } else if (data.avg_rating < 4.0) {
      recommendations.push('Improve communication and reliability to get better ratings');
    }
    
    // Verification recommendations
    if (data.verified_count < 2) {
      recommendations.push('Complete identity and bank verification for score boost');
    }
    
    // Activity recommendations
    if (data.total_loans < 5) {
      recommendations.push('Stay active on the platform to improve your activity score');
    }
    
    return recommendations;
  }
}
