/**
 * Push Notification Setup Component
 * Handles push notification permission and service worker registration
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { pushNotificationService } from "@/utils/pushNotificationService";
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  Loader2,
  Shield,
  AlertCircle,
  X,
  Settings
} from "lucide-react";

interface PushNotificationSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnabled: () => void;
}

export const PushNotificationSetup = ({ 
  open, 
  onOpenChange, 
  onEnabled 
}: PushNotificationSetupProps) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setSupported(false);
      return;
    }

    // Get current permission status
    setPermission(Notification.permission);
  }, []);

  const handleEnableNotifications = async () => {
    if (!supported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Initialize push notification service
        const result = await pushNotificationService.initialize();
        
        if (result.success) {
          // Save preference to localStorage
          const userId = localStorage.getItem('userId') || 'current_user';
          const preferences = JSON.parse(localStorage.getItem(`notification_prefs_${userId}`) || '{}');
          
          const updatedPreferences = {
            ...preferences,
            push_enabled: true
          };
          
          localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(updatedPreferences));

          // Send test notification
          await pushNotificationService.sendTestNotification();

          toast({
            title: "Push Notifications Enabled! 🔔",
            description: "You'll now receive instant notifications for important loan updates.",
          });

          onEnabled();
          onOpenChange(false);
        } else {
          throw new Error(result.error || 'Failed to initialize push notifications');
        }
      } else if (permission === 'denied') {
        toast({
          title: "Permission Denied",
          description: "Push notifications have been blocked. You can enable them in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to enable push notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await pushNotificationService.sendTestNotification();
      toast({
        title: "Test Sent!",
        description: "Check if you received the test notification.",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  const getPermissionIcon = () => {
    switch (permission) {
      case 'granted':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'denied':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  if (!supported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Not Supported
            </DialogTitle>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Push Notifications
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getPermissionIcon()}
                  Current Status
                </span>
                {getPermissionBadge()}
              </CardTitle>
              <CardDescription>
                {permission === 'granted' 
                  ? "Push notifications are enabled and working"
                  : permission === 'denied'
                  ? "Push notifications are blocked in browser settings"
                  : "Push notifications are not enabled yet"
                }
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Demo Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Demo Mode:</strong> Notifications will appear as browser notifications. 
              In production, these would be persistent push notifications.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="space-y-3">
            {permission !== 'granted' ? (
              <Button 
                onClick={handleEnableNotifications}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Enable Push Notifications
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleTestNotification}
                variant="outline"
                className="w-full"
              >
                <BellRing className="mr-2 h-4 w-4" />
                Send Test Notification
              </Button>
            )}

            {permission === 'denied' && (
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  To enable notifications:
                  <br />
                  1. Click the 🔒 icon in your address bar
                  <br />
                  2. Change notifications to "Allow"
                  <br />
                  3. Refresh the page and try again
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="flex items-center gap-2 font-medium text-green-800 mb-2">
              <Shield className="h-4 w-4" />
              Push Notification Benefits
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Real-time loan status updates</li>
              <li>• Instant payment confirmations</li>
              <li>• Important deadline reminders</li>
              <li>• Works even when app is closed</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
