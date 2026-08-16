export interface ReminderItem {
  id: string;
  name: string;
  reminderDate: string | null;
  reminderNotified: string;
}

export function getPendingReminders(items: ReminderItem[]): ReminderItem[] {
  const now = new Date();
  return items.filter((item) => {
    if (!item.reminderDate) return false;
    if (item.reminderNotified === '1') return false;
    const reminderTime = new Date(item.reminderDate);
    return reminderTime <= now;
  });
}

export function getUpcomingReminders(items: ReminderItem[], hours: number = 24): ReminderItem[] {
  const now = new Date();
  const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return items
    .filter((item) => {
      if (!item.reminderDate) return false;
      const reminderTime = new Date(item.reminderDate);
      return reminderTime > now && reminderTime <= future && item.reminderNotified === '0';
    })
    .sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime());
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('denied');
  }
  if (Notification.permission === 'granted') {
    return Promise.resolve('granted');
  }
  return Notification.requestPermission();
}

export function scheduleLocalNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `reminder-${Date.now()}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 10000);
  } catch {
    // Silently fail - notifications are not critical
  }
}
