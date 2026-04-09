import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const STORAGE_KEY = 'calora_notif_settings';

// expo-notifications was removed from Expo Go in SDK 53. Loading the module
// at all auto-registers a push-token listener which warns even inside try/catch.
// So we only require it in real builds (standalone / dev client).
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler?.({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // expo-notifications not available
  }
}

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

const WATER_HOURS = [9, 11, 13, 15, 17, 19];

export function useNotifications() {
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
      setIsLoading(false);
    });
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (!Notifications) { setIsSupported(false); return; }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
      setIsSupported(true);
    } catch {
      setIsSupported(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!Notifications) return false;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      return false;
    }
  };

  const persist = useCallback(async (s: NotifSettings) => {
    setSettings(s);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, []);

  const scheduleAll = useCallback(async (s: NotifSettings, translations: Record<string, string>) => {
    if (!Notifications) return;
    try {
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
    } catch {
      // Notification scheduling failed (Expo Go limitation)
    }
  }, []);

  const toggleSetting = useCallback(async (
    key: keyof NotifSettings,
    translations: Record<string, string>,
  ) => {
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
    isSupported,
    toggleSetting,
  };
}
