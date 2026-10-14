export type UiLanguage = 'ti' | 'en';

type UiStrings = {
    library: string;
    growth: string;
    journey: string;
    search: string;
    settings: string;
    theWord: string;
    savedVerses: string;
    appPreferences: string;
    searchScriptures: string;
    books: string;
    all: string;
    oldTestament: string;
    newTestament: string;
    chapters: string;
    chaptersCount: (n: number) => string;
    continueReading: string;
    dailyVerse: string;
    openChapter: string;
    immersiveReader: string;
    dualPaneOn: string;
    dualPaneOff: string;
    displaySettings: string;
    textSize: string;
    spacing: string;
    relatedVerses: string;
    show: string;
    hide: string;
    previous: string;
    next: string;
    verseActions: string;
    bookmark: string;
    highlight: string;
    share: string;
    collections: string;
    createCollection: string;
    add: string;
    reflectionNote: string;
    saveNote: string;
    removeNote: string;
    jumpAndCompare: string;
    compareBook: string;
    compareChapter: string;
    parallelPane: string;
    primaryPane: string;
    chapterOf: (chapter: number, total: number) => string;
    bookNotFound: string;
    bookUnavailable: string;
    backToLibrary: string;
    startReading: string;
    chooseChapter: string;
    seekingWisdom: string;
    offlineSearchHint: string;
    allBooks: string;
    recentSearches: string;
    clear: string;
    popularTags: string;
    results: string;
    foundInstances: (n: number) => string;
    searching: string;
    noResults: string;
    sortBy: string;
    relevance: string;
    book: string;
    readChapter: string;
    installApp: string;
    installIosHint: string;
    updateAvailable: string;
    reloadToUpdate: string;
    offline: string;
    online: string;
    readingPreferences: string;
    bibleLanguage: string;
    systemLanguage: string;
    designTheme: string;
    bibleFontScale: string;
    appFontScale: string;
    matchSizes: string;
    showCrossMotifs: string;
    legal: string;
    aboutAttribution: string;
    privacyPolicy: string;
    scriptureTiOnly: string;
    seekerLevel: (n: number) => string;
    soulProgress: string;
    streakDays: (n: number) => string;
    badges: string;
    quests: string;
    suggestedPlans: string;
    resumeReading: string;
    noSavedYet: string;
    note: string;
    collection: string;
};

