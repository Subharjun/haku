import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethodInput, PaymentMethodType } from "./PaymentMethodInput";
import { InvitationFlow } from "./InvitationFlow";
import InvitationSuccess from "./InvitationSuccess";
import { formatCurrency, parseCurrency } from "@/utils/currency";
import { 
  DollarSign, 
  Users, 
  UserPlus, 
  Calculator, 
  FileText, 
  Send
} from "lucide-react";

interface CreateLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateLoanModal = ({ open, onOpenChange }: CreateLoanModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [borrowerType, setBorrowerType] = useState<'existing' | 'new'>('existing');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('12');
  const [interestRate, setInterestRate] = useState('5.0');
  const [purpose, setPurpose] = useState('');
  const [conditions, setConditions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [smartContract, setSmartContract] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [createdAgreementId, setCreatedAgreementId] = useState<string>('');
  const resetForm = () => {
    setBorrowerEmail('');
    setBorrowerName('');
    setAmount('');
    setDuration('12');
    setInterestRate('5.0');
    setPurpose('');
    setConditions('');
    setPaymentDetails({});
    setPaymentMethod('upi');
    setSmartContract(false);
  };

  const calculateTotalReturn = () => {
    const principal = parseCurrency(amount) || 0;
    const rate = parseFloat(interestRate) || 0;
    const durationNum = parseFloat(duration) || 0;
    
    if (principal && rate && durationNum) {
      const interest = (principal * rate * durationNum) / (100 * 12); // Monthly interest
      return principal + interest;
    }
    return principal;
  };  const handleCreateLoan = async () => {
    console.log('Create loan button clicked');
    console.log('Form state:', {
      user: !!user,
      amount,
      duration,
      borrowerEmail,
      borrowerName,
      paymentMethod,
      paymentDetails
    });

    if (!user) {
      console.log('No user found');
      toast({
        title: "Authentication Required",
        description: "Please log in to create a loan agreement.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || !duration || !borrowerEmail || !borrowerName) {
      console.log('Missing required fields');
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }// Enhanced payment method validation (temporarily relaxed for testing)
    if (!paymentDetails.isValid && paymentMethod !== 'cash') {
      let errorMessage = "Please provide valid payment details for your selected method.";
      
      switch (paymentMethod) {
        case 'upi':
          errorMessage = "Please provide a valid UPI ID (e.g., username@paytm)";
          break;
        case 'bank':
          errorMessage = "Please provide valid account number and IFSC code";
          break;
        case 'wallet':
          errorMessage = "Please provide a valid wallet ID or phone number";
          break;
        case 'crypto':
          errorMessage = "Please provide a valid cryptocurrency wallet address";
          break;
      }
      
      console.log('Payment validation failed:', { paymentMethod, paymentDetails });
      toast({
        title: "Payment Details Required",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Validate amount range
    const loanAmount = parseCurrency(amount);
    if (loanAmount < 100 || loanAmount > 1000000) {
      toast({
        title: "Invalid Amount",
        description: "Loan amount must be between ₹100 and ₹10,00,000",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);    try {      console.log('Creating loan offer with data:', {
        lender_id: user.id,
        lender_name: user.name || user.email || 'Unknown Lender',
        lender_email: user.email || '',
        borrower_email: borrowerEmail,
        borrower_name: borrowerName,
        amount: parseCurrency(amount),
        interest_rate: parseFloat(interestRate),
        duration_months: parseInt(duration),
        purpose,
        conditions,
        payment_method: paymentMethod,
        status: 'pending'
      });

      // Create loan offer (lender offering to borrower)
      const { data: proposal, error } = await supabase
        .from('loan_agreements')
        .insert({
          lender_id: user.id,
          lender_name: user.name || user.email || 'Unknown Lender',
          lender_email: user.email || '',
          borrower_id: null, // Will be set when borrower accepts
          borrower_email: borrowerEmail,
          borrower_name: borrowerName,
          amount: parseCurrency(amount),
          interest_rate: parseFloat(interestRate),
          duration_months: parseInt(duration),
          purpose: purpose || 'other', // Ensure purpose is not empty
          conditions: conditions || '', // Ensure conditions is not null
          payment_method: paymentMethod,
          smart_contract: smartContract,
          status: 'pending', // Loan offer pending borrower acceptance
          data: {
            paymentDetails: paymentDetails,
            lenderSignedAt: new Date().toISOString(),
            type: 'loan_offer'
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Loan offer created successfully:', proposal);// Send notification (will be handled via email for now)
      // TODO: Implement proper notification system after schema is updated
      try {
        await supabase.from('notifications').insert({
          user_id: null, // For non-registered users, will be updated when they register
          title: 'New Loan Offer',
          message: `${user.name || 'A lender'} has offered you a loan of ${formatCurrency(parseCurrency(amount))} at ${interestRate}% interest for ${duration} months.`,
          type: 'loan_request',
          related_agreement_id: proposal.id,
          read: false,
          data: {
            borrower_email: borrowerEmail,
            offer_details: {
              amount: parseCurrency(amount),
              interest_rate: parseFloat(interestRate),
              duration: parseInt(duration),
              purpose
            }
          }
        });
      } catch (notificationError) {
        console.warn('Notification creation failed:', notificationError);
        // Don't fail the entire process if notification fails
      }

      setCreatedAgreementId(proposal.id);

      if (borrowerType === 'new') {
        // Show invitation flow for new users
        setShowInvitation(true);
      } else {
        // For existing users, send notification
        toast({
          title: "Loan Proposal Sent! 📩",
          description: `Loan offer sent to ${borrowerName}. They need to accept and sign the agreement before it becomes active.`,
        });
        
        // Reset form and close modal
        resetForm();
        onOpenChange(false);
      }

    } catch (error) {
      console.error('Error creating loan proposal:', error);
      toast({
        title: "Error",
        description: "Failed to create loan proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <DollarSign className="mr-2 h-6 w-6 text-green-600" />
              Create Loan Agreement
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Borrower Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Who are you lending to?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={borrowerType} onValueChange={(value) => setBorrowerType(value as 'existing' | 'new')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Existing User</TabsTrigger>
                    <TabsTrigger value="new" className="flex items-center">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite New User
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="existing" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="existing-email">Email Address</Label>
                      <Input
                        id="existing-email"
                        type="email"
                        value={borrowerEmail}
                        onChange={(e) => setBorrowerEmail(e.target.value)}
                        placeholder="borrower@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="existing-name">Full Name</Label>
                      <Input
                        id="existing-name"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="new" className="space-y-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Invite Someone New</h4>
                      <p className="text-sm text-blue-700">
                        We'll send them an invitation to join Lendit and accept your loan offer.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="new-email">Email Address</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={borrowerEmail}
                        onChange={(e) => setBorrowerEmail(e.target.value)}
                        placeholder="borrower@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-name">Full Name</Label>
                      <Input
                        id="new-name"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Loan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50000"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (months)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="1"
                      max="120"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="interest">Interest Rate (% annually)</Label>
                    <Input
                      id="interest"
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      min="0"
                      step="0.1"
                      placeholder="5.0"
                    />
                  </div>
                </div>
                  <div>
                  <Label htmlFor="purpose">Purpose of Loan</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="home_improvement">Home Improvement</SelectItem>
                      <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="conditions">Additional Terms & Conditions</Label>
                  <Textarea
                    id="conditions"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    placeholder="Any specific conditions or requirements..."
                    rows={3}
                  />
                </div>

                {/* Loan Summary */}
                {amount && duration && interestRate && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center text-green-800">
                        <FileText className="mr-2 h-5 w-5" />
                        Loan Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Principal Amount</p>
                          <p className="text-lg font-semibold">{formatCurrency(parseCurrency(amount) || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Interest</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(calculateTotalReturn() - (parseCurrency(amount) || 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Return</p>
                          <p className="text-xl font-bold text-green-800">
                            {formatCurrency(calculateTotalReturn())}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Monthly Payment</p>
                          <p className="text-lg font-semibold">
                            {duration ? formatCurrency(calculateTotalReturn() / parseFloat(duration)) : formatCurrency(0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>            {/* Payment Method */}
            <PaymentMethodInput
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              onPaymentDetails={setPaymentDetails}
              smartContract={smartContract}
              onSmartContractChange={setSmartContract}
              initialPaymentDetails={paymentDetails}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLoan}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading || !amount || !borrowerEmail || !borrowerName}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {borrowerType === 'new' ? 'Create & Send Invitation' : 'Create Loan Agreement'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>      {/* Success Modal for showing invitation details */}
      <Dialog open={showInvitation} onOpenChange={setShowInvitation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loan Proposal Sent Successfully!</DialogTitle>
          </DialogHeader>
          <InvitationSuccess
            agreementId={createdAgreementId}
            borrowerName={borrowerName}
            borrowerEmail={borrowerEmail}
            amount={parseCurrency(amount) || 0}
            interestRate={parseFloat(interestRate) || 0}
            duration={parseInt(duration) || 0}
            paymentMethod={paymentMethod}
            onClose={() => {
              setShowInvitation(false);
              resetForm();
              onOpenChange(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateLoanModal;
