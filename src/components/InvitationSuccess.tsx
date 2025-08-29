import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/utils/currency";
import { 
  CheckCircle, 
  Copy, 
  Mail, 
  Smartphone, 
  ExternalLink,
  Clock
} from "lucide-react";

interface InvitationSuccessProps {
  agreementId: string;
  borrowerName: string;
  borrowerEmail: string;
  amount: number;
  interestRate: number;
  duration: number;
  paymentMethod: string;
  onClose: () => void;
}

const InvitationSuccess = ({
  agreementId,
  borrowerName,
  borrowerEmail,
  amount,
  interestRate,
  duration,
  paymentMethod,
  onClose
}: InvitationSuccessProps) => {
  const inviteLink = `${window.location.origin}/loan-offer/${agreementId}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
  };

  const sendWhatsApp = () => {
    const message = `Hi ${borrowerName}! I've created a loan offer for you on Lendit. Amount: ${formatCurrency(amount)}, Interest: ${interestRate}%, Duration: ${duration} months. Please review and sign: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendEmail = () => {
    const subject = `Loan Offer - ${formatCurrency(amount)} at ${interestRate}% Interest`;
    const body = `Hi ${borrowerName},\n\nI've created a loan offer for you on Lendit with the following details:\n\nAmount: ${formatCurrency(amount)}\nInterest Rate: ${interestRate}% per annum\nDuration: ${duration} months\nPayment Method: ${paymentMethod}\n\nPlease review and digitally sign the agreement using this link:\n${inviteLink}\n\nBest regards`;
    
    window.open(`mailto:${borrowerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <CheckCircle className="mr-2 h-5 w-5" />
            Loan Proposal Created Successfully! 🎉
          </CardTitle>
          <CardDescription>
            Your loan offer has been created and is waiting for {borrowerName} to accept and sign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-2 font-semibold">{formatCurrency(amount)}</span>
            </div>
            <div>
              <span className="text-gray-500">Interest Rate:</span>
              <span className="ml-2 font-semibold">{interestRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Duration:</span>
              <span className="ml-2 font-semibold">{duration} months</span>
            </div>
            <div>
              <span className="text-gray-500">Payment Method:</span>
              <span className="ml-2 font-semibold">{paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> Share the invitation link with {borrowerName}. 
              Once they accept and digitally sign, your agreement will become active and the PDF will be generated.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share Invitation</CardTitle>
          <CardDescription>
            Send the loan offer to {borrowerName} ({borrowerEmail})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <input 
              type="text" 
              value={inviteLink} 
              readOnly 
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
            <Button size="sm" variant="outline" onClick={copyInviteLink}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>

          <div className="flex space-x-3">
            <Button onClick={sendEmail} variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button onClick={sendWhatsApp} variant="outline" className="flex-1">
              <Smartphone className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              onClick={() => window.open(inviteLink, '_blank')} 
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Link
            </Button>
          </div>

          <div className="text-center">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationSuccess;
