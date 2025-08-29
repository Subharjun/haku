/**
 * Payment Utilities for UPI Deep Links and Bank Transfer Facilitation
 * Handles Indian payment systems including UPI, NEFT, RTGS, IMPS
 */

export interface UpiPaymentData {
  payeeVpa: string; // UPI ID/VPA
  payeeName: string;
  amount: number;
  transactionNote?: string;
  transactionRef?: string;
  merchantCode?: string;
  currency?: string;
}

export interface BankTransferData {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  amount: number;
  reference: string;
  bankName?: string;
  transferMode?: 'NEFT' | 'RTGS' | 'IMPS';
}

/**
 * Generate UPI deep link for various UPI apps
 * Supports standard UPI URL scheme compatible with all major UPI apps
 */
export const generateUpiDeepLink = (data: UpiPaymentData): string => {
  const {
    payeeVpa,
    payeeName,
    amount,
    transactionNote = '',
    transactionRef = '',
    merchantCode = '',
    currency = 'INR'
  } = data;

  // Standard UPI URL format as per NPCI guidelines
  const upiUrl = new URL('upi://pay');
  upiUrl.searchParams.set('pa', payeeVpa); // Payee Address (UPI ID)
  upiUrl.searchParams.set('pn', payeeName); // Payee Name
  upiUrl.searchParams.set('am', amount.toString()); // Amount
  upiUrl.searchParams.set('cu', currency); // Currency
  
  if (transactionNote) {
    upiUrl.searchParams.set('tn', transactionNote); // Transaction Note
  }
  
  if (transactionRef) {
    upiUrl.searchParams.set('tr', transactionRef); // Transaction Reference
  }
  
  if (merchantCode) {
    upiUrl.searchParams.set('mc', merchantCode); // Merchant Code
  }

  return upiUrl.toString();
};

/**
 * Generate app-specific UPI deep links for better user experience
 */
export const generateAppSpecificUpiLinks = (data: UpiPaymentData) => {
  const baseData = {
    pa: data.payeeVpa,
    pn: data.payeeName,
    am: data.amount.toString(),
    cu: data.currency || 'INR',
    tn: data.transactionNote || '',
    tr: data.transactionRef || ''
  };

  const params = new URLSearchParams(baseData).toString();

  return {
    // Google Pay
    googlepay: `tez://upi/pay?${params}`,
    
    // PhonePe
    phonepe: `phonepe://pay?${params}`,
    
    // Paytm
    paytm: `paytmmp://pay?${params}`,
    
    // BHIM
    bhim: `bhim://pay?${params}`,
    
    // Amazon Pay
    amazonpay: `amazonpay://pay?${params}`,
    
    // Standard UPI (fallback)
    standard: `upi://pay?${params}`
  };
};

/**
 * Attempt to open UPI payment in available apps
 * Falls back through apps if primary app is not available
 */
export const initiateUpiPayment = (data: UpiPaymentData): Promise<boolean> => {
  return new Promise((resolve) => {
    const links = generateAppSpecificUpiLinks(data);
    
    // Try opening in order of preference
    const appOrder = ['googlepay', 'phonepe', 'paytm', 'bhim', 'standard'] as const;
    
    let currentAppIndex = 0;
    
    const tryNextApp = () => {
      if (currentAppIndex >= appOrder.length) {
        // All apps failed, try the standard UPI link as last resort
        window.location.href = links.standard;
        resolve(false);
        return;
      }
      
      const appName = appOrder[currentAppIndex];
      const link = links[appName];
      
      try {
        // Create invisible iframe to test if app is available
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = link;
        document.body.appendChild(iframe);
        
        // Remove iframe after attempting to open
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
        
        // If we get here without error, assume success
        resolve(true);
      } catch (error) {
        // Try next app
        currentAppIndex++;
        tryNextApp();
      }
    };
    
    tryNextApp();
  });
};

/**
 * Format bank transfer details for easy copying
 */
export const formatBankTransferDetails = (data: BankTransferData): string => {
  const {
    accountNumber,
    ifscCode,
    accountHolderName,
    amount,
    reference,
    bankName,
    transferMode = 'NEFT'
  } = data;

  return `
🏦 BANK TRANSFER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━

Account Number: ${accountNumber}
IFSC Code: ${ifscCode}
Account Holder: ${accountHolderName}
${bankName ? `Bank Name: ${bankName}` : ''}

💰 Amount: ₹${amount.toLocaleString('en-IN')}
📝 Reference: ${reference}
🔄 Mode: ${transferMode}

⚠️ Important Notes:
• Include the reference number in remarks
• Keep transaction receipt for proof
• Transfer may take 2-4 hours (NEFT) or instant (IMPS)
${transferMode === 'RTGS' ? '• RTGS minimum amount: ₹2,00,000' : ''}
  `.trim();
};

/**
 * Generate QR code data for UPI payments
 * Returns data that can be used with QR code libraries
 */
export const generateUpiQrData = (data: UpiPaymentData): string => {
  return generateUpiDeepLink(data);
};

/**
 * Validate UPI ID format
 */