const en: UiStrings = {
    library: 'Library',
    growth: 'Growth',
    journey: 'Journey',
    search: 'Search',
    settings: 'Settings',
    theWord: 'The Word',
    savedVerses: 'Saved Verses',
    appPreferences: 'App Preferences',
    searchScriptures: 'Search the Scriptures',
    books: 'Books',
    all: 'All',
    oldTestament: 'Old Testament',
    newTestament: 'New Testament',
    chapters: 'Chapters',
    chaptersCount: n => `${n} chapters`,
    continueReading: 'Continue reading',
    dailyVerse: 'Daily verse',
    openChapter: 'Open chapter',
    immersiveReader: 'Immersive reader',
    dualPaneOn: 'Dual pane on',
    dualPaneOff: 'Dual pane off',
    displaySettings: 'Display settings',
    textSize: 'Text size',
    spacing: 'Spacing',
    relatedVerses: 'Related verses',
    show: 'Show',
    hide: 'Hide',
    previous: 'Previous',
    next: 'Next',
    verseActions: 'Verse actions',
    bookmark: 'Bookmark',
    highlight: 'Highlight',
    share: 'Share',
    collections: 'Collections',
    createCollection: 'Create collection',
    add: 'Add',
    reflectionNote: 'Reflection note',
    saveNote: 'Save note',
    removeNote: 'Remove note',
    jumpAndCompare: 'Jump and compare',
    compareBook: 'Compare book',
    compareChapter: 'Compare chapter',
    parallelPane: 'TI Parallel study',
    primaryPane: 'TI ወንጌል',
    chapterOf: (chapter, total) => `Chapter ${chapter} of ${total}`,
    bookNotFound: 'Book not found',
    bookUnavailable: 'The selected book is unavailable.',
    backToLibrary: 'Back to library',
    startReading: 'Start reading',
    chooseChapter: 'Choose a chapter to open the reader.',
    seekingWisdom: 'Seek wisdom in the sacred text.',
    offlineSearchHint: 'Offline-capable search with book filters and direct chapter opening.',
    allBooks: 'All books',
    recentSearches: 'Recent searches',
    clear: 'Clear',
    popularTags: 'Popular tags',
    results: 'Results',
    foundInstances: n => `Found ${n} instances`,
    searching: 'Searching…',
    noResults: 'No results.',
    sortBy: 'Sort by',
    relevance: 'Relevance',
    book: 'Book',
    readChapter: 'Read chapter',
    installApp: 'Install App',
    installIosHint: 'Share → Add to Home Screen',
    updateAvailable: 'Update available',
    reloadToUpdate: 'Reload',
    offline: 'Offline',
    online: 'Online',
    readingPreferences: 'Reading preferences',
    bibleLanguage: 'Bible language',
    systemLanguage: 'System language',
    designTheme: 'Design theme',
    bibleFontScale: 'Bible font scale',
    appFontScale: 'App font scale',
    matchSizes: 'Match sizes',
    showCrossMotifs: 'Show cross motifs',
    legal: 'Legal',
    aboutAttribution: 'About & attribution',
    privacyPolicy: 'Privacy policy',
    scriptureTiOnly: 'Scripture text is currently available in Tigrigna only.',
    seekerLevel: n => `Seeker level ${n}`,
    soulProgress: 'Soul progress',
    streakDays: n => `${n}-day streak`,
    badges: 'Badges',
    quests: 'Quests',
    suggestedPlans: 'Suggested plans',
    resumeReading: 'Resume reading',
    noSavedYet: 'No saved items yet. Add a bookmark, highlight, collection link, or note.',
    note: 'Note',
    collection: 'Collection'
};

