declare module 'expo-notifications' {
  export interface NotificationRequest {
    content: NotificationContent;
    trigger: NotificationTrigger | null;
    identifier?: string;
  }

  export interface NotificationContent {
    title?: string | null;
    subtitle?: string | null;
    body?: string | null;
    data?: Record<string, any>;
    sound?: boolean | string | null;
    badge?: number | null;
    attachments?: NotificationContentAttachment[];
    summaryArgument?: string | null;
    summaryArgumentCount?: number;
    categoryIdentifier?: string | null;
    threadIdentifier?: string | null;
    launchImageName?: string | null;
    sticky?: boolean;
    autoDismiss?: boolean;
  }

  export interface NotificationContentAttachment {
    identifier?: string | null;
    url?: string | null;
    type?: string | null;
    hideThumbnail?: boolean;
    thumbnailClipArea?: { x: number; y: number; width: number; height: number } | null;
    thumbnailTime?: number | null;
  }

  export type NotificationTrigger = 
    | null
    | DateTrigger
    | TimeIntervalTrigger
    | DailyTrigger
    | CalendarTrigger;

  export interface DateTrigger {
    type: 'date';
    date: Date | number;
  }

  export interface TimeIntervalTrigger {
    type: 'timeInterval';
    seconds: number;
    repeats?: boolean;
  }

  export interface DailyTrigger {
    type: 'daily';
    hour: number;
    minute: number;
    repeats?: boolean;
  }

  export interface CalendarTrigger {
    type: 'calendar';
    repeats?: boolean;
    hour?: number;
    minute?: number;
    second?: number;
    weekday?: number;
    weekOfMonth?: number;
    weekOfYear?: number;
    weekdayOrdinal?: number;
    day?: number;
    month?: number;
    year?: number;
    timezone?: string;
  }

  export interface Notification {
    date: number;
    request: NotificationRequest;
  }

  export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
    userText?: string;
  }

  export interface NotificationPermissionsStatus {
    status: 'granted' | 'denied' | 'undetermined';
    expires?: number;
    canAskAgain?: boolean;
    granted?: boolean;
    ios?: {
      status: 'granted' | 'denied' | 'undetermined';
      allowsAlert?: boolean;
      allowsSound?: boolean;
      allowsBadge?: boolean;
      allowsAnnouncements?: boolean;
      allowsDisplayInCarPlay?: boolean;
      allowsCriticalAlerts?: boolean;
      alertStyle?: 'banner' | 'alert' | 'none';
      allowsProvidesAppSettings?: boolean;
    };
    android?: {
      importance?: number;
      interruptionFilter?: number;
    };
  }

  export interface NotificationHandler {
    handleNotification: (notification: Notification) => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }

  export interface NotificationSubscription {
    remove: () => void;
  }

  export function scheduleNotificationAsync(
    request: NotificationRequest
  ): Promise<string>;

  export function cancelScheduledNotificationAsync(
    identifier: string
  ): Promise<void>;

  export function cancelAllScheduledNotificationsAsync(): Promise<void>;

  export function getAllScheduledNotificationsAsync(): Promise<Notification[]>;

  export function presentNotificationAsync(
    content: NotificationContent,
    identifier?: string
  ): Promise<string>;

  export function dismissNotificationAsync(identifier: string): Promise<void>;

  export function dismissAllNotificationsAsync(): Promise<void>;

  export function getPermissionsAsync(): Promise<NotificationPermissionsStatus>;

  export function requestPermissionsAsync(
    permissions?: {
      ios?: {
        allowAlert?: boolean;
        allowBadge?: boolean;
        allowSound?: boolean;
        allowDisplayInCarPlay?: boolean;
        allowCriticalAlerts?: boolean;
        provideAppNotificationSettings?: boolean;
        provisional?: boolean;
        allowAnnouncements?: boolean;
      };
      android?: {};
    }
  ): Promise<NotificationPermissionsStatus>;

  export function setNotificationHandler(
    handler: NotificationHandler | null
  ): void;

  export function setNotificationChannelAsync(
    channelId: string,
    channel: {
      name: string;
      importance?: number;
      description?: string;
      sound?: string | null;
      enableLights?: boolean;
      lightColor?: string;
      enableVibrate?: boolean;
      vibrationPattern?: number[] | null;
      showBadge?: boolean;
      bypassDnd?: boolean;
      audioAttributes?: {
        usage: number;
        contentType: number;
        flags: {
          enforceAudibility: number;
          requestHardwareAudioVideoSynchronization: number;
        };
      };
    }
  ): Promise<void | null>;

  export function getNotificationChannelAsync(
    channelId: string
  ): Promise<any | null>;

  export function getNotificationChannelsAsync(): Promise<any[]>;

  export function deleteNotificationChannelAsync(
    channelId: string
  ): Promise<void>;

  export function getNotificationCategoriesAsync(): Promise<any[]>;

  export function setNotificationCategoryAsync(
    identifier: string,
    actions: any[],
    options?: any
  ): Promise<any>;

  export function deleteNotificationCategoryAsync(
    identifier: string
  ): Promise<boolean>;

  export function addNotificationReceivedListener(
    listener: (notification: Notification) => void
  ): NotificationSubscription;

  export function addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void
  ): NotificationSubscription;

  export function addNotificationsDroppedListener(
    listener: () => void
  ): NotificationSubscription;

  export function removeNotificationSubscription(
    subscription: NotificationSubscription
  ): void;

  export function getBadgeCountAsync(): Promise<number>;

  export function setBadgeCountAsync(badgeCount: number): Promise<boolean>;

  export function getExpoPushTokenAsync(options?: {
    experienceId?: string;
    devicePushToken?: { data: string; type: 'ios' | 'android' };
    applicationId?: string;
    development?: boolean;
  }): Promise<{ data: string; type: 'expo' }>;

  export function getDevicePushTokenAsync(): Promise<{ data: string; type: 'ios' | 'android' }>;

  export const DEFAULT_ACTION_IDENTIFIER: string;
}