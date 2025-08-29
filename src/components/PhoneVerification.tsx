/**
 * Phone Verification Component for SMS notifications
 * Handles phone number verification for SMS notification setup
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { smsService } from "@/utils/smsService";
import { 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Loader2,
  Shield,
  AlertCircle
} from "lucide-react";

interface PhoneVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (phoneNumber: string) => void;
}

export const PhoneVerification = ({ 
  open, 
  onOpenChange, 
  onVerified 
}: PhoneVerificationProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string>(''); // For demo
  const { toast } = useToast();

  const formatPhoneNumber = (phone: string) => {
    // Format Indian phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    } else if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    return phone;
  };

  const handleSendCode = async () => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!formattedPhone.match(/^\+91\d{10}$/)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Indian phone number (10 digits).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate a simulated verification code for demo
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedCode(code);

      // In production, this would send real SMS
      const result = await smsService.sendSms(
        formattedPhone,
        `Your LendIt verification code is: ${code}. Do not share this code with anyone.`
      );

      if (result.success) {
        toast({
          title: "Verification Code Sent",
          description: `A 6-digit code has been sent to ${formattedPhone}. ${result.message}`,
        });
        setStep('verify');
      } else {
        throw new Error(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // In demo mode, check against simulated code
      // In production, verify against server-stored code
      if (verificationCode === simulatedCode || verificationCode === '123456') {
        // Save verified phone number to localStorage (in production: save to database)
        const userId = localStorage.getItem('userId') || 'current_user';
        const preferences = JSON.parse(localStorage.getItem(`notification_prefs_${userId}`) || '{}');
        
        const updatedPreferences = {
          ...preferences,
          phone_number: formatPhoneNumber(phoneNumber),
          phone_verified: true,
          sms_enabled: true
        };
        
        localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(updatedPreferences));

        toast({
          title: "Phone Verified! 📱",
          description: "Your phone number has been verified. SMS notifications are now enabled.",
        });

        onVerified(formatPhoneNumber(phoneNumber));
        onOpenChange(false);
        
        // Reset form
        setPhoneNumber('');
        setVerificationCode('');
        setStep('phone');
        setSimulatedCode('');
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setVerificationCode('');
    await handleSendCode();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Demo Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Demo Mode:</strong> In production, real SMS will be sent. 
              For demo, use code <code className="bg-blue-100 px-1 rounded">123456</code> or check console for generated code.
            </AlertDescription>
          </Alert>

          {step === 'phone' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enter Phone Number</CardTitle>
                <CardDescription>
                  We'll send you a verification code to enable SMS notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your 10-digit Indian mobile number
                  </p>
                </div>

                <Button 
                  onClick={handleSendCode}
                  disabled={loading || phoneNumber.length < 10}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enter Verification Code</CardTitle>
                <CardDescription>
                  Check your SMS for the 6-digit verification code
                  <br />
                  <Badge variant="outline" className="mt-2">
                    Sent to: {formatPhoneNumber(phoneNumber)}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="mt-1 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  {simulatedCode && (
                    <p className="text-xs text-gray-500 mt-1">
                      Demo code: <code className="bg-gray-100 px-1 rounded">{simulatedCode}</code>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleVerifyCode}
                    disabled={loading || verificationCode.length !== 6}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Verify
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    Resend
                  </Button>
                </div>

                <Button 
                  variant="ghost"
                  onClick={() => {
                    setStep('phone');
                    setVerificationCode('');
                    setSimulatedCode('');
                  }}
                  className="w-full"
                >
                  Change Phone Number
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="flex items-center gap-2 font-medium text-green-800 mb-2">
              <Shield className="h-4 w-4" />
              SMS Notification Benefits
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Instant payment reminders</li>
              <li>• Critical overdue alerts</li>
              <li>• Loan approval notifications</li>
              <li>• Enhanced security alerts</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
