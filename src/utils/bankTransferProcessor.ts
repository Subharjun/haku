/**
 * Bank Transfer Payment Processor
 * Handles bank transfers through various methods
 */

import { PaymentDetails, PaymentResult } from './paymentProcessing';
import { supabase } from '@/integrations/supabase/client';

export interface BankTransferDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  transferMethod: 'neft' | 'rtgs' | 'imps';
}

export interface BankTransferRequest extends PaymentDetails {
  bankDetails: BankTransferDetails;
  purpose: string;
}

/**
 * Validate bank account details
 */
export const validateBankDetails = (details: BankTransferDetails): boolean => {
  // Basic validation
  if (!details.accountNumber || details.accountNumber.length < 9) {
    return false;
  }
  
  if (!details.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(details.ifscCode)) {
    return false;
  }
  
  if (!details.accountHolderName || details.accountHolderName.length < 2) {
    return false;
  }
  
  return true;
};

/**
 * Generate bank transfer instructions
 */
export const generateTransferInstructions = (
  request: BankTransferRequest,
  recipientBankDetails: BankTransferDetails
): {
  instructions: string[];
  reference: string;
  estimatedTime: string;
} => {
  const reference = `LOAN_${request.agreementId}_${Date.now()}`;
  
  let estimatedTime = '2-4 hours';
  if (request.bankDetails.transferMethod === 'rtgs') {
    estimatedTime = '30 minutes - 2 hours';
  } else if (request.bankDetails.transferMethod === 'imps') {
    estimatedTime = '5-10 minutes';
  }
  
  const instructions = [
    `Transfer Amount: ₹${request.amount.toLocaleString('en-IN')}`,
    `Recipient Bank: ${recipientBankDetails.bankName}`,
    `Account Number: ${recipientBankDetails.accountNumber}`,
    `IFSC Code: ${recipientBankDetails.ifscCode}`,
    `Account Holder: ${recipientBankDetails.accountHolderName}`,
    `Transfer Method: ${request.bankDetails.transferMethod.toUpperCase()}`,
    `Purpose: Loan Payment - ${request.purpose}`,
    `Reference: ${reference}`,
    `Estimated Time: ${estimatedTime}`,
  ];
  
  return {
    instructions,
    reference,
    estimatedTime,
  };
};

/**
 * Process bank transfer payment
 */
export const processBankTransfer = async (
  request: BankTransferRequest,
  recipientBankDetails: BankTransferDetails
): Promise<PaymentResult> => {
  try {
    // Validate bank details
    if (!validateBankDetails(request.bankDetails)) {
      throw new Error('Invalid bank details provided');
    }
    
    if (!validateBankDetails(recipientBankDetails)) {
      throw new Error('Invalid recipient bank details');
    }
    
    // Generate transfer instructions
    const { instructions, reference, estimatedTime } = generateTransferInstructions(
      request,
      recipientBankDetails
    );
    
    // Create pending transaction record
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: request.agreementId,
        transaction_type: request.transactionType,
        amount: request.amount,
        payment_method: 'bank',
        payment_reference: reference,
        status: 'pending',
        metadata: {
          transfer_method: request.bankDetails.transferMethod,
          sender_bank: request.bankDetails,
          recipient_bank: recipientBankDetails,
          instructions,
          estimated_time: estimatedTime,
          purpose: request.purpose,
        },
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      transactionId: transaction.id,
      referenceId: reference,
      message: `Bank transfer initiated. Please complete the transfer using the provided instructions.`,
      metadata: {
        instructions,
        reference,
        estimatedTime,
        transferMethod: request.bankDetails.transferMethod,
      },
    };
  } catch (error) {
    console.error('Bank transfer processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Bank transfer processing failed',
    };
  }
};

/**
 * Verify bank transfer
 * This would typically be called when the recipient confirms payment receipt
 */
export const verifyBankTransfer = async (
  transactionRef: string,
  bankTransactionId?: string
): Promise<PaymentResult> => {
  try {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_reference', transactionRef)
      .single();
    
    if (error) throw error;
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
      // Update transaction with bank transaction ID and mark as completed
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        metadata: {
          transfer_method: (transaction as any).metadata?.transfer_method,
          sender_bank: (transaction as any).metadata?.sender_bank,
          recipient_bank: (transaction as any).metadata?.recipient_bank,
          instructions: (transaction as any).metadata?.instructions,
          estimated_time: (transaction as any).metadata?.estimated_time,
          purpose: (transaction as any).metadata?.purpose,
          bank_transaction_id: bankTransactionId,
          verified_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id);
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      transactionId: transaction.id,
      referenceId: transactionRef,
      message: 'Bank transfer verified successfully',
      metadata: {
        bankTransactionId,
      },
    };
  } catch (error) {
    console.error('Bank transfer verification failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Bank transfer verification failed',
    };
  }
};

/**
 * Get supported transfer methods based on amount
 */
export const getSupportedTransferMethods = (amount: number): string[] => {
  const methods = ['neft', 'imps'];
  
  // RTGS is typically for amounts above ₹2 lakhs
  if (amount >= 200000) {
    methods.push('rtgs');
  }
  
  return methods;
};

/**
 * Get transfer limits for different methods
 */
export const getTransferLimits = () => {
  return {
    neft: {
      min: 1,
      max: 1000000, // ₹10 lakhs
      timing: '24x7',
    },
    rtgs: {
      min: 200000, // ₹2 lakhs
      max: 10000000, // ₹1 crore
      timing: 'Banking hours (9 AM - 4:30 PM)',
    },
    imps: {
      min: 1,
      max: 500000, // ₹5 lakhs
      timing: '24x7',
    },
  };
};
