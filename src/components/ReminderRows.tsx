import {ListGroup, ListRow, Switch} from './ui';
import {useSettingsStore} from '../store/settingsStore';
import {toast} from '../store/uiStore';
import {getUi} from '../i18n/ui';

export default function ReminderRows() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const reminderEnabled = useSettingsStore(state => state.reminderEnabled);
    const reminderTime = useSettingsStore(state => state.reminderTime);
    const setReminderEnabled = useSettingsStore(state => state.setReminderEnabled);
    const setReminderTime = useSettingsStore(state => state.setReminderTime);
    const ui = getUi(systemLanguage);

    const toggle = async (enabled: boolean) => {
        setReminderEnabled(enabled);
        if (enabled && 'Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'denied') toast(ui.notificationsBlocked);
        }
    };

    return (
        <ListGroup header={ui.reminder} footer={ui.reminderHint}>
            <ListRow
                icon="bell"
                iconTone="orange"
                title={ui.reminder}
                accessory={<Switch checked={reminderEnabled} onChange={value => void toggle(value)} label={ui.reminder} />}
            />
            {reminderEnabled ? (
                <ListRow
                    icon="calendar"
                    iconTone="red"
                    title={ui.reminderTime}
                    accessory={
                        <input
                            type="time"
                            className="field field-time"
                            value={reminderTime}
                            onChange={event => setReminderTime(event.target.value || '07:00')}
                            aria-label={ui.reminder}
                        />
                    }
                />
            ) : null}
        </ListGroup>
    );
}
