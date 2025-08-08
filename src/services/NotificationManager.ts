// services/NotificationManager.ts
import { PushNotificationService } from './PushNotificationService';
import { BackgroundScheduler } from './BackgroundScheduler';

/**
 * NotificationManager serves as the main entry point for all notification-related
 * functionality. Initialize this once in your App.tsx or main component.
 */
class NotificationManager {
  private pushService = new PushNotificationService();
  private scheduler = new BackgroundScheduler();
  private initialized = false;

  async initialize() {
    if (this.initialized) {
      console.log('NotificationManager already initialized');
      return;
    }

    try {
      console.log('Initializing NotificationManager...');
      
      // Initialize push notification service
      await this.pushService.initialize();
      
      // Initialize background scheduler (which will schedule all reminders)
      await this.scheduler.initialize();
      
      this.initialized = true;
      console.log('NotificationManager initialized successfully');
      
      // Log current status
      const status = await this.scheduler.getSchedulerStatus();
      console.log('Scheduler status:', status);
      
    } catch (error) {
      console.error('Failed to initialize NotificationManager:', error);
      throw error;
    }
  }

  // Check if user has granted notification permissions
  async checkNotificationPermissions() {
    try {
      const permissions = await this.pushService.checkPermissions();
      return permissions;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { alert: false, badge: false, sound: false };
    }
  }

  // Request notification permissions
  async requestNotificationPermissions() {
    try {
      const permissions = await this.pushService.requestPermissions();
      return permissions;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { alert: false, badge: false, sound: false };
    }
  }

  // Force reschedule all reminders (call this after major data changes)
  async rescheduleAllReminders() {
    if (!this.initialized) {
      console.warn('NotificationManager not initialized yet');
      return;
    }
    
    try {
      await this.scheduler.forceReschedule();
    } catch (error) {
      console.error('Error rescheduling reminders:', error);
    }
  }

  // Get services for manual use
  getPushService() {
    return this.pushService;
  }

  getScheduler() {
    return this.scheduler;
  }

  // Clean up on app termination
  destroy() {
    this.scheduler.destroy();
    this.initialized = false;
  }

  // Get overall system status
  async getStatus() {
    const permissions = await this.checkNotificationPermissions();
    const schedulerStatus = await this.scheduler.getSchedulerStatus();
    const scheduledNotifications = await this.pushService.getScheduledNotifications();
    
    return {
      initialized: this.initialized,
      permissions,
      scheduler: schedulerStatus,
      totalScheduledNotifications: scheduledNotifications.length,
    };
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();