import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { useToast } from "@/components/ui/use-toast";
import { RepaymentDashboard } from "@/components/RepaymentDashboard";
import { LoanComparisonTool } from "@/components/LoanComparisonTool";
import { BrowseLoanRequests } from "@/components/BrowseLoanRequests";
import { MyLoanRequests } from "@/components/MyLoanRequests";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Briefcase,
  PieChart,
  BarChart3,
  Activity
} from "lucide-react";

interface LoanMetrics {
  // Lending metrics
  totalLent: number;
  activeLentLoans: number;
  lendingReturn: number;
  defaultRate: number;
  avgLendingRate: number;
  
  // Borrowing metrics  
  totalBorrowed: number;
  activeBorrowedLoans: number;
  totalDebt: number;
  monthlyPayments: number;
  creditUtilization: number;
  
  // General metrics
  totalTransactions: number;
  reputationScore: number;
  successfulLoans: number;
  avgLoanSize: number;
}

export const LoanManagementDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<LoanMetrics>({
    totalLent: 0,
    activeLentLoans: 0,
    lendingReturn: 0,
    defaultRate: 0,
    avgLendingRate: 0,
    totalBorrowed: 0,
    activeBorrowedLoans: 0,
    totalDebt: 0,
    monthlyPayments: 0,
    creditUtilization: 0,
    totalTransactions: 0,
    reputationScore: 750,
    successfulLoans: 0,
    avgLoanSize: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchLoanMetrics();
      fetchRecentActivity();
    }
  }, [user]);

  const fetchLoanMetrics = async () => {
    if (!user) return;

    try {
      // Fetch all loan agreements involving the user
      const { data: agreements, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`);

      if (error) throw error;

      // Fetch all transactions involving the user
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .in('agreement_id', (agreements || []).map(a => a.id));

      if (txError) throw txError;

      // Calculate metrics
      const lentLoans = (agreements || []).filter(a => a.lender_id === user.id);
      const borrowedLoans = (agreements || []).filter(a => a.borrower_id === user.id);
      const completedLoans = (agreements || []).filter(a => a.status === 'completed');

      const totalLent = lentLoans.reduce((sum, loan) => sum + parseFloat(loan.amount?.toString() || '0'), 0);
      const totalBorrowed = borrowedLoans.reduce((sum, loan) => sum + parseFloat(loan.amount?.toString() || '0'), 0);
      const activeLentLoans = lentLoans.filter(l => l.status === 'active').length;
      const activeBorrowedLoans = borrowedLoans.filter(l => l.status === 'active').length;

      // Calculate lending return (simplified)
      const lendingReturn = lentLoans.reduce((sum, loan) => {
        const amount = parseFloat(loan.amount?.toString() || '0');
        const rate = parseFloat(loan.interest_rate?.toString() || '0');
        const duration = loan.duration_months || 0;
        return sum + (amount * rate * duration) / (100 * 12);
      }, 0);

      // Calculate monthly payments for borrowed loans
      const monthlyPayments = borrowedLoans
        .filter(l => l.status === 'active')
        .reduce((sum, loan) => {
          const amount = parseFloat(loan.amount?.toString() || '0');
          const rate = parseFloat(loan.interest_rate?.toString() || '0');
          const duration = loan.duration_months || 1;
          const totalRepayment = amount + (amount * rate * duration) / (100 * 12);
          return sum + (totalRepayment / duration);
        }, 0);

      // Calculate average lending rate
      const avgLendingRate = lentLoans.length > 0 
        ? lentLoans.reduce((sum, loan) => sum + parseFloat(loan.interest_rate?.toString() || '0'), 0) / lentLoans.length
        : 0;

      // Calculate average loan size
      const avgLoanSize = (agreements || []).length > 0
        ? (agreements || []).reduce((sum, loan) => sum + parseFloat(loan.amount?.toString() || '0'), 0) / (agreements || []).length
        : 0;

      const newMetrics: LoanMetrics = {
        totalLent,
        activeLentLoans,
        lendingReturn,
        defaultRate: 2.3, // Mock default rate
        avgLendingRate,
        totalBorrowed,
        activeBorrowedLoans,
        totalDebt: totalBorrowed, // Simplified
        monthlyPayments,
        creditUtilization: totalBorrowed > 0 ? (totalBorrowed / 100000) * 100 : 0, // Mock calculation
        totalTransactions: (transactions || []).length,
        reputationScore: Math.min(850, 650 + completedLoans.length * 10), // Dynamic reputation
        successfulLoans: completedLoans.length,
        avgLoanSize
      };

      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error fetching loan metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load loan metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      // Fetch recent transactions and notifications
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, loan_agreements(*)')
        .limit(10)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const activity = (transactions || []).map(tx => ({
        id: tx.id,
        type: tx.transaction_type,
        amount: parseFloat(tx.amount?.toString() || '0'),
        status: tx.status,
        date: tx.created_at,
        description: `${tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)} - ${formatCurrency(parseFloat(tx.amount?.toString() || '0'))}`
      }));

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 600) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditUtilizationColor = (utilization: number) => {
    if (utilization <= 30) return 'text-green-600';
    if (utilization <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive view of your lending and borrowing activities
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(metrics.reputationScore)}`}>
            {metrics.reputationScore}
          </div>
          <p className="text-sm text-gray-500">Credit Score</p>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalLent + metrics.lendingReturn)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(metrics.lendingReturn)} interest earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.activeLentLoans + metrics.activeBorrowedLoans}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeLentLoans} lending • {metrics.activeBorrowedLoans} borrowing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Obligations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.monthlyPayments)}
            </div>
            <p className="text-xs text-muted-foreground">
              Due this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCreditUtilizationColor(metrics.creditUtilization)}`}>
              {metrics.creditUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.creditUtilization <= 30 ? 'Excellent' : metrics.creditUtilization <= 60 ? 'Good' : 'High'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lending">Lending</TabsTrigger>
          <TabsTrigger value="borrowing">Borrowing</TabsTrigger>
          <TabsTrigger value="repayments">Repayments</TabsTrigger>
          <TabsTrigger value="comparison">Compare</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Financial Health Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lending Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                  Lending Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Lent</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalLent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interest Earned</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(metrics.lendingReturn)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Rate</p>
                    <p className="text-lg font-semibold">{metrics.avgLendingRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Default Rate</p>
                    <p className={`text-lg font-semibold ${metrics.defaultRate < 5 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.defaultRate}%
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Risk Profile</span>
                    <span>{metrics.defaultRate < 3 ? 'Low Risk' : metrics.defaultRate < 7 ? 'Medium Risk' : 'High Risk'}</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - metrics.defaultRate * 10)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Borrowing Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="mr-2 h-5 w-5 text-blue-600" />
                  Borrowing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Borrowed</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalBorrowed)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Debt</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(metrics.totalDebt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="text-lg font-semibold">{formatCurrency(metrics.monthlyPayments)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Utilization</p>
                    <p className={`text-lg font-semibold ${getCreditUtilizationColor(metrics.creditUtilization)}`}>
                      {metrics.creditUtilization.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Payment Health</span>
                    <span>{metrics.creditUtilization <= 30 ? 'Excellent' : metrics.creditUtilization <= 60 ? 'Good' : 'Needs Attention'}</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - metrics.creditUtilization)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'disbursement' ? 'bg-green-100' :
                          activity.type === 'repayment' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {activity.type === 'disbursement' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : activity.type === 'repayment' ? (
                            <TrendingDown className="h-4 w-4 text-blue-600" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={activity.status === 'completed' ? 'default' : 'outline'}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lending">
          <BrowseLoanRequests />
        </TabsContent>

        <TabsContent value="borrowing">
          <MyLoanRequests />
        </TabsContent>

        <TabsContent value="repayments">
          <RepaymentDashboard />
        </TabsContent>

        <TabsContent value="comparison">
          <LoanComparisonTool 
            amount={50000}
            purpose="Personal Loan"
            duration={12}
            maxInterestRate={15}
          />
        </TabsContent>

        <TabsContent value="requests">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MyLoanRequests />
            <BrowseLoanRequests />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
