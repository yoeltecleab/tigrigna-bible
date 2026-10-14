import {Link} from 'react-router-dom';
import {getUi} from '../i18n/ui';
import {useSettingsStore} from '../store/settingsStore';

export default function NotFoundPage() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);

    return (
        <section className="empty-state">
            <h2>{ui.pageNotFound}</h2>
            <p>{ui.pageNotFoundBody}</p>
            <Link className="btn" to="/">
                {ui.goBackLibrary}
            </Link>
        </section>
    );
}
