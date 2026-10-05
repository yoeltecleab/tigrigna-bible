import {create} from 'zustand';
import {persist} from 'zustand/middleware';

type DesignTheme = 'sacred-covenant' | 'aether-light' | 'orthodox';
type UiLanguage = 'ti' | 'en';

type LastReading = {
    bookId: string;
    chapter: number;
};

type SettingsState = {
    language: string;
    bibleLanguage: UiLanguage;
    systemLanguage: UiLanguage;
    fontScale: number;
    appFontScale: number;
    designTheme: DesignTheme;
    showDecorativeCrosses: boolean;
    recentSearches: string[];
    lastReading: LastReading | null;
    setLanguage: (language: string) => void;
    setBibleLanguage: (language: UiLanguage) => void;
    setSystemLanguage: (language: UiLanguage) => void;
    setFontScale: (fontScale: number) => void;
    setAppFontScale: (appFontScale: number) => void;
    syncFontScales: () => void;
    setDesignTheme: (designTheme: DesignTheme) => void;
    setShowDecorativeCrosses: (enabled: boolean) => void;
    addRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
    setLastReading: (lastReading: LastReading) => void;
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        set => ({
            language: 'ti',
            bibleLanguage: 'ti',
            systemLanguage: 'en',
            fontScale: 1,
            appFontScale: 1,
            designTheme: 'sacred-covenant',
            showDecorativeCrosses: true,
            recentSearches: [],
            lastReading: null,
            setLanguage: language => set({language}),
            setBibleLanguage: bibleLanguage =>
                set({
                    bibleLanguage,
                    // English bible content is not wired yet, so we keep content language on Tigrigna.
                    language: 'ti'
                }),
            setSystemLanguage: systemLanguage => set({systemLanguage}),
            setFontScale: fontScale => set({fontScale}),
            setAppFontScale: appFontScale => set({appFontScale}),
            syncFontScales: () => set(state => ({appFontScale: Math.min(1.35, Math.max(0.85, state.fontScale))})),
            setDesignTheme: designTheme => set({designTheme}),
            setShowDecorativeCrosses: showDecorativeCrosses => set({showDecorativeCrosses}),
            addRecentSearch: query =>
                set(state => {
                    const trimmed = query.trim();
                    if (trimmed.length < 2) {
                        return state;
                    }

                    const deduped = state.recentSearches.filter(item => item.toLocaleLowerCase() !== trimmed.toLocaleLowerCase());
                    return {
                        recentSearches: [trimmed, ...deduped].slice(0, 12)
                    };
                }),
            clearRecentSearches: () => set({recentSearches: []}),
            setLastReading: lastReading => set({lastReading})
        }),
        {
            name: 'tb-web-settings-v1'
        }
    )
);
