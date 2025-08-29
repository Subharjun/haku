import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Search,
  Filter,
  Calendar,
  CreditCard,
  DollarSign
} from "lucide-react";

interface Transaction {
  id: string;
  agreement_id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  payment_reference: string | null;
  status: string;
  created_at: string;
  loan_agreement?: {
    amount: number;
    lender_id: string;
    borrower_name: string | null;
    borrower_email: string | null;
  };
}

interface TransactionHistoryProps {
  userId: string;
}

const TransactionHistory = ({ userId }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          loan_agreement:loan_agreements(
            amount,
            lender_id,
            borrower_name,
            borrower_email
          )
        `)
        .or(`loan_agreement.lender_id.eq.${userId},loan_agreement.borrower_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string, isIncoming: boolean) => {
    const iconProps = { className: `w-5 h-5 ${isIncoming ? 'text-green-600' : 'text-red-600'}` };
    
    if (type === 'loan_disbursement') {
      return isIncoming ? <ArrowDownCircle {...iconProps} /> : <ArrowUpCircle {...iconProps} />;
    } else if (type === 'repayment') {
      return isIncoming ? <ArrowDownCircle {...iconProps} /> : <ArrowUpCircle {...iconProps} />;
    }
    
    return <DollarSign {...iconProps} />;
  };

  const getTransactionType = (transaction: Transaction) => {
    const isLender = transaction.loan_agreement?.lender_id === userId;
    
    if (transaction.transaction_type === 'loan_disbursement') {
      return isLender ? 'Loan Disbursed' : 'Loan Received';
    } else if (transaction.transaction_type === 'repayment') {
      return isLender ? 'Payment Received' : 'Payment Made';
    }
    
    return transaction.transaction_type;
  };

  const isIncomingTransaction = (transaction: Transaction) => {
    const isLender = transaction.loan_agreement?.lender_id === userId;
    
    if (transaction.transaction_type === 'loan_disbursement') {
      return !isLender; // Borrower receives the loan
    } else if (transaction.transaction_type === 'repayment') {
      return isLender; // Lender receives the repayment
    }
    
    return false;
  };
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.loan_agreement?.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.loan_agreement?.borrower_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTotalAmount = (type: 'incoming' | 'outgoing') => {
    return filteredTransactions
      .filter(t => isIncomingTransaction(t) === (type === 'incoming'))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotalAmount('incoming'))}
                </p>
              </div>
              <ArrowDownCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(getTotalAmount('outgoing'))}
                </p>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(getTotalAmount('incoming') - getTotalAmount('outgoing'))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all your payment transactions</CardDescription>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">No transactions match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const isIncoming = isIncomingTransaction(transaction);
                const transactionType = getTransactionType(transaction);
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction.transaction_type, isIncoming)}
                      
                      <div>
                        <p className="font-medium">{transactionType}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.loan_agreement?.borrower_name || 
                           transaction.loan_agreement?.borrower_email || 
                           'Unknown'}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                          {transaction.payment_reference && (
                            <>
                              <span>•</span>
                              <span>Ref: {transaction.payment_reference}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncoming ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(transaction.status)}
                        <Badge variant="outline" className="text-xs">
                          {transaction.payment_method}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
