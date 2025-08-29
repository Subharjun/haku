/**
 * TrustScoreBreakdown Component
 * Detailed modal showing trust score calculation breakdown
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Shield, 
  Activity,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { 
  TRUST_SCORE_TIERS, 
  TRUST_SCORE_WEIGHTS,
  TrustScoreTier 
} from '@/types/trustScore';

interface TrustScoreBreakdownProps {
  score: number;
  tier: TrustScoreTier['name'];
  isOpen: boolean;
  onClose: () => void;
  breakdown?: {
    repayment_score: number;
    performance_score: number;
    activity_score: number;
    social_score: number;
    verification_score: number;
  };
  recommendations?: string[];
}

export const TrustScoreBreakdown: React.FC<TrustScoreBreakdownProps> = ({
  score,
  tier,
  isOpen,
  onClose,
  breakdown,
  recommendations = []
}) => {
  const tierInfo = TRUST_SCORE_TIERS[tier];

  // Default breakdown if not provided
  const defaultBreakdown = {
    repayment_score: Math.round(score * 0.4),
    performance_score: Math.round(score * 0.2),
    activity_score: Math.round(score * 0.1),
    social_score: Math.round(score * 0.15),
    verification_score: Math.round(score * 0.05)
  };

  const scoreBreakdown = breakdown || defaultBreakdown;

  const components = [
    {
      name: 'Repayment History',
      score: scoreBreakdown.repayment_score,
      maxScore: 400,
      weight: TRUST_SCORE_WEIGHTS.repayment,
      icon: CreditCard,
      color: '#10B981',
      description: 'On-time payments and loan completion record',
      factors: [
        'Payment timeliness',
        'Loan completion rate',
        'Default history',
        'Early payment bonus'
      ]
    },
    {
      name: 'Loan Performance',
      score: scoreBreakdown.performance_score,
      maxScore: 350,
      weight: TRUST_SCORE_WEIGHTS.performance,
      icon: TrendingUp,
      color: '#3B82F6',
      description: 'Overall success rate and loan management',
      factors: [
        'Successful loan ratio',
        'Loan duration consistency',
        'Amount reliability',
        'Platform experience'
      ]
    },
    {
      name: 'Platform Activity',
      score: scoreBreakdown.activity_score,
      maxScore: 325,
      weight: TRUST_SCORE_WEIGHTS.activity,
      icon: Activity,
      color: '#8B5CF6',
      description: 'Engagement and platform usage',
      factors: [
        'Account age',
        'Profile completeness',
        'Regular activity',
        'Feature usage'
      ]
    },
    {
      name: 'Social Rating',
      score: scoreBreakdown.social_score,
      maxScore: 337,
      weight: TRUST_SCORE_WEIGHTS.social,
      icon: Users,
      color: '#F59E0B',
      description: 'Community ratings and reviews',
      factors: [
        'Average user rating',
        'Number of reviews',
        'Communication quality',
        'Community engagement'
      ]
    },
    {
      name: 'Verification Status',
      score: scoreBreakdown.verification_score,
      maxScore: 312,
      weight: TRUST_SCORE_WEIGHTS.verification,
      icon: Shield,
      color: '#EF4444',
      description: 'Identity and financial verification',
      factors: [
        'Identity verification',
        'Bank account verification',
        'Phone verification',
        'Document verification'
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: tierInfo.color }}
            >
              <Shield size={16} />
            </div>
            Trust Score Breakdown
            <Badge 
              variant="secondary"
              className="capitalize"
              style={{ backgroundColor: `${tierInfo.color}20`, color: tierInfo.color }}
            >
              {tier}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of your {score}-point trust score and how it's calculated
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Score Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Trust Score</span>
                <span className="text-3xl font-bold">{score}/850</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress value={(score / 850) * 100} className="h-3" />
                <div className="text-sm text-muted-foreground">
                  {tierInfo.description}
                </div>
                
                {/* Tier Benefits */}
                <div>
                  <h4 className="font-medium mb-2">Your Current Benefits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tierInfo.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <ChevronRight size={12} />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Components */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {components.map((component, index) => {
              const percentage = (component.score / component.maxScore) * 100;
              const Icon = component.icon;
              
              return (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon size={18} style={{ color: component.color }} />
                      {component.name}
                      <Badge variant="outline" className="ml-auto">
                        {Math.round(component.weight * 100)}%
                      </Badge>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {component.description}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{component.score}/{component.maxScore}</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      
                      {/* Factors */}
                      <div className="space-y-1">
                        {component.factors.map((factor, factorIndex) => (
                          <div key={factorIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div 
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: component.color }}
                            />
                            {factor}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-blue-600" />
                  Recommendations to Improve Your Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-sm">
                        {recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tier Progression */}
          <Card>
            <CardHeader>
              <CardTitle>Tier Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(TRUST_SCORE_TIERS).map(([tierName, tierData]) => {
                  const isCurrentTier = tierName === tier;
                  const isAchieved = score >= tierData.minScore;
                  
                  return (
                    <div 
                      key={tierName}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isCurrentTier ? 'bg-blue-50 border-2 border-blue-200' : 
                        isAchieved ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          isAchieved ? '' : 'opacity-50'
                        }`}
                        style={{ backgroundColor: tierData.color }}
                      >
                        {tierName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium capitalize">{tierName}</div>
                        <div className="text-sm text-muted-foreground">
                          {tierData.minScore} - {tierData.maxScore} points
                        </div>
                      </div>
                      {isCurrentTier && (
                        <Badge variant="default">Current</Badge>
                      )}
                      {isAchieved && !isCurrentTier && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Achieved
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
