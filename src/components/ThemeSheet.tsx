import Sheet from './Sheet';
import ThemePicker from './ThemePicker';
import {Segmented} from './ui';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';

export function ThemeChooser() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const appearance = useSettingsStore(state => state.appearance);
    const designTheme = useSettingsStore(state => state.designTheme);
    const lightTheme = useSettingsStore(state => state.lightTheme);
    const darkTheme = useSettingsStore(state => state.darkTheme);
    const setAppearance = useSettingsStore(state => state.setAppearance);
    const setDesignTheme = useSettingsStore(state => state.setDesignTheme);
    const setLightTheme = useSettingsStore(state => state.setLightTheme);
    const setDarkTheme = useSettingsStore(state => state.setDarkTheme);
    const ui = getUi(systemLanguage);
    const tierLabels = {dark: ui.themeTierDark, mid: ui.themeTierMid, light: ui.themeTierLight};

    return (
        <div className="theme-chooser">
            <Segmented
                value={appearance}
                onChange={setAppearance}
                label={ui.appearance}
                stretch
                options={[
                    {value: 'system', label: ui.matchSystem},
                    {value: 'fixed', label: ui.singleTheme}
                ]}
            />
            {appearance === 'system' ? (
                <>
                    <div className="theme-chooser-group">
                        <h3 className="theme-group-title">{ui.lightTheme}</h3>
                        <ThemePicker value={lightTheme} onChange={setLightTheme} label={ui.lightTheme} tierLabels={tierLabels} tiers={['light']} />
                    </div>
                    <div className="theme-chooser-group">
                        <h3 className="theme-group-title">{ui.darkTheme}</h3>
                        <ThemePicker value={darkTheme} onChange={setDarkTheme} label={ui.darkTheme} tierLabels={tierLabels} tiers={['dark', 'mid']} />
                    </div>
                </>
            ) : (
                <ThemePicker value={designTheme} onChange={setDesignTheme} label={ui.theme} tierLabels={tierLabels} />
            )}
        </div>
    );
}

export default function ThemeSheet({open, onClose}: {open: boolean; onClose: () => void}) {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    return (
        <Sheet open={open} onClose={onClose} title={ui.appearance} size="tall" closeLabel={ui.close}>
            <ThemeChooser />
        </Sheet>
    );
}
