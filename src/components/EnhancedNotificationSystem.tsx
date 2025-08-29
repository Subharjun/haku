import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { PhoneVerification } from "./PhoneVerification";
import { PushNotificationSetup } from "./PushNotificationSetup";
import { getNotificationStatus } from "@/utils/notificationIntegration";
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Mail,
  Smartphone
} from "lucide-react";

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  payment_reminders: boolean;
  loan_offers: boolean;
  status_updates: boolean;
  marketing: boolean;
  reminder_days: number;
}

interface PaymentReminder {
  id: string;
  loan_id: string;
  lender_name: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  status: 'upcoming' | 'due_today' | 'overdue';
  reminder_sent: boolean;
}

export const EnhancedNotificationSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    payment_reminders: true,
    loan_offers: true,
    status_updates: true,
    marketing: false,
    reminder_days: 3
  });
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reminders' | 'notifications' | 'settings'>('reminders');
  
  // New state for phone verification and push setup
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showPushSetup, setShowPushSetup] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadPreferences();
      setLoading(false);
    }
  }, [user]);

  const loadPreferences = () => {
    if (!user) return;
    
    // Load from localStorage for demo
    const saved = localStorage.getItem(`notification_prefs_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPreferences(parsed);
      setPhoneVerified(!!parsed.phone_verified);
      setVerifiedPhone(parsed.phone_number || '');
    }
  };

  const savePreferences = (newPreferences: NotificationPreferences) => {
    if (!user) return;
    
    setPreferences(newPreferences);
    localStorage.setItem(`notification_prefs_${user.id}`, JSON.stringify(newPreferences));
    
    toast({
      title: "Preferences Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'reminders', label: 'Payment Reminders', icon: Calendar },
          { key: 'notifications', label: 'All Notifications', icon: Bell },
          { key: 'settings', label: 'Settings', icon: Settings }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notification Channels */}
            <div>
              <h4 className="font-semibold mb-4">Notification Channels</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive notifications via email</div>
                  </div>
                  <Switch
                    checked={preferences.email_enabled}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, email_enabled: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-sm text-gray-600">Critical alerts via SMS</div>
                  </div>
                  <Switch
                    checked={preferences.sms_enabled && phoneVerified}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, sms_enabled: checked })
                    }
                    disabled={!phoneVerified}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-gray-600">Browser push notifications</div>
                  </div>
                  <Switch
                    checked={preferences.push_enabled}
                    onCheckedChange={(checked) => 
                      savePreferences({ ...preferences, push_enabled: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Phone Verification */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold">SMS Notifications</h4>
                <p className="text-sm text-gray-600">
                  {phoneVerified 
                    ? `Verified: ${verifiedPhone}` 
                    : "Verify your phone number to receive SMS alerts"
                  }
                </p>
              </div>
              <Button 
                onClick={() => setShowPhoneVerification(true)}
                variant={phoneVerified ? "outline" : "default"}
                size="sm"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                {phoneVerified ? "Change Number" : "Verify Phone"}
              </Button>
            </div>

            {/* Push Notification Setup */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold">Push Notifications</h4>
                <p className="text-sm text-gray-600">
                  {preferences.push_enabled 
                    ? "Enabled - You'll receive instant notifications" 
                    : "Enable browser notifications for real-time updates"
                  }
                </p>
              </div>
              <Button 
                onClick={() => setShowPushSetup(true)}
                variant={preferences.push_enabled ? "outline" : "default"}
                size="sm"
              >
                <Bell className="mr-2 h-4 w-4" />
                {preferences.push_enabled ? "Test & Manage" : "Enable Push"}
              </Button>
            </div>

            {/* Service Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Mail className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="font-medium">Email</div>
                <Badge variant="default" className="mt-1">Active</Badge>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Smartphone className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="font-medium">SMS</div>
                <Badge variant={phoneVerified ? 'default' : 'outline'} className="mt-1">
                  {phoneVerified ? 'Demo' : 'Inactive'}
                </Badge>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Bell className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="font-medium">Push</div>
                <Badge variant={preferences.push_enabled ? 'default' : 'outline'} className="mt-1">
                  {preferences.push_enabled ? 'Demo' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'reminders' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Payment Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming payments</h3>
              <p className="text-gray-500">You'll see payment reminders here when you have active loans.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You'll see all your notifications here.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <PhoneVerification 
        open={showPhoneVerification}
        onOpenChange={setShowPhoneVerification}
        onVerified={(phone) => {
          setPhoneVerified(true);
          setVerifiedPhone(phone);
          setPreferences(prev => ({ ...prev, sms_enabled: true }));
        }}
      />

      <PushNotificationSetup 
        open={showPushSetup}
        onOpenChange={setShowPushSetup}
        onEnabled={() => {
          setPreferences(prev => ({ ...prev, push_enabled: true }));
        }}
      />
    </div>
  );
};
