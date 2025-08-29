/**
 * Push Notification Service for LendIt Platform
 * Provides web push notifications for real-time alerts
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface PushResult {
  success: boolean;
  error?: string;
  subscriptionActive?: boolean;
}

/**
 * Push Notification Service class
 * Handles web push notifications using Service Worker API
 */
class PushNotificationService {
  private vapidPublicKey: string;
  private isSupported: boolean;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    this.isSupported = this.checkSupport();
    
    if (!this.isSupported) {
      console.warn('Push notifications not supported in this browser');
    }
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    return !!(
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeUser(): Promise<PushSubscription | null> {
    if (!this.isSupported || !this.vapidPublicKey) {
      console.warn('Cannot subscribe: missing VAPID key or unsupported browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Save subscription to backend (simulated)
      await this.saveSubscription(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      return null;
    }
  }

  /**
   * Save subscription to backend
   */
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      // In production, save to your backend
      console.log('📱 Push Subscription Saved (simulated):', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        }
      });

      // Simulate API call
      /*
      await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          }
        })
      });
      */
    } catch (error) {
      console.error('Failed to save subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const result = await subscription.unsubscribe();
        console.log('User unsubscribed:', result);
        return result;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
      return false;
    }
  }

  /**
   * Send a local notification (for testing)
   */
  async sendLocalNotification(data: PushNotificationData): Promise<PushResult> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return {
        success: false,
        error: 'Notifications not permitted or not supported'
      };
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/lendit.png',
        badge: data.badge || '/lendit.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle click action
        if (data.data?.url) {
          window.open(data.data.url, '_blank');
        }
      };

      return { success: true };
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send payment reminder push notification
   */
  async sendPaymentReminder(data: {
    borrowerName: string;
    amount: number;
    dueDate: string;
    lenderName?: string;
  }): Promise<PushResult> {
    const notificationData: PushNotificationData = {
      title: '💰 Payment Reminder',
      body: `Hi ${data.borrowerName}, your payment of ₹${data.amount.toLocaleString()} is due ${data.dueDate}`,
      icon: '/lendit.png',
      tag: 'payment-reminder',
      data: {
        type: 'payment_reminder',
        url: '/dashboard/agreements'
      },
      actions: [
        {
          action: 'pay',
          title: 'Pay Now',
          icon: '/pay-icon.png'
        },
        {
          action: 'view',
          title: 'View Details',
          icon: '/view-icon.png'
        }
      ]
    };

    return this.sendLocalNotification(notificationData);
  }

  /**
   * Send loan approval push notification
   */
  async sendLoanApproval(data: {
    borrowerName: string;
    amount: number;
    lenderName: string;
  }): Promise<PushResult> {
    const notificationData: PushNotificationData = {
      title: '🎉 Loan Approved!',
      body: `${data.lenderName} approved your loan of ₹${data.amount.toLocaleString()}`,
      icon: '/lendit.png',
      tag: 'loan-approved',
      data: {
        type: 'loan_approved',
        url: '/dashboard/agreements'
      },
      actions: [
        {
          action: 'view',
          title: 'View Agreement',
          icon: '/view-icon.png'
        }
      ]
    };

    return this.sendLocalNotification(notificationData);
  }

  /**
   * Send overdue alert push notification
   */
  async sendOverdueAlert(data: {
    borrowerName: string;
    amount: number;
    daysPastDue: number;
  }): Promise<PushResult> {
    const notificationData: PushNotificationData = {
      title: '⚠️ Payment Overdue',
      body: `Your payment of ₹${data.amount.toLocaleString()} is ${data.daysPastDue} day(s) overdue`,
      icon: '/lendit.png',
      tag: 'payment-overdue',
      data: {
        type: 'payment_overdue',
        url: '/dashboard/agreements',
        urgent: true
      },
      actions: [
        {
          action: 'pay',
          title: 'Pay Now',
          icon: '/pay-icon.png'
        },
        {
          action: 'contact',
          title: 'Contact Lender',
          icon: '/contact-icon.png'
        }
      ]
    };

    return this.sendLocalNotification(notificationData);
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<PushResult> {
    const notificationData: PushNotificationData = {
      title: '🔔 LendIt Test Notification',
      body: 'Push notifications are working correctly!',
      icon: '/lendit.png',
      tag: 'test-notification',
      data: {
        type: 'test'
      }
    };

    return this.sendLocalNotification(notificationData);
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      supported: this.isSupported,
      permission: this.getPermissionStatus(),
      vapidConfigured: !!this.vapidPublicKey,
      serviceWorkerSupported: 'serviceWorker' in navigator
    };
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export helper functions
export const sendPaymentReminderPush = (data: any) => 
  pushNotificationService.sendPaymentReminder(data);

export const sendLoanApprovalPush = (data: any) => 
  pushNotificationService.sendLoanApproval(data);

export const sendOverdueAlertPush = (data: any) => 
  pushNotificationService.sendOverdueAlert(data);
