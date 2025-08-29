import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { LoanAcceptanceModal } from "@/components/LoanAcceptanceModal";
import { formatCurrency } from "@/utils/currency";
import { 
  FileText, 
  CheckCircle, 
  X, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Percent,
  User
} from "lucide-react";

const LoanOfferPage = () => {
  const { agreementId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);

  useEffect(() => {
    if (agreementId) {
      fetchAgreement();
    }
  }, [agreementId]);

  const fetchAgreement = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Loan agreement not found');
        return;
      }

      if (data.status !== 'proposed') {
        setError(`This loan offer has already been ${data.status}`);
        return;
      }

      setAgreement(data);
    } catch (error) {
      console.error('Error fetching agreement:', error);
      setError('Failed to load loan agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = () => {
    setShowAcceptanceModal(true);
  };

  const handleOfferAccepted = () => {
    // Refresh the agreement data
    fetchAgreement();
    toast({
      title: "Success! 🎉",
      description: "You have successfully accepted the loan offer.",
    });
  };

  const handleOfferRejected = () => {
    // Refresh the agreement data
    fetchAgreement();
    toast({
      title: "Offer Declined",
      description: "You have declined this loan offer.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Agreement Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">The loan agreement could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Lendit</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Loan Offer Received
          </h1>
          <p className="text-gray-600">
            You have received a loan offer. Please review the terms below.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Lender Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                From: {agreement.lender_name || 'Lender'}
              </CardTitle>
              <CardDescription>
                Loan offer details and terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge 
                variant={agreement.status === 'proposed' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {agreement.status}
              </Badge>
            </CardContent>
          </Card>

          {/* Loan Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600 bg-green-100 rounded-full p-2" />
                  <div>
                    <p className="text-sm text-gray-600">Loan Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(agreement.amount)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Percent className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-2" />
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="text-xl font-bold">{agreement.interest_rate}% per year</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-purple-600 bg-purple-100 rounded-full p-2" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-xl font-bold">{agreement.duration_months} months</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-orange-600 bg-orange-100 rounded-full p-2" />
                  <div>
                    <p className="text-sm text-gray-600">Purpose</p>
                    <p className="text-lg font-semibold">{agreement.purpose || 'Personal loan'}</p>
                  </div>
                </div>
              </div>

              {agreement.conditions && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Special Conditions</p>
                  <p className="text-gray-900">{agreement.conditions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Total Amount to Repay</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(agreement.amount + (agreement.amount * agreement.interest_rate * agreement.duration_months / (100 * 12)))}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Principal + Interest over {agreement.duration_months} months
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              By accepting this loan, you agree to repay the full amount according to the agreed terms. 
              Please ensure you can meet the monthly payment obligations.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          {agreement.status === 'proposed' && (
            <div className="flex gap-4">
              <Button
                onClick={handleAcceptOffer}
                className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-3"
                size="lg"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Accept Loan Offer
              </Button>

              <Button
                variant="destructive"
                className="flex-1 text-lg py-3"
                size="lg"
                onClick={() => setShowAcceptanceModal(true)}
              >
                <X className="mr-2 h-5 w-5" />
                Decline Offer
              </Button>
            </div>
          )}

          {agreement.status !== 'proposed' && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-600">
                    This loan offer has been <span className="font-semibold capitalize">{agreement.status}</span>
                  </p>
                  {agreement.status === 'active' && (
                    <p className="text-green-600 mt-2">
                      ✓ The loan agreement is now active and binding
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Acceptance Modal */}
      <LoanAcceptanceModal
        open={showAcceptanceModal}
        onOpenChange={setShowAcceptanceModal}
        agreementId={agreementId || ''}
        agreement={agreement}
        onAccepted={handleOfferAccepted}
        onRejected={handleOfferRejected}
      />
    </div>
  );
};

export default LoanOfferPage;
