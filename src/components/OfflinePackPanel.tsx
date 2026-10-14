import {useEffect, useRef, useState} from 'react';
import {loadBooks} from '../data/api';
import {
    countOfflineInventory,
    downloadOfflinePack,
    type OfflineInventory,
    type OfflineProgress
} from '../lib/offlinePack';
import {getUi} from '../i18n/ui';
import {useSettingsStore} from '../store/settingsStore';

export default function OfflinePackPanel() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const [inventory, setInventory] = useState<OfflineInventory | null>(null);
    const [progress, setProgress] = useState<OfflineProgress | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const refresh = async () => {
        const books = await loadBooks(language);
        const next = await countOfflineInventory(language, books);
        setInventory(next);
    };

    useEffect(() => {
        void refresh();
        return () => {
            abortRef.current?.abort();
        };
    }, [language]);

    const startDownload = async () => {
        setMessage(null);
        setDownloading(true);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const books = await loadBooks(language);
            const next = await downloadOfflinePack(language, books, setProgress, controller.signal);
            setInventory(next);
            setMessage(ui.offlineDownloadDone);
        } catch (error) {
            if ((error as DOMException)?.name === 'AbortError') {
                setMessage(null);
            } else {
                setMessage(ui.offlineDownloadFailed);
            }
            await refresh();
        } finally {
            setDownloading(false);
            setProgress(null);
            abortRef.current = null;
        }
    };

    const statusText = inventory?.ready
        ? ui.offlineReady
        : inventory
          ? inventory.chaptersCached > 0
              ? ui.offlinePartial(inventory.chaptersCached, inventory.chaptersTotal)
              : ui.offlineEmpty
          : '…';

    const percent =
        progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : inventory?.ready ? 100 : 0;

    return (
        <div className="stack-sm offline-pack-panel">
            <div className="section-header">
                <div>
                    <p className="eyebrow">{ui.offlinePack}</p>
                    <p className={inventory?.ready ? 'offline-status offline-status-ready' : 'offline-status'}>{statusText}</p>
                </div>
                {inventory?.ready ? <span className="status-pill status-online">{ui.online}</span> : null}
            </div>

            {progress ? (
                <div className="offline-progress stack-xs">
                    <div className="offline-progress-track" aria-hidden="true">
                        <div className="offline-progress-fill" style={{width: `${percent}%`}} />
                    </div>
                    <p className="muted">
                        {ui.downloadingOffline} {percent}%
                    </p>
                </div>
            ) : null}

            <div className="row gap-sm wrap">
                {downloading ? (
                    <button
                        className="btn"
                        type="button"
                        onClick={() => abortRef.current?.abort()}
                    >
                        {ui.cancelDownload}
                    </button>
                ) : (
                    <button className="btn btn-primary" type="button" onClick={() => void startDownload()}>
                        {ui.downloadOffline}
                    </button>
                )}
            </div>

            {message ? <p className="muted">{message}</p> : null}
        </div>
    );
}
