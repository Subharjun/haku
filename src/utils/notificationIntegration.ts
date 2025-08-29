/**
 * Integration module for adding notifications to loan flows
 * This module provides easy-to-use functions for triggering notifications at key points
 */

import { unifiedNotificationService, NotificationData } from './unifiedNotificationService';

export interface LoanFlowData {
  agreementId: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerId: string;
  lenderName?: string;
  lenderEmail?: string;
  lenderId?: string;
  amount: number;
  purpose?: string;
  duration?: number;
}

/**
 * Send notification when a loan request is created
 */
export const notifyLoanRequestCreated = async (data: LoanFlowData) => {
  try {
    const notificationData: NotificationData = {
      userId: data.borrowerId,
      type: 'loan_request',
      priority: 'medium',
      borrowerName: data.borrowerName,
      lenderName: data.lenderName,
      amount: data.amount,
      borrowerEmail: data.borrowerEmail,
      lenderEmail: data.lenderEmail,
      purpose: data.purpose,
      duration: data.duration,
      requestId: data.agreementId
    };

    return await unifiedNotificationService.sendNotification(notificationData);
  } catch (error) {
    console.error('Failed to send loan request notification:', error);
    return { success: false, channels: {}, totalChannels: 0, successfulChannels: 0 };
  }
};

/**
 * Send notification when a loan is approved/accepted by lender
 */
export const notifyLoanApproved = async (data: LoanFlowData) => {
  try {
    const notificationData: NotificationData = {
      userId: data.borrowerId,
      type: 'loan_approval',
      priority: 'high',
      borrowerName: data.borrowerName,
      lenderName: data.lenderName || 'A lender',
      amount: data.amount,
      borrowerEmail: data.borrowerEmail,
      lenderEmail: data.lenderEmail,
      purpose: data.purpose,
      duration: data.duration,
      requestId: data.agreementId
    };

    return await unifiedNotificationService.sendNotification(notificationData);
  } catch (error) {
    console.error('Failed to send loan approval notification:', error);
    return { success: false, channels: {}, totalChannels: 0, successfulChannels: 0 };
  }
};

/**
 * Send notification when loan funding is confirmed
 */
export const notifyFundingConfirmed = async (data: LoanFlowData) => {
  try {
    const notificationData: NotificationData = {
      userId: data.borrowerId,
      type: 'funding_confirmation',
      priority: 'high',
      borrowerName: data.borrowerName,
      lenderName: data.lenderName || 'Lender',
      amount: data.amount,
      borrowerEmail: data.borrowerEmail,
      lenderEmail: data.lenderEmail,
      purpose: data.purpose,
      duration: data.duration,
      requestId: data.agreementId
    };

    const result = await unifiedNotificationService.sendNotification(notificationData);

    // Also notify lender if available
    if (data.lenderId) {
      const lenderNotificationData: NotificationData = {
        userId: data.lenderId,
        type: 'funding_confirmation',
        priority: 'medium',
        borrowerName: data.borrowerName,
        lenderName: data.lenderName || 'You',
        amount: data.amount,
        borrowerEmail: data.borrowerEmail,
        lenderEmail: data.lenderEmail,
        purpose: data.purpose,
        duration: data.duration,
        requestId: data.agreementId
      };

      await unifiedNotificationService.sendNotification(lenderNotificationData);
    }

    return result;
  } catch (error) {
    console.error('Failed to send funding confirmation notification:', error);
    return { success: false, channels: {}, totalChannels: 0, successfulChannels: 0 };
  }
};

/**
 * Send payment reminder notification
 */
export const notifyPaymentReminder = async (data: LoanFlowData & { dueDate: string; daysPastDue?: number }) => {
  try {
    const priority = data.daysPastDue ? 'critical' : 'medium';
    
    const notificationData: NotificationData = {
      userId: data.borrowerId,
      type: 'payment_reminder',
      priority,
      borrowerName: data.borrowerName,
      lenderName: data.lenderName,
      amount: data.amount / (data.duration || 12), // Monthly payment
      dueDate: data.dueDate,
      daysPastDue: data.daysPastDue,
      borrowerEmail: data.borrowerEmail,
      lenderEmail: data.lenderEmail,
      requestId: data.agreementId
    };

    return await unifiedNotificationService.sendNotification(notificationData);
  } catch (error) {
    console.error('Failed to send payment reminder notification:', error);
    return { success: false, channels: {}, totalChannels: 0, successfulChannels: 0 };
  }
};

/**
 * Send overdue alert notification
 */
export const notifyOverdueAlert = async (data: LoanFlowData & { daysPastDue: number }) => {
  try {
    const notificationData: NotificationData = {
      userId: data.borrowerId,
      type: 'overdue_alert',
      priority: 'critical',
      borrowerName: data.borrowerName,
      lenderName: data.lenderName,
      amount: data.amount / (data.duration || 12), // Monthly payment
      daysPastDue: data.daysPastDue,
      borrowerEmail: data.borrowerEmail,
      lenderEmail: data.lenderEmail,
      requestId: data.agreementId
    };

    const result = await unifiedNotificationService.sendNotification(notificationData);

    // Also notify lender about overdue payment
    if (data.lenderId) {
      const lenderNotificationData: NotificationData = {
        userId: data.lenderId,
        type: 'overdue_alert',
        priority: 'high',
        borrowerName: data.borrowerName,
        lenderName: data.lenderName || 'You',
        amount: data.amount / (data.duration || 12),
        daysPastDue: data.daysPastDue,
        borrowerEmail: data.borrowerEmail,
        lenderEmail: data.lenderEmail,
        requestId: data.agreementId
      };

      await unifiedNotificationService.sendNotification(lenderNotificationData);
    }

    return result;
  } catch (error) {
    console.error('Failed to send overdue alert notification:', error);
    return { success: false, channels: {}, totalChannels: 0, successfulChannels: 0 };
  }
};

/**
 * Setup scheduled payment reminders (call this periodically)
 */
export const setupScheduledReminders = async () => {
  try {
    await unifiedNotificationService.sendScheduledPaymentReminders();
  } catch (error) {
    console.error('Failed to setup scheduled reminders:', error);
  }
};

/**
 * Get notification service status
 */
export const getNotificationStatus = () => {
  return unifiedNotificationService.getStatus();
};

// Export the main service for advanced usage
export { unifiedNotificationService };
