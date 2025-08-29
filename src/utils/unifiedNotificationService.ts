/**
 * Unified Notification Service for LendIt Platform
 * Orchestrates email, SMS, and push notifications based on user preferences
 */

import { smsService, SmsTemplateData } from './smsService';
import { pushNotificationService } from './pushNotificationService';
import { sendEmail, EmailType, EmailTemplateData } from './emailNotifications';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  phone_verified: boolean;
  phone_number?: string;
  payment_reminders: boolean;
  loan_offers: boolean;
  status_updates: boolean;
  marketing: boolean;
  reminder_days: number;
}

export interface NotificationData {
  userId: string;
  type: 'payment_reminder' | 'loan_approval' | 'loan_request' | 'overdue_alert' | 'funding_confirmation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  borrowerName: string;
  lenderName?: string;
  amount: number;
  dueDate?: string;
  daysPastDue?: number;
  requestId?: string;
  borrowerEmail?: string;
  lenderEmail?: string;
  purpose?: string;
  duration?: number;
}

export interface NotificationResult {
  success: boolean;
  channels: {
    email?: { success: boolean; error?: string };
    sms?: { success: boolean; error?: string };
    push?: { success: boolean; error?: string };
  };
  totalChannels: number;
  successfulChannels: number;
}

/**
 * Unified Notification Service
 * Routes notifications to appropriate channels based on user preferences and priority
 */
class UnifiedNotificationService {
  private appUrl: string;

  constructor() {
    this.appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  }

