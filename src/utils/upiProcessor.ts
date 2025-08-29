/**
 * UPI Payment Processor
 * Handles direct UPI payments and UPI intent generation
 */

import { PaymentDetails, PaymentResult } from './paymentProcessing';
import { paymentConfig } from '../config/paymentConfig';
import { supabase } from '@/integrations/supabase/client';

export interface UpiPaymentRequest {
  vpa: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  transactionRef: string;
}

/**
 * Generate UPI payment intent URL
 */
export const generateUpiIntent = (request: UpiPaymentRequest): string => {
  const params = new URLSearchParams({
    pa: request.vpa,
    pn: request.payeeName,
    am: request.amount.toString(),
    tn: request.transactionNote,
    tr: request.transactionRef,
    cu: 'INR',
  });

  return `upi://pay?${params.toString()}`;
};

/**
 * Generate UPI QR code data
 */
export const generateUpiQrData = (request: UpiPaymentRequest): string => {
  const params = new URLSearchParams({
    pa: request.vpa,
    pn: request.payeeName,
    am: request.amount.toString(),
    tn: request.transactionNote,
    tr: request.transactionRef,
    cu: 'INR',
  });

  return `upi://pay?${params.toString()}`;
};

/**
 * Process direct UPI payment
 */
export const processDirectUpiPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    const transactionRef = `UPI_${details.agreementId}_${Date.now()}`;
    
    const upiRequest: UpiPaymentRequest = {
      vpa: paymentConfig.upi.vpa,
      payeeName: paymentConfig.upi.merchantName,
      amount: details.amount,
      transactionNote: `Loan payment for agreement ${details.agreementId}`,
      transactionRef,
    };

    // Generate UPI intent
    const upiIntent = generateUpiIntent(upiRequest);
    const qrData = generateUpiQrData(upiRequest);

    // Create pending transaction record
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'upi',
        payment_reference: transactionRef,
        status: 'pending',
        metadata: {
          upi_intent: upiIntent,
          qr_data: qrData,
          vpa: paymentConfig.upi.vpa,
        },
      })
      .select()
      .single();

    if (error) throw error;

    // Return payment result with UPI details
    return {
      success: true,
      transactionId: transaction.id,
      referenceId: transactionRef,
      message: 'UPI payment initiated. Please complete payment using your UPI app.',
      metadata: {
        upiIntent,
        qrData,
        vpa: paymentConfig.upi.vpa,
        amount: details.amount,
        transactionRef,
      },
    };
  } catch (error) {
    console.error('Direct UPI payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'UPI payment processing failed',
    };
  }
};

/**
 * Verify UPI payment status
 * This would typically be called by a webhook or polling mechanism
 */
export const verifyUpiPayment = async (transactionRef: string): Promise<PaymentResult> => {
  try {
    // In a real implementation, this would call the payment gateway API
    // to check the status of the UPI payment
    
    // For now, we'll check our database for any updates
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_reference', transactionRef)
      .single();

    if (error) throw error;

    if (transaction.status === 'completed') {
      return {
        success: true,
        transactionId: transaction.id,
        referenceId: transactionRef,
        message: 'UPI payment verified successfully',
      };
    } else if (transaction.status === 'failed') {
      return {
        success: false,
        message: 'UPI payment failed',
      };
    } else {
      return {
        success: false,
        message: 'UPI payment still pending',
      };
    }
  } catch (error) {
    console.error('UPI payment verification failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'UPI payment verification failed',
    };
  }
};
