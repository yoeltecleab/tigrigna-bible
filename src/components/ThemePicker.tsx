import type {CSSProperties} from 'react';
import {themeTiers, themes, type DesignTheme, type ThemeTier} from '../themes';
import Icon from './Icon';

type Props = {
    value: DesignTheme;
    onChange: (id: DesignTheme) => void;
    tierLabels: Record<ThemeTier, string>;
    label: string;
    tiers?: ThemeTier[];
};

export default function ThemePicker({value, onChange, tierLabels, label, tiers}: Props) {
    const visibleTiers = themeTiers.filter(({tier}) => !tiers || tiers.includes(tier));
    return (
        <div className="theme-picker" role="radiogroup" aria-label={label}>
            {visibleTiers.map(({tier}) => (
                <section key={tier} className="theme-tier">
                    {visibleTiers.length > 1 ? <h3 className="theme-tier-label">{tierLabels[tier]}</h3> : null}
                    <div className="theme-grid">
                        {themes
                            .filter(t => t.tier === tier)
                            .map(t => {
                                const selected = value === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        aria-label={t.label}
                                        className={selected ? 'theme-card theme-card-active' : 'theme-card'}
                                        onClick={() => onChange(t.id)}
                                    >
                                        <span className="theme-swatch" style={t.vars as CSSProperties} aria-hidden="true">
                                            <span className="theme-swatch-page">
                                                <span className="theme-swatch-line" />
                                                <span className="theme-swatch-line theme-swatch-line-short" />
                                                <span className="theme-swatch-line" />
                                                <span className="theme-swatch-pill" />
                                            </span>
                                            {selected ? (
                                                <span className="theme-card-check">
                                                    <Icon name="check" size={12} strokeWidth={3} />
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="theme-card-name">{t.label}</span>
                                    </button>
                                );
                            })}
                    </div>
                </section>
            ))}
        </div>
    );
}
