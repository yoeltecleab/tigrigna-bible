import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {loadBooks} from '../data/api';
import {Book} from '../types/bible';
import {getGrowthJourneySnapshot} from '../data/growthJourneyData';
import {useSavedStore} from '../store/savedStore';
import {useSettingsStore} from '../store/settingsStore';
import {getUi} from '../i18n/ui';
import Icon from '../components/Icon';

export default function GrowthPage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const lastReading = useSettingsStore(state => state.lastReading);
    const ui = getUi(systemLanguage);
    const verses = useSavedStore(state => state.verses);
    const notes = useSavedStore(state => state.notes);
    const collectionItems = useSavedStore(state => state.collectionItems);
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        void loadBooks(language).then(setBooks);
    }, [language]);

    const booksMap = useMemo(() => new Map(books.map(book => [book.id, book])), [books]);
    const bookmarkCount = verses.filter(item => item.kind === 'bookmark').length;
    const highlightCount = verses.filter(item => item.kind === 'highlight').length;
    const activeDays = useMemo(() => {
        const days = new Set(
            [...verses, ...notes, ...collectionItems]
                .map(item => ('updatedAt' in item ? item.updatedAt : item.createdAt)?.slice(0, 10))
                .filter(Boolean)
        );
        return Math.max(1, days.size);
    }, [verses, notes, collectionItems]);

    const snapshot = getGrowthJourneySnapshot({
        bookmarks: bookmarkCount,
        highlights: highlightCount,
        notes: notes.length,
        collectionLinks: collectionItems.length,
        activeDays
    });

    const continueBook = lastReading ? booksMap.get(lastReading.bookId) : null;

    return (
        <section className="stack-lg">
            <div className="panel hero-panel journey-hero stack-sm">
                <p className="eyebrow">{ui.growth}</p>
                <h2>{ui.seekerLevel(snapshot.seekerLevel)}</h2>
                <p className="muted">
                    {snapshot.apostleRank} · {ui.streakDays(snapshot.streakDays)} · {snapshot.xp} XP
                </p>
                <div
                    className="journey-level-ring"
                    style={{
                        background: `radial-gradient(circle at center, color-mix(in oklch, var(--surface) 92%, transparent) 55%, transparent 56%), conic-gradient(var(--primary) 0 ${snapshot.soulProgressPercent * 3.6}deg, color-mix(in oklch, var(--border) 70%, transparent) ${snapshot.soulProgressPercent * 3.6}deg)`
                    }}
                >
                    <div>
                        <strong className="journey-big-number">{snapshot.soulProgressPercent}%</strong>
                        <span className="muted">{ui.soulProgress}</span>
                    </div>
                </div>
            </div>

            <div className="growth-grid">
                <div className="panel stack-sm">
                    <p className="eyebrow">{ui.resumeReading}</p>
                    {lastReading ? (
                        <Link className="clickable-card stack-xs" to={`/reader/${lastReading.bookId}/${lastReading.chapter}`}>
                            <h3>
                                {continueBook?.title ?? lastReading.bookId} {lastReading.chapter}
                            </h3>
                            <span className="chip chip-active-collection">{ui.continueReading}</span>
                        </Link>
                    ) : (
                        <Link className="btn btn-primary" to="/">
                            {ui.startReading}
                        </Link>
                    )}
                </div>

                <div className="panel stack-sm">
                    <p className="eyebrow">{ui.journey}</p>
                    <p className="muted">{ui.journeyCounts(bookmarkCount, highlightCount, notes.length)}</p>
                    <Link className="btn" to="/journey">
                        {ui.savedVerses}
                    </Link>
                </div>
            </div>

            <div className="panel stack-sm">
                <div className="section-header">
                    <h3>{ui.badges}</h3>
                </div>
                <div className="badges-grid">
                    {snapshot.badges.map(badge => (
                        <article key={badge.id} className={badge.status === 'locked' ? 'badge-item muted-badge' : 'badge-item'}>
                            <Icon name={badge.icon} size={22} />
                            <strong>{badge.title}</strong>
                            <span className="meta">{badge.status === 'earned' ? ui.badgeEarned : ui.badgeLocked}</span>
                        </article>
                    ))}
                </div>
            </div>

            <div className="panel stack-sm">
                <div className="section-header">
                    <h3>{ui.quests}</h3>
                </div>
                <div className="quest-list">
                    {snapshot.quests.map(quest => (
                        <article key={quest.id} className={`quest-item quest-${quest.tone}`}>
                            <strong>{quest.title}</strong>
                            <p className="muted">{quest.detail}</p>
                            <span className="meta">{quest.progressLabel}</span>
                        </article>
                    ))}
                </div>
            </div>

            <div className="panel stack-sm">
                <div className="section-header">
                    <h3>{ui.suggestedPlans}</h3>
                </div>
                <div className="plans-grid">
                    {snapshot.suggestedPlans.map(plan => (
                        <article key={plan.id} className={`plan-card ${plan.tone}`}>
                            <p className="meta">{plan.duration}</p>
                            <strong>{plan.title}</strong>
                            <p className="muted">{plan.detail}</p>
                            <Link className="link-btn" to="/">
                                {ui.startReading}
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
