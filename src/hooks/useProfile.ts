import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../types';

const STORAGE_KEY = 'calora_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: '1',
  age: 25,
  weight: 70,
  height: 175,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        setProfile(JSON.parse(raw));
      }
      setIsLoading(false);
    });
  }, []);

  const saveProfile = useCallback(async (updated: UserProfile) => {
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  return { profile, saveProfile, isLoading };
}
