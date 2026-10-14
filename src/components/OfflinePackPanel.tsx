import {useCallback, useEffect, useRef, useState} from 'react';
import {loadBooks} from '../data/api';
import {countOfflineInventory, downloadOfflinePack, estimateStorageMb, type OfflineInventory, type OfflineProgress} from '../lib/offlinePack';
import {getUi} from '../i18n/ui';
import {useSettingsStore} from '../store/settingsStore';
import {toast} from '../store/uiStore';
import Icon from './Icon';
import {ListGroup, ProgressBar} from './ui';

export default function OfflinePackPanel() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const [inventory, setInventory] = useState<OfflineInventory | null>(null);
    const [progress, setProgress] = useState<OfflineProgress | null>(null);
    const [storageMb, setStorageMb] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const refresh = useCallback(async () => {
        const books = await loadBooks(language);
        setInventory(await countOfflineInventory(language, books));
        setStorageMb(await estimateStorageMb());
    }, [language]);

    useEffect(() => {
        void refresh();
        return () => abortRef.current?.abort();
    }, [refresh]);

    const startDownload = async () => {
        setFailed(false);
        const controller = new AbortController();
        abortRef.current = controller;
        setProgress({done: 0, total: 1});
        try {
            const books = await loadBooks(language);
            setInventory(await downloadOfflinePack(language, books, setProgress, controller.signal));
            toast(ui.offlineDownloadDone);
        } catch (error) {
            if ((error as DOMException)?.name !== 'AbortError') setFailed(true);
        } finally {
            abortRef.current = null;
            setProgress(null);
            await refresh();
        }
    };

    const downloading = progress != null;
    const percent = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    const status = !inventory
        ? ui.loading
        : inventory.ready
          ? ui.offlineReady
          : inventory.chaptersCached > 0
            ? ui.offlinePartial(inventory.chaptersCached, inventory.chaptersTotal)
            : ui.offlineEmpty;

    return (
        <ListGroup header={ui.offline} footer={failed ? ui.offlineDownloadFailed : storageMb ? ui.storageUsed(storageMb) : undefined}>
            <div className="list-row offline-row">
                <span className={inventory?.ready ? 'row-icon row-icon-green' : 'row-icon row-icon-blue'} aria-hidden="true">
                    <Icon name={inventory?.ready ? 'check_circle' : 'offline'} size={17} />
                </span>
                <span className="row-copy">
                    <span className="row-title">{ui.offlinePack}</span>
                    <span className="row-detail">{downloading ? ui.downloadingOffline(percent) : status}</span>
                    {downloading ? <ProgressBar value={percent} label={ui.offlinePack} /> : null}
                </span>
                {downloading ? (
                    <button type="button" className="btn btn-plain btn-small" onClick={() => abortRef.current?.abort()}>
                        {ui.cancelDownload}
                    </button>
                ) : inventory && !inventory.ready ? (
                    <button type="button" className="btn btn-tinted btn-small" onClick={() => void startDownload()}>
                        <Icon name="download" size={15} />
                        {ui.downloadOffline}
                    </button>
                ) : null}
            </div>
        </ListGroup>
    );
}
