import {useEffect} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BooksPage from './pages/BooksPage';
import ReaderPage from './pages/ReaderPage';
import SavedPage from './pages/SavedPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';
import GrowthPage from './pages/GrowthPage';
import StudyPage from './pages/StudyPage';
import {useSettingsStore} from './store/settingsStore';
import {applyThemeVars, getTheme} from './themes';

export default function App() {
    const designTheme = useSettingsStore(state => state.designTheme);
    const appFontScale = useSettingsStore(state => state.appFontScale);
    const showDecorativeCrosses = useSettingsStore(state => state.showDecorativeCrosses);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);

    useEffect(() => {
        applyThemeVars(document.documentElement, getTheme(designTheme));
    }, [designTheme]);

    useEffect(() => {
        document.documentElement.style.setProperty('--app-font-scale', String(appFontScale));
    }, [appFontScale]);

    useEffect(() => {
        document.documentElement.lang = systemLanguage === 'ti' ? 'ti' : 'en';
    }, [systemLanguage]);

    useEffect(() => {
        if (showDecorativeCrosses) {
            document.documentElement.setAttribute('data-crosses', 'on');
            return;
        }

        document.documentElement.removeAttribute('data-crosses');
    }, [showDecorativeCrosses]);

    return (
        <Routes>
            <Route element={<Layout/>}>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/journey" element={<SavedPage/>}/>
                <Route path="/growth" element={<GrowthPage/>}/>
                <Route path="/settings" element={<SettingsPage/>}/>
                <Route path="/search" element={<SearchPage/>}/>
                <Route path="/books/:bookId" element={<BooksPage/>}/>
                <Route path="/reader/:bookId/:chapter" element={<ReaderPage/>}/>
                <Route path="/saved" element={<Navigate to="/journey" replace/>}/>
                <Route path="/about" element={<AboutPage/>}/>
                <Route path="/privacy" element={<PrivacyPage/>}/>
                <Route path="/scrolls" element={<Navigate to="/search" replace/>}/>
                <Route path="/study" element={<StudyPage/>}/>
                <Route path="/library" element={<Navigate to="/" replace/>}/>
                <Route path="/study-redirect" element={<Navigate to="/study" replace/>}/>
            </Route>
            <Route path="*" element={<NotFoundPage/>}/>
        </Routes>
    );
}
