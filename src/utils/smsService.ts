/**
 * SMS Notification Service for LendIt Platform
 * Provides SMS capabilities using Twilio for critical notifications
 */

export interface SmsConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryStatus?: 'sent' | 'delivered' | 'failed';
}

export interface SmsTemplateData {
  borrowerName: string;
  lenderName?: string;
  amount: number;
  dueDate?: string;
  daysPastDue?: number;
  appUrl?: string;
}

/**
 * SMS Service class for sending notifications
 * Currently uses simulated SMS for demo - replace with real Twilio in production
 */
class SmsService {
  private fromNumber: string;
  private enabled: boolean;

  constructor(config: SmsConfig) {
    this.fromNumber = config.fromNumber;
    this.enabled = !!(config.accountSid && config.authToken);
    
    if (!this.enabled) {
      console.warn('SMS service not configured - using simulation mode');
    }
  }

  /**
   * Send a basic SMS message
   */
  async sendSms(to: string, message: string): Promise<SmsResult> {
    try {
      // Simulate SMS sending for demo
      console.log('📱 SMS Simulation:', { to, message, from: this.fromNumber });
      
      // In production, replace with:
      /*
      const client = twilio(accountSid, authToken);
      const result = await client.messages.create({
        from: this.fromNumber,
        to: to,
        body: message
      });
      
      return {
        success: true,
        messageId: result.sid,
        deliveryStatus: 'sent'
      };
      */

      // Simulate success response
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveryStatus: 'sent'
      };

    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveryStatus: 'failed'
      };
    }
  }

  /**
   * Send payment reminder SMS
   */
  async sendPaymentReminder(to: string, data: SmsTemplateData): Promise<SmsResult> {
    const dueDate = data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN') : 'soon';
    
    const message = `🔔 Payment Reminder\n\nHi ${data.borrowerName},\n\nYour payment of ₹${data.amount.toLocaleString()} to ${data.lenderName || 'your lender'} is due on ${dueDate}.\n\nPay now via LendIt app to avoid late fees.\n\n${data.appUrl || 'https://lendit.app'}`;
    
    return this.sendSms(to, message);
  }

  /**
   * Send overdue payment alert SMS
   */
  async sendOverdueAlert(to: string, data: SmsTemplateData): Promise<SmsResult> {
    const daysPastDue = data.daysPastDue || 1;
    
    const message = `⚠️ URGENT: Payment Overdue\n\nHi ${data.borrowerName},\n\nYour payment of ₹${data.amount.toLocaleString()} to ${data.lenderName || 'your lender'} is ${daysPastDue} day(s) overdue.\n\nPlease pay immediately to avoid additional charges.\n\n${data.appUrl || 'https://lendit.app'}`;
    
    return this.sendSms(to, message);
  }

  /**
   * Send loan approval notification SMS
   */
  async sendLoanApproval(to: string, data: SmsTemplateData): Promise<SmsResult> {
    const message = `🎉 Loan Approved!\n\nHi ${data.borrowerName},\n\n${data.lenderName || 'A lender'} has approved your loan of ₹${data.amount.toLocaleString()}!\n\nCheck your LendIt app for next steps.\n\n${data.appUrl || 'https://lendit.app'}`;
    
    return this.sendSms(to, message);
  }

  /**
   * Send loan request notification SMS
   */
  async sendLoanRequest(to: string, data: SmsTemplateData): Promise<SmsResult> {
    const message = `💰 New Loan Request\n\nHi ${data.lenderName},\n\n${data.borrowerName} has requested a loan of ₹${data.amount.toLocaleString()}.\n\nReview and respond in your LendIt app.\n\n${data.appUrl || 'https://lendit.app'}`;
    
    return this.sendSms(to, message);
  }

  /**
   * Send loan funding confirmation SMS
   */
  async sendFundingConfirmation(to: string, data: SmsTemplateData): Promise<SmsResult> {
    const message = `✅ Loan Funded\n\nHi ${data.borrowerName},\n\nYour loan of ₹${data.amount.toLocaleString()} has been funded by ${data.lenderName || 'your lender'}!\n\nFunds should be in your account shortly.\n\n${data.appUrl || 'https://lendit.app'}`;
    
    return this.sendSms(to, message);
  }

  /**
   * Send OTP for phone verification
   */
  async sendOtp(to: string, otp: string): Promise<SmsResult> {
    const message = `Your LendIt verification code is: ${otp}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.`;
    
    return this.sendSms(to, message);
  }

  /**
   * Check if SMS service is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get service status information
   */
  getStatus() {
    return {
      enabled: this.enabled,
      fromNumber: this.fromNumber,
      mode: this.enabled ? 'production' : 'simulation'
    };
  }
}

// Configuration from environment variables
const smsConfig: SmsConfig = {
  accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
  authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
  fromNumber: import.meta.env.VITE_TWILIO_FROM_NUMBER || '+1234567890'
};

// Export singleton instance
export const smsService = new SmsService(smsConfig);

// Export helper functions for common use cases
export const sendPaymentReminderSms = (to: string, data: SmsTemplateData) => 
  smsService.sendPaymentReminder(to, data);

export const sendLoanApprovalSms = (to: string, data: SmsTemplateData) => 
  smsService.sendLoanApproval(to, data);

export const sendOverdueAlertSms = (to: string, data: SmsTemplateData) => 
  smsService.sendOverdueAlert(to, data);

export const sendOtpSms = (to: string, otp: string) => 
  smsService.sendOtp(to, otp);
