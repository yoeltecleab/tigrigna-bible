import {useEffect, useMemo, useState} from 'react';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isIos = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return /iphone|ipad|ipod/.test(ua) || iPadOs;
};

const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && Boolean((window.navigator as Navigator & {standalone?: boolean}).standalone));

export default function InstallPrompt() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissedIos, setDismissedIos] = useState(() => sessionStorage.getItem('tb-ios-install-dismissed') === '1');
    const showIosHint = useMemo(() => isIos() && !isStandalone() && !dismissedIos, [dismissedIos]);

    useEffect(() => {
        const onBeforeInstall = (event: Event) => {
            event.preventDefault();
            setDeferred(event as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    if (deferred) {
        const install = async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
        };

        return (
            <button className="install-btn" onClick={install} type="button">
                {ui.installApp}
            </button>
        );
    }

    if (!showIosHint) {
        return null;
    }

    return (
        <button
            className="install-btn install-btn-ios"
            type="button"
            title={ui.installIosHint}
            onClick={() => {
                sessionStorage.setItem('tb-ios-install-dismissed', '1');
                setDismissedIos(true);
            }}
        >
            {ui.installIosHint}
        </button>
    );
}
