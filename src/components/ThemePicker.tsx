import type {CSSProperties} from 'react';
import {themeTiers, themes, type DesignTheme, type ThemeTier} from '../themes';
import Icon from './Icon';

type Props = {
    value: DesignTheme;
    onChange: (id: DesignTheme) => void;
    tierLabels: Record<ThemeTier, string>;
    label: string;
};

export default function ThemePicker({value, onChange, tierLabels, label}: Props) {
    return (
        <div className="theme-picker" role="radiogroup" aria-label={label}>
            {themeTiers.map(({tier}) => (
                <section key={tier} className="theme-tier">
                    <h4 className="theme-tier-label">{tierLabels[tier]}</h4>
                    <div className="theme-card-grid">
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
                                        className={selected ? 'theme-card theme-card-active' : 'theme-card'}
                                        onClick={() => onChange(t.id)}
                                    >
                                        <span className="theme-swatch" style={t.vars as CSSProperties} aria-hidden="true">
                                            <span className="theme-swatch-glow" />
                                            <span className="theme-swatch-panel">
                                                <span className="theme-swatch-line" />
                                                <span className="theme-swatch-line theme-swatch-line-short" />
                                                <span className="theme-swatch-pill" />
                                            </span>
                                            <span className="theme-swatch-dot" />
                                        </span>
                                        <span className="theme-card-copy">
                                            <span className="theme-card-head">
                                                <span className="theme-orb" style={{background: t.preview}} aria-hidden="true" />
                                                <span className="theme-card-name">{t.label}</span>
                                                {selected ? (
                                                    <span className="theme-card-check" aria-hidden="true">
                                                        <Icon name="check" size={14} strokeWidth={2.5} />
                                                    </span>
                                                ) : null}
                                            </span>
                                            <span className="theme-card-desc">{t.description}</span>
                                        </span>
                                    </button>
                                );
                            })}
                    </div>
                </section>
            ))}
        </div>
    );
}
