
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, parseCurrency } from "@/utils/currency";
import { AlertCircle, CheckCircle, Edit, X, DollarSign, Calendar, FileText } from "lucide-react";

interface LoanRequest {
  id: string;
  borrowerName: string;
  amount: number;
  purpose: string;
  requestDate: string;
}

interface LoanRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LoanRequest;
}

export const LoanRequestModal = ({ open, onOpenChange, request }: LoanRequestModalProps) => {
  const [action, setAction] = useState<'view' | 'modify'>('view');
  const [modifiedTerms, setModifiedTerms] = useState({
    amount: request.amount.toString(),
    duration: '12',
    interestRate: '5.0',
    conditions: ''
  });

  const handleAccept = () => {
    console.log('Accepting loan request:', request);
    // Here you would typically send the acceptance to your backend
    onOpenChange(false);
  };

  const handleReject = () => {
    console.log('Rejecting loan request:', request);
    // Here you would typically send the rejection to your backend
    onOpenChange(false);
  };

  const handleModify = () => {
    console.log('Modifying loan request with terms:', modifiedTerms);
    // Here you would typically send the modified terms to your backend
    onOpenChange(false);
  };

  const calculateTotalReturn = () => {
    const principal = parseCurrency(modifiedTerms.amount) || 0;
    const rate = parseFloat(modifiedTerms.interestRate) || 0;
    const duration = parseFloat(modifiedTerms.duration) || 0;
    
    if (principal && rate && duration) {
      const interest = (principal * rate * duration) / 100;
      return principal + interest;
    }
    return principal;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <FileText className="mr-2 h-6 w-6 text-blue-600" />
            Loan Request from {request.borrowerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Requested Amount</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(request.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Request Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Purpose</p>
                <p className="text-base">{request.purpose}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Borrower Reputation</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Score: 78/100
                  </Badge>
                  <span className="text-sm text-gray-500">5 successful loans</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Selection */}
          {action === 'view' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Request
                </Button>
                <Button 
                  onClick={() => setAction('modify')}
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modify Terms
                </Button>
                <Button 
                  onClick={handleReject}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Quick Accept</h4>
                    <p className="text-sm text-blue-700">
                      Accepting will use default terms: 12 months duration, 5% annual interest rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modify Terms Form */}
          {action === 'modify' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Edit className="mr-2 h-5 w-5" />
                  Modify Loan Terms
                </CardTitle>
                <CardDescription>
                  Adjust the terms and send a counter-proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="modAmount">Amount (₹)</Label>
                    <Input
                      id="modAmount"
                      type="number"
                      value={modifiedTerms.amount}
                      onChange={(e) => setModifiedTerms(prev => ({ ...prev, amount: e.target.value }))}
                      min="1"
                      step="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="modDuration">Duration (months)</Label>
                    <Input
                      id="modDuration"
                      type="number"
                      value={modifiedTerms.duration}
                      onChange={(e) => setModifiedTerms(prev => ({ ...prev, duration: e.target.value }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="modInterestRate">Interest Rate (% annually)</Label>
                    <Input
                      id="modInterestRate"
                      type="number"
                      value={modifiedTerms.interestRate}
                      onChange={(e) => setModifiedTerms(prev => ({ ...prev, interestRate: e.target.value }))}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="modConditions">Additional Conditions</Label>
                  <Textarea
                    id="modConditions"
                    value={modifiedTerms.conditions}
                    onChange={(e) => setModifiedTerms(prev => ({ ...prev, conditions: e.target.value }))}
                    placeholder="Any additional terms or conditions..."
                    rows={3}
                  />
                </div>

                {/* Modified Terms Summary */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-yellow-800">
                      <Calendar className="mr-2 h-5 w-5" />
                      Modified Terms Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Principal Amount</p>
                        <p className="text-lg font-semibold">{formatCurrency(parseCurrency(modifiedTerms.amount) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Interest ({modifiedTerms.interestRate}% annually)</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(calculateTotalReturn() - (parseCurrency(modifiedTerms.amount) || 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Repayment</p>
                        <p className="text-xl font-bold text-yellow-800">
                          {formatCurrency(calculateTotalReturn())}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monthly Payment</p>
                        <p className="text-lg font-semibold">
                          {modifiedTerms.duration ? formatCurrency(calculateTotalReturn() / parseFloat(modifiedTerms.duration)) : formatCurrency(0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => setAction('view')}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleModify}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  >
                    Send Counter-Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
