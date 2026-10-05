import {useEffect, useState} from 'react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallPrompt() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const onBeforeInstall = (event: Event) => {
            event.preventDefault();
            setDeferred(event as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    }, []);

    if (!deferred) {
        return null;
    }

    const install = async () => {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
    };

    return (
        <button className="install-btn" onClick={install} type="button">
            Install App
        </button>
    );
}
