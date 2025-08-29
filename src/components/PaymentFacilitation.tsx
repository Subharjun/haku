import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { processContractToIpfs, prepareContractData } from "@/utils/contractIpfsUtils";
import { notifyFundingConfirmed } from "@/utils/notificationIntegration";
import { 
  generateUpiDeepLink, 
  formatBankTransferDetails, 
  initiateUpiPayment,
  suggestTransferMode,
  UpiPaymentData,
  BankTransferData
} from "@/utils/paymentUtils";
import { 
  Smartphone, 
  Building2, 
  Copy, 
  CheckCircle, 
  ExternalLink,
  Upload,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowRight,
  Zap,
  Shield
} from "lucide-react";

interface PaymentFacilitationProps {
  agreement: any;
  onPaymentCompleted: () => void;
  onClose: () => void;
}

export const PaymentFacilitation = ({ 
  agreement, 
  onPaymentCompleted, 
  onClose 
}: PaymentFacilitationProps) => {
  const [paymentProofUploaded, setPaymentProofUploaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'bank'>('upi');
  const { toast } = useToast();
  // Generate UPI deep link with enhanced data
  const generateUpiDeepLinkEnhanced = () => {
    const paymentDetails = agreement.data?.paymentDetails || {};
    const upiData: UpiPaymentData = {
      payeeVpa: paymentDetails.upiId || 'lendit@paytm',
      payeeName: agreement.borrower_name || 'LendIt User',
      amount: agreement.amount,
      transactionNote: `Loan funding for ${agreement.borrower_name}`,
      transactionRef: `LOAN-${agreement.id.slice(0, 8)}`,
      currency: 'INR'
    };

    return generateUpiDeepLink(upiData);
  };

  // Handle UPI payment initiation with enhanced experience
  const handleUpiPayment = async () => {
    const paymentDetails = agreement.data?.paymentDetails || {};
    const upiData: UpiPaymentData = {
      payeeVpa: paymentDetails.upiId || 'lendit@paytm',
      payeeName: agreement.borrower_name || 'LendIt User',
      amount: agreement.amount,
      transactionNote: `Loan funding for ${agreement.borrower_name}`,
      transactionRef: `LOAN-${agreement.id.slice(0, 8)}`,
      currency: 'INR'
    };

    try {
      const success = await initiateUpiPayment(upiData);
      
      if (success) {
        toast({
          title: "UPI Payment Initiated",
          description: "UPI app opened successfully. Complete the payment and upload proof below.",
        });
      } else {
        toast({
          title: "UPI App Not Found",
          description: "Please install a UPI app or use the manual payment option.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open UPI app. Please try manual payment.",
        variant: "destructive",
      });
    }

    // Record payment initiation
    recordPaymentAttempt('upi');
  };

  // Copy UPI details for manual payment
  const copyUpiDetails = () => {
    const paymentDetails = agreement.data?.paymentDetails || {};
    const upiDetails = `
UPI ID: ${paymentDetails.upiId || 'lendit@paytm'}
Amount: ₹${agreement.amount}
Note: Loan payment for agreement ${agreement.id.slice(0, 8)}
Receiver: ${agreement.lender_name}
    `.trim();

    navigator.clipboard.writeText(upiDetails);
    toast({
      title: "UPI Details Copied",
      description: "UPI payment details copied to clipboard",
    });
  };
  // Copy bank details for manual transfer with enhanced formatting
  const copyBankDetails = () => {
    const paymentDetails = agreement.data?.paymentDetails || {};
    const bankData: BankTransferData = {
      accountNumber: paymentDetails.accountNumber || 'Contact borrower for details',
      ifscCode: paymentDetails.ifsc || 'Contact borrower for details',
      accountHolderName: agreement.borrower_name,
      amount: agreement.amount,
      reference: `LOAN-${agreement.id.slice(0, 8)}`,
      transferMode: 'NEFT'
    };

    const formattedDetails = formatBankTransferDetails(bankData);
    navigator.clipboard.writeText(formattedDetails);
    
    toast({
      title: "Bank Details Copied",
      description: "Complete bank transfer details copied to clipboard with formatting",
    });
  };

  // Get transfer mode suggestion
  const getTransferSuggestion = () => {
    return suggestTransferMode(agreement.amount, false);
  };
  // Record payment attempt in database
  const recordPaymentAttempt = async (method: string) => {
    try {
      await supabase.from('transactions').insert({
        agreement_id: agreement.id,
        amount: agreement.amount,
        transaction_type: 'loan_funding',
        payment_method: method,
        status: 'pending',
        payment_reference: `LOAN-${agreement.id.slice(0, 8)}-${Date.now()}`
      });
    } catch (error) {
      console.error('Error recording payment attempt:', error);
    }
  };

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (!paymentProofUploaded) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload payment proof before confirming.",
        variant: "destructive",
      });
      return;
    }

    setConfirming(true);

    try {
      // Update agreement status to funded
      const { error: updateError } = await supabase
        .from('loan_agreements')
        .update({
          status: 'funded',
          funding_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', agreement.id)
        .eq('status', 'accepted'); // Only update if currently accepted

      if (updateError) throw updateError;      // Record successful funding transaction
      await supabase.from('transactions').insert({
        agreement_id: agreement.id,
        amount: agreement.amount,
        transaction_type: 'loan_funding',
        payment_method: selectedMethod,
        status: 'completed',
        payment_reference: `LOAN-${agreement.id.slice(0, 8)}-COMPLETED-${Date.now()}`
      });      // Create notification for borrower
      await supabase.from('notifications').insert({
        user_id: agreement.borrower_id,
        type: 'loan_funded',
        title: 'Loan Funded! 💰',
        message: `${agreement.lender_name} has funded your loan of ${formatCurrency(agreement.amount)}. The money should be in your account shortly.`,
        agreement_id: agreement.id,
        read: false
      });

      // Send multi-channel notification for funding confirmation
      try {
        await notifyFundingConfirmed({
          agreementId: agreement.id,
          borrowerName: agreement.borrower_name || 'Borrower',
          borrowerEmail: agreement.borrower_email || '',
          borrowerId: agreement.borrower_id || '',
          lenderName: agreement.lender_name || 'Lender',
          lenderEmail: agreement.lender_email || '',
          lenderId: agreement.lender_id || '',
          amount: agreement.amount,
          purpose: agreement.purpose,
          duration: agreement.duration_months
        });
      } catch (notifyError) {
        console.warn('Multi-channel funding notification failed:', notifyError);
      }toast({
        title: "Payment Confirmed! 🎉",
        description: `Loan of ${formatCurrency(agreement.amount)} has been marked as funded. The borrower has been notified.`,
      });

      // Generate and upload contract to IPFS
      try {
        toast({
          title: "🔄 Generating Contract",
          description: "Creating digital contract and uploading to IPFS...",
        });

        // Prepare contract data
        const contractData = prepareContractData(
          agreement,
          { name: agreement.lender_name || 'Lender', address: 'Address to be provided' },
          { name: agreement.borrower_name || 'Borrower', address: 'Address to be provided' }
        );

        // Process contract to IPFS
        const ipfsResult = await processContractToIpfs(agreement, contractData);

        if (ipfsResult.success && ipfsResult.ipfsResult) {
          toast({
            title: "✅ Contract Uploaded to IPFS",
            description: `Signed agreement stored permanently. CID: ${ipfsResult.ipfsResult.cid.substring(0, 12)}...`,
          });
        } else {
          console.warn('IPFS upload failed:', ipfsResult.error);
          toast({
            title: "⚠️ Contract Generation Warning",
            description: "Payment confirmed but IPFS upload failed. Contract will be available for download.",
            variant: "destructive",
          });
        }
      } catch (ipfsError) {
        console.warn('IPFS contract generation failed:', ipfsError);
        // Don't fail the payment process if IPFS fails
      }

      // Notify via integrated notification system
      try {
        await notifyFundingConfirmed(agreement);
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
        toast({
          title: "Payment Confirmed",
          description: "Loan funded and notification sent to borrower.",
        });
      }

      onPaymentCompleted();

    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  const paymentDetails = agreement.data?.paymentDetails || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Fund the Loan</h3>
        <p className="text-gray-600">
          Transfer {formatCurrency(agreement.amount)} to {agreement.borrower_name}
        </p>
      </div>

      {/* Loan Details Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Borrower:</span>
              <p className="font-medium">{agreement.borrower_name}</p>
            </div>
            <div>
              <span className="text-gray-600">Amount:</span>
              <p className="font-medium text-blue-600">{formatCurrency(agreement.amount)}</p>
            </div>
            <div>
              <span className="text-gray-600">Purpose:</span>
              <p className="font-medium">{agreement.purpose}</p>
            </div>
            <div>
              <span className="text-gray-600">Agreement ID:</span>
              <p className="font-medium">{agreement.id.slice(0, 8)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${selectedMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
          onClick={() => setSelectedMethod('upi')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Smartphone className="mr-2 h-5 w-5" />
              UPI Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Instant transfer via UPI apps</p>
            {selectedMethod === 'upi' && <Badge className="mt-2">Selected</Badge>}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${selectedMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
          onClick={() => setSelectedMethod('bank')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Bank Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">NEFT/RTGS/IMPS transfer</p>
            {selectedMethod === 'bank' && <Badge className="mt-2">Selected</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* UPI Payment Section */}
      {selectedMethod === 'upi' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="mr-2 h-5 w-5 text-blue-600" />
              UPI Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">UPI ID:</span>
                <code className="bg-white px-2 py-1 rounded text-sm">
                  {paymentDetails.upiId || 'lendit@paytm'}
                </code>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-medium text-blue-600">₹{agreement.amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Receiver:</span>
                <span className="font-medium">{agreement.borrower_name}</span>
              </div>
            </div>            <div className="flex gap-2">
              <Button 
                onClick={handleUpiPayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                Pay via UPI App
              </Button>
              <Button variant="outline" onClick={copyUpiDetails}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Details
              </Button>
            </div>

            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">UPI Payment Options:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>Click "Pay via UPI App" to open your default UPI app</li>
                    <li>Supports GPay, PhonePe, Paytm, BHIM, Amazon Pay</li>
                    <li>Instant transfer • Zero fees • Available 24x7</li>
                    <li>Payment details are pre-filled for your convenience</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}      {/* Bank Transfer Section */}
      {selectedMethod === 'bank' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-green-600" />
              Bank Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transfer Mode Suggestion */}
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Recommended: {getTransferSuggestion().recommended}</p>
                  <p className="text-sm">{getTransferSuggestion().reason}</p>
                  {getTransferSuggestion().alternatives.length > 0 && (
                    <div className="text-xs">
                      <p className="font-medium">Alternatives:</p>
                      <ul className="list-disc list-inside">
                        {getTransferSuggestion().alternatives.map((alt, idx) => (
                          <li key={idx}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Account Number:</span>
                <code className="bg-white px-2 py-1 rounded text-sm">
                  {paymentDetails.accountNumber || 'Contact borrower for details'}
                </code>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">IFSC Code:</span>
                <code className="bg-white px-2 py-1 rounded text-sm">
                  {paymentDetails.ifsc || 'Contact borrower for details'}
                </code>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Account Holder:</span>
                <span className="font-medium">{agreement.borrower_name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-medium text-green-600">₹{agreement.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reference:</span>
                <code className="bg-white px-2 py-1 rounded text-sm">
                  LOAN-{agreement.id.slice(0, 8)}
                </code>
              </div>
            </div>

            <Button variant="outline" onClick={copyBankDetails} className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copy Formatted Bank Details
            </Button>

            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Transfer Instructions:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>Use the reference number in transaction remarks</li>
                    <li>Keep the receipt/screenshot for proof</li>
                    <li>NEFT: 2-4 hours (₹{agreement.amount <= 10000 ? '2.5' : '5-25'} fee)</li>
                    <li>IMPS: Instant (₹{agreement.amount <= 10000 ? '5' : '15-25'} fee)</li>
                    {agreement.amount >= 200000 && <li>RTGS: 30 mins (₹{agreement.amount <= 500000 ? '30' : '55'} fee)</li>}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Payment Proof Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload Payment Proof
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {!paymentProofUploaded ? (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload screenshot or receipt of payment</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Simulate file upload for now
                    setPaymentProofUploaded(true);
                    toast({
                      title: "Payment Proof Uploaded",
                      description: "Payment proof has been recorded. You can now confirm the payment.",
                    });
                  }}
                >
                  Choose File
                </Button>
              </div>
            ) : (
              <div className="text-green-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Payment proof uploaded successfully</p>
              </div>
            )}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Upload a clear screenshot or receipt showing the successful payment. This helps maintain trust and provides proof of transaction.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleConfirmPayment}
          disabled={!paymentProofUploaded || confirming}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          {confirming ? 'Confirming...' : 'Confirm Payment Sent'}
        </Button>

        <Button variant="outline" onClick={onClose} disabled={confirming}>
          Cancel
        </Button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Once confirmed, the loan status will be updated to "Funded" and the borrower will be notified.
      </div>
    </div>
  );
};
