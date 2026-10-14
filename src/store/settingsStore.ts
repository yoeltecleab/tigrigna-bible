import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {getTheme, normalizeThemeId, type Appearance, type DesignTheme} from '../themes';

type UiLanguage = 'ti' | 'en';

export type {DesignTheme, Appearance};

export type ReaderLayout = 'verses' | 'paragraph';
export type ReaderFont = 'serif' | 'sans';

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
    lineHeightScale: number;
    appearance: Appearance;
    designTheme: DesignTheme;
    lightTheme: DesignTheme;
    darkTheme: DesignTheme;
    ambientEffects: boolean;
    showDecorativeCrosses: boolean;
    readerLayout: ReaderLayout;
    readerFont: ReaderFont;
    showVerseNumbers: boolean;
    showHeadings: boolean;
    showMarkers: boolean;
    focusAutoHide: boolean;
    reminderEnabled: boolean;
    reminderTime: string;
    searchExactPhrase: boolean;
    searchCaseSensitive: boolean;
    recentSearches: string[];
    lastReading: LastReading | null;
    setLanguage: (language: string) => void;
    setBibleLanguage: (language: UiLanguage) => void;
    setSystemLanguage: (language: UiLanguage) => void;
    setFontScale: (fontScale: number) => void;
    setAppFontScale: (appFontScale: number) => void;
    setLineHeightScale: (lineHeightScale: number) => void;
    syncFontScales: () => void;
    setAppearance: (appearance: Appearance) => void;
    setDesignTheme: (designTheme: DesignTheme) => void;
    setLightTheme: (designTheme: DesignTheme) => void;
    setDarkTheme: (designTheme: DesignTheme) => void;
    setAmbientEffects: (enabled: boolean) => void;
    setShowDecorativeCrosses: (enabled: boolean) => void;
    setReaderLayout: (layout: ReaderLayout) => void;
    setReaderFont: (font: ReaderFont) => void;
    setShowVerseNumbers: (enabled: boolean) => void;
    setShowHeadings: (enabled: boolean) => void;
    setShowMarkers: (enabled: boolean) => void;
    setFocusAutoHide: (enabled: boolean) => void;
    setReminderEnabled: (enabled: boolean) => void;
    setReminderTime: (time: string) => void;
    setSearchExactPhrase: (enabled: boolean) => void;
    setSearchCaseSensitive: (enabled: boolean) => void;
    addRecentSearch: (query: string) => void;
    removeRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
    setLastReading: (lastReading: LastReading) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const useSettingsStore = create<SettingsState>()(
    persist(
        set => ({
            language: 'ti',
            bibleLanguage: 'ti',
            systemLanguage: 'en',
            fontScale: 1.1,
            appFontScale: 1,
            lineHeightScale: 1.8,
            appearance: 'system',
            designTheme: 'sand',
            lightTheme: 'sand',
            darkTheme: 'ink',
            ambientEffects: false,
            showDecorativeCrosses: false,
            readerLayout: 'verses',
            readerFont: 'serif',
            showVerseNumbers: true,
            showHeadings: true,
            showMarkers: true,
            focusAutoHide: true,
            reminderEnabled: false,
            reminderTime: '07:00',
            searchExactPhrase: false,
            searchCaseSensitive: false,
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
            setFontScale: fontScale => set({fontScale: clamp(fontScale, 0.8, 1.8)}),
            setAppFontScale: appFontScale => set({appFontScale: clamp(appFontScale, 0.85, 1.35)}),
            setLineHeightScale: lineHeightScale => set({lineHeightScale: clamp(lineHeightScale, 1.4, 2.4)}),
            syncFontScales: () => set(state => ({appFontScale: clamp(state.fontScale, 0.85, 1.35)})),
            setAppearance: appearance => set({appearance}),
            setDesignTheme: designTheme => set({designTheme, appearance: 'fixed'}),
            setLightTheme: lightTheme => set({lightTheme: getTheme(lightTheme).tier === 'light' ? lightTheme : 'sand'}),
            setDarkTheme: darkTheme => set({darkTheme: getTheme(darkTheme).tier !== 'light' ? darkTheme : 'ink'}),
            setAmbientEffects: ambientEffects => set({ambientEffects}),
            setShowDecorativeCrosses: showDecorativeCrosses => set({showDecorativeCrosses}),
            setReaderLayout: readerLayout => set({readerLayout}),
            setReaderFont: readerFont => set({readerFont}),
            setShowVerseNumbers: showVerseNumbers => set({showVerseNumbers}),
            setShowHeadings: showHeadings => set({showHeadings}),
            setShowMarkers: showMarkers => set({showMarkers}),
            setFocusAutoHide: focusAutoHide => set({focusAutoHide}),
            setReminderEnabled: reminderEnabled => set({reminderEnabled}),
            setReminderTime: reminderTime => set({reminderTime}),
            setSearchExactPhrase: searchExactPhrase => set({searchExactPhrase}),
            setSearchCaseSensitive: searchCaseSensitive => set({searchCaseSensitive}),
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
            removeRecentSearch: query => set(state => ({recentSearches: state.recentSearches.filter(item => item !== query)})),
            clearRecentSearches: () => set({recentSearches: []}),
            setLastReading: lastReading => set({lastReading})
        }),
        {
            name: 'tb-web-settings-v1',
            version: 2,
            migrate: persisted => {
                const incoming = (persisted ?? {}) as Partial<SettingsState>;
                // Users from before appearance modes keep the exact theme they picked.
                return {
                    ...incoming,
                    appearance: incoming.appearance ?? (incoming.designTheme ? 'fixed' : 'system'),
                    showDecorativeCrosses: false
                } as SettingsState;
            },
            merge: (persisted, current) => {
                const incoming = (persisted ?? {}) as Partial<SettingsState>;
                const lightTheme = normalizeThemeId(incoming.lightTheme ?? current.lightTheme);
                const darkTheme = normalizeThemeId(incoming.darkTheme ?? current.darkTheme);
                return {
                    ...current,
                    ...incoming,
                    designTheme: normalizeThemeId(incoming.designTheme ?? current.designTheme),
                    lightTheme: getTheme(lightTheme).tier === 'light' ? lightTheme : current.lightTheme,
                    darkTheme: getTheme(darkTheme).tier !== 'light' ? darkTheme : current.darkTheme
                };
            }
        }
    )
);
