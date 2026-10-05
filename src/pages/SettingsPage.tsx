import {Link} from 'react-router-dom';
import {useSettingsStore} from '../store/settingsStore';

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

    return (
        <section className="stack-lg">
            <div className="panel hero-panel stack-sm">
                <p className="eyebrow">Settings</p>
                <h3>Reading preferences</h3>
                <p className="muted">Tune interface language, design themes, and font proportions.</p>

                <label className="stack-xs">
                    <span>Bible language</span>
                    <select className="input" value="ti" disabled aria-describedby="bible-language-help">
                        <option value="ti">Tigrigna</option>
                    </select>
                    <span id="bible-language-help" className="muted">
                        Scripture text is currently available in Tigrigna only.
                    </span>
                </label>

                <label className="stack-xs">
                    <span>System language</span>
                    <select
                        className="input"
                        value={systemLanguage}
                        onChange={event => setSystemLanguage(event.target.value as 'ti' | 'en')}
                    >
                        <option value="en">English</option>
                        <option value="ti">Tigrigna</option>
                    </select>
                </label>

                <label className="stack-xs">
                    <span>Design theme</span>
                    <select
                        className="input"
                        value={designTheme}
                        onChange={event => setDesignTheme(event.target.value as 'sacred-covenant' | 'aether-light' | 'orthodox')}
                    >
                        <option value="sacred-covenant">Sacred Covenant (default)</option>
                        <option value="aether-light">Aether Light</option>
                        <option value="orthodox">Orthodox</option>
                    </select>
                </label>

                <label className="stack-xs">
                    <span>Bible font scale ({fontScale.toFixed(1)}x)</span>
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
                    <span>App font scale ({appFontScale.toFixed(1)}x)</span>
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
                        Match sizes
                    </button>
                    <label className="toggle-row" htmlFor="decorative-crosses-toggle">
                        <span>Show cross motifs</span>
                        <button
                            id="decorative-crosses-toggle"
                            type="button"
                            className={showDecorativeCrosses ? 'toggle-switch toggle-switch-on' : 'toggle-switch'}
                            onClick={() => setShowDecorativeCrosses(!showDecorativeCrosses)}
                            aria-pressed={showDecorativeCrosses}
                        >
                            <span/>
                        </button>
                    </label>
                </div>

                <div className="stack-xs">
                    <div className="section-header">
                        <span>Recent searches</span>
                        {recentSearches.length > 0 ? (
                            <button className="link-btn" type="button" onClick={clearRecentSearches}>
                                Clear
                            </button>
                        ) : null}
                    </div>
                    {recentSearches.length > 0 ? (
                        <p className="muted">{recentSearches.slice(0, 5).join(' • ')}</p>
                    ) : (
                        <p className="muted">No recent searches yet.</p>
                    )}
                </div>
            </div>

            <div className="panel stack-sm">
                <h3>Legal</h3>
                <div className="row gap-sm wrap">
                    <Link className="btn" to="/about">
                        About &amp; attribution
                    </Link>
                    <Link className="btn" to="/privacy">
                        Privacy policy
                    </Link>
                </div>
            </div>
        </section>
    );
}