const ti: UiStrings = {
    library: 'ቤተ-መጻሕፍቲ',
    growth: 'ዕብየት',
    journey: 'ጉዕዞ',
    search: 'ድለ',
    settings: 'ቅንብራት',
    theWord: 'ቃል',
    savedVerses: 'ዝተሓልዉ ጥቕስታት',
    appPreferences: 'ቅንብራት መተግበሪ',
    searchScriptures: 'ቅዱሳት ጽሑፋት ድለ',
    books: 'መጻሕፍቲ',
    all: 'ኩሉ',
    oldTestament: 'ብሉይ ኪዳን',
    newTestament: 'ሓድሽ ኪዳን',
    chapters: 'ምዕራፋት',
    chaptersCount: n => `${n} ምዕራፋት`,
    continueReading: 'ንባብ ቀጽል',
    dailyVerse: 'ናይ መዓልቲ ጥቕሲ',
    openChapter: 'ምዕራፍ ክፈት',
    immersiveReader: 'ንባብ',
    dualPaneOn: 'ክልተ ገጽ ተኸፊቱ',
    dualPaneOff: 'ክልተ ገጽ ዕጸው',
    displaySettings: 'ቅንብራት ምርኢት',
    textSize: 'ዓቐን ፊደል',
    spacing: 'ርሕቀት መስመር',
    relatedVerses: 'ተዛማዲ ጥቕስታት',
    show: 'ኣርእይ',
    hide: 'ሓብእ',
    previous: 'ዝሓለፈ',
    next: 'ዝቕጽል',
    verseActions: 'ተግባራት ጥቕሲ',
    bookmark: 'መልክዕ',
    highlight: 'ኣብርህ',
    share: 'ኣካፍል',
    collections: 'እከባታት',
    createCollection: 'ሓድሽ እከብ ፍጠር',
    add: 'ውስኽ',
    reflectionNote: 'ኣስተብህሎ',
    saveNote: 'መዘኻኸሪ ኣቐምጥ',
    removeNote: 'መዘኻኸሪ ኣጥፍእ',
    jumpAndCompare: 'ዝለልን ኣነጻጽርን',
    compareBook: 'መጽሓፍ ኣነጻጽር',
    compareChapter: 'ምዕራፍ ኣነጻጽር',
    parallelPane: 'TI ተወሳኺ ንባብ',
    primaryPane: 'TI ወንጌል',
    chapterOf: (chapter, total) => `ምዕራፍ ${chapter} ካብ ${total}`,
    bookNotFound: 'መጽሓፍ ኣይተረኽበን',
    bookUnavailable: 'እቲ ዝተመረጸ መጽሓፍ የለን።',
    backToLibrary: 'ናብ ቤተ-መጻሕፍቲ ተመለስ',
    startReading: 'ንባብ ጀምር',
    chooseChapter: 'ንንባብ ምዕራፍ ምረጽ።',
    seekingWisdom: 'ብቕዱስ ጽሑፍ ጥበብ ድለ።',
    offlineSearchHint: 'ብዘይ ኢንተርነት ዝሰርሕ ድለያ፣ ብመጻሕፍቲ ምፍላይን ቀጥታ ናብ ምዕራፍ ምኻድን።',
    allBooks: 'ኩለን መጻሕፍቲ',
    recentSearches: 'ናይ ቀረባ ድለያታት',
    clear: 'ኣጽሪ',
    popularTags: 'ተፈላጥ ቃላት',
    results: 'ውጽኢታት',
    foundInstances: n => `${n} ተረኺቡ`,
    searching: 'ይድለ ኣሎ…',
    noResults: 'ውጽኢት የለን።',
    sortBy: 'ሰርድ ብ',
    relevance: 'ምትእስሳር',
    book: 'መጽሓፍ',
    readChapter: 'ምዕራፍ ኣንብብ',
    installApp: 'መተግበሪ ኣቐምጥ',
    installIosHint: 'Share → Add to Home Screen',
    updateAvailable: 'ሓድሽ ስሪት ኣሎ',
    reloadToUpdate: 'ዳግም ጽዓን',
    offline: 'ብዘይ መርበብ',
    online: 'ብመርበብ',
    readingPreferences: 'ቅንብራት ንባብ',
    bibleLanguage: 'ቋንቋ መጽሓፍ ቅዱስ',
    systemLanguage: 'ቋንቋ ስርዓት',
    designTheme: 'ቅርጺ',
    bibleFontScale: 'ዓቐን ፊደል መጽሓፍ',
    appFontScale: 'ዓቐን ፊደል መተግበሪ',
    matchSizes: 'ዓቐናት ኣሰማምር',
    showCrossMotifs: 'መስቀላት ኣርእይ',
    legal: 'ሕጋዊ',
    aboutAttribution: 'ብዛዕባን ምንጭን',
    privacyPolicy: 'ናይ ዉሽጣዊ ፖሊሲ',
    scriptureTiOnly: 'ጽሑፍ መጽሓፍ ቅዱስ ሕጂ ብትግርኛ ጥራይ ኣሎ።',
    seekerLevel: n => `ደረጃ ደላይ ${n}`,
    soulProgress: 'ምዕባለ ነፍሲ',
    streakDays: n => `${n} መዓልቲ ተኸታታሊ`,
    badges: 'ልዕልናታት',
    quests: 'ተልእኾታት',
    suggestedPlans: 'ዝሑላት ውጥናት',
    resumeReading: 'ንባብ ቀጽል',
    noSavedYet: 'ዝተሓለወ የለን። መልክዕ፣ ብርሃን፣ እከብ ወይ መዘኻኸሪ ውስኽ።',
    note: 'መዘኻኸሪ',
    collection: 'እከብ'
};

const catalogs: Record<UiLanguage, UiStrings> = {en, ti};

export const getUi = (language: UiLanguage): UiStrings => catalogs[language] ?? en;
