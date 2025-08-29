import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
// import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  CreditCard,
  TrendingUp,
  Bell,
  ArrowUpRight
} from "lucide-react";

interface RepaymentLoan {
  id: string;
  lender_name: string;
  amount: number;
  interest_rate: number;
  duration_months: number;
  monthly_payment: number;
  total_repayment: number;
  amount_paid: number;
  next_payment_date: string;
  days_until_payment: number;
  status: 'active' | 'overdue' | 'completed';
  created_at: string;
  payment_method?: string;
}

export const RepaymentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<RepaymentLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<RepaymentLoan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank' | 'wallet' | 'crypto' | 'cash'>('upi');
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRepaymentData();
    }
  }, [user]);

  const fetchRepaymentData = async () => {
    if (!user) return;

    try {
      // Fetch active loans where user is borrower
      const { data: agreements, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .eq('borrower_id', user.id)
        .in('status', ['active', 'overdue']);

      if (error) throw error;

      // Calculate repayment details for each loan
      const repaymentLoans: RepaymentLoan[] = (agreements || []).map(agreement => {
        const principal = parseFloat(agreement.amount.toString());
        const rate = parseFloat(agreement.interest_rate?.toString() || '0');
        const duration = agreement.duration_months;
        
        // Calculate total repayment with simple interest
        const totalInterest = (principal * rate * duration) / (100 * 12);
        const totalRepayment = principal + totalInterest;
        const monthlyPayment = totalRepayment / duration;
        
        // Calculate payment progress (mock for now - in real app, get from transactions)
        const amountPaid = 0; // TODO: Calculate from actual payments
        
        // Calculate next payment date (mock - 30 days from creation)
        const createdDate = new Date(agreement.created_at);
        const nextPaymentDate = new Date(createdDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        
        const daysUntilPayment = Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        return {
          id: agreement.id,
          lender_name: 'Unknown Lender', // Note: lender_name might not exist in schema
          amount: principal,
          interest_rate: rate,
          duration_months: duration,
          monthly_payment: monthlyPayment,
          total_repayment: totalRepayment,
          amount_paid: amountPaid,
          next_payment_date: nextPaymentDate.toISOString(),
          days_until_payment: daysUntilPayment,
          status: daysUntilPayment < 0 ? 'overdue' : 'active',
          created_at: agreement.created_at,
          payment_method: agreement.payment_method
        };
      });

      setLoans(repaymentLoans);
    } catch (error) {
      console.error('Error fetching repayment data:', error);
      toast({
        title: "Error",
        description: "Failed to load repayment information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async () => {
    if (!selectedLoan || !paymentAmount) return;

    setProcessing(true);
    try {
      const amount = parseFloat(paymentAmount);
      
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          agreement_id: selectedLoan.id,
          transaction_type: 'repayment',
          amount: amount,
          payment_method: paymentMethod,
          payment_reference: `PAY-${selectedLoan.id.slice(0, 8)}-${Date.now()}`,
          status: 'completed'
        });

      if (transactionError) throw transactionError;

      // Send notification to lender
      await supabase.from('notifications').insert({
        user_id: null, // Will be updated with lender's user_id
        type: 'payment_received',
        title: 'Payment Received',
        message: `${user?.name} has made a payment of ${formatCurrency(amount)} for loan agreement.`,
        agreement_id: selectedLoan.id,
        read: false
      });

      toast({
        title: "Payment Processed",
        description: `Payment of ${formatCurrency(amount)} has been recorded successfully.`,
      });

      setShowPaymentModal(false);
      setSelectedLoan(null);
      setPaymentAmount('');
      fetchRepaymentData(); // Refresh data
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-red-600';
    if (daysUntil <= 3) return 'text-orange-600';
    if (daysUntil <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Loans</h3>
        <p className="text-gray-500">You don't have any active loans requiring repayment.</p>
      </div>
    );
  }

  // Calculate summary statistics
  const totalDebt = loans.reduce((sum, loan) => sum + (loan.total_repayment - loan.amount_paid), 0);
  const monthlyPayments = loans.reduce((sum, loan) => sum + loan.monthly_payment, 0);
  const overdueLoan = loans.find(loan => loan.status === 'overdue');
  const nextPayment = loans
    .filter(loan => loan.status === 'active')
    .sort((a, b) => a.days_until_payment - b.days_until_payment)[0];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
            <p className="text-xs text-muted-foreground">Across {loans.length} loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyPayments)}</div>
            <p className="text-xs text-muted-foreground">Due each month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUrgencyColor(nextPayment?.days_until_payment || 0)}`}>
              {nextPayment ? `${nextPayment.days_until_payment} days` : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {nextPayment ? formatCurrency(nextPayment.monthly_payment) : 'No payments due'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            {overdueLoan ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueLoan ? 'text-red-600' : 'text-green-600'}`}>
              {overdueLoan ? 'Overdue' : 'Current'}
            </div>
            <p className="text-xs text-muted-foreground">
              {overdueLoan ? 'Action required' : 'All payments on time'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueLoan && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Overdue Payment Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-3">
              You have an overdue payment of {formatCurrency(overdueLoan.monthly_payment)} 
              for your loan with {overdueLoan.lender_name}.
            </p>
            <Button 
              onClick={() => {
                setSelectedLoan(overdueLoan);
                setPaymentAmount(overdueLoan.monthly_payment.toString());
                setShowPaymentModal(true);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Make Payment Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loan List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Loans</h3>
        {loans.map((loan) => {
          const progressPercentage = (loan.amount_paid / loan.total_repayment) * 100;
          
          return (
            <Card key={loan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{loan.lender_name}</CardTitle>
                    <CardDescription>
                      Loan of {formatCurrency(loan.amount)} • {loan.interest_rate}% interest
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(loan.status)}>
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Repayment Progress</span>
                    <span>{formatCurrency(loan.amount_paid)} / {formatCurrency(loan.total_repayment)}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Monthly Payment</p>
                    <p className="font-semibold">{formatCurrency(loan.monthly_payment)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Next Due</p>
                    <p className={`font-semibold ${getUrgencyColor(loan.days_until_payment)}`}>
                      {loan.days_until_payment >= 0 
                        ? `${loan.days_until_payment} days`
                        : `${Math.abs(loan.days_until_payment)} days overdue`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Remaining</p>
                    <p className="font-semibold">
                      {formatCurrency(loan.total_repayment - loan.amount_paid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-semibold">{loan.duration_months} months</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setPaymentAmount(loan.monthly_payment.toString());
                      setShowPaymentModal(true);
                    }}
                    className="flex-1"
                    variant={loan.status === 'overdue' ? 'default' : 'outline'}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Make Payment
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Bell className="mr-2 h-4 w-4" />
                    Set Reminder
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Make Payment</CardTitle>
              <CardDescription>
                Payment to {selectedLoan.lender_name}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Payment Amount</label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter amount"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Monthly payment: {formatCurrency(selectedLoan.monthly_payment)}
                </p>
              </div>              {/* Simple Payment Method Selection */}
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="wallet">Digital Wallet</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedLoan(null);
                    setPaymentAmount('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMakePayment}
                  disabled={processing || !paymentAmount}
                  className="flex-1"
                >
                  {processing ? 'Processing...' : 'Pay Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
