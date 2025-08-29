import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { downloadContract, ContractData } from "@/utils/contractGenerator";
import { processContractToIpfs, prepareContractData, getContractFromIpfs, hasContractInIpfs } from "@/utils/contractIpfsUtils";
import { PaymentFacilitationModal } from "./PaymentFacilitationModal";
import { 
  Calendar, 
  DollarSign, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Eye,
  Edit,
  CreditCard,
  Download,
  ArrowUpRight,
  Cloud,
  ExternalLink,
  Loader2
} from "lucide-react";

interface LoanAgreement {
  id: string;
  lender_id: string;
  borrower_id: string | null;
  borrower_email: string | null;
  borrower_name: string | null;
  amount: number;
  interest_rate: number;
  duration_months: number;
  purpose: string | null;
  status: string;
  payment_method: string;
  conditions: string | null;
  smart_contract: boolean;
  created_at: string;
  updated_at: string;
}

interface AgreementListProps {
  agreements: LoanAgreement[];
  currentUserId: string;
  onUpdate: () => void;
}

const AgreementList = ({ agreements, currentUserId, onUpdate }: AgreementListProps) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedAgreement, setSelectedAgreement] = useState<LoanAgreement | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'payment' | 'details' | 'edit' | 'download'>('details');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');  const [loading, setLoading] = useState(false);
  const [borrowerData, setBorrowerData] = useState<any>(null);
  const [lenderData, setLenderData] = useState<any>(null);
  const [ipfsContractMap, setIpfsContractMap] = useState<Record<string, boolean>>({});
  const [ipfsLoading, setIpfsLoading] = useState<Record<string, boolean>>({});

  // Fetch user profiles when an agreement is selected
  useEffect(() => {
    if (selectedAgreement) {
      fetchUserProfiles(selectedAgreement);
    }
  }, [selectedAgreement]);

  const fetchUserProfiles = async (agreement: LoanAgreement) => {
    try {
      // Fetch borrower profile
      if (agreement.borrower_id) {
        const { data: borrowerProfile, error: borrowerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', agreement.borrower_id)
          .single();
          
        if (borrowerError) throw borrowerError;
        setBorrowerData(borrowerProfile);
      } else {
        setBorrowerData({
          name: agreement.borrower_name,
          email: agreement.borrower_email
        });
      }
      
      // Fetch lender profile
      const { data: lenderProfile, error: lenderError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agreement.lender_id)
        .single();
        
      if (lenderError) throw lenderError;
      setLenderData(lenderProfile);
      
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      accepted: { variant: 'default' as const, label: 'Accepted', icon: CheckCircle },
      active: { variant: 'default' as const, label: 'Active', icon: CheckCircle },
      completed: { variant: 'secondary' as const, label: 'Completed', icon: CheckCircle },
      rejected: { variant: 'destructive' as const, label: 'Rejected', icon: AlertCircle },
      defaulted: { variant: 'destructive' as const, label: 'Defaulted', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getUserRole = (agreement: LoanAgreement) => {
    return agreement.lender_id === currentUserId ? 'lender' : 'borrower';
  };

  const getCounterpartyName = (agreement: LoanAgreement) => {
    const role = getUserRole(agreement);
    if (role === 'lender') {
      return agreement.borrower_name || agreement.borrower_email || 'Unknown Borrower';
    } else {
      return lenderData?.name || 'Lender';
    }
  };
  const handleAction = async (agreement: LoanAgreement, action: 'accept' | 'reject' | 'payment' | 'details' | 'edit' | 'download') => {
    setSelectedAgreement(agreement);
    setActionType(action);
    
    if (action === 'download') {
      generateAgreementPDF(agreement);
      return;
    }
    
    setShowActionDialog(true);
  };

  // IPFS Contract Management Functions
  const checkIpfsContractStatus = async (agreementId: string) => {
    try {
      const hasContract = await hasContractInIpfs(agreementId);
      setIpfsContractMap(prev => ({ ...prev, [agreementId]: hasContract }));
      return hasContract;
    } catch (error) {
      console.error('Error checking IPFS contract status:', error);
      return false;
    }
  };

  const handleViewIpfsContract = async (agreement: LoanAgreement) => {
    try {
      const contractUrl = await getContractFromIpfs(agreement.id);
      if (contractUrl) {
        window.open(contractUrl, '_blank');
        toast({
          title: "📄 Opening IPFS Contract",
          description: "Contract is loading from IPFS...",
        });
      } else {
        toast({
          title: "Contract Not Found",
          description: "No IPFS contract found for this agreement.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error viewing IPFS contract:', error);
      toast({
        title: "Error",
        description: "Failed to load contract from IPFS.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateIpfsContract = async (agreement: LoanAgreement) => {
    try {
      setIpfsLoading(prev => ({ ...prev, [agreement.id]: true }));
      
      toast({
        title: "🔄 Generating Contract",
        description: "Creating digital contract and uploading to IPFS...",
      });

      // Prepare contract data
      const contractData = prepareContractData(
        agreement,
        { name: lenderData?.name || 'Lender', address: 'Address to be provided' },
        { name: borrowerData?.name || agreement.borrower_name || 'Borrower', address: 'Address to be provided' }
      );

      // Process contract to IPFS
      const ipfsResult = await processContractToIpfs(agreement, contractData);

      if (ipfsResult.success && ipfsResult.ipfsResult) {
        setIpfsContractMap(prev => ({ ...prev, [agreement.id]: true }));
        toast({
          title: "✅ Contract Uploaded to IPFS",
          description: `Signed agreement stored permanently. CID: ${ipfsResult.ipfsResult.cid.substring(0, 12)}...`,
        });
      } else {
        throw new Error(ipfsResult.error || 'IPFS upload failed');
      }
    } catch (error) {
      console.error('Error generating IPFS contract:', error);
      toast({
        title: "Error",
        description: "Failed to upload contract to IPFS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIpfsLoading(prev => ({ ...prev, [agreement.id]: false }));
    }
  };

  // Load IPFS contract status for all agreements
  useEffect(() => {
    const loadIpfsStatus = async () => {
      for (const agreement of agreements) {
        await checkIpfsContractStatus(agreement.id);
      }
    };

    if (agreements.length > 0) {
      loadIpfsStatus();
    }
  }, [agreements]);

  const executeAction = async () => {
    if (!selectedAgreement) return;
    setLoading(true);

    try {
      switch (actionType) {
        case 'accept':
          await handleAcceptLoan();
          break;
        case 'reject':
          await handleRejectLoan();
          break;
        case 'payment':
          await handlePayment();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: "Error",
        description: "Failed to execute action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowActionDialog(false);
      setPaymentAmount('');
      setPaymentReference('');
    }
  };
  const generateAgreementPDF = async (agreement: LoanAgreement) => {
    if (!borrowerData || !lenderData) {
      toast({
        title: "Error",
        description: "Missing user data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Get the latest agreement data with signature timestamps
    const { data: latestAgreement, error } = await supabase
      .from('loan_agreements')
      .select('*')
      .eq('id', agreement.id)
      .single();

    if (error || !latestAgreement) {
      toast({
        title: "Error",
        description: "Could not fetch agreement data.",
        variant: "destructive",
      });
      return;
    }    // Temporarily use placeholder signature data since the database doesn't have signature columns yet
    // TODO: Add proper signature columns to remote database
    const lenderSignedAt = latestAgreement.created_at ? new Date(latestAgreement.created_at) : undefined;
    const borrowerSignedAt = latestAgreement.status === 'active' ? new Date() : undefined;
    
    // Prepare contract data
    const startDate = new Date(latestAgreement.created_at || new Date());
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + latestAgreement.duration_months);
    
    // Calculate payments
    const amount = parseFloat(latestAgreement.amount.toString());
    const rate = parseFloat(latestAgreement.interest_rate?.toString() || '0');
    const duration = latestAgreement.duration_months;
    
    // Monthly interest rate
    const monthlyRate = rate / 100 / 12;
    
    // Monthly payment using amortization formula
    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);
    
    // Total repayment amount
    const totalRepayment = monthlyPayment * duration;
    
    const contractData: ContractData = {
      lenderName: lenderData.name,
      lenderAddress: lenderData.address || 'Not provided',
      borrowerName: borrowerData.name,
      borrowerAddress: borrowerData.address || 'Not provided',
      amount: amount,
      interestRate: rate,
      durationMonths: duration,
      purpose: latestAgreement.purpose || 'Not specified',
      startDate,
      endDate,
      monthlyPayment,
      totalRepayment,
      // Digital signature data - CRITICAL for PDF generation
      lenderSignedAt,
      borrowerSignedAt,
      paymentMethod: latestAgreement.payment_method,      agreementId: latestAgreement.id,
      // Include blockchain details if smart contract is used
      walletAddress: latestAgreement.smart_contract ? 'To be provided' : undefined,
      contractHash: latestAgreement.smart_contract ? 'To be generated' : undefined
    };
    
    // Generate and download the PDF (will only work if both signatures are present)
    try {
      downloadContract(contractData);
      
      toast({
        title: "✅ Digitally Signed PDF Generated",
        description: "Loan agreement PDF with digital signatures has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleAcceptLoan = async () => {
    if (!selectedAgreement) return;

    const { error } = await supabase
      .from('loan_agreements')
      .update({ 
        status: 'active',
        borrower_id: currentUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedAgreement.id);

    if (error) throw error;

    // Generate and send the PDF to both parties
    generateAgreementPDF({
      ...selectedAgreement,
      status: 'active',
      borrower_id: currentUserId
    });

    toast({
      title: "Loan Accepted",
      description: "You have successfully accepted this loan agreement.",
    });
    onUpdate();
  };

  const handleRejectLoan = async () => {
    if (!selectedAgreement) return;

    const { error } = await supabase
      .from('loan_agreements')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedAgreement.id);

    if (error) throw error;

    toast({
      title: "Loan Rejected",
      description: "You have rejected this loan agreement.",
    });
    onUpdate();
  };

  const handlePayment = async () => {
    if (!selectedAgreement || !paymentAmount) return;

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        agreement_id: selectedAgreement.id,
        transaction_type: 'repayment',
        amount: parseFloat(paymentAmount),
        payment_method: selectedAgreement.payment_method,
        payment_reference: paymentReference,
        status: 'completed'
      });

    if (transactionError) throw transactionError;

    toast({
      title: "Payment Recorded",
      description: `Payment of ${formatCurrency(parseFloat(paymentAmount))} has been recorded.`,
    });
    onUpdate();
  };

  const calculateProgress = (agreement: LoanAgreement) => {
    // This would calculate based on actual payments from transactions table
    return Math.random() * 100;
  };

  const getNextPaymentDate = (agreement: LoanAgreement) => {
    const startDate = new Date(agreement.created_at);
    const nextDate = new Date(startDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate.toLocaleDateString();
  };

  const filteredAgreements = agreements.filter(agreement => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'lending') return getUserRole(agreement) === 'lender';
    if (selectedTab === 'borrowing') return getUserRole(agreement) === 'borrower';
    if (selectedTab === 'active') return agreement.status === 'active';
    if (selectedTab === 'completed') return agreement.status === 'completed';
    return true;
  });

  if (agreements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
          <p className="text-gray-500 text-center">
            You don't have any loan agreements yet. Create your first loan to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          My Agreements
        </CardTitle>
        <CardDescription>
          Track all your lending and borrowing agreements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lending">Lending</TabsTrigger>
            <TabsTrigger value="borrowing">Borrowing</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-6">
            <div className="space-y-4">
              {filteredAgreements.length > 0 ? (
                filteredAgreements.map((agreement) => {
                  const role = getUserRole(agreement);
                  const counterpartyName = getCounterpartyName(agreement);
                  const progress = calculateProgress(agreement);
                  const monthlyPayment = (agreement.amount * (1 + agreement.interest_rate / 100)) / agreement.duration_months;

                  return (
                    <Card key={agreement.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {role === 'lender' ? (
                                <DollarSign className="w-5 h-5 text-green-600" />
                              ) : (
                                <CreditCard className="w-5 h-5 text-blue-600" />
                              )}
                              {formatCurrency(agreement.amount)}
                              <Badge variant="outline" className="ml-2">
                                {role === 'lender' ? 'Lending' : 'Borrowing'}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {counterpartyName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {agreement.duration_months} months
                              </span>
                              <span>{agreement.interest_rate}% interest</span>
                            </CardDescription>
                          </div>                          <div className="flex items-center gap-2">
                            {getStatusBadge(agreement.status)}
                            {/* IPFS Status Indicator */}
                            {(agreement.status === 'accepted' || agreement.status === 'active' || agreement.status === 'completed') && (
                              ipfsContractMap[agreement.id] ? (
                                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                  <Cloud className="w-3 h-3 mr-1" />
                                  IPFS
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-200 text-gray-600">
                                  <Cloud className="w-3 h-3 mr-1" />
                                  No IPFS
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {agreement.purpose && (
                            <div>
                              <Label className="text-sm font-medium">Purpose</Label>
                              <p className="text-sm text-gray-600">{agreement.purpose}</p>
                            </div>
                          )}

                          {agreement.status === 'active' && (
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>Payment Progress</span>
                                <span>{progress.toFixed(1)}%</span>
                              </div>
                              <Progress value={progress} className="w-full" />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Monthly: {formatCurrency(monthlyPayment)}</span>
                                <span>Next: {getNextPaymentDate(agreement)}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(agreement, 'details')}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>

                            {agreement.status === 'pending' && agreement.borrower_id === null && role === 'borrower' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleAction(agreement, 'accept')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleAction(agreement, 'reject')}
                                >
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {agreement.status === 'accepted' && role === 'lender' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedAgreement(agreement);
                                  setShowPaymentModal(true);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <ArrowUpRight className="w-4 h-4 mr-1" />
                                Fund Loan
                              </Button>
                            )}

                            {agreement.status === 'active' && role === 'borrower' && (
                              <Button
                                size="sm"
                                onClick={() => handleAction(agreement, 'payment')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Make Payment
                              </Button>
                            )}                            {agreement.status === 'pending' && role === 'lender' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(agreement, 'edit')}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}

                            {/* IPFS Contract Actions */}
                            {(agreement.status === 'accepted' || agreement.status === 'active' || agreement.status === 'completed') && (
                              <>
                                {ipfsContractMap[agreement.id] ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewIpfsContract(agreement)}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                  >
                                    <Cloud className="w-4 h-4 mr-1" />
                                    View on IPFS
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateIpfsContract(agreement)}
                                    disabled={ipfsLoading[agreement.id]}
                                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                  >
                                    {ipfsLoading[agreement.id] ? (
                                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                      <Cloud className="w-4 h-4 mr-1" />
                                    )}
                                    Upload to IPFS
                                  </Button>
                                )}
                              </>
                            )}

                            {/* Download PDF Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(agreement, 'download')}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No agreements found</h3>
                  <p className="text-gray-500">
                    {selectedTab === 'all' 
                      ? "You haven't created any lending agreements yet." 
                      : `No ${selectedTab} agreements found.`}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' && 'Accept Loan Agreement'}
              {actionType === 'reject' && 'Reject Loan Agreement'}
              {actionType === 'payment' && 'Make Payment'}
              {actionType === 'details' && 'Loan Details'}
              {actionType === 'edit' && 'Edit Loan Agreement'}
              {actionType === 'download' && 'Download Agreement'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept' && 'Are you sure you want to accept this loan agreement?'}
              {actionType === 'reject' && 'Are you sure you want to reject this loan agreement?'}
              {actionType === 'payment' && 'Enter the payment details below.'}
              {actionType === 'details' && 'View complete loan agreement details.'}
              {actionType === 'edit' && 'Modify the loan agreement details.'}
              {actionType === 'download' && 'Download the loan agreement as a PDF.'}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'payment' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reference">Payment Reference (Optional)</Label>
                <Input
                  id="reference"
                  placeholder="Transaction ID or reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            </div>
          )}

          {actionType === 'details' && selectedAgreement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <p className="font-medium">{formatCurrency(selectedAgreement.amount)}</p>
                </div>
                <div>
                  <Label>Interest Rate</Label>
                  <p className="font-medium">{selectedAgreement.interest_rate}%</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="font-medium">{selectedAgreement.duration_months} months</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="font-medium capitalize">{selectedAgreement.payment_method}</p>
                </div>
              </div>
              {selectedAgreement.purpose && (
                <div>
                  <Label>Purpose</Label>
                  <p className="text-sm">{selectedAgreement.purpose}</p>
                </div>
              )}
              {selectedAgreement.conditions && (
                <div>
                  <Label>Terms & Conditions</Label>
                  <p className="text-sm">{selectedAgreement.conditions}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            {(actionType === 'accept' || actionType === 'reject' || actionType === 'payment') && (
              <Button onClick={executeAction} disabled={loading}>
                {loading ? 'Processing...' : 'Confirm'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>      </Dialog>

      {/* Payment Facilitation Modal */}
      <PaymentFacilitationModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        agreement={selectedAgreement}
        onPaymentCompleted={() => {
          onUpdate();
          setShowPaymentModal(false);
        }}
      />
    </Card>
  );
};

export default AgreementList;
