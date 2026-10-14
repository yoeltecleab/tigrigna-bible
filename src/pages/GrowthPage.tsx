import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {loadBooks} from '../data/api';
import type {Book} from '../types/bible';
import {PLANS, nextPlanChapter, planProgress, type PlanProgress} from '../data/plans';
import {buildBadges, buildQuests, weekStartKey} from '../data/growth';
import {useSavedStore} from '../store/savedStore';
import {useSettingsStore} from '../store/settingsStore';
import {recentDays, summarizeStreak, useProgressStore} from '../store/progressStore';
import {toast} from '../store/uiStore';
import {getUi} from '../i18n/ui';
import Icon from '../components/Icon';
import ReminderRows from '../components/ReminderRows';
import {PageHeader, ProgressBar, SectionHeader} from '../components/ui';

export default function GrowthPage() {
    const language = useSettingsStore(state => state.language);
    const systemLanguage = useSettingsStore(state => state.systemLanguage);
    const ui = getUi(systemLanguage);
    const savedVerses = useSavedStore(state => state.verses);
    const notes = useSavedStore(state => state.notes);
    const readChapters = useProgressStore(state => state.readChapters);
    const log = useProgressStore(state => state.log);
    const activePlans = useProgressStore(state => state.plans);
    const startPlan = useProgressStore(state => state.startPlan);
    const stopPlan = useProgressStore(state => state.stopPlan);
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        void loadBooks(language).then(setBooks);
    }, [language]);

    const titles = useMemo(() => new Map(books.map(book => [book.id, book.title])), [books]);
    const streak = useMemo(() => summarizeStreak(log), [log]);
    const week = useMemo(() => recentDays(log, 7), [log]);
    const weekMax = Math.max(3, ...week.map(day => day.chapters));
    const weekTotal = week.reduce((sum, day) => sum + day.chapters, 0);

    const progressById = useMemo(() => {
        const map = new Map<string, PlanProgress>();
        if (books.length > 0) PLANS.forEach(plan => map.set(plan.id, planProgress(plan, books, readChapters)));
        return map;
    }, [books, readChapters]);

    const mine = activePlans.map(item => progressById.get(item.planId)).filter((item): item is PlanProgress => Boolean(item));
    const browse = PLANS.filter(plan => !activePlans.some(item => item.planId === plan.id));
    const completedPlans = mine.filter(item => item.done).length;

    const growthInput = {
        books,
        readChapters,
        log,
        streak,
        highlights: savedVerses.filter(item => item.kind === 'highlight').length,
        notes: notes.length,
        completedPlans
    };
    const badges = books.length > 0 ? buildBadges(growthInput, systemLanguage) : [];
    const weekStart = weekStartKey();
    const quests = buildQuests(growthInput, systemLanguage, notes.filter(note => note.updatedAt.slice(0, 10) >= weekStart).length);

    return (
        <section className="page growth-page">
            <PageHeader title={ui.growthTitle} />

            <div className="stat-grid">
                <div className="card stat-card stat-card-hero">
                    <span className={streak.readToday ? 'streak-flame streak-flame-on' : 'streak-flame'} aria-hidden="true">
                        <Icon name="flame" size={22} />
                    </span>
                    <span className="stat-value">{streak.current}</span>
                    <span className="stat-label">{ui.currentStreak}</span>
                    <span className="stat-hint">{streak.readToday ? ui.streakKept : ui.streakNudge}</span>
                </div>
                <div className="card stat-card">
                    <span className="stat-value">{streak.best}</span>
                    <span className="stat-label">{ui.bestStreak}</span>
                </div>
                <div className="card stat-card">
                    <span className="stat-value">{Object.keys(readChapters).length}</span>
                    <span className="stat-label">{ui.chaptersRead}</span>
                </div>
                <div className="card stat-card">
                    <span className="stat-value">{streak.activeDays}</span>
                    <span className="stat-label">{ui.daysActive}</span>
                </div>
            </div>

            <div className="card week-card">
                <div className="week-card-head">
                    <h2 className="card-title">{ui.thisWeek}</h2>
                    <span className="muted-text">{ui.weekSummary(weekTotal)}</span>
                </div>
                <div className="week-chart" role="img" aria-label={ui.weekSummary(weekTotal)}>
                    {week.map(day => (
                        <div key={day.day} className="week-col">
                            <span className="week-bar-track">
                                <span className={day.chapters > 0 ? 'week-bar week-bar-on' : 'week-bar'} style={{height: `${Math.max(6, (day.chapters / weekMax) * 100)}%`}} />
                            </span>
                            <span className="week-count">{day.chapters > 0 ? day.chapters : ''}</span>
                            <span className="week-label">{ui.weekdayShort[(day.date.getDay() + 6) % 7]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {mine.length > 0 ? (
                <section>
                    <SectionHeader title={ui.myPlans} />
                    <div className="plan-list">
                        {mine.map(progress => {
                            const next = nextPlanChapter(progress, readChapters);
                            return (
                                <article key={progress.plan.id} className={`card plan-card plan-tone-${progress.plan.tone}`}>
                                    <div className="plan-card-head">
                                        <div>
                                            <h3 className="card-title">{progress.plan.title[systemLanguage]}</h3>
                                            <p className="muted-text">
                                                {progress.done ? ui.planComplete : ui.planDay(progress.currentDay, progress.schedule.length)} · {progress.percent}%
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="icon-btn icon-btn-small"
                                            aria-label={ui.stopPlan}
                                            onClick={() => {
                                                if (window.confirm(`${ui.stopPlan}?`)) stopPlan(progress.plan.id);
                                            }}
                                        >
                                            <Icon name="close" size={16} />
                                        </button>
                                    </div>
                                    <ProgressBar value={progress.percent} label={progress.plan.title[systemLanguage]} />
                                    {!progress.done && next ? (
                                        <div className="plan-today">
                                            <span className="card-eyebrow">{ui.todayReading}</span>
                                            <span className="plan-today-list" lang="ti">
                                                {progress.today.map(item => `${titles.get(item.bookId) ?? item.bookId} ${item.chapter}`).join(' · ')}
                                            </span>
                                            <Link className="btn btn-filled btn-small" to={`/reader/${next.bookId}/${next.chapter}`}>
                                                {ui.continuePlan}
                                                <Icon name="chevron_right" size={16} />
                                            </Link>
                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            <section>
                <SectionHeader title={mine.length > 0 ? ui.browsePlans : ui.plans} />
                <div className="plan-browse">
                    {browse.map(plan => {
                        const progress = progressById.get(plan.id);
                        return (
                            <article key={plan.id} className={`card plan-tile plan-tone-${plan.tone}`}>
                                <span className="plan-tile-days">{ui.planDays(plan.days)}</span>
                                <h3 className="plan-tile-title">{plan.title[systemLanguage]}</h3>
                                <p className="plan-tile-desc">{plan.description[systemLanguage]}</p>
                                {progress && progress.percent > 0 ? <ProgressBar value={progress.percent} label={plan.title[systemLanguage]} /> : null}
                                <button
                                    type="button"
                                    className="btn btn-tinted btn-small"
                                    onClick={() => {
                                        startPlan(plan.id);
                                        toast(ui.planStarted);
                                    }}
                                >
                                    {ui.startPlan}
                                </button>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section>
                <SectionHeader title={ui.quests} />
                <div className="list-group-body">
                    {quests.map(quest => (
                        <div key={quest.id} className="list-row quest-row">
                            <span className={quest.progress >= quest.goal ? 'quest-check quest-check-on' : 'quest-check'} aria-hidden="true">
                                <Icon name="check" size={13} strokeWidth={3} />
                            </span>
                            <span className="row-copy">
                                <span className="row-title">{quest.title}</span>
                                <span className="row-detail">{quest.detail}</span>
                            </span>
                            <span className="row-value">
                                {quest.progress}/{quest.goal}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <SectionHeader title={ui.badges} />
                <div className="badge-grid">
                    {badges.map(badge => (
                        <article key={badge.id} className={badge.earned ? 'badge badge-earned' : 'badge'}>
                            <span className="badge-icon" aria-hidden="true">
                                <Icon name={badge.earned ? badge.icon : 'lock'} size={22} />
                            </span>
                            <strong className="badge-title">{badge.title}</strong>
                            <span className="badge-detail">{badge.detail}</span>
                            {badge.earned ? (
                                <span className="badge-state">{ui.earned}</span>
                            ) : (
                                <span className="badge-progress">
                                    <ProgressBar value={(badge.progress / badge.goal) * 100} label={badge.title} />
                                    <span>
                                        {badge.progress}/{badge.goal}
                                    </span>
                                </span>
                            )}
                        </article>
                    ))}
                </div>
            </section>

            <ReminderRows />
        </section>
    );
}
