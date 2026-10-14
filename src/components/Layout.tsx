import {Link, NavLink, Outlet, useLocation} from 'react-router-dom';
import {useEffect, useLayoutEffect, useState} from 'react';
import InstallPrompt from './InstallPrompt';
import AmbientScene from './AmbientScene';
import ThemeDrawer from './ThemeDrawer';
import Icon from './Icon';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';
import {loadBooks} from '../data/api';
import {countOfflineInventory} from '../lib/offlinePack';

export default function Layout() {
    const location = useLocation();
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const [offline, setOffline] = useState(!navigator.onLine);
    const [updateReady, setUpdateReady] = useState(false);
    const [offlinePackReady, setOfflinePackReady] = useState(false);

    const navItems = [
        {to: '/', label: ui.library, icon: 'auto_stories'},
        {to: '/growth', label: ui.growth, icon: 'military_tech'},
        {to: '/journey', label: ui.journey, icon: 'favorite'},
        {to: '/search', label: ui.search, icon: 'search'}
    ];

    const activeItem = navItems.find(
        item => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`))
    );
    const routeKey =
        activeItem?.to === '/'
            ? 'library'
            : activeItem?.to === '/growth'
                ? 'growth'
                : activeItem?.to === '/journey'
                    ? 'journey'
                    : activeItem?.to === '/search'
                        ? 'search'
                        : 'library';
    const pageSubtitles: Array<[string, string]> = [
        ['/settings', ui.settings],
        ['/about', ui.about],
        ['/privacy', ui.privacy]
    ];
    const routeSubtitle =
        pageSubtitles.find(([prefix]) => location.pathname.startsWith(prefix))?.[1] ??
        (routeKey === 'library'
            ? ui.theWord
            : routeKey === 'journey'
                ? ui.savedVerses
                : routeKey === 'growth'
                    ? ui.soulProgress
                    : ui.searchScriptures);

    useEffect(() => {
        const onConnectivity = (event: Event) => {
            const detail = (event as CustomEvent<{offline: boolean}>).detail;
            setOffline(Boolean(detail?.offline));
        };
        const onUpdate = () => setUpdateReady(true);

        window.addEventListener('tb-connectivity', onConnectivity);
        window.addEventListener('tb-sw-update', onUpdate);
        setOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('tb-connectivity', onConnectivity);
            window.removeEventListener('tb-sw-update', onUpdate);
        };
    }, []);

    useLayoutEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: 'instant'});
    }, [location.pathname]);

    useEffect(() => {
        let cancelled = false;
        void loadBooks(language)
            .then(books => countOfflineInventory(language, books))
            .then(inventory => {
                if (!cancelled) {
                    setOfflinePackReady(inventory.ready);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOfflinePackReady(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [language, location.pathname]);

    return (
        <div className="app-shell" data-route={routeKey}>
            <AmbientScene />
            <header className="topbar">
                <div className="brand-lockup">
                    <Link className="brand-logo-button" to="/" aria-label={ui.library}>
                        <img className="brand-logo" src="/icons/logo.png" alt="" width={36} height={36} />
                    </Link>
                    <div>
                        <h1>ወንጌል ቅዱስ</h1>
                        <p>{routeSubtitle}</p>
                    </div>
                </div>
                <div className="topbar-actions">
                    {offline ? <span className="status-pill status-offline">{ui.offline}</span> : null}
                    {!offline && offlinePackReady ? (
                        <span className="status-pill status-online" title={ui.offlineReady}>
                            {ui.offlineReadyShort}
                        </span>
                    ) : null}
                    {updateReady ? (
                        <button
                            className="install-btn"
                            type="button"
                            onClick={() => {
                                window.__tbNeedRefresh?.();
                                window.location.reload();
                            }}
                        >
                            {ui.reloadToUpdate}
                        </button>
                    ) : null}
                    <ThemeDrawer />
                    <Link className="icon-button mobile-settings" to="/settings" aria-label={ui.settings}>
                        <Icon name="settings" size={20} />
                    </Link>
                    <InstallPrompt/>
                </div>
            </header>

            <div className="shell-grid">
                <aside className="desktop-nav" aria-label="Main navigation">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({isActive}) => (isActive ? 'rail-item active' : 'rail-item')}
                            aria-label={item.label}
                            aria-current={location.pathname === item.to ? 'page' : undefined}
                        >
                            <Icon name={item.icon} size={20} />
                            <span className="rail-label">{item.label}</span>
                        </NavLink>
                    ))}
                    <NavLink
                        className={({isActive}) => (isActive ? 'rail-item rail-settings active' : 'rail-item rail-settings')}
                        to="/settings"
                        aria-label={ui.settings}
                    >
                        <Icon name="settings" size={20} />
                        <span className="rail-label">{ui.settings}</span>
                    </NavLink>
                </aside>

                <main className="content">
                    <Outlet/>
                    <footer className="app-footer">
                        <Link to="/about">{ui.about}</Link>
                        <span aria-hidden="true">·</span>
                        <Link to="/privacy">{ui.privacy}</Link>
                    </footer>
                </main>
            </div>

            <nav className="bottom-nav" aria-label="Main navigation">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({isActive}) => (isActive ? 'tab active' : 'tab')}
                        aria-current={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to)) ? 'page' : undefined}
                    >
                        <Icon name={item.icon} size={22} />
                        <span className="tab-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