export const validateUpiId = (upiId: string): boolean => {
  // UPI ID format: username@bankcode
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  return upiRegex.test(upiId);
};

/**
 * Validate IFSC code format
 */
export const validateIfscCode = (ifsc: string): boolean => {
  // IFSC format: 4 letters + 7 alphanumeric characters
  const ifscRegex = /^[A-Z]{4}[A-Z0-9]{7}$/;
  return ifscRegex.test(ifsc.toUpperCase());
};

/**
 * Validate Indian bank account number
 */
export const validateAccountNumber = (accountNumber: string): boolean => {
  // Account number: 9-18 digits
  const accountRegex = /^[0-9]{9,18}$/;
  return accountRegex.test(accountNumber);
};

/**
 * Get bank name from IFSC code
 * Returns bank name based on first 4 characters of IFSC
 */
export const getBankNameFromIfsc = (ifsc: string): string => {
  const bankCodes: { [key: string]: string } = {
    'HDFC': 'HDFC Bank',
    'ICIC': 'ICICI Bank',
    'SBIN': 'State Bank of India',
    'AXIS': 'Axis Bank',
    'KKBK': 'Kotak Mahindra Bank',
    'YESB': 'Yes Bank',
    'INDB': 'Indian Bank',
    'PUNB': 'Punjab National Bank',
    'UTIB': 'Axis Bank',
    'BARB': 'Bank of Baroda',
    'CNRB': 'Canara Bank',
    'IOBA': 'Indian Overseas Bank',
    'VIJB': 'Vijaya Bank',
    'CORP': 'Corporation Bank',
    'UBIN': 'Union Bank of India',
    'MAHB': 'Bank of Maharashtra',
    'ANDB': 'Andhra Bank',
    'ALLA': 'Allahabad Bank',
    'CBIN': 'Central Bank of India',
    'IDIB': 'Indian Bank',
    'ORBC': 'Oriental Bank of Commerce',
    'PSIB': 'Punjab & Sind Bank',
    'SRCB': 'Saraswat Cooperative Bank',
    'TMBL': 'Tamilnad Mercantile Bank',
    'TNSC': 'Tamil Nadu State Cooperative Bank',
    'UCBA': 'UCO Bank',
    'VSBL': 'Vishweshwar Bank'
  };

  const bankCode = ifsc.substring(0, 4).toUpperCase();
  return bankCodes[bankCode] || 'Unknown Bank';
};

/**
 * Calculate transfer time and fees based on amount and mode
 */
export const getTransferInfo = (amount: number, mode: 'NEFT' | 'RTGS' | 'IMPS') => {
  const info = {
    NEFT: {
      minAmount: 1,
      maxAmount: 1000000000, // No upper limit
      processingTime: '2-4 hours (batch processing)',
      workingHours: 'Monday to Friday, 8 AM to 7 PM',
      fees: amount <= 10000 ? 2.5 : amount <= 100000 ? 5 : amount <= 200000 ? 15 : 25
    },
    RTGS: {
      minAmount: 200000,
      maxAmount: 1000000000, // No upper limit
      processingTime: '30 minutes (real-time)',
      workingHours: 'Monday to Friday, 9 AM to 4:30 PM',
      fees: amount <= 500000 ? 30 : 55
    },
    IMPS: {
      minAmount: 1,
      maxAmount: 200000,
      processingTime: 'Instant (24x7)',
      workingHours: 'Available 24x7',
      fees: amount <= 10000 ? 5 : amount <= 25000 ? 5 : amount <= 100000 ? 15 : 25
    }
  };

  return info[mode];
};

/**
 * Suggest best transfer mode based on amount and urgency
 */
export const suggestTransferMode = (amount: number, urgent: boolean = false): {
  recommended: 'NEFT' | 'RTGS' | 'IMPS';
  reason: string;
  alternatives: string[];
} => {
  if (amount >= 200000) {
    return {
      recommended: 'RTGS',
      reason: 'Large amount transfers are best done via RTGS for security and speed',
      alternatives: urgent ? [] : ['NEFT for lower fees (if not urgent)']
    };
  }

  if (urgent || amount <= 200000) {
    return {
      recommended: 'IMPS',
      reason: urgent ? 'Instant transfer available 24x7' : 'Best balance of speed and fees',
      alternatives: ['NEFT for lower fees (2-4 hours delay)']
    };
  }

  return {
    recommended: 'NEFT',
    reason: 'Most economical option for non-urgent transfers',
    alternatives: ['IMPS for instant transfer (higher fees)', 'RTGS for large amounts (₹2L+)']
  };
};

/**
 * Test UPI ID with dummy transaction (for validation)
 */
export const testUpiId = async (upiId: string): Promise<{ valid: boolean; message: string }> => {
  // This would typically make an API call to validate UPI ID
  // For now, we'll do basic format validation
  
  if (!validateUpiId(upiId)) {
    return {
      valid: false,
      message: 'Invalid UPI ID format. Should be like user@bankname'
    };
  }

  // Simulate API validation delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real implementation, this would check with UPI servers
  return {
    valid: true,
    message: 'UPI ID format is valid'
  };
};
