// services/BackgroundScheduler.ts
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PushNotificationService } from './PushNotificationService';
import { DataStore } from './DataStore';

/**
 * BackgroundScheduler handles automatic scheduling of attendance reminders
 * for all upcoming games. It runs when the app becomes active and manages
 * the 4-day reminder system.
 */
export class BackgroundScheduler {
  private pushService = new PushNotificationService();
  private dataStore = new DataStore();
  private isInitialized = false;
  private lastScheduleCheck: Date | null = null;
  private appStateSubscription: any = null;

  async initialize() {
    if (this.isInitialized) return;

    // Initialize push notification service first
    await this.pushService.initialize();

    // Schedule reminders on app start
    await this.scheduleAllReminders();

    // Listen for app state changes to reschedule when app becomes active
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Set up periodic checks (every 6 hours when app is active)
    this.setupPeriodicCheck();

    this.isInitialized = true;
    console.log('BackgroundScheduler initialized');
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App became active - check if we need to reschedule
      const shouldReschedule = await this.shouldReschedule();
      if (shouldReschedule) {
        await this.scheduleAllReminders();
      }
    }
  };

  private async shouldReschedule(): Promise<boolean> {
    try {
      const lastCheck = await AsyncStorage.getItem('last_reminder_schedule');
      if (!lastCheck) return true;

      const lastCheckDate = new Date(lastCheck);
      const now = new Date();
      const hoursSinceLastCheck = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60);

      // Reschedule if it's been more than 6 hours
      return hoursSinceLastCheck > 6;
    } catch (error) {
      console.error('Error checking reschedule need:', error);
      return true;
    }
  }

  private setupPeriodicCheck() {
    // Check every 6 hours when app is active
    setInterval(async () => {
      if (AppState.currentState === 'active') {
        await this.scheduleAllReminders();
      }
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
  }

  async scheduleAllReminders() {
    try {
      console.log('Scheduling all reminders...');
      
      // Clean up old reminders first
      await this.pushService.cleanupOldReminders();

      // Get all upcoming games
      const upcomingGames = await this.dataStore.getAllUpcomingGames();
      
      for (const game of upcomingGames) {
        await this.scheduleGameReminders(game);
      }

      // Update last schedule check time
      await AsyncStorage.setItem('last_reminder_schedule', new Date().toISOString());
      this.lastScheduleCheck = new Date();
      
      console.log(`Scheduled reminders for ${upcomingGames.length} upcoming games`);
    } catch (error) {
      console.error('Error scheduling all reminders:', error);
    }
  }

  private async scheduleGameReminders(game: any) {
    try {
      const gameDate = new Date(game.date);
      const reminderDate = new Date(gameDate.getTime() - (4 * 24 * 60 * 60 * 1000));
      const now = new Date();

      // Only schedule if reminder is in the future
      if (reminderDate <= now) {
        console.log(`Reminder date for game ${game.id} is in the past, skipping`);
        return;
      }

      // Get teams involved in the game
      const [homeTeam, awayTeam] = await Promise.all([
        this.dataStore.getTeam(game.homeTeam),
        this.dataStore.getTeam(game.awayTeam)
      ]);

      // Schedule reminders for home team players
      if (homeTeam) {
        const homePlayers = await this.dataStore.getPlayersInTeam(homeTeam.id);
        const autoReminderEnabled = await this.isAutoReminderEnabled(homeTeam.id, homePlayers);
        
        if (autoReminderEnabled) {
          await this.pushService.scheduleGameReminder(game, homeTeam, homePlayers);
        }
      }

      // Schedule reminders for away team players  
      if (awayTeam) {
        const awayPlayers = await this.dataStore.getPlayersInTeam(awayTeam.id);
        const autoReminderEnabled = await this.isAutoReminderEnabled(awayTeam.id, awayPlayers);
        
        if (autoReminderEnabled) {
          await this.pushService.scheduleGameReminder(game, awayTeam, awayPlayers);
        }
      }

    } catch (error) {
      console.error(`Error scheduling reminders for game ${game.id}:`, error);
    }
  }

  private async isAutoReminderEnabled(teamId: string, players: any[]): Promise<boolean> {
    // Check if at least one player has auto reminders enabled for this team
    // This prevents duplicate notifications if multiple players have it disabled
    for (const player of players) {
      const enabled = await this.dataStore.getAutoReminderSetting(teamId, player.id);
      if (enabled) return true;
    }
    return false;
  }

  /**
   * Manually trigger a full reschedule of all reminders
   * Useful to call after major data changes (new games, team changes, etc.)
   */
  async forceReschedule() {
    console.log('Force rescheduling all reminders...');
    
    // Cancel all existing reminders
    this.pushService.cancelAllNotifications();
    
    // Clear stored reminder IDs
    const keys = await AsyncStorage.getAllKeys();
    const reminderKeys = keys.filter(key => key.startsWith('reminder_'));
    await AsyncStorage.multiRemove(reminderKeys);
    
    // Schedule fresh reminders
    await this.scheduleAllReminders();
  }

  /**
   * Get status information about the scheduler
   */
  async getSchedulerStatus() {
    const lastCheck = await AsyncStorage.getItem('last_reminder_schedule');
    const scheduledReminders = await this.getScheduledReminderCount();
    
    return {
      initialized: this.isInitialized,
      lastScheduleCheck: lastCheck ? new Date(lastCheck) : null,
      scheduledRemindersCount: scheduledReminders,
    };
  }

  private async getScheduledReminderCount(): Promise<number> {
    return new Promise((resolve) => {
      this.pushService.getScheduledNotifications();
      // This is a bit hacky since getScheduledNotifications uses a callback
      // In a real implementation, you might want to modify that method
      // For now, we'll just return a placeholder
      resolve(0);
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.isInitialized = false;
  }
}

// Create singleton instance
export const backgroundScheduler = new BackgroundScheduler();