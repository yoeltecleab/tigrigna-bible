import Sheet from './Sheet';
import Icon from './Icon';
import {useInstallStore} from '../store/installStore';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';

export default function InstallSheet({open, onClose}: {open: boolean; onClose: () => void}) {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const deferred = useInstallStore(state => state.deferred);
    const isIos = useInstallStore(state => state.isIos);
    const isStandalone = useInstallStore(state => state.isStandalone);
    const promptInstall = useInstallStore(state => state.promptInstall);

    return (
        <Sheet open={open} onClose={onClose} title={isIos ? ui.installIosTitle : ui.installApp} closeLabel={ui.close}>
            <div className="install-sheet">
                <div className="install-hero">
                    <img src="/icons/apple-touch-icon-v6.png" alt="" width={76} height={76} className="install-icon" />
                    <div>
                        <p className="install-name">ወንጌል ቅዱስ</p>
                        <p className="muted-text">{ui.installAppHint}</p>
                    </div>
                </div>

                {isStandalone ? (
                    <p className="install-done">
                        <Icon name="check_circle" size={18} /> {ui.installed}
                    </p>
                ) : isIos ? (
                    <ol className="install-steps">
                        <li>
                            <span className="install-step-icon"><Icon name="share" size={18} /></span>
                            {ui.installIosStep1}
                        </li>
                        <li>
                            <span className="install-step-icon"><Icon name="add_home" size={18} /></span>
                            {ui.installIosStep2}
                        </li>
                        <li>
                            <span className="install-step-icon"><Icon name="check" size={18} /></span>
                            {ui.installIosStep3}
                        </li>
                    </ol>
                ) : deferred ? (
                    <button
                        type="button"
                        className="btn btn-filled btn-block btn-large"
                        onClick={() => void promptInstall().then(accepted => accepted && onClose())}
                    >
                        <Icon name="download" size={18} />
                        {ui.installNow}
                    </button>
                ) : null}

                <p className="install-tip">
                    <Icon name="info" size={15} />
                    <span>{ui.installIosIconTip}</span>
                </p>
            </div>
        </Sheet>
    );
}
