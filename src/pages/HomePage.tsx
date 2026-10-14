import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {loadBooks, resolveDailyVerse} from '../data/api';
import type {Book, SearchVerse} from '../types/bible';
import {useSettingsStore} from '../store/settingsStore';
import {chapterKey, recentDays, summarizeStreak, useProgressStore} from '../store/progressStore';
import {toast, useUiStore} from '../store/uiStore';
import {canOfferInstall, useInstallStore} from '../store/installStore';
import {getPlan, nextPlanChapter, planProgress} from '../data/plans';
import {readerShareUrl, sharePassage} from '../lib/site';
import {getUi} from '../i18n/ui';
import Icon from '../components/Icon';
import {PageHeader, ProgressBar, Segmented} from '../components/ui';
import ThemeSheet from '../components/ThemeSheet';
import InstallSheet from '../components/InstallSheet';

const readCount = (book: Book, readChapters: Record<string, string>) => {
    let count = 0;
    for (let chapter = 1; chapter <= book.chaptersNum; chapter += 1) {
        if (readChapters[chapterKey(book.id, chapter)]) count += 1;
    }
    return count;
};

export default function HomePage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const lastReading = useSettingsStore(state => state.lastReading);
    const readChapters = useProgressStore(state => state.readChapters);
    const log = useProgressStore(state => state.log);
    const activePlans = useProgressStore(state => state.plans);
    const reminderDue = useUiStore(state => state.reminderDue);
    const installOffer = useInstallStore(canOfferInstall);
    const installDismissed = useInstallStore(state => state.cardDismissed);
    const dismissInstall = useInstallStore(state => state.dismissCard);
    const ui = getUi(systemLanguage);
    const [books, setBooks] = useState<Book[]>([]);
    const [dailyVerse, setDailyVerse] = useState<SearchVerse | null>(null);
    const [testament, setTestament] = useState<'old' | 'new'>('new');
    const [themeOpen, setThemeOpen] = useState(false);
    const [installOpen, setInstallOpen] = useState(false);

    useEffect(() => {
        void loadBooks(language).then(setBooks);
        void resolveDailyVerse(language).then(setDailyVerse);
    }, [language]);

    const booksMap = useMemo(() => new Map(books.map(book => [book.id, book])), [books]);
    const continueBook = lastReading ? booksMap.get(lastReading.bookId) : undefined;
    const streak = useMemo(() => summarizeStreak(log), [log]);
    const week = useMemo(() => recentDays(log, 7), [log]);
    const plan = useMemo(() => {
        const active = activePlans.map(item => getPlan(item.planId)).find(Boolean);
        return active && books.length > 0 ? planProgress(active, books, readChapters) : null;
    }, [activePlans, books, readChapters]);
    const planNext = plan ? nextPlanChapter(plan, readChapters) : null;
    const visibleBooks = books.filter(book => book.testament === testament);

    const dateLabel = new Intl.DateTimeFormat(systemLanguage === 'ti' ? 'ti-ER' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    }).format(new Date());

    const dailyReference = dailyVerse
        ? `${booksMap.get(dailyVerse.bookId)?.title ?? ''} ${dailyVerse.chapter}:${dailyVerse.label ?? dailyVerse.verse}`
        : '';

    const shareDaily = async () => {
        if (!dailyVerse) return;
        const outcome = await sharePassage(dailyReference, dailyVerse.text, readerShareUrl(dailyVerse.bookId, dailyVerse.chapter, dailyVerse.verse));
        if (outcome === 'copied') toast(ui.copied);
    };

    return (
        <section className="page home-page">
            <PageHeader
                eyebrow={dateLabel}
                title={ui.theWord}
                actions={
                    <>
                        <button type="button" className="icon-btn" onClick={() => setThemeOpen(true)} aria-label={ui.appearance}>
                            <Icon name="palette" size={21} />
                        </button>
                        <Link className="icon-btn" to="/settings" aria-label={ui.settings}>
                            <Icon name="settings" size={21} />
                        </Link>
                    </>
                }
            />

            {reminderDue ? (
                <Link className="nudge" to={planNext ? `/reader/${planNext.bookId}/${planNext.chapter}` : lastReading ? `/reader/${lastReading.bookId}/${lastReading.chapter}` : '/study'}>
                    <Icon name="bell" size={18} />
                    <span>{ui.reminderBanner}</span>
                    <Icon name="chevron_right" size={16} />
                </Link>
            ) : null}

            {dailyVerse ? (
                <article className="card daily-card">
                    <p className="card-eyebrow">
                        <Icon name="sunny" size={15} />
                        {ui.dailyVerse}
                    </p>
                    <blockquote className="daily-quote" lang="ti">
                        {dailyVerse.text}
                    </blockquote>
                    <div className="daily-footer">
                        <span className="daily-ref">{dailyReference}</span>
                        <div className="daily-actions">
                            <button type="button" className="icon-btn icon-btn-tinted" onClick={() => void shareDaily()} aria-label={ui.share}>
                                <Icon name="share" size={18} />
                            </button>
                            <Link
                                className="btn btn-tinted btn-small"
                                to={`/reader/${dailyVerse.bookId}/${dailyVerse.chapter}`}
                                state={{targetKey: dailyVerse.key}}
                            >
                                {ui.readInContext}
                            </Link>
                        </div>
                    </div>
                </article>
            ) : (
                <div className="card daily-card daily-card-skeleton" aria-hidden="true">
                    <span className="skeleton-line" />
                    <span className="skeleton-line" />
                    <span className="skeleton-line skeleton-short" />
                </div>
            )}

            <div className="home-grid">
                {lastReading && continueBook ? (
                    <Link className="card resume-card" to={`/reader/${lastReading.bookId}/${lastReading.chapter}`}>
                        <span className="resume-icon" aria-hidden="true">
                            <Icon name="menu_book" size={22} />
                        </span>
                        <span className="resume-copy">
                            <span className="card-eyebrow">{ui.continueReading}</span>
                            <span className="resume-title">
                                {continueBook.title} {lastReading.chapter}
                            </span>
                            <ProgressBar value={(readCount(continueBook, readChapters) / continueBook.chaptersNum) * 100} label={continueBook.title} />
                            <span className="resume-meta">{ui.chaptersReadOf(readCount(continueBook, readChapters), continueBook.chaptersNum)}</span>
                        </span>
                        <Icon name="chevron_right" size={18} className="card-chevron" />
                    </Link>
                ) : (
                    <Link className="card resume-card" to="/reader/JONE/1">
                        <span className="resume-icon" aria-hidden="true">
                            <Icon name="menu_book" size={22} />
                        </span>
                        <span className="resume-copy">
                            <span className="card-eyebrow">{ui.startReading}</span>
                            <span className="resume-title">{booksMap.get('JONE')?.title ?? '…'} 1</span>
                        </span>
                        <Icon name="chevron_right" size={18} className="card-chevron" />
                    </Link>
                )}

                {plan && planNext ? (
                    <Link className="card plan-mini" to={`/reader/${planNext.bookId}/${planNext.chapter}`}>
                        <span className="card-eyebrow">
                            <Icon name="calendar" size={15} />
                            {ui.todayReading}
                        </span>
                        <span className="plan-mini-title">{plan.plan.title[systemLanguage]}</span>
                        <span className="plan-mini-reading">
                            {plan.today.map(item => `${booksMap.get(item.bookId)?.title ?? ''} ${item.chapter}`).join(' · ')}
                        </span>
                        <ProgressBar value={plan.percent} label={plan.plan.title[systemLanguage]} />
                        <span className="resume-meta">{ui.planDay(plan.currentDay, plan.schedule.length)}</span>
                    </Link>
                ) : null}

                <Link className="card streak-card" to="/growth">
                    <span className="streak-head">
                        <span className={streak.readToday ? 'streak-flame streak-flame-on' : 'streak-flame'} aria-hidden="true">
                            <Icon name="flame" size={20} />
                        </span>
                        <span>
                            <span className="streak-number">{ui.days(streak.current)}</span>
                            <span className="resume-meta">{streak.readToday ? ui.streakKept : ui.streakNudge}</span>
                        </span>
                    </span>
                    <span className="week-dots" aria-label={ui.thisWeek}>
                        {week.map((day, index) => (
                            <span key={day.day} className={day.chapters > 0 ? 'week-dot week-dot-on' : 'week-dot'}>
                                <span className="week-dot-mark" />
                                <span className="week-dot-label">{ui.weekdayShort[(day.date.getDay() + 6) % 7] ?? index}</span>
                            </span>
                        ))}
                    </span>
                </Link>
            </div>

            {installOffer && !installDismissed ? (
                <div className="card install-card">
                    <img src="/icons/apple-touch-icon-v6.png" alt="" width={48} height={48} className="install-card-icon" />
                    <div className="install-card-copy">
                        <strong>{ui.installApp}</strong>
                        <span>{ui.installAppHint}</span>
                    </div>
                    <div className="install-card-actions">
                        <button type="button" className="btn btn-filled btn-small" onClick={() => setInstallOpen(true)}>
                            {ui.installNow}
                        </button>
                        <button type="button" className="btn btn-plain btn-small" onClick={dismissInstall}>
                            {ui.notNow}
                        </button>
                    </div>
                </div>
            ) : null}

            <section className="library">
                <div className="section-head">
                    <h2 className="section-title">{ui.books}</h2>
                    <Segmented
                        value={testament}
                        onChange={setTestament}
                        label={ui.books}
                        options={[
                            {value: 'old', label: ui.oldTestament},
                            {value: 'new', label: ui.newTestament}
                        ]}
                    />
                </div>
                <div className="book-grid">
                    {books.length === 0
                        ? Array.from({length: 12}).map((_, index) => <span key={index} className="book-tile book-tile-skeleton" />)
                        : visibleBooks.map(book => {
                              const read = readCount(book, readChapters);
                              return (
                                  <Link key={book.id} className="book-tile" to={`/books/${book.id}`}>
                                      <span className="book-title" lang="ti">
                                          {book.title}
                                      </span>
                                      <span className="book-meta">
                                          {systemLanguage === 'en' ? `${book.engname} · ` : ''}
                                          {book.chaptersNum}
                                      </span>
                                      {read > 0 ? (
                                          <span className="book-progress" style={{width: `${(read / book.chaptersNum) * 100}%`}} aria-hidden="true" />
                                      ) : null}
                                  </Link>
                              );
                          })}
                </div>
            </section>

            <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
            <InstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
        </section>
    );
}
