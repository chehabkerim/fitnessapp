import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

import type { AlertPermission, RestAlertsApi } from './types';

// Rest-end alerts only matter when the app is in the background; in the foreground the timer bar and haptics handle it.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }),
});

let current: { endsAt: number; label: string } | null = null;
let scheduledId: string | null = null;

const cancel = async () => {
  if (scheduledId) await Notifications.cancelScheduledNotificationAsync(scheduledId).catch(() => {});
  scheduledId = null;
};

const scheduleIfBackground = async () => {
  await cancel();
  if (!current || AppState.currentState === 'active' || current.endsAt <= Date.now()) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  scheduledId = await Notifications.scheduleNotificationAsync({
    content: { title: 'Rest is over', body: `Time for your next set of ${current.label}.`, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(current.endsAt) },
  }).catch(() => null);
};

AppState.addEventListener('change', (state) => void (state === 'active' ? cancel() : scheduleIfBackground()));

const map = (s: { granted: boolean; canAskAgain: boolean }): AlertPermission => (s.granted ? 'granted' : s.canAskAgain ? 'default' : 'denied');

export const restAlerts: RestAlertsApi = {
  permission: async () => map(await Notifications.getPermissionsAsync()),
  requestPermission: async () => map(await Notifications.requestPermissionsAsync()),
  sync(rest) {
    current = rest;
    void scheduleIfBackground();
  },
};
