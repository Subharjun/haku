/**
 * useTrustScore Hook
 * React hook for managing trust score data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TrustScoreService } from '@/utils/trustScoreService';
import { 
  TrustScore, 
  TrustScoreHistory, 
  TrustScoreEventType,
  TrustScoreCalculation,
  TrustScoreTier
} from '@/types/trustScore';

export interface UseTrustScoreResult {
  // Data
  trustScore: TrustScore | null;
  history: TrustScoreHistory[];
  calculation: TrustScoreCalculation | null;
  tier: TrustScoreTier | null;
  
  // Loading states
  loading: boolean;
  calculating: boolean;
  historyLoading: boolean;
  
  // Actions
  refreshTrustScore: () => Promise<void>;
  calculateScore: () => Promise<TrustScoreCalculation | null>;
  recordEvent: (eventType: TrustScoreEventType, eventReferenceId?: string, reason?: string) => Promise<boolean>;
  loadHistory: (limit?: number) => Promise<void>;
  
  // Utilities
  getScoreForUser: (userId: string) => Promise<TrustScore | null>;
  getMultipleScores: (userIds: string[]) => Promise<TrustScore[]>;
  
  // State
  error: string | null;
}

export const useTrustScore = (userId?: string): UseTrustScoreResult => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  // State
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [history, setHistory] = useState<TrustScoreHistory[]>([]);
  const [calculation, setCalculation] = useState<TrustScoreCalculation | null>(null);
  const [tier, setTier] = useState<TrustScoreTier | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load trust score
  const refreshTrustScore = useCallback(async () => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const score = await TrustScoreService.getUserTrustScore(targetUserId);
      setTrustScore(score);
      
      if (score) {
        const tierInfo = TrustScoreService.getTrustScoreTier(score.overall_score);
        setTier(tierInfo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trust score');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  // Calculate score
  const calculateScore = useCallback(async (): Promise<TrustScoreCalculation | null> => {
    if (!targetUserId) return null;

    setCalculating(true);
    setError(null);

    try {
      const calc = await TrustScoreService.calculateTrustScore(targetUserId);
      setCalculation(calc);
      
      // Refresh the trust score after calculation
      await refreshTrustScore();
      
      return calc;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate trust score');
      return null;
    } finally {
      setCalculating(false);
    }
  }, [targetUserId, refreshTrustScore]);

  // Record trust score event
  const recordEvent = useCallback(async (
    eventType: TrustScoreEventType,
    eventReferenceId?: string,
    reason?: string
  ): Promise<boolean> => {
    if (!targetUserId) return false;

    try {
      const success = await TrustScoreService.recordTrustScoreEvent(
        targetUserId,
        eventType,
        eventReferenceId,
        reason
      );
      
      if (success) {
        // Refresh score after recording event
        await refreshTrustScore();
        await loadHistory(10); // Refresh recent history
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record trust score event');
      return false;
    }
  }, [targetUserId, refreshTrustScore]);

  // Load history
  const loadHistory = useCallback(async (limit: number = 10) => {
    if (!targetUserId) return;

    setHistoryLoading(true);
    setError(null);

    try {
      const historyData = await TrustScoreService.getTrustScoreHistory(targetUserId, limit);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trust score history');
    } finally {
      setHistoryLoading(false);
    }
  }, [targetUserId]);

  // Get score for specific user
  const getScoreForUser = useCallback(async (userId: string): Promise<TrustScore | null> => {
    try {
      return await TrustScoreService.getUserTrustScore(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get user trust score');
      return null;
    }
  }, []);

  // Get multiple scores
  const getMultipleScores = useCallback(async (userIds: string[]): Promise<TrustScore[]> => {
    try {
      return await TrustScoreService.getMultipleUserTrustScores(userIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get multiple trust scores');
      return [];
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (targetUserId) {
      refreshTrustScore();
      loadHistory(10);
    }
  }, [targetUserId, refreshTrustScore, loadHistory]);

  return {
    // Data
    trustScore,
    history,
    calculation,
    tier,
    
    // Loading states
    loading,
    calculating,
    historyLoading,
    
    // Actions
    refreshTrustScore,
    calculateScore,
    recordEvent,
    loadHistory,
    
    // Utilities
    getScoreForUser,
    getMultipleScores,
    
    // State
    error
  };
};

// Specialized hook for platform statistics
export const usePlatformTrustStats = () => {
  const [stats, setStats] = useState<{
    averageScore: number;
    totalUsers: number;
    tierDistribution: Record<string, number>;
    scoreDistribution: { range: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const platformStats = await TrustScoreService.getPlatformTrustScoreStats();
      setStats(platformStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
};

// Hook for trust score in loan context
export const useLoanTrustScores = (lenderIds: string[], borrowerIds: string[]) => {
  const [scores, setScores] = useState<Record<string, TrustScore>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScores = useCallback(async () => {
    const allIds = [...lenderIds, ...borrowerIds];
    if (allIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const trustScores = await TrustScoreService.getMultipleUserTrustScores(allIds);
      const scoreMap = trustScores.reduce((acc, score) => {
        acc[score.user_id] = score;
        return acc;
      }, {} as Record<string, TrustScore>);
      
      setScores(scoreMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loan trust scores');
    } finally {
      setLoading(false);
    }
  }, [lenderIds, borrowerIds]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  return {
    scores,
    loading,
    error,
    refresh: loadScores,
    getScore: (userId: string) => scores[userId] || null
  };
};
