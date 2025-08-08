// services/PushNotificationService.ts
import PushNotification, { Importance } from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DataStore } from './DataStore';
import { Game, Team, User, Poll } from '../types';

// You'll need to install: npm install react-native-push-notification @react-native-async-storage/async-storage
// And follow the setup instructions for react-native-push-notification

export class PushNotificationService {
  private dataStore = new DataStore();
  private initialized = false;

  // Initialize push notifications
  async initialize() {
    if (this.initialized) return;

    // Configure the notification settings
    PushNotification.configure({
      onRegister: async (token) => {
        console.log('Push notification token:', token.token);
        await AsyncStorage.setItem('pushToken', token.token);
      },

      onNotification: (notification) => {
        console.log('Notification received:', notification);
        
        // Handle notification tap
        if (notification.userInteraction) {
          this.handleNotificationTap(notification);
        }
        
        // Call the notification handler if provided (iOS specific)
        if (notification.finish) {
          notification.finish('UIBackgroundFetchResultNoData');
        }
      },

      onAction: (notification) => {
        console.log('Notification action received:', notification.action);
      },

      onRegistrationError: (err) => {
        console.error('Push notification registration error:', err.message);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'attendance-reminders',
          channelName: 'Attendance Reminders',
          channelDescription: 'Automatic reminders for game attendance',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created) => console.log(`Attendance channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'manual-reminders',
          channelName: 'Manual Reminders',
          channelDescription: 'Manual reminders from captains and admins',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created) => console.log(`Manual reminders channel created: ${created}`)
      );
    }

    this.initialized = true;
  }

  // Schedule automatic reminder for a game (4 days before)
  async scheduleGameReminder(game: Game, team: Team, players: User[]) {
    const gameDate = new Date(game.date);
    const reminderDate = new Date(gameDate.getTime() - (4 * 24 * 60 * 60 * 1000)); // 4 days before
    const now = new Date();

    // Only schedule if reminder date is in the future
    if (reminderDate <= now) {
      console.log(`Reminder date for game ${game.id} is in the past, skipping`);
      return;
    }

    // Get players who haven't responded yet
    const poll = await this.dataStore.getPoll(game.id, team.id);
    const unrespondedPlayers = players.filter(player => 
      !poll?.responses[player.id]
    );

    if (unrespondedPlayers.length === 0) {
      console.log(`All players have responded for game ${game.id}, skipping reminder`);
      return;
    }

    // Generate unique notification ID
    const notificationId = `reminder_${game.id}_${team.id}_${Date.now()}`;

    // Schedule notification
    PushNotification.localNotificationSchedule({
      id: notificationId,
      title: '⚽ Game Reminder',
      message: `Don't forget to mark your attendance for ${team.name} vs opponent on ${gameDate.toLocaleDateString()}!`,
      date: reminderDate,
      allowWhileIdle: true,
      channelId: 'attendance-reminders',
      userInfo: {
        type: 'attendance_reminder',
        gameId: game.id,
        teamId: team.id,
      },
      actions: Platform.OS === 'android' ? ['Mark Attendance'] : undefined,
    });

    // Store notification ID for potential cancellation
    await AsyncStorage.setItem(
      `reminder_${game.id}_${team.id}`, 
      notificationId
    );

    console.log(`Scheduled reminder for game ${game.id} on ${reminderDate.toISOString()}`);
  }

  // Cancel a scheduled reminder
  async cancelGameReminder(gameId: string, teamId: string) {
    try {
      const notificationId = await AsyncStorage.getItem(`reminder_${gameId}_${teamId}`);
      if (notificationId) {
        PushNotification.cancelLocalNotification(notificationId);
        await AsyncStorage.removeItem(`reminder_${gameId}_${teamId}`);
        console.log(`Cancelled reminder for game ${gameId}`);
      }
    } catch (error) {
      console.error('Error cancelling reminder:', error);
    }
  }

  // Send immediate push notification to specific players
  async sendManualReminder(
    game: Game, 
    team: Team, 
    targetPlayers: User[], 
    senderName: string,
    senderRole: 'captain' | 'admin'
  ) {
    const roleEmoji = senderRole === 'captain' ? '👑' : '🛡️';
    const gameDate = new Date(game.date).toLocaleDateString();
    
    for (const player of targetPlayers) {
      try {
        // Generate unique ID for each notification
        const notificationId = `manual_${game.id}_${player.id}_${Date.now()}`;
        
        PushNotification.localNotification({
          id: notificationId,
          title: `${roleEmoji} Attendance Reminder`,
          message: `${senderName} is asking: Please mark your attendance for ${team.name}'s game on ${gameDate}`,
          channelId: 'manual-reminders',
          userInfo: {
            type: 'manual_reminder',
            gameId: game.id,
            teamId: team.id,
            senderId: senderName,
            senderRole,
            playerId: player.id,
          },
          actions: Platform.OS === 'android' ? ['Mark Attendance'] : undefined,
        });
        
        console.log(`Sent manual reminder to ${player.name}`);
      } catch (error) {
        console.error(`Failed to send reminder to ${player.name}:`, error);
      }
    }

    console.log(`Sent manual reminders to ${targetPlayers.length} players`);
  }

  // Batch schedule reminders for all upcoming games
  async scheduleAllUpcomingReminders() {
    try {
      const games = await this.dataStore.getAllUpcomingGames();
      
      for (const game of games) {
        if (game.status !== 'Scheduled') continue;
        
        const [homeTeam, awayTeam] = await Promise.all([
          this.dataStore.getTeam(game.homeTeam),
          this.dataStore.getTeam(game.awayTeam),
        ]);

        if (homeTeam) {
          const homePlayers = await this.dataStore.getPlayersInTeam(homeTeam.id);
          await this.scheduleGameReminder(game, homeTeam, homePlayers);
        }

        if (awayTeam) {
          const awayPlayers = await this.dataStore.getPlayersInTeam(awayTeam.id);
          await this.scheduleGameReminder(game, awayTeam, awayPlayers);
        }
      }
    } catch (error) {
      console.error('Error scheduling batch reminders:', error);
    }
  }

  // Handle notification tap
  handleNotificationTap(notification: any) {
    const { userInfo } = notification;
    
    if (userInfo && (userInfo.type === 'attendance_reminder' || userInfo.type === 'manual_reminder')) {
      // You would implement navigation logic here
      // For now, we'll just log it
      console.log('Should navigate to game:', userInfo.gameId, 'for team:', userInfo.teamId);
      
      // Return navigation params for your navigation system to handle
      return {
        screen: 'GameDetail',
        params: {
          gameId: userInfo.gameId,
          teamId: userInfo.teamId,
        },
      };
    }
  }

  // Clean up old notification IDs from storage
  async cleanupOldReminders() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const reminderKeys = keys.filter(key => key.startsWith('reminder_'));
      
      for (const key of reminderKeys) {
        const gameId = key.split('_')[1];
        const game = await this.dataStore.getGame(gameId);
        
        // If game is completed or cancelled, remove the stored reminder
        if (!game || game.status === 'Completed' || game.status === 'Cancelled') {
          const notificationId = await AsyncStorage.getItem(key);
          if (notificationId) {
            PushNotification.cancelLocalNotification(notificationId);
          }
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old reminders:', error);
    }
  }

  // Get all scheduled notifications (useful for debugging)
  getScheduledNotifications(): Promise<any[]> {
    return new Promise((resolve) => {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        console.log('Scheduled notifications:', notifications);
        resolve(notifications);
      });
    });
  }

  // Cancel all notifications
  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  // Check if notifications are enabled
  async checkPermissions(): Promise<{
    alert: boolean;
    badge: boolean;
    sound: boolean;
  }> {
    return new Promise((resolve) => {
      PushNotification.checkPermissions((permissions) => {
        resolve({
          alert: permissions.alert || false,
          badge: permissions.badge || false,
          sound: permissions.sound || false,
        });
      });
    });
  }

  // Request permissions (mainly for iOS)
  async requestPermissions(): Promise<{
    alert: boolean;
    badge: boolean;
    sound: boolean;
  }> {
    return new Promise((resolve) => {
      PushNotification.requestPermissions().then((permissions) => {
        resolve({
          alert: permissions.alert || false,
          badge: permissions.badge || false,
          sound: permissions.sound || false,
        });
      });
    });
  }

  // Get current badge number (iOS)
  getBadgeNumber(): Promise<number> {
    return new Promise((resolve) => {
      PushNotification.getApplicationIconBadgeNumber((number) => {
        resolve(number);
      });
    });
  }

  // Set badge number (iOS)
  setBadgeNumber(number: number) {
    PushNotification.setApplicationIconBadgeNumber(number);
  }

  // Enhanced error handling for cross-platform compatibility
  private handlePlatformSpecificError(error: any, operation: string) {
    if (Platform.OS === 'ios') {
      if (error.message?.includes('permission')) {
        console.warn(`iOS permission issue in ${operation}:`, error);
        return 'permission_denied';
      }
    } else if (Platform.OS === 'android') {
      if (error.message?.includes('channel')) {
        console.warn(`Android channel issue in ${operation}:`, error);
        return 'channel_error';
      }
    }
    
    console.error(`Platform error in ${operation}:`, error);
    return 'unknown_error';
  }

  // Enhanced notification scheduling with better error handling
  async scheduleGameReminderEnhanced(game: Game, team: Team, players: User[]): Promise<boolean> {
    try {
      const gameDate = new Date(game.date);
      const reminderDate = new Date(gameDate.getTime() - (4 * 24 * 60 * 60 * 1000));
      const now = new Date();

      if (reminderDate <= now) {
        console.log(`Reminder date for game ${game.id} is in the past, skipping`);
        return false;
      }

      // Check permissions first
      const permissions = await this.checkPermissions();
      if (!permissions.alert && !permissions.badge) {
        console.warn('No notification permissions granted');
        return false;
      }

      // Get poll and filter unresponded players
      const poll = await this.dataStore.getPoll(game.id, team.id);
      const unrespondedPlayers = players.filter(player => 
        !poll?.responses[player.id]
      );

      if (unrespondedPlayers.length === 0) {
        console.log(`All players have responded for game ${game.id}, skipping reminder`);
        return false;
      }

      // Generate unique notification ID
      const notificationId = `reminder_${game.id}_${team.id}_${Date.now()}`;

      // Cross-platform notification configuration
      const notificationConfig: any = {
        id: notificationId,
        title: '⚽ Game Reminder',
        message: `Don't forget to mark your attendance for ${team.name} vs opponent on ${gameDate.toLocaleDateString()}!`,
        date: reminderDate,
        allowWhileIdle: true,
        userInfo: {
          type: 'attendance_reminder',
          gameId: game.id,
          teamId: team.id,
        },
      };

      // Platform-specific configurations
      if (Platform.OS === 'android') {
        notificationConfig.channelId = 'attendance-reminders';
        notificationConfig.actions = ['Mark Attendance'];
        notificationConfig.invokeApp = true;
        notificationConfig.autoCancel = true;
      } else {
        // iOS specific
        notificationConfig.category = 'ATTENDANCE_REMINDER';
      }

      PushNotification.localNotificationSchedule(notificationConfig);

      // Store notification ID for potential cancellation
      await AsyncStorage.setItem(
        `reminder_${game.id}_${team.id}`, 
        notificationId
      );

      console.log(`Scheduled reminder for game ${game.id} on ${reminderDate.toISOString()}`);
      return true;

    } catch (error) {
      const errorType = this.handlePlatformSpecificError(error, 'scheduleGameReminderEnhanced');
      console.error(`Failed to schedule reminder: ${errorType}`, error);
      return false;
    }
  }
}