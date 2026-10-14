import {Link} from 'react-router-dom';
import OfflinePackPanel from '../components/OfflinePackPanel';
import ThemePicker from '../components/ThemePicker';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';

export default function SettingsPage() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const fontScale = useSettingsStore(state => state.fontScale);
    const appFontScale = useSettingsStore(state => state.appFontScale);
    const designTheme = useSettingsStore(state => state.designTheme);
    const showDecorativeCrosses = useSettingsStore(state => state.showDecorativeCrosses);
    const setSystemLanguage = useSettingsStore(state => state.setSystemLanguage);
    const setFontScale = useSettingsStore(state => state.setFontScale);
    const setAppFontScale = useSettingsStore(state => state.setAppFontScale);
    const syncFontScales = useSettingsStore(state => state.syncFontScales);
    const setDesignTheme = useSettingsStore(state => state.setDesignTheme);
    const setShowDecorativeCrosses = useSettingsStore(state => state.setShowDecorativeCrosses);
    const recentSearches = useSettingsStore(state => state.recentSearches);
    const clearRecentSearches = useSettingsStore(state => state.clearRecentSearches);
    const ui = getUi(systemLanguage);

    return (
        <section className="stack-lg">
            <div className="panel hero-panel stack-sm">
                <p className="eyebrow">{ui.settings}</p>
                <h3>{ui.readingPreferences}</h3>

                <label className="stack-xs">
                    <span>{ui.bibleLanguage}</span>
                    <select className="input" value="ti" disabled aria-describedby="bible-language-help">
                        <option value="ti">Tigrigna</option>
                    </select>
                    <span id="bible-language-help" className="muted">
                        {ui.scriptureTiOnly}
                    </span>
                </label>

                <label className="stack-xs">
                    <span>{ui.systemLanguage}</span>
                    <select
                        className="input"
                        value={systemLanguage}
                        onChange={event => setSystemLanguage(event.target.value as 'ti' | 'en')}
                    >
                        <option value="en">English</option>
                        <option value="ti">ትግርኛ</option>
                    </select>
                </label>

                <label className="stack-xs">
                    <span>
                        {ui.bibleFontScale} ({fontScale.toFixed(1)}x)
                    </span>
                    <input
                        type="range"
                        className="input"
                        min={0.8}
                        max={1.5}
                        step={0.1}
                        value={fontScale}
                        onChange={event => setFontScale(Number(event.target.value))}
                    />
                </label>

                <label className="stack-xs">
                    <span>
                        {ui.appFontScale} ({appFontScale.toFixed(1)}x)
                    </span>
                    <input
                        type="range"
                        className="input"
                        min={0.85}
                        max={1.35}
                        step={0.05}
                        value={appFontScale}
                        onChange={event => setAppFontScale(Number(event.target.value))}
                    />
                </label>

                <div className="row gap-sm wrap">
                    <button className="btn" type="button" onClick={syncFontScales}>
                        {ui.matchSizes}
                    </button>
                    <label className="toggle-row" htmlFor="decorative-crosses-toggle">
                        <span>{ui.showCrossMotifs}</span>
                        <button
                            id="decorative-crosses-toggle"
                            type="button"
                            className={showDecorativeCrosses ? 'toggle-switch toggle-switch-on' : 'toggle-switch'}
                            onClick={() => setShowDecorativeCrosses(!showDecorativeCrosses)}
                            aria-pressed={showDecorativeCrosses}
                        >
                            <span />
                        </button>
                    </label>
                </div>

                <div className="stack-xs">
                    <div className="section-header">
                        <span>{ui.recentSearches}</span>
                        {recentSearches.length > 0 ? (
                            <button className="link-btn" type="button" onClick={clearRecentSearches}>
                                {ui.clear}
                            </button>
                        ) : null}
                    </div>
                    {recentSearches.length > 0 ? (
                        <p className="muted">{recentSearches.slice(0, 5).join(' • ')}</p>
                    ) : (
                        <p className="muted">—</p>
                    )}
                </div>
            </div>

            <div className="panel stack-md" id="visual-mode">
                <div>
                    <p className="eyebrow">{ui.themeDrawerSubtitle}</p>
                    <h3>{ui.designTheme}</h3>
                </div>
                <ThemePicker
                    value={designTheme}
                    onChange={setDesignTheme}
                    label={ui.designTheme}
                    tierLabels={{dark: ui.themeTierDark, mid: ui.themeTierMid, light: ui.themeTierLight}}
                />
            </div>

            <div className="panel stack-sm">
                <OfflinePackPanel />
            </div>

            <div className="panel stack-sm">
                <h3>{ui.legal}</h3>
                <div className="row gap-sm wrap">
                    <Link className="btn" to="/about">
                        {ui.aboutAttribution}
                    </Link>
                    <Link className="btn" to="/privacy">
                        {ui.privacyPolicy}
                    </Link>
                </div>
            </div>
        </section>
    );
}
