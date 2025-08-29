import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Clock, Wand2 } from "lucide-react";
import { formatCurrency } from "@/utils/currency";

interface RequestLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestLoanModal = ({ open, onOpenChange }: RequestLoanModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '',
    interestRate: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a loan request.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Validate required fields
      if (!formData.amount || !formData.purpose || !formData.duration) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Validate amount is a positive number
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid loan amount.",
          variant: "destructive",
        });
        return;
      }

      // Validate duration is a positive integer
      const duration = parseInt(formData.duration);
      if (isNaN(duration) || duration <= 0) {
        toast({
          title: "Invalid Duration",
          description: "Please enter a valid duration in months.",
          variant: "destructive",
        });
        return;
      }

      // Parse interest rate (optional)
      const interestRate = formData.interestRate ? parseFloat(formData.interestRate) : 0;      // Create loan request with correct schema (lender_id can be null)
      const insertData = {
        borrower_id: user.id,
        borrower_name: user.name || user.email || 'Unknown User',
        borrower_email: user.email || '',
        lender_id: null, // No lender yet - this is a loan request
        amount: amount,
        purpose: formData.purpose,
        duration_months: duration,
        interest_rate: interestRate,
        conditions: formData.description || '',
        status: 'pending' as const
      };

      const { data, error } = await supabase
        .from('loan_agreements')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to create loan request: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database');
      }

      // Success
      toast({
        title: "Loan Request Created! 🎉",
        description: `Your loan request for ${formatCurrency(amount)} has been created successfully.`,
      });

      // Reset form and close modal
      setFormData({
        amount: '',
        purpose: '',
        duration: '',
        interestRate: '',
        description: ''
      });

      onOpenChange(false);

    } catch (error: any) {
      console.error('Error creating loan request:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create loan request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAutofill = () => {
    setFormData({
      amount: '5000',
      purpose: 'education',
      duration: '6',
      interestRate: '2.5',
      description: 'Need funds for semester fees. Will repay on time.'
    });

    toast({
      title: "Form Autofilled",
      description: "Sample values have been filled in. You can modify them as needed.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
            Request a Loan
          </DialogTitle>
          <DialogDescription className="flex justify-between items-center">
            <span>Request a friendly loan from your contacts.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAutofill}
              className="flex items-center gap-1"
            >
              <Wand2 className="h-3 w-3" />
              Autofill
            </Button>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Loan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Months) *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 6"
                  className="pl-10"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Loan Purpose *</Label>
            <Select onValueChange={(value) => handleInputChange('purpose', value)} value={formData.purpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select loan purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="home_improvement">Home Improvement</SelectItem>
                <SelectItem value="personal">Personal Use</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">Preferred Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              placeholder="e.g., 2.5"
              value={formData.interestRate}
              onChange={(e) => handleInputChange('interestRate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Message to Lender</Label>
            <Textarea
              id="description"
              placeholder="Brief explanation of why you need this loan..."
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
