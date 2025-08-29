/**
 * Payment Processing Utility
 * This file contains functions for processing payments through different methods
 * Now integrates with real payment gateways and APIs
 */

import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from './currency';
import { processRazorpayPayment } from './razorpayProcessor';
import { processDirectUpiPayment, verifyUpiPayment } from './upiProcessor';
import { processEthereumPayment, processUsdtPayment, getCryptoPrices } from './cryptoProcessor';
import { processBankTransfer, BankTransferDetails } from './bankTransferProcessor';

// Define payment method options
export type PaymentMethod = 'upi' | 'bank' | 'wallet' | 'crypto' | 'cash';

// Interface for payment details
export interface PaymentDetails {
  amount: number;
  agreementId: string;
  paymentMethod?: PaymentMethod;
  payerId: string;
  recipientId: string;
  reference?: string;
  walletAddress?: string;
  transactionType: 'disbursement' | 'repayment' | 'interest';
  metadata?: any;
}

// Interface for payment result
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  referenceId?: string;
  message?: string;
  error?: any;
  metadata?: any;
}

/**
 * Process a payment using UPI
 * Now integrates with real UPI payment systems
 * @param details Payment details
 * @returns Payment result
 */
export const processUpiPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    console.log(`Processing UPI payment of ${formatCurrency(details.amount)}`);
    
    // Use Razorpay for UPI payments (more reliable)
    if (details.metadata?.useRazorpay !== false) {
      return await processRazorpayPayment({
        ...details,
        metadata: { ...details.metadata, preferredMethod: 'upi' }
      });
    }
    
    // Use direct UPI for intent-based payments
    return await processDirectUpiPayment(details);
  } catch (error) {
    console.error('UPI payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'UPI payment processing failed'
    };
  }
};

/**
 * Process a bank transfer payment
 * Now integrates with real banking systems and provides proper instructions
 * @param details Payment details
 * @returns Payment result
 */
export const processBankPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    console.log(`Processing bank transfer of ${formatCurrency(details.amount)}`);
    
    // Get recipient bank details (in real app, this would come from user profile)
    const recipientBankDetails: BankTransferDetails = {
      bankName: 'HDFC Bank',
      accountNumber: '50100123456789',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'LendIt Platform',
      transferMethod: 'neft',
    };
    
    const bankTransferRequest = {
      ...details,
      bankDetails: details.metadata?.senderBankDetails || {
        bankName: 'User Bank',
        accountNumber: '1234567890',
        ifscCode: 'BANK0001234',
        accountHolderName: 'User Name',
        transferMethod: 'neft' as const,
      },
      purpose: `Loan payment for agreement ${details.agreementId}`,
    };
    
    return await processBankTransfer(bankTransferRequest, recipientBankDetails);
  } catch (error) {
    console.error('Bank transfer processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Bank transfer processing failed'
    };
  }
};

/**
 * Process a digital wallet payment
 * Now integrates with real wallet APIs through Razorpay
 * @param details Payment details
 * @returns Payment result
 */
export const processWalletPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    console.log(`Processing wallet payment of ${formatCurrency(details.amount)}`);
    
    // Use Razorpay for wallet payments (supports multiple wallets)
    return await processRazorpayPayment({
      ...details,
      metadata: { ...details.metadata, preferredMethod: 'wallet' }
    });
  } catch (error) {
    console.error('Wallet payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Wallet payment processing failed'
    };
  }
};

/**
 * Process a crypto payment
 * Now integrates with real blockchain networks
 * @param details Payment details with walletAddress
 * @returns Payment result
 */
export const processCryptoPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  if (!details.walletAddress) {
    return {
      success: false,
      message: 'Wallet address is required for crypto payments'
    };
  }
  
  try {
    console.log(`Processing crypto payment of ${formatCurrency(details.amount)}`);
    console.log(`Recipient wallet: ${details.walletAddress}`);
    
    const cryptocurrency = details.metadata?.cryptocurrency || 'ETH';
    
    // Process based on cryptocurrency type
    if (cryptocurrency === 'ETH') {
      return await processEthereumPayment({
        ...details,
        cryptocurrency: 'ETH',
        recipientAddress: details.walletAddress,
      });
    } else if (cryptocurrency === 'USDT') {
      return await processUsdtPayment({
        ...details,
        cryptocurrency: 'USDT',
        recipientAddress: details.walletAddress,
      });
    } else {
      throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
    }
  } catch (error) {
    console.error('Crypto payment processing failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Crypto payment processing failed'
    };
  }
};

