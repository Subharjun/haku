/**
 * Email notification utilities for LendIt platform
 * Provides easy-to-use functions for sending various email notifications
 */

export interface EmailTemplateData {
  borrowerName: string;
  borrowerEmail: string;
  lenderName?: string;
  lenderEmail?: string;
  amount: number;
  purpose: string;
  duration: number;
  interestRate?: number;
  requestId: string;
  appUrl: string;
}

export type EmailType = 'loanRequestCreated' | 'loanRequestClaimed' | 'contractReady';

/**
 * Send an email notification using our serverless API
 */
export async function sendEmail(
  type: EmailType,
  to: string | string[],
  data: EmailTemplateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        to,
        data
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return { success: true };

  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send notification when a new loan request is created
 */
export async function notifyLoanRequestCreated(data: {
  borrowerName: string;
  borrowerEmail: string;
  amount: number;
  purpose: string;
  duration: number;
  interestRate?: number;
  requestId: string;
  recipients?: string[]; // Optional: specific people to notify
}) {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  
  // If no specific recipients, we could integrate with a contacts system later
  // For now, we'll just log that a request was created
  if (!data.recipients || data.recipients.length === 0) {
    console.log('Loan request created, but no specific recipients to notify');
    return { success: true };
  }

  return sendEmail('loanRequestCreated', data.recipients, {
    borrowerName: data.borrowerName,
    borrowerEmail: data.borrowerEmail,
    amount: data.amount,
    purpose: data.purpose,
    duration: data.duration,
    interestRate: data.interestRate,
    requestId: data.requestId,
    appUrl
  });
}

/**
 * Send notification when a lender claims/accepts a loan request
 */
export async function notifyLoanRequestClaimed(data: {
  borrowerName: string;
  borrowerEmail: string;
  lenderName: string;
  lenderEmail: string;
  amount: number;
  purpose: string;
  duration: number;
  requestId: string;
}) {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  
  return sendEmail('loanRequestClaimed', data.borrowerEmail, {
    borrowerName: data.borrowerName,
    borrowerEmail: data.borrowerEmail,
    lenderName: data.lenderName,
    lenderEmail: data.lenderEmail,
    amount: data.amount,
    purpose: data.purpose,
    duration: data.duration,
    requestId: data.requestId,
    appUrl
  });
}

/**
 * Send notification when both parties have signed and contract is deployed
 */
export async function notifyContractReady(data: {
  borrowerName: string;
  borrowerEmail: string;
  lenderName: string;
  lenderEmail: string;
  amount: number;
  purpose: string;
  duration: number;
  requestId: string;
}) {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  
  // Send to both borrower and lender
  return sendEmail('contractReady', [data.borrowerEmail, data.lenderEmail], {
    borrowerName: data.borrowerName,
    borrowerEmail: data.borrowerEmail,
    lenderName: data.lenderName,
    lenderEmail: data.lenderEmail,
    amount: data.amount,
    purpose: data.purpose,
    duration: data.duration,
    requestId: data.requestId,
    appUrl
  });
}
