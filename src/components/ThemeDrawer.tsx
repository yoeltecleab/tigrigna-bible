import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link} from 'react-router-dom';
import ThemePicker from './ThemePicker';
import Icon from './Icon';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';
import {getTheme} from '../themes';

export default function ThemeDrawer() {
    const [open, setOpen] = useState(false);
    const designTheme = useSettingsStore(state => state.designTheme);
    const setDesignTheme = useSettingsStore(state => state.setDesignTheme);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const active = getTheme(designTheme);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        const trigger = triggerRef.current;
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKey);
            trigger?.focus();
        };
    }, [open]);

    const drawer = open ? (
        <div className="drawer-root">
            <button type="button" className="drawer-scrim" aria-label={ui.close} onClick={() => setOpen(false)} />
            <aside className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="theme-drawer-title">
                <header className="drawer-head">
                    <div>
                        <p id="theme-drawer-title" className="drawer-title">{ui.designTheme}</p>
                        <p className="drawer-subtitle">
                            {ui.themeDrawerSubtitle} · <span className="drawer-current">{active.label}</span>
                        </p>
                    </div>
                    <button ref={closeRef} type="button" className="icon-button" aria-label={ui.close} onClick={() => setOpen(false)}>
                        <Icon name="close" size={20} />
                    </button>
                </header>
                <div className="drawer-body">
                    <ThemePicker
                        value={designTheme}
                        onChange={setDesignTheme}
                        label={ui.designTheme}
                        tierLabels={{dark: ui.themeTierDark, mid: ui.themeTierMid, light: ui.themeTierLight}}
                    />
                    <Link className="btn drawer-footer-link" to="/settings" onClick={() => setOpen(false)}>
                        <Icon name="settings" size={16} />
                        {ui.moreSettings}
                    </Link>
                </div>
            </aside>
        </div>
    ) : null;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="icon-button theme-trigger"
                aria-label={ui.openThemes}
                aria-haspopup="dialog"
                aria-expanded={open}
                title={`${ui.designTheme} — ${active.label}`}
                onClick={() => setOpen(true)}
            >
                <Icon name="palette" size={20} />
                <span className="theme-trigger-dot" aria-hidden="true" />
            </button>
            {drawer ? createPortal(drawer, document.body) : null}
        </>
    );
}
