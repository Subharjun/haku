/**
 * UserRatingModal Component
 * Modal for rating users after loan completion (Future Implementation)
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Heart, MessageCircle, Shield, Clock } from 'lucide-react';
import { RatingFormData, RatingCategories } from '@/types/trustScore';

interface UserRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: RatingFormData) => Promise<void>;
  userName: string;
  userType: 'lender' | 'borrower';
  loanAmount: number;
  loading?: boolean;
}

export const UserRatingModal: React.FC<UserRatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userName,
  userType,
  loanAmount,
  loading = false
}) => {
  const [overallRating, setOverallRating] = useState(0);
  const [categories, setCategories] = useState<RatingCategories>({
    communication: 0,
    reliability: 0,
    transparency: 0,
    responsiveness: 0,
    professionalism: 0
  });
  const [reviewText, setReviewText] = useState('');

  const categoryLabels = {
    communication: { label: 'Communication', icon: MessageCircle, description: 'Clear and helpful communication' },
    reliability: { label: 'Reliability', icon: Shield, description: 'Dependable and trustworthy' },
    transparency: { label: 'Transparency', icon: Heart, description: 'Honest and upfront' },
    responsiveness: { label: 'Responsiveness', icon: Clock, description: 'Quick to respond and act' },
    professionalism: { label: 'Professionalism', icon: Star, description: 'Professional conduct' }
  };

  const handleCategoryRating = (category: keyof RatingCategories, rating: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    const ratingData: RatingFormData = {
      rating: overallRating,
      review_text: reviewText.trim() || undefined,
      categories
    };

    try {
      await onSubmit(ratingData);
      onClose();
      // Reset form
      setOverallRating(0);
      setCategories({
        communication: 0,
        reliability: 0,
        transparency: 0,
        responsiveness: 0,
        professionalism: 0
      });
      setReviewText('');
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const StarRating = ({ 
    rating, 
    onRatingChange, 
    size = 20 
  }: { 
    rating: number; 
    onRatingChange: (rating: number) => void;
    size?: number;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="transition-colors hover:scale-110"
        >
          <Star
            size={size}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience with {userName} as a {userType}? 
            Your feedback helps build trust in our community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Overall Rating</Label>
            <div className="flex items-center gap-3">
              <StarRating 
                rating={overallRating} 
                onRatingChange={setOverallRating}
                size={24}
              />
              <span className="text-sm text-muted-foreground">
                {overallRating > 0 && (
                  overallRating === 5 ? 'Excellent' :
                  overallRating === 4 ? 'Good' :
                  overallRating === 3 ? 'Average' :
                  overallRating === 2 ? 'Poor' : 'Very Poor'
                )}
              </span>
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Detailed Ratings</Label>
            {Object.entries(categoryLabels).map(([key, { label, icon: Icon, description }]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Icon size={16} className="text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                </div>
                <StarRating
                  rating={categories[key as keyof RatingCategories] || 0}
                  onRatingChange={(rating) => handleCategoryRating(key as keyof RatingCategories, rating)}
                  size={16}
                />
              </div>
            ))}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Additional Comments (Optional)</Label>
            <Textarea
              id="review"
              placeholder={`Share your experience with ${userName}...`}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {reviewText.length}/500 characters
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Skip Rating
          </Button>
          <Button onClick={handleSubmit} disabled={loading || overallRating === 0}>
            {loading ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
