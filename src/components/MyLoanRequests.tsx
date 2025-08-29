import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { 
  DollarSign, 
  Clock, 
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus
} from "lucide-react";

interface MyLoanRequest {
  id: string;
  amount: number;
  purpose: string;
  duration_months: number;
  interest_rate: number;
  conditions: string;
  status: string;
  created_at: string;
  lender_id?: string;
  lender_name?: string;
}

interface MyLoanRequestsProps {
  onCreateNew?: () => void;
}

export const MyLoanRequests = ({ onCreateNew }: MyLoanRequestsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MyLoanRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
        const { data, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .eq('borrower_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // All records where user is borrower are their requests/agreements
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching my requests:', error);
      toast({
        title: "Error",
        description: "Failed to load your loan requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const parseConditions = (conditions: string) => {
    return {
      description: conditions || '',
      collateral: '',
      monthlyIncome: 0,
      employmentStatus: '',
      creditScore: 0
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'approved':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPurpose = (purpose: string) => {
    return purpose.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('loan_agreements')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Deleted",
        description: "Your loan request has been deleted.",
      });

      fetchMyRequests(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request.",
        variant: "destructive",
      });
    }
  };

  const handleViewRequest = (request: MyLoanRequest) => {
    toast({
      title: "Loan Request Details",
      description: `Amount: ${formatCurrency(request.amount)} | Purpose: ${formatPurpose(request.purpose)} | Duration: ${request.duration_months} months | Interest: ${request.interest_rate}%`,
    });
  };

  const handleEditRequest = (request: MyLoanRequest) => {
    toast({
      title: "Edit Request",
      description: "Edit functionality coming soon! For now, you can delete and create a new request.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No loan requests yet</h3>
        <p className="text-gray-500 mb-4">
          Create your first loan request to get started with borrowing.
        </p>
        <Button 
          onClick={onCreateNew}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Request a Loan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const conditions = parseConditions(request.conditions);
        
        return (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    {getStatusIcon(request.status)}
                    <span className="ml-2">{formatCurrency(request.amount)}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                    <Badge variant="outline">
                      {formatPurpose(request.purpose)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {request.duration_months} months
                  </div>
                  {request.interest_rate > 0 && (
                    <div className="text-sm text-gray-500">
                      {request.interest_rate}% interest
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">                {/* Financial Info */}
                {conditions.monthlyIncome > 0 && (
                  <div>
                    <span className="text-gray-600">Monthly Income:</span>
                    <span className="ml-2 font-medium">{formatCurrency(conditions.monthlyIncome)}</span>
                  </div>
                )}
                
                {conditions.employmentStatus && (
                  <div>
                    <span className="text-gray-600">Employment:</span>
                    <span className="ml-2 font-medium capitalize">{conditions.employmentStatus.replace('_', ' ')}</span>
                  </div>
                )}
                
                {conditions.creditScore > 0 && (
                  <div>
                    <span className="text-gray-600">Credit Score:</span>
                    <span className="ml-2 font-medium">{conditions.creditScore}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-600">Requested:</span>
                  <span className="ml-2 font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description */}
              {conditions.description && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">{conditions.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                <div className="text-xs text-gray-500">
                  {request.status === 'pending' ? 'Waiting for lenders' : `Status: ${request.status}`}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewRequest(request)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  
                  {request.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRequest(request)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
