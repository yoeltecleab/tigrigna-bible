import {useEffect} from 'react';
import {useSettingsStore} from '../store/settingsStore';
import {dayKey, useProgressStore} from '../store/progressStore';
import {useUiStore} from '../store/uiStore';
import {getUi} from '../i18n/ui';

const NOTIFIED_KEY = 'tb-reminder-notified';

const reminderDate = (time: string, now = new Date()) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(now);
    date.setHours(Number.isFinite(hours) ? hours : 7, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    return date;
};

const notify = async (title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (localStorage.getItem(NOTIFIED_KEY) === dayKey()) return;
    localStorage.setItem(NOTIFIED_KEY, dayKey());
    try {
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration) {
            await registration.showNotification(title, {body, icon: '/icons/icon-192-v6.png', badge: '/icons/icon-192-v6.png', tag: 'daily-reading'});
            return;
        }
        new Notification(title, {body, icon: '/icons/icon-192-v6.png'});
    } catch {
        // Notifications are best-effort.
    }
};

/** In-app nudge (and a notification while the app is open) when today's reading is still pending. */
export function useReadingReminder() {
    const enabled = useSettingsStore(state => state.reminderEnabled);
    const time = useSettingsStore(state => state.reminderTime);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const log = useProgressStore(state => state.log);
    const setReminderDue = useUiStore(state => state.setReminderDue);
    const readToday = (log[dayKey()]?.length ?? 0) > 0;

    useEffect(() => {
        if (!enabled || readToday) {
            setReminderDue(false);
            return;
        }
        const ui = getUi(systemLanguage);
        const fire = () => {
            setReminderDue(true);
            void notify(ui.reminder, ui.reminderBanner);
        };
        const wait = reminderDate(time).getTime() - Date.now();
        if (wait <= 0) {
            fire();
            return;
        }
        setReminderDue(false);
        const timer = window.setTimeout(fire, Math.min(wait, 2_147_000_000));
        return () => window.clearTimeout(timer);
    }, [enabled, time, readToday, systemLanguage, setReminderDue]);
}
