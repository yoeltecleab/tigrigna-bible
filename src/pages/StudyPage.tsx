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
            if (cancelled) return;
            const firstBook = books.find(book => book.id === 'ZEFTRET') ?? books[0];
            navigate(firstBook ? `/reader/${firstBook.id}/1` : '/', {replace: true});
        });
        return () => {
            cancelled = true;
        };
    }, [language, lastReading, navigate]);

    return <p className="page-loading">{ui.loading}</p>;
}
