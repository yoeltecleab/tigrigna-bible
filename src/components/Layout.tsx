import {NavLink, Outlet, useLocation} from 'react-router-dom';
import {useEffect, useLayoutEffect, useState} from 'react';
import AmbientScene from './AmbientScene';
import Icon from './Icon';
import {useSettingsStore} from '../store/settingsStore';
import {useUiStore} from '../store/uiStore';
import {getUi} from '../i18n/ui';
import {useReadingReminder} from '../lib/useReadingReminder';

function Toaster() {
    const toasts = useUiStore(state => state.toasts);
    const dismissToast = useUiStore(state => state.dismissToast);
    return (
        <div className="toaster" role="status" aria-live="polite">
            {toasts.map(item => (
                <div key={item.id} className="toast">
                    <span>{item.message}</span>
                    {item.actionLabel && item.onAction ? (
                        <button
                            type="button"
                            className="toast-action"
                            onClick={() => {
                                item.onAction?.();
                                dismissToast(item.id);
                            }}
                        >
                            {item.actionLabel}
                        </button>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

export default function Layout() {
    const location = useLocation();
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ambientEffects = useSettingsStore(state => state.ambientEffects);
    const chromeHidden = useUiStore(state => state.chromeHidden);
    const ui = getUi(systemLanguage);
    const [offline, setOffline] = useState(!navigator.onLine);
    const [updateReady, setUpdateReady] = useState(false);
    const isReader = location.pathname.startsWith('/reader/');
    useReadingReminder();

    const navItems = [
        {to: '/', label: ui.library, icon: 'library'},
        {to: '/growth', label: ui.growth, icon: 'growth'},
        {to: '/journey', label: ui.journey, icon: 'saved'},
        {to: '/search', label: ui.search, icon: 'search'}
    ];

    useEffect(() => {
        const onConnectivity = (event: Event) => setOffline(Boolean((event as CustomEvent<{offline: boolean}>).detail?.offline));
        const onUpdate = () => setUpdateReady(true);
        window.addEventListener('tb-connectivity', onConnectivity);
        window.addEventListener('tb-sw-update', onUpdate);
        return () => {
            window.removeEventListener('tb-connectivity', onConnectivity);
            window.removeEventListener('tb-sw-update', onUpdate);
        };
    }, []);

    useLayoutEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: 'instant'});
    }, [location.pathname]);

    const isActive = (to: string) => (to === '/' ? location.pathname === '/' || location.pathname.startsWith('/books/') : location.pathname.startsWith(to));

    return (
        <div className={['app-shell', isReader ? 'route-reader' : '', isReader && chromeHidden ? 'chrome-hidden' : ''].join(' ')}>
            {ambientEffects && !isReader ? <AmbientScene /> : null}

            <aside className="sidebar" aria-label="Main navigation">
                <NavLink to="/" className="sidebar-brand">
                    <img src="/icons/logo.png" alt="" width={36} height={36} />
                    <span>ወንጌል ቅዱስ</span>
                </NavLink>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={isActive(item.to) ? 'sidebar-item active' : 'sidebar-item'}
                            aria-current={isActive(item.to) ? 'page' : undefined}
                        >
                            <Icon name={item.icon} size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <NavLink to="/settings" className={location.pathname.startsWith('/settings') ? 'sidebar-item active' : 'sidebar-item'}>
                    <Icon name="settings" size={20} />
                    <span>{ui.settings}</span>
                </NavLink>
            </aside>

            <main className="content">
                {offline ? (
                    <div className="banner banner-offline" role="status">
                        <Icon name="offline" size={16} />
                        <span>{ui.youAreOffline}</span>
                    </div>
                ) : null}
                {updateReady ? (
                    <div className="banner banner-update" role="status">
                        <Icon name="sparkles" size={16} />
                        <span>{ui.updateReady}</span>
                        <button
                            type="button"
                            className="banner-action"
                            onClick={() => {
                                window.__tbNeedRefresh?.();
                                window.setTimeout(() => window.location.reload(), 400);
                            }}
                        >
                            {ui.reload}
                        </button>
                    </div>
                ) : null}
                <Outlet />
            </main>

            <nav className="tab-bar" aria-label="Main navigation">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={isActive(item.to) ? 'tab active' : 'tab'}
                        aria-current={isActive(item.to) ? 'page' : undefined}
                    >
                        <Icon name={item.icon} size={24} strokeWidth={isActive(item.to) ? 2.2 : 1.8} />
                        <span className="tab-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <Toaster />
        </div>
    );
}