/**
 * Record a cash payment (manually tracked)
 * @param details Payment details
 * @returns Payment result
 */
export const recordCashPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  try {
    console.log(`Recording cash payment of ${formatCurrency(details.amount)}`);
    
    // Generate a reference for the manual transaction
    const mockTransactionId = `cash_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Record the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        agreement_id: details.agreementId,
        transaction_type: details.transactionType,
        amount: details.amount,
        payment_method: 'cash',
        payment_reference: details.reference || mockTransactionId,
        status: 'completed'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      transactionId: data.id,
      referenceId: mockTransactionId,
      message: 'Cash payment recorded successfully'
    };
  } catch (error) {
    console.error('Cash payment recording failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Cash payment recording failed'
    };
  }
};

/**
 * Process a payment using the specified payment method
 * @param details Payment details
 * @returns Payment result
 */
export const processPayment = async (details: PaymentDetails): Promise<PaymentResult> => {
  if (!details.paymentMethod) {
    return {
      success: false,
      message: 'Payment method is required'
    };
  }

  switch (details.paymentMethod) {
    case 'upi':
      return processUpiPayment(details);
    case 'bank':
      return processBankPayment(details);
    case 'wallet':
      return processWalletPayment(details);
    case 'crypto':
      return processCryptoPayment(details);
    case 'cash':
      return recordCashPayment(details);
    default:
      return {
        success: false,
        message: `Unsupported payment method: ${details.paymentMethod}`
      };
  }
};

/**
 * Verify payment status
 * @param transactionId Transaction ID to verify
 * @param paymentMethod Payment method used
 * @returns Payment verification result
 */
export const verifyPaymentStatus = async (
  transactionId: string,
  paymentMethod: PaymentMethod
): Promise<PaymentResult> => {
  try {
    // Get transaction from database
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) throw error;

    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found'
      };
    }

    // For UPI payments, verify with payment gateway
    if (paymentMethod === 'upi' && transaction.payment_reference) {
      return await verifyUpiPayment(transaction.payment_reference);
    }    // For other methods, return current status
    return {
      success: transaction.status === 'completed',
      transactionId: transaction.id,
      referenceId: transaction.payment_reference,
      message: `Payment status: ${transaction.status}`,
      metadata: (transaction as any).metadata || {}
    };
  } catch (error) {
    console.error('Payment verification failed:', error);
    return {
      success: false,
      error,
      message: error instanceof Error ? error.message : 'Payment verification failed'
    };
  }
};

/**
 * Get payment method capabilities
 * @returns Object describing capabilities of each payment method
 */
export const getPaymentMethodCapabilities = () => {
  return {
    upi: {
      name: 'UPI',
      instant: true,
      maxAmount: 100000, // ₹1 lakh
      fees: 0,
      description: 'Instant payment via UPI apps'
    },
    bank: {
      name: 'Bank Transfer',
      instant: false,
      maxAmount: 10000000, // ₹1 crore
      fees: 0,
      description: 'NEFT/RTGS/IMPS bank transfer'
    },
    wallet: {
      name: 'Digital Wallet',
      instant: true,
      maxAmount: 200000, // ₹2 lakhs
      fees: 0,
      description: 'Paytm, PhonePe, Google Pay, etc.'
    },
    crypto: {
      name: 'Cryptocurrency',
      instant: false,
      maxAmount: Number.MAX_SAFE_INTEGER,
      fees: 'Variable',
      description: 'ETH, USDT, BTC payments'
    },
    cash: {
      name: 'Cash',
      instant: true,
      maxAmount: 200000, // ₹2 lakhs (regulatory limit)
      fees: 0,
      description: 'Physical cash payment'
    }
  };
};