  /**
   * Send notification through multiple channels
   */
  async sendNotification(data: NotificationData): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      channels: {},
      totalChannels: 0,
      successfulChannels: 0
    };

    try {
      // Get user notification preferences
      const preferences = await this.getUserPreferences(data.userId);
      
      // Determine which channels to use based on type and priority
      const channels = this.getChannelsForNotification(data.type, data.priority, preferences);
      
      result.totalChannels = channels.length;

      // Send through each channel
      for (const channel of channels) {
        try {
          switch (channel) {
            case 'email':
              result.channels.email = await this.sendEmailNotification(data, preferences);
              break;
            case 'sms':
              result.channels.sms = await this.sendSmsNotification(data, preferences);
              break;
            case 'push':
              result.channels.push = await this.sendPushNotification(data);
              break;
          }

          if (result.channels[channel as keyof typeof result.channels]?.success) {
            result.successfulChannels++;
          }
        } catch (error) {
          console.error(`Failed to send ${channel} notification:`, error);
          result.channels[channel as keyof typeof result.channels] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      result.success = result.successfulChannels > 0;

      // Log notification attempt
      await this.logNotificationAttempt(data, result);

      return result;

    } catch (error) {
      console.error('Unified notification service error:', error);
      return {
        success: false,
        channels: {},
        totalChannels: 0,
        successfulChannels: 0
      };
    }
  }
  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // For now, use localStorage (in production, implement proper user preferences table)
      const saved = localStorage.getItem(`notification_prefs_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }

      // Return default preferences
      return {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        phone_verified: false,
        payment_reminders: true,
        loan_offers: true,
        status_updates: true,
        marketing: false,
        reminder_days: 3
      };

    } catch (error) {
      console.error('Error getting user preferences:', error);
      // Return safe defaults
      return {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: false,
        phone_verified: false,
        payment_reminders: true,
        loan_offers: true,
        status_updates: true,
        marketing: false,
        reminder_days: 3
      };
    }
  }
  /**
   * Determine which channels to use for a notification
   */
  private getChannelsForNotification(
    type: string,
    priority: string,
    preferences: NotificationPreferences
  ): ('email' | 'sms' | 'push')[] {
    const channels: ('email' | 'sms' | 'push')[] = [];

    // Check user preferences for notification type
    const typeEnabled = {
      payment_reminder: preferences.payment_reminders,
      loan_approval: preferences.loan_offers,
      loan_request: preferences.loan_offers,
      overdue_alert: preferences.payment_reminders,
      funding_confirmation: preferences.status_updates
    }[type] ?? true;

    if (!typeEnabled) {
      return []; // User has disabled this notification type
    }

    // Add channels based on preferences and priority
    if (preferences.email_enabled) {
      channels.push('email');
    }

    // For critical notifications, always try SMS if phone is verified
    if (priority === 'critical' && preferences.phone_verified && preferences.phone_number) {
      channels.push('sms');
    } else if (preferences.sms_enabled && preferences.phone_verified && preferences.phone_number) {
      channels.push('sms');
    }

    // Add push notifications if enabled
    if (preferences.push_enabled) {
      channels.push('push');
    }

    // Ensure critical notifications have at least one channel
    if (priority === 'critical' && channels.length === 0) {
      channels.push('email'); // Fallback to email for critical notifications
    }    return channels;
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    data: NotificationData,
    preferences: NotificationPreferences
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!data.borrowerEmail && !data.lenderEmail) {
        return { success: false, error: 'No email address provided' };
      }

      const emailData: EmailTemplateData = {
        borrowerName: data.borrowerName,
        borrowerEmail: data.borrowerEmail || '',
        lenderName: data.lenderName,
        lenderEmail: data.lenderEmail,
        amount: data.amount,
        purpose: data.purpose || 'Personal loan',
        duration: data.duration || 12,
        requestId: data.requestId || '',
        appUrl: this.appUrl
      };

      const emailType = this.getEmailType(data.type);
      const recipient = data.borrowerEmail || data.lenderEmail || '';

      const result = await sendEmail(emailType, recipient, emailData);
      
      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed'
      };
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(
    data: NotificationData,
    preferences: NotificationPreferences
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!preferences.phone_number) {
        return { success: false, error: 'No phone number configured' };
      }

      const smsData: SmsTemplateData = {
        borrowerName: data.borrowerName,
        lenderName: data.lenderName,
        amount: data.amount,
        dueDate: data.dueDate,
        daysPastDue: data.daysPastDue,
        appUrl: this.appUrl
      };

      let result;
      switch (data.type) {
        case 'payment_reminder':
          result = await smsService.sendPaymentReminder(preferences.phone_number, smsData);
          break;
        case 'loan_approval':
          result = await smsService.sendLoanApproval(preferences.phone_number, smsData);
          break;
        case 'overdue_alert':
          result = await smsService.sendOverdueAlert(preferences.phone_number, smsData);
          break;
        case 'funding_confirmation':
          result = await smsService.sendFundingConfirmation(preferences.phone_number, smsData);
          break;
        default:
          result = await smsService.sendSms(
            preferences.phone_number,
            `LendIt: ${data.borrowerName}, you have a new notification. Check your app for details.`
          );
      }

      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed'
      };
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(data: NotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      let result;
      
      switch (data.type) {
        case 'payment_reminder':
          result = await pushNotificationService.sendPaymentReminder({
            borrowerName: data.borrowerName,
            amount: data.amount,
            dueDate: data.dueDate || 'soon',
            lenderName: data.lenderName
          });
          break;
        case 'loan_approval':
          result = await pushNotificationService.sendLoanApproval({
            borrowerName: data.borrowerName,
            amount: data.amount,
            lenderName: data.lenderName || 'A lender'
          });
          break;
        case 'overdue_alert':
          result = await pushNotificationService.sendOverdueAlert({
            borrowerName: data.borrowerName,
            amount: data.amount,
            daysPastDue: data.daysPastDue || 1
          });
          break;
        default:
          result = await pushNotificationService.sendTestNotification();
      }

      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Push notification failed'
      };
    }
  }

  /**
   * Map notification type to email type
   */
  private getEmailType(notificationType: string): EmailType {
    const typeMapping: Record<string, EmailType> = {
      loan_request: 'loanRequestCreated',
      loan_approval: 'loanRequestClaimed',
      funding_confirmation: 'contractReady'
    };

    return typeMapping[notificationType] || 'loanRequestCreated';
  }
  /**
   * Log notification attempt for analytics
   */
  private async logNotificationAttempt(data: NotificationData, result: NotificationResult): Promise<void> {
    try {
      // Store in localStorage for demo - in production use proper logging table
      const logEntry = {
        user_id: data.userId,
        notification_type: data.type,
        priority: data.priority,
        channels_attempted: Object.keys(result.channels),
        channels_successful: Object.entries(result.channels)
          .filter(([_, result]) => result.success)
          .map(([channel, _]) => channel),
        success: result.success,
        timestamp: new Date().toISOString()
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('notification_logs') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 100 entries
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('notification_logs', JSON.stringify(existingLogs));
      console.log('Notification attempt logged:', logEntry);
      
    } catch (error) {
      console.warn('Failed to log notification attempt:', error);
      // Don't throw - logging failure shouldn't break notifications
    }
  }  /**
   * Send scheduled payment reminders
   */
  async sendScheduledPaymentReminders(): Promise<void> {
    try {
      // Get all active loans
      const { data: loans, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .eq('status', 'active');

      if (error || !loans) {
        console.error('Failed to fetch loans for reminders:', error);
        return;
      }

      for (const loan of loans) {
        // Calculate next payment date (simplified)
        const startDate = new Date(loan.created_at);
        const nextPaymentDate = new Date(startDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        
        const daysUntilDue = Math.ceil((nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        // Send reminder if within reminder window
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          await this.sendNotification({
            userId: loan.borrower_id,
            type: 'payment_reminder',
            priority: daysUntilDue === 0 ? 'high' : 'medium',
            borrowerName: loan.borrower_name || 'Borrower',
            lenderName: 'Lender', // Simplified for now
            amount: loan.amount / loan.duration_months,
            dueDate: nextPaymentDate.toISOString(),
            borrowerEmail: loan.borrower_email
          });
        }
      }

    } catch (error) {
      console.error('Error sending scheduled payment reminders:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      sms: smsService.getStatus(),
      push: pushNotificationService.getStatus(),
      email: { enabled: true, mode: 'production' } // Email service is always available
    };
  }
}

// Export singleton instance
export const unifiedNotificationService = new UnifiedNotificationService();

// Export convenience functions
export const sendPaymentReminder = (data: NotificationData) =>
  unifiedNotificationService.sendNotification({ ...data, type: 'payment_reminder' });

export const sendLoanApproval = (data: NotificationData) =>
  unifiedNotificationService.sendNotification({ ...data, type: 'loan_approval' });

export const sendOverdueAlert = (data: NotificationData) =>
  unifiedNotificationService.sendNotification({ ...data, type: 'overdue_alert' });

export const sendFundingConfirmation = (data: NotificationData) =>
  unifiedNotificationService.sendNotification({ ...data, type: 'funding_confirmation' });
