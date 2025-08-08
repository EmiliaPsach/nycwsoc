# Attendance Reminder System Setup Guide

This guide will help you set up the automated attendance reminder system with push notifications for iOS and Android.

## Prerequisites

### 1. Install Required Packages

```bash
npm install react-native-push-notification @react-native-async-storage/async-storage
```

### 2. iOS Setup

#### Configure iOS Notifications
1. In your `ios/YourApp/AppDelegate.m` (or `AppDelegate.mm`), add:

```objc
#import <UserNotifications/UNUserNotificationCenter.h>
#import <RNCPushNotificationIOS.h>

// At the top of AppDelegate.m
@interface AppDelegate () <UNUserNotificationCenterDelegate>
@end

// In didFinishLaunchingWithOptions
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // ... other code ...
  
  // Define UNUserNotificationCenter
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;

  return YES;
}

// Add these methods
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
}

// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
 [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}
// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}
// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
 [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}
// Required for localNotification event
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveLocalNotification:(UILocalNotification *)notification
{
 [RNCPushNotificationIOS didReceiveLocalNotification:notification];
}
```

2. Add notification capabilities in `ios/YourApp.xcodeproj`:
   - Open your project in Xcode
   - Select your target
   - Go to "Signing & Capabilities"
   - Add "Push Notifications" capability

#### iOS Permissions
Add these to your `ios/YourApp/Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>background-processing</string>
    <string>remote-notification</string>
</array>
```

### 3. Android Setup

#### Configure Android Notifications
1. In `android/app/src/main/AndroidManifest.xml`, add:

```xml
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>

<application>
    <!-- Add this inside <application> -->
    <meta-data  android:name="com.dieam.reactnativepushnotification.notification_foreground"
                android:value="false"/>
    <meta-data  android:name="com.dieam.reactnativepushnotification.notification_color"
                android:resource="@android:color/white"/>

    <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationActions" />
    <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationPublisher" />
    <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationBootEventReceiver">
        <intent-filter>
            <action android:name="android.intent.action.BOOT_COMPLETED" />
            <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            <action android:name="com.htc.intent.action.QUICKBOOT_POWERON"/>
        </intent-filter>
    </receiver>

    <service
        android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService"
        android:exported="false" >
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
</application>
```

2. In `android/app/src/main/java/.../MainApplication.java`, add:

```java
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;

// In the getPackages() method, add:
@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new ReactNativePushNotificationPackage());
    return packages;
}
```

## Integration

### 1. Initialize in Your App

In your main `App.tsx` or root component:

```typescript
import React, { useEffect } from 'react';
import { notificationManager } from './src/services/NotificationManager';

export default function App() {
  useEffect(() => {
    // Initialize the notification system
    const initNotifications = async () => {
      try {
        await notificationManager.initialize();
        console.log('Notification system initialized');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();

    // Cleanup on unmount
    return () => {
      notificationManager.destroy();
    };
  }, []);

  // ... rest of your app
}
```

### 2. Request Permissions

Add this to your auth flow or user onboarding:

```typescript
import { notificationManager } from '../services/NotificationManager';

const requestNotificationPermissions = async () => {
  const permissions = await notificationManager.requestNotificationPermissions();
  
  if (permissions.alert) {
    console.log('Notifications enabled!');
  } else {
    // Show user a message about enabling notifications in settings
    Alert.alert(
      'Enable Notifications',
      'To receive attendance reminders, please enable notifications in your device settings.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openSettings() }
      ]
    );
  }
};
```

### 3. Handle Navigation from Notifications

In your navigation setup, add notification handling:

```typescript
import { notificationManager } from '../services/NotificationManager';

// In your navigation container
useEffect(() => {
  const pushService = notificationManager.getPushService();
  
  // Override the handleNotificationTap method to include navigation
  const originalHandler = pushService.handleNotificationTap;
  pushService.handleNotificationTap = (notification) => {
    const result = originalHandler(notification);
    
    if (result && result.screen) {
      // Navigate to the appropriate screen
      navigationRef.current?.navigate(result.screen, result.params);
    }
  };
}, []);
```

## Usage

### 1. Automatic Reminders

Automatic reminders are handled by the `BackgroundScheduler`. It will:
- Schedule reminders 4 days before each game
- Only remind players who haven't responded to the attendance poll
- Respect user preferences (auto-reminders can be disabled per team)

### 2. Manual Reminders

Team captains and admins can send manual reminders using the `AttendanceReminderPanel` component, which is automatically shown in the `GameDetailScreen`.

### 3. Managing Settings

Users can control auto-reminders through the toggle in the `AttendanceReminderPanel`.

## Key Features

### ✅ What's Included

- **Automatic 4-day reminders** for upcoming games
- **Manual reminder capability** for captains and admins
- **Cross-platform support** (iOS and Android)
- **Permission management** with graceful fallbacks
- **User preference storage** (enable/disable auto-reminders)
- **Reminder logging** for tracking and debugging
- **Background scheduling** that handles app lifecycle
- **Error handling** with platform-specific fallbacks

### 🔧 Configuration Options

#### Reminder Timing
Change the reminder timing in `PushNotificationService.ts`:
```typescript
// Currently set to 4 days before
const reminderDate = new Date(gameDate.getTime() - (4 * 24 * 60 * 60 * 1000));

// Change to 2 days before:
const reminderDate = new Date(gameDate.getTime() - (2 * 24 * 60 * 60 * 1000));
```

#### Notification Channels (Android)
Modify channels in `PushNotificationService.ts` in the `initialize()` method.

#### Auto-reminder Defaults
Change default auto-reminder setting in `DataStore.ts`:
```typescript
return settings[key] !== undefined ? settings[key] : false; // Default to false
```

## Troubleshooting

### Common Issues

1. **Notifications not appearing on iOS**
   - Check that you've added the notification capabilities in Xcode
   - Verify AppDelegate setup is correct
   - Test on device (simulator has limitations)

2. **Android notifications not working**
   - Verify AndroidManifest.xml permissions
   - Check that notification channels are created
   - Test with "Background App Refresh" enabled

3. **Scheduling not working**
   - Check device settings for the app
   - Verify that background processing is allowed
   - Look for console errors in background scheduler

### Debug Tools

Check notification status:
```typescript
const status = await notificationManager.getStatus();
console.log('Notification system status:', status);
```

View scheduled notifications:
```typescript
const notifications = await notificationManager.getPushService().getScheduledNotifications();
console.log('Scheduled notifications:', notifications);
```

### Testing

Test the system by:
1. Setting reminders for games happening in the next few minutes
2. Modifying the reminder timing to 1 minute for testing
3. Checking logs for scheduling confirmations
4. Verifying notifications appear on both platforms

## Future Enhancements

Consider adding:
- Push notification server integration (FCM/APNS)
- Different reminder frequencies (1 day, 2 hours before)
- Custom reminder messages per league/team
- Rich notifications with quick response actions
- Analytics tracking for reminder effectiveness

---

The system is now complete and ready for use! Players will automatically receive attendance reminders, and captains can send manual reminders as needed.