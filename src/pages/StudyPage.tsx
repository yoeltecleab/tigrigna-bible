import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {loadBooks} from '../data/api';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';

export default function StudyPage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const lastReading = useSettingsStore(state => state.lastReading);
    const navigate = useNavigate();
    const ui = getUi(systemLanguage);

    useEffect(() => {
        let cancelled = false;

        if (lastReading) {
            navigate(`/reader/${lastReading.bookId}/${lastReading.chapter}`, {replace: true});
            return;
        }

        void loadBooks(language).then(books => {
            if (cancelled) {
                return;
            }

            const firstBook = books.find(book => book.id === 'ZEFTRET') ?? books[0];
            if (firstBook) {
                navigate(`/reader/${firstBook.id}/1`, {replace: true});
            } else {
                navigate('/', {replace: true});
            }
        });

        return () => {
            cancelled = true;
        };
    }, [language, lastReading, navigate]);

    return (
        <section className="stack-lg">
            <div className="panel hero-panel">
                <p className="eyebrow">{ui.resumeReading}</p>
                <h2>{ui.continueReading}</h2>
                <p className="muted">{ui.chooseChapter}</p>
            </div>
        </section>
    );
}
