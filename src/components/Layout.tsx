import {Link, NavLink, Outlet, useLocation} from 'react-router-dom';
import InstallPrompt from './InstallPrompt';

const navItems = [
    {to: '/', label: 'Library', icon: 'auto_stories'},
    {to: '/journey', label: 'Journey', icon: 'auto_awesome'},
    {to: '/settings', label: 'Settings', icon: 'settings'},
    {to: '/search', label: 'Search', icon: 'history_edu'}
];

export default function Layout() {
    const location = useLocation();
    const activeItem = navItems.find(item => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
    const routeKey = activeItem?.label.toLocaleLowerCase() ?? 'library';
    const routeTitle = activeItem?.label ?? 'Library';
    const routeSubtitle =
        routeTitle === 'Library'
            ? 'The Word'
            : routeTitle === 'Journey'
                ? 'Saved Verses'
                : routeTitle === 'Settings'
                    ? 'App Preferences'
                    : 'Search the Scriptures';

    return (
        <div className="app-shell" data-route={routeKey}>
            <header className="topbar">
                <div className="brand-lockup">
                    <Link className="icon-button" to="/" aria-label="Go to library">
                        <span className="material-symbols-outlined">church</span>
                    </Link>
                    <div>
                        <h1>ወንጌል ቅዱስ</h1>
                        <p>{routeSubtitle}</p>
                    </div>
                </div>
                <div className="topbar-actions">
                    <Link className="icon-button" to="/search" aria-label="Search scriptures">
                        <span className="material-symbols-outlined">search</span>
                    </Link>
                    <Link className="icon-button" to="/settings" aria-label="Open settings">
                        <span className="material-symbols-outlined">settings</span>
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
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </aside>

                <main className="content">
                    <div className="route-crumb">{routeTitle}</div>
                    <Outlet/>
                    <footer className="app-footer">
                        <Link to="/about">About</Link>
                        <span aria-hidden="true">·</span>
                        <Link to="/privacy">Privacy</Link>
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
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span className="tab-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
