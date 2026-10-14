import {useState, type CSSProperties} from 'react';
import OfflinePackPanel from '../components/OfflinePackPanel';
import ReminderRows from '../components/ReminderRows';
import ThemeSheet from '../components/ThemeSheet';
import InstallSheet from '../components/InstallSheet';
import {ReadingControls} from '../components/reader/ReadingOptionsSheet';
import {ListGroup, ListRow, PageHeader, Segmented, Switch} from '../components/ui';
import {useSettingsStore} from '../store/settingsStore';
import {useProgressStore} from '../store/progressStore';
import {useInstallStore} from '../store/installStore';
import {toast} from '../store/uiStore';
import {getTheme} from '../themes';
import {getUi} from '../i18n/ui';

const APP_SIZE_STEPS = [0.9, 1, 1.1, 1.2, 1.3];

export default function SettingsPage() {
    const settings = useSettingsStore();
    const resetProgress = useProgressStore(state => state.resetProgress);
    const isStandalone = useInstallStore(state => state.isStandalone);
    const ui = getUi(settings.systemLanguage);
    const [themeOpen, setThemeOpen] = useState(false);
    const [installOpen, setInstallOpen] = useState(false);

    const themeValue =
        settings.appearance === 'system'
            ? `${getTheme(settings.lightTheme).label} / ${getTheme(settings.darkTheme).label}`
            : getTheme(settings.designTheme).label;
    const appSize = APP_SIZE_STEPS.reduce((best, value) => (Math.abs(value - settings.appFontScale) < Math.abs(best - settings.appFontScale) ? value : best));

    return (
        <section className="page settings-page">
            <PageHeader title={ui.settings} />

            <ListGroup header={ui.appearance} footer={ui.backgroundEffectsHint}>
                <ListRow
                    icon="palette"
                    iconTone="purple"
                    title={ui.theme}
                    detail={settings.appearance === 'system' ? ui.matchSystem : undefined}
                    value={themeValue}
                    onClick={() => setThemeOpen(true)}
                    chevron
                />
                <ListRow
                    icon="sparkles"
                    iconTone="indigo"
                    title={ui.backgroundEffects}
                    accessory={<Switch checked={settings.ambientEffects} onChange={settings.setAmbientEffects} label={ui.backgroundEffects} />}
                />
            </ListGroup>

            <section className="list-group">
                <h2 className="list-group-header">{ui.reading}</h2>
                <div
                    className={`card reading-preview reader-font-${settings.readerFont}`}
                    style={{'--reader-size': `calc(17px * ${settings.fontScale})`, '--reader-leading': settings.lineHeightScale} as CSSProperties}
                    lang="ti"
                >
                    <span className="reading-preview-label">{ui.preview}</span>
                    <p className="reading-preview-text">
                        {settings.showVerseNumbers ? <sup className="verse-sup">16</sup> : null}
                        “በቲ ሓደ ወዱ ዝኣመነ ዘበለ ዅሉ ናይ ዘለዓለም ሕይወት ምእንቲ ኺረክብ እምበር ከይጠፍእሲ፥ ኣምላኽ ንወዱ በጃ ኽሳዕ ዚህብ ክሳዕ ክንድዚ ንዓለም ኣፍቀራ።
                    </p>
                </div>
                <div className="options-stack">
                    <ReadingControls ui={ui} />
                </div>
            </section>

            <ListGroup header={ui.appLanguage} footer={ui.scriptureTiOnly}>
                <div className="list-row">
                    <span className="row-icon row-icon-blue" aria-hidden="true">
                        <span className="row-icon-glyph">ሀ</span>
                    </span>
                    <span className="row-copy">
                        <span className="row-title">{ui.appLanguage}</span>
                    </span>
                    <Segmented
                        value={settings.systemLanguage}
                        onChange={settings.setSystemLanguage}
                        label={ui.appLanguage}
                        options={[
                            {value: 'en', label: 'English'},
                            {value: 'ti', label: 'ትግርኛ'}
                        ]}
                    />
                </div>
                <ListRow icon="menu_book" iconTone="brown" title={ui.bibleLanguage} value="ትግርኛ" />
                <div className="list-row">
                    <span className="row-icon row-icon-gray" aria-hidden="true">
                        <span className="row-icon-glyph">Aa</span>
                    </span>
                    <span className="row-copy">
                        <span className="row-title">{ui.appTextSize}</span>
                    </span>
                    <Segmented
                        value={String(appSize)}
                        onChange={value => settings.setAppFontScale(Number(value))}
                        label={ui.appTextSize}
                        options={APP_SIZE_STEPS.map((value, index) => ({
                            value: String(value),
                            label: <span style={{fontSize: `${0.72 + index * 0.08}rem`}}>A</span>
                        }))}
                    />
                </div>
            </ListGroup>

            <ReminderRows />

            <OfflinePackPanel />

            <ListGroup footer={isStandalone ? undefined : ui.installAppHint}>
                <ListRow
                    icon="add_home"
                    iconTone="green"
                    title={ui.installApp}
                    value={isStandalone ? ui.installed : undefined}
                    onClick={() => setInstallOpen(true)}
                    chevron
                />
            </ListGroup>

            <ListGroup header={ui.data}>
                <ListRow
                    icon="history"
                    iconTone="gray"
                    title={ui.clearRecentSearches}
                    value={settings.recentSearches.length || undefined}
                    onClick={() => {
                        settings.clearRecentSearches();
                        toast(ui.clear);
                    }}
                />
                <ListRow
                    icon="refresh"
                    iconTone="red"
                    title={ui.resetProgress}
                    destructive
                    onClick={() => {
                        if (window.confirm(ui.resetProgressConfirm)) {
                            resetProgress();
                            toast(ui.progressReset);
                        }
                    }}
                />
            </ListGroup>

            <ListGroup header={ui.about}>
                <ListRow icon="info" iconTone="blue" title={ui.aboutAttribution} to="/about" />
                <ListRow icon="shield" iconTone="green" title={ui.privacyPolicy} to="/privacy" />
                <ListRow icon="church" iconTone="brown" title={ui.version} value={__APP_VERSION__} />
            </ListGroup>

            <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
            <InstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
        </section>
    );
}
