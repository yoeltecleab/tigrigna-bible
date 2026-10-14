import {Link} from 'react-router-dom';
import {getUi} from '../i18n/ui';
import {useSettingsStore} from '../store/settingsStore';
import {EmptyState} from '../components/ui';

export default function NotFoundPage() {
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);

    return (
        <main className="page page-standalone">
            <EmptyState
                icon="menu_book"
                title={ui.pageNotFound}
                body={ui.pageNotFoundBody}
                action={
                    <Link className="btn btn-filled" to="/">
                        {ui.goBackLibrary}
                    </Link>
                }
            />
        </main>
    );
}
