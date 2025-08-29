import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/utils/currency";
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Zap
} from "lucide-react";

interface LoanOption {
  id: string;
  lenderName: string;
  amount: number;
  interestRate: number;
  duration: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  processingTime: string;
  reputationScore: number;
  specialConditions?: string[];
}

interface LoanComparisonProps {
  amount: number;
  purpose: string;
  duration: number;
  maxInterestRate?: number;
}

export const LoanComparisonTool = ({ 
  amount, 
  purpose, 
  duration,
  maxInterestRate = 15 
}: LoanComparisonProps) => {
  const [loanOptions, setLoanOptions] = useState<LoanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonAmount, setComparisonAmount] = useState(amount);
  const [comparisonDuration, setComparisonDuration] = useState(duration);
  const [sortBy, setSortBy] = useState<'rate' | 'total' | 'monthly'>('rate');

  useEffect(() => {
    generateLoanOptions();
  }, [comparisonAmount, comparisonDuration]);

  const generateLoanOptions = () => {
    setLoading(true);
    
    // Simulate loan options from different lenders
    const mockLenders = [
      { name: 'QuickLend Pro', baseRate: 8.5, reputation: 95, processingTime: '24 hours' },
      { name: 'FlexiFinance', baseRate: 9.2, reputation: 88, processingTime: '48 hours' },
      { name: 'TrustBank P2P', baseRate: 7.8, reputation: 92, processingTime: '72 hours' },
      { name: 'CommunityLend', baseRate: 10.1, reputation: 85, processingTime: '12 hours' },
      { name: 'EasyMoney', baseRate: 11.5, reputation: 78, processingTime: '6 hours' },
      { name: 'PrimeLender', baseRate: 6.9, reputation: 98, processingTime: '96 hours' }
    ];

    const options: LoanOption[] = mockLenders.map((lender, index) => {
      const rate = lender.baseRate + (Math.random() * 2 - 1); // Add some variation
      const monthlyRate = rate / 100 / 12;
      const numPayments = comparisonDuration;
      
      // Calculate monthly payment using amortization formula
      const monthlyPayment = comparisonAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      const totalRepayment = monthlyPayment * numPayments;
      const totalInterest = totalRepayment - comparisonAmount;

      const conditions = [];
      if (rate < 8) conditions.push('Low Interest Rate');
      if (lender.reputation > 90) conditions.push('Top Rated Lender');
      if (lender.processingTime.includes('24') || lender.processingTime.includes('12') || lender.processingTime.includes('6')) {
        conditions.push('Quick Processing');
      }
      if (Math.random() > 0.7) conditions.push('No Prepayment Penalty');
      if (Math.random() > 0.8) conditions.push('Flexible Terms');

      return {
        id: `loan-${index}`,
        lenderName: lender.name,
        amount: comparisonAmount,
        interestRate: parseFloat(rate.toFixed(2)),
        duration: comparisonDuration,
        monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
        totalRepayment: parseFloat(totalRepayment.toFixed(2)),
        totalInterest: parseFloat(totalInterest.toFixed(2)),
        processingTime: lender.processingTime,
        reputationScore: lender.reputation,
        specialConditions: conditions
      };
    }).filter(option => option.interestRate <= maxInterestRate);

    // Sort options based on selected criteria
    options.sort((a, b) => {
      switch (sortBy) {
        case 'rate':
          return a.interestRate - b.interestRate;
        case 'total':
          return a.totalRepayment - b.totalRepayment;
        case 'monthly':
          return a.monthlyPayment - b.monthlyPayment;
        default:
          return a.interestRate - b.interestRate;
      }
    });

    setLoanOptions(options);
    setLoading(false);
  };

  const getBestValueOption = () => {
    if (loanOptions.length === 0) return null;
    
    // Calculate value score based on interest rate, reputation, and processing time
    return loanOptions.reduce((best, current) => {
      const currentScore = (
        (15 - current.interestRate) * 0.4 + // Lower interest is better
        (current.reputationScore / 100) * 0.3 + // Higher reputation is better
        (current.processingTime.includes('24') || current.processingTime.includes('12') ? 0.3 : 0.1) // Faster processing bonus
      );
      
      const bestScore = (
        (15 - best.interestRate) * 0.4 +
        (best.reputationScore / 100) * 0.3 +
        (best.processingTime.includes('24') || best.processingTime.includes('12') ? 0.3 : 0.1)
      );
      
      return currentScore > bestScore ? current : best;
    });
  };

  const getMonthlyPaymentRange = () => {
    if (loanOptions.length === 0) return { min: 0, max: 0 };
    const payments = loanOptions.map(opt => opt.monthlyPayment);
    return {
      min: Math.min(...payments),
      max: Math.max(...payments)
    };
  };

  const getTotalInterestRange = () => {
    if (loanOptions.length === 0) return { min: 0, max: 0 };
    const interests = loanOptions.map(opt => opt.totalInterest);
    return {
      min: Math.min(...interests),
      max: Math.max(...interests)
    };
  };

  const bestValue = getBestValueOption();
  const paymentRange = getMonthlyPaymentRange();
  const interestRange = getTotalInterestRange();

  return (
    <div className="space-y-6">
      {/* Comparison Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Loan Comparison Tool
          </CardTitle>
          <CardDescription>
            Compare different loan offers for {purpose}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="amount">Loan Amount</Label>
              <Input
                id="amount"
                type="number"
                value={comparisonAmount}
                onChange={(e) => setComparisonAmount(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (Months)</Label>
              <div className="mt-1 space-y-2">
                <Slider
                  value={[comparisonDuration]}
                  onValueChange={(value) => setComparisonDuration(value[0])}
                  min={6}
                  max={60}
                  step={6}
                />
                <div className="text-center text-sm text-gray-600">
                  {comparisonDuration} months
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="rate">Interest Rate</option>
                <option value="total">Total Repayment</option>
                <option value="monthly">Monthly Payment</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payment Range</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(paymentRange.min)} - {formatCurrency(paymentRange.max)}
            </div>
            <p className="text-xs text-muted-foreground">
              Difference: {formatCurrency(paymentRange.max - paymentRange.min)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interest Cost Range</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(interestRange.min)} - {formatCurrency(interestRange.max)}
            </div>
            <p className="text-xs text-muted-foreground">
              You could save: {formatCurrency(interestRange.max - interestRange.min)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Value Option</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bestValue?.lenderName || 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              {bestValue ? `${bestValue.interestRate}% rate` : 'Calculating...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Options */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Available Loan Options</h3>
            <p className="text-sm text-gray-600">{loanOptions.length} offers found</p>
          </div>

          {loanOptions.map((option, index) => (
            <Card key={option.id} className={`hover:shadow-lg transition-shadow ${index === 0 ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      {option.lenderName}
                      {index === 0 && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          Best Rate
                        </Badge>
                      )}
                      {option === bestValue && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800">
                          <Target className="mr-1 h-3 w-3" />
                          Best Value
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Reputation Score: {option.reputationScore}/100 • Processing: {option.processingTime}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {option.interestRate}%
                    </div>
                    <p className="text-xs text-gray-500">Interest Rate</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="text-lg font-semibold">{formatCurrency(option.monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Repayment</p>
                    <p className="text-lg font-semibold">{formatCurrency(option.totalRepayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Interest</p>
                    <p className="text-lg font-semibold">{formatCurrency(option.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-lg font-semibold">{option.duration} months</p>
                  </div>
                </div>

                {/* Special Conditions */}
                {option.specialConditions && option.specialConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {option.specialConditions.map((condition, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" variant={index === 0 ? "default" : "outline"}>
                    <Zap className="mr-2 h-4 w-4" />
                    Select This Offer
                  </Button>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Loan Comparison Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">💡 Smart Insights:</h4>
              <ul className="text-sm space-y-1">
                <li>• Choosing the lowest rate saves you {formatCurrency(interestRange.max - interestRange.min)} in interest</li>
                <li>• Monthly payment varies by {formatCurrency(paymentRange.max - paymentRange.min)} across offers</li>
                <li>• {loanOptions.filter(opt => opt.reputationScore > 90).length} lenders have 90+ reputation scores</li>
                <li>• {loanOptions.filter(opt => opt.processingTime.includes('24') || opt.processingTime.includes('12')).length} offers have same-day processing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Quick Stats:</h4>
              <ul className="text-sm space-y-1">
                <li>• Average interest rate: {(loanOptions.reduce((sum, opt) => sum + opt.interestRate, 0) / loanOptions.length).toFixed(2)}%</li>
                <li>• Best monthly payment: {formatCurrency(paymentRange.min)}</li>
                <li>• Highest rated lender: {loanOptions.reduce((highest, opt) => opt.reputationScore > highest.reputationScore ? opt : highest).lenderName}</li>
                <li>• Fastest processing: {loanOptions.reduce((fastest, opt) => opt.processingTime < fastest.processingTime ? opt : fastest).processingTime}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
