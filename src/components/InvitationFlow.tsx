
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Phone, 
  UserPlus, 
  Send, 
  CheckCircle,
  Clock
} from "lucide-react";

interface InvitationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId?: string;
  borrowerEmail?: string;
  borrowerName?: string;
}

export const InvitationFlow = ({ 
  open, 
  onOpenChange, 
  agreementId,
  borrowerEmail: initialEmail = '',
  borrowerName: initialName = ''
}: InvitationFlowProps) => {
  const [step, setStep] = useState<'details' | 'sending' | 'sent'>('details');
  const [borrowerName, setBorrowerName] = useState(initialName);
  const [borrowerEmail, setBorrowerEmail] = useState(initialEmail);
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const { toast } = useToast();

  const handleSendInvitation = async () => {
    if (!borrowerEmail || !borrowerName) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and email for the borrower.",
        variant: "destructive",
      });
      return;
    }

    setStep('sending');

    try {
      // Generate invitation token
      const invitationToken = crypto.randomUUID();
      
      // Save invitation to database
      const { error } = await supabase
        .from('invitations')
        .insert({
          agreement_id: agreementId,
          email: borrowerEmail,
          phone: borrowerPhone || null,
          invitation_token: invitationToken,
          status: 'sent'
        });

      if (error) throw error;

      // In a real app, you would send an actual email here
      // For now, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 2000));

      setStep('sent');
      
      toast({
        title: "Invitation Sent!",
        description: `Invitation has been sent to ${borrowerEmail}`,
      });

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
      setStep('details');
    }
  };

  const resetFlow = () => {
    setStep('details');
    setBorrowerName('');
    setBorrowerEmail('');
    setBorrowerPhone('');
    setPersonalMessage('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetFlow, 300); // Reset after dialog closes
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Invite Borrower
          </DialogTitle>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Borrower Information</CardTitle>
                <CardDescription>
                  We'll send them an invitation to join Lendit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="borrower-name">Full Name *</Label>
                  <Input
                    id="borrower-name"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="borrower-email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="borrower-email"
                      type="email"
                      value={borrowerEmail}
                      onChange={(e) => setBorrowerEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="borrower-phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="borrower-phone"
                      value={borrowerPhone}
                      onChange={(e) => setBorrowerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="personal-message">Personal Message (Optional)</Label>
                  <Textarea
                    id="personal-message"
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Hi! I'd like to offer you a loan through Lendit..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSendInvitation}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!borrowerName || !borrowerEmail}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            </div>
          </div>
        )}

        {step === 'sending' && (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Sending Invitation...</h3>
              <p className="text-gray-600">Please wait while we send the invitation to {borrowerEmail}</p>
            </div>
          </div>
        )}

        {step === 'sent' && (
          <div className="py-8 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-800">Invitation Sent!</h3>
              <p className="text-gray-600 mt-2">
                We've sent an invitation to <strong>{borrowerEmail}</strong>
              </p>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">What happens next?</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• {borrowerName} will receive an email invitation</li>
                      <li>• They can create an account and accept your loan offer</li>
                      <li>• You'll be notified once they respond</li>
                      <li>• The invitation expires in 7 days</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
