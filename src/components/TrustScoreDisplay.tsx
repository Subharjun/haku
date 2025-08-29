/**
 * TrustScoreDisplay Component
 * Displays user trust score with tier badge and optional details
 */

import React, { useState } from 'react';
import { Shield, TrendingUp, Info, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrustScoreDisplayProps, TRUST_SCORE_TIERS } from '@/types/trustScore';
import { TrustScoreBreakdown } from './TrustScoreBreakdown';

export const TrustScoreDisplay: React.FC<TrustScoreDisplayProps> = ({
  score,
  tier,
  size = 'medium',
  showDetails = false,
  animate = true
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const tierInfo = TRUST_SCORE_TIERS[tier];
  
  // Calculate progress within current tier
  const tierProgress = ((score - tierInfo.minScore) / (tierInfo.maxScore - tierInfo.minScore)) * 100;
  
  // Next tier information
  const nextTier = score >= 751 ? null : 
    score >= 601 ? TRUST_SCORE_TIERS.platinum :
    score >= 401 ? TRUST_SCORE_TIERS.gold :
    TRUST_SCORE_TIERS.silver;
  
  const pointsToNextTier = nextTier ? nextTier.minScore - score : 0;

  // Size configurations
  const sizeConfig = {
    small: {
      scoreSize: 'text-lg',
      iconSize: 16,
      badgeSize: 'sm',
      cardPadding: 'p-3'
    },
    medium: {
      scoreSize: 'text-2xl',
      iconSize: 20,
      badgeSize: 'default',
      cardPadding: 'p-4'
    },
    large: {
      scoreSize: 'text-4xl',
      iconSize: 24,
      badgeSize: 'lg',
      cardPadding: 'p-6'
    }
  };

  const config = sizeConfig[size];

  const ScoreDisplay = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${config.scoreSize}`}
          style={{ backgroundColor: tierInfo.color }}
        >
          <Shield size={config.iconSize} />
        </div>
        {animate && (
          <div 
            className="absolute inset-0 rounded-full border-2 animate-pulse"
            style={{ borderColor: tierInfo.color }}
          />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${config.scoreSize}`}>{score}</span>
          <Badge 
            variant="secondary" 
            className="capitalize"
            style={{ backgroundColor: `${tierInfo.color}20`, color: tierInfo.color }}
          >
            {tier}
          </Badge>
        </div>
        
        {size !== 'small' && (
          <div className="text-sm text-muted-foreground">
            {tierInfo.description}
          </div>
        )}
      </div>
      
      {showDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBreakdown(true)}
          className="flex items-center gap-1"
        >
          <Info size={14} />
          Details
        </Button>
      )}
    </div>
  );

  if (size === 'small') {
    return (
      <div className="inline-flex items-center gap-2">
        <ScoreDisplay />
        {showBreakdown && (
          <TrustScoreBreakdown
            score={score}
            tier={tier}
            isOpen={showBreakdown}
            onClose={() => setShowBreakdown(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <Card className={config.cardPadding}>
        <CardContent className="p-0">
          <ScoreDisplay />
          
          {size === 'large' && (
            <div className="mt-4 space-y-3">
              {/* Tier Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress in {tier} tier</span>
                  <span>{Math.round(tierProgress)}%</span>
                </div>
                <Progress value={tierProgress} className="h-2" />
              </div>
              
              {/* Next Tier Info */}
              {nextTier && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">Next: {nextTier.name} tier</div>
                    <div className="text-sm text-muted-foreground">
                      {pointsToNextTier} points to go
                    </div>
                  </div>
                  <TrendingUp size={16} className="text-green-600" />
                </div>
              )}
              
              {/* Quick Benefits */}
              <div>
                <h4 className="font-medium mb-2">Your Benefits</h4>
                <ul className="space-y-1">
                  {tierInfo.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <ChevronRight size={12} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showBreakdown && (
        <TrustScoreBreakdown
          score={score}
          tier={tier}
          isOpen={showBreakdown}
          onClose={() => setShowBreakdown(false)}
        />
      )}
    </>
  );
};
