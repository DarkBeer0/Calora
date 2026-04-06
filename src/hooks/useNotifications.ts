import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'calora_notif_settings';

export interface NotifSettings {
  meals: boolean;
  water: boolean;
  summary: boolean;
}

const DEFAULT_SETTINGS: NotifSettings = {
  meals: false,
  water: false,
  summary: false,
};

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface MealReminder {
  id: string;
  hour: number;
  minute: number;
  titleKey: string;
  bodyKey: string;
}

const MEAL_REMINDERS: MealReminder[] = [
  { id: 'breakfast', hour: 8, minute: 0, titleKey: 'notif_breakfast_title', bodyKey: 'notif_breakfast_body' },
  { id: 'lunch', hour: 13, minute: 0, titleKey: 'notif_lunch_title', bodyKey: 'notif_lunch_body' },
  { id: 'dinner', hour: 19, minute: 0, titleKey: 'notif_dinner_title', bodyKey: 'notif_dinner_body' },
];

const WATER_HOURS = [9, 11, 13, 15, 17, 19]; // Every 2 hours from 9 to 19

export function useNotifications() {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // Load settings
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
      setIsLoading(false);
    });
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    return granted;
  };

  const persist = useCallback(async (s: NotifSettings) => {
    setSettings(s);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, []);

  // Schedule all notifications based on current settings
  const scheduleAll = useCallback(async (s: NotifSettings, translations: Record<string, string>) => {
    // Cancel everything first
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (s.meals) {
      for (const meal of MEAL_REMINDERS) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: translations[meal.titleKey] || meal.titleKey,
            body: translations[meal.bodyKey] || meal.bodyKey,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: meal.hour,
            minute: meal.minute,
          },
        });
      }
    }

    if (s.water) {
      for (const hour of WATER_HOURS) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: translations['notif_water_title'] || 'Drink water!',
            body: translations['notif_water_body'] || 'Time to have a glass of water',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute: 0,
          },
        });
      }
    }

    if (s.summary) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: translations['notif_summary_title'] || 'Daily summary',
          body: translations['notif_summary_body'] || 'Check your stats for today',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
        },
      });
    }
  }, []);

  const toggleSetting = useCallback(async (
    key: keyof NotifSettings,
    translations: Record<string, string>,
  ) => {
    // Request permission if enabling for the first time
    if (!settings[key] && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const updated = { ...settings, [key]: !settings[key] };
    await persist(updated);
    await scheduleAll(updated, translations);
  }, [settings, hasPermission, persist, scheduleAll]);

  return {
    settings,
    isLoading,
    hasPermission,
    toggleSetting,
  };
}
