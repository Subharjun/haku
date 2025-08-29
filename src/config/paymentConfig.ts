/**
 * Payment Gateway Configuration
 * This file contains configuration for various payment gateways
 * Uses sandbox/test keys for development
 */

export interface PaymentConfig {
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    testMode: boolean;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    testMode: boolean;
  };
  paytm: {
    merchantId: string;
    merchantKey: string;
    website: string;
    industryType: string;
    testMode: boolean;
  };
  upi: {
    vpa: string; // Virtual Payment Address for receiving UPI payments
    merchantName: string;
    testMode: boolean;
    testVpas: string[];
  };
}

// Environment-based configuration
export const paymentConfig: PaymentConfig = {
  razorpay: {
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
    keySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '',
    webhookSecret: import.meta.env.VITE_RAZORPAY_WEBHOOK_SECRET || '',
    testMode: true
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx',
    secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
    webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
    testMode: true
  },
  paytm: {
    merchantId: import.meta.env.VITE_PAYTM_MERCHANT_ID || 'TESTMERCHANTID',
    merchantKey: import.meta.env.VITE_PAYTM_MERCHANT_KEY || 'TESTMERCHANTKEY',
    website: import.meta.env.VITE_PAYTM_WEBSITE || 'WEBSTAGING',
    industryType: import.meta.env.VITE_PAYTM_INDUSTRY_TYPE || 'Retail',
    testMode: true
  },
  upi: {
    vpa: import.meta.env.VITE_UPI_VPA || 'lendit@ybl',
    merchantName: import.meta.env.VITE_UPI_MERCHANT_NAME || 'LendIt Platform',
    testMode: true,
    testVpas: [
      'success@upi',
      'failure@upi',
      'pending@upi'
    ]
  },
};

// Payment sandbox test data and instructions
export const PAYMENT_TEST_DATA = {
  cards: [
    { number: '4111 1111 1111 1111', expiryMonth: '12', expiryYear: '29', cvv: '123', type: 'visa', name: 'Test Card (Success)' },
    { number: '5555 5555 5555 4444', expiryMonth: '12', expiryYear: '29', cvv: '123', type: 'mastercard', name: 'Test Card (Success)' },
    { number: '4000 0000 0000 0002', expiryMonth: '12', expiryYear: '29', cvv: '123', type: 'visa', name: 'Test Card (Declined)' }
  ],
  upi: {
    success: 'success@razorpay',
    failure: 'failure@razorpay',
    pending: 'pending@razorpay',
    test_id: 'test@paytm'
  },
  bank: {
    accountNumber: '1112220001',
    ifsc: 'HDFC0000001',
    name: 'Test User'
  },
  wallet: {
    phoneNumber: '9999999999',
    provider: 'paytm'
  }
};

// Test mode instructions for users
export const PAYMENT_TEST_INSTRUCTIONS = {
  razorpay: {
    title: 'Razorpay Test Mode',
    description: 'This is running in test mode. No real money will be charged.',
    instructions: [
      'Use any test card: 4111 1111 1111 1111 (Visa)',
      'Use any CVV (e.g., 123) and future expiry date',
      'For UPI, use success@razorpay for successful payment',
      'Use failure@razorpay to simulate payment failure'
    ]
  },
  upi: {
    title: 'UPI Test Mode',
    description: 'Simulated UPI payments - no real transactions',
    instructions: [
      'Use success@razorpay for successful payment simulation',
      'Use failure@razorpay for failed payment simulation',
      'Any other UPI ID will show pending status'
    ]
  },
  bank: {
    title: 'Bank Transfer Simulation',
    description: 'Shows bank transfer instructions - no real transfer',
    instructions: [
      'This will show you bank transfer details',
      'No actual money transfer happens in test mode',
      'Use account: 1112220001, IFSC: HDFC0000001'
    ]
  },
  crypto: {
    title: 'Cryptocurrency Test Mode',
    description: 'Simulated crypto payments using test networks',
    instructions: [
      'Use test wallet addresses only',
      'Ethereum testnet: Use Sepolia or Goerli networks',
      'Bitcoin testnet: Use testnet addresses only'
    ]
  }
};

// API endpoints
export const API_ENDPOINTS = {
  razorpay: 'https://api.razorpay.com/v1',
  stripe: 'https://api.stripe.com/v1',
  paytm: {
    staging: 'https://securegw-stage.paytm.in',
    production: 'https://securegw.paytm.in',
  },
};

// Currency codes
export const CURRENCY_CODES = {
  INR: 'INR',
  USD: 'USD',
  ETH: 'ETH',
  BTC: 'BTC',
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CODES;
