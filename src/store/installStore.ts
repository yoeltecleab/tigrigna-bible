import {create} from 'zustand';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
};

const detectIos = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return /iphone|ipad|ipod/.test(ua) || iPadOs;
};

const detectStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & {standalone?: boolean}).standalone);

const DISMISS_KEY = 'tb-install-card-dismissed';

type InstallState = {
    deferred: BeforeInstallPromptEvent | null;
    isIos: boolean;
    isStandalone: boolean;
    cardDismissed: boolean;
    promptInstall: () => Promise<boolean>;
    dismissCard: () => void;
};

export const useInstallStore = create<InstallState>()((set, get) => ({
    deferred: null,
    isIos: detectIos(),
    isStandalone: detectStandalone(),
    cardDismissed: localStorage.getItem(DISMISS_KEY) === '1',
    promptInstall: async () => {
        const deferred = get().deferred;
        if (!deferred) return false;
        await deferred.prompt();
        const choice = await deferred.userChoice;
        set({deferred: null, isStandalone: choice.outcome === 'accepted' || get().isStandalone});
        return choice.outcome === 'accepted';
    },
    dismissCard: () => {
        localStorage.setItem(DISMISS_KEY, '1');
        set({cardDismissed: true});
    }
}));

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    useInstallStore.setState({deferred: event as BeforeInstallPromptEvent});
});

window.addEventListener('appinstalled', () => useInstallStore.setState({deferred: null, isStandalone: true}));

/** Installable on this device right now (native prompt available, or iOS Safari manual flow). */
export const canOfferInstall = (state: InstallState) => !state.isStandalone && (Boolean(state.deferred) || state.isIos);
