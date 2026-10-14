/** Design themes for the Bible app — existing Sacred set + all PS Price themes. */

export type ThemeTier = 'bible' | 'dark' | 'mid' | 'light';

export type DesignTheme =
    | 'sacred-covenant'
    | 'aether-light'
    | 'orthodox'
    | 'abyss'
    | 'void'
    | 'nebula'
    | 'midnight'
    | 'eclipse'
    | 'crimson'
    | 'forest'
    | 'fusion'
    | 'ink'
    | 'dusk'
    | 'graphite'
    | 'dawn'
    | 'frost'
    | 'paper'
    | 'sand'
    | 'sky'
    | 'mint'
    | 'pearl';

export type ThemeVars = Record<string, string>;

export type ThemeDefinition = {
    id: DesignTheme;
    label: string;
    description: string;
    preview: string;
    tier: ThemeTier;
    vars: ThemeVars;
};

const CHROME = {
    '--ghost-border': 'color-mix(in oklch, var(--border) 35%, transparent)',
    '--chrome-surface': 'color-mix(in oklch, var(--bg) 82%, transparent)',
    '--chrome-surface-soft': 'color-mix(in oklch, var(--bg) 55%, transparent)',
    '--chrome-nav': 'color-mix(in oklch, var(--bg-soft) 86%, transparent)',
    '--chrome-nav-alt': 'color-mix(in oklch, var(--panel-soft) 82%, transparent)',
    '--primary-soft': 'color-mix(in oklch, var(--primary) 16%, transparent)',
    '--accent-soft': 'color-mix(in oklch, var(--accent) 12%, transparent)',
    '--focus-ring': 'var(--accent)'
} as const;

function bibleTheme(
    id: DesignTheme,
    label: string,
    description: string,
    preview: string,
    vars: ThemeVars
): ThemeDefinition {
    return {
        id,
        label,
        description,
        preview,
        tier: 'bible',
        vars: {
            ...vars,
            ...CHROME,
            '--shadow': vars['--shadow'] ?? 'oklch(0.2 0.02 90 / 0.07)'
        }
    };
}

function fromPs(
    id: DesignTheme,
    label: string,
    description: string,
    preview: string,
    tier: Exclude<ThemeTier, 'bible'>,
    ps: Record<string, string>
): ThemeDefinition {
    const dark = tier !== 'light';
    return {
        id,
        label,
        description,
        preview,
        tier,
        vars: {
            '--bg': ps['--bg'],
            '--bg-soft': ps['--surface'],
            '--panel': ps['--surface'],
            '--panel-soft': ps['--surface-raised'],
            '--panel-strong': ps['--surface-raised'],
            '--text': ps['--ink'],
            '--muted': ps['--muted'],
            '--primary': ps['--primary'],
            '--primary-container': ps['--primary-hover'],
            '--accent': ps['--accent'],
            '--secondary': ps['--primary-hover'],
            '--tertiary': ps['--accent'],
            '--border': ps['--border'],
            '--shadow': dark ? 'oklch(0 0 0 / 0.42)' : 'oklch(0.22 0.02 260 / 0.08)',
            ...CHROME,
            '--focus-ring': ps['--focus-ring'] ?? ps['--accent']
        }
    };
}

export const themes: ThemeDefinition[] = [
    bibleTheme('sacred-covenant', 'Sacred Covenant', 'Parchment & gold', '#d4af37', {
        '--bg': '#fbfbe2',
        '--bg-soft': '#f5f5dc',
        '--panel': '#fffdf1',
        '--panel-soft': '#efefd7',
        '--panel-strong': '#e4e4cc',
        '--text': '#1b1d0e',
        '--muted': '#5a5344',
        '--primary': '#735c00',
        '--primary-container': '#d4af37',
        '--accent': '#b52619',
        '--secondary': '#d4af37',
        '--tertiary': '#435b9f',
        '--border': '#d0c5af',
        '--shadow': 'rgba(27, 29, 14, 0.06)'
    }),
    bibleTheme('aether-light', 'Aether Light', 'Cool editorial blue', '#5da9dd', {
        '--bg': '#f7f9fb',
        '--bg-soft': '#eef3f7',
        '--panel': '#ffffff',
        '--panel-soft': '#edf2f8',
        '--panel-strong': '#dfeaf5',
        '--text': '#1a242f',
        '--muted': '#55697c',
        '--primary': '#006591',
        '--primary-container': '#5da9dd',
        '--accent': '#0f5d86',
        '--secondary': '#735c00',
        '--tertiary': '#435b9f',
        '--border': '#c7d7e6',
        '--shadow': 'rgba(26, 36, 47, 0.07)'
    }),
    bibleTheme('orthodox', 'Orthodox', 'Warm liturgical gold', '#bea04a', {
        '--bg': '#f7f4e8',
        '--bg-soft': '#efead7',
        '--panel': '#fefcf2',
        '--panel-soft': '#ece4cf',
        '--panel-strong': '#e3d6b7',
        '--text': '#221d14',
        '--muted': '#5f4f3a',
        '--primary': '#7a5e10',
        '--primary-container': '#bea04a',
        '--accent': '#a61d12',
        '--secondary': '#bea04a',
        '--tertiary': '#435b9f',
        '--border': '#d6c7a8',
        '--shadow': 'rgba(34, 29, 20, 0.07)'
    }),

    fromPs('abyss', 'Abyss', 'Pure black vacuum', 'oklch(0.15 0.02 260)', 'dark', {
        '--bg': 'oklch(0.015 0.005 260)',
        '--surface': 'oklch(0.04 0.01 260)',
        '--surface-raised': 'oklch(0.07 0.015 260)',
        '--ink': 'oklch(0.94 0.005 260)',
        '--muted': 'oklch(0.52 0.02 260)',
        '--primary': 'oklch(0.55 0.12 250)',
        '--primary-hover': 'oklch(0.62 0.14 250)',
        '--accent': 'oklch(0.78 0.12 195)',
        '--border': 'oklch(0.12 0.015 260)',
        '--focus-ring': 'oklch(0.78 0.12 195)'
    }),
    fromPs('void', 'Void', 'Absolute darkness', 'oklch(0.85 0.14 85)', 'dark', {
        '--bg': 'oklch(0.02 0 0)',
        '--surface': 'oklch(0.06 0.008 250)',
        '--surface-raised': 'oklch(0.1 0.012 250)',
        '--ink': 'oklch(0.95 0.005 250)',
        '--muted': 'oklch(0.55 0.02 250)',
        '--primary': 'oklch(0.58 0.14 250)',
        '--primary-hover': 'oklch(0.65 0.16 250)',
        '--accent': 'oklch(0.85 0.14 85)',
        '--border': 'oklch(0.14 0.015 250)',
        '--focus-ring': 'oklch(0.85 0.14 85)'
    }),
    fromPs('nebula', 'Nebula', 'Deep space cobalt', 'oklch(0.62 0.22 250)', 'dark', {
        '--bg': 'oklch(0.045 0.02 260)',
        '--surface': 'oklch(0.09 0.035 260)',
        '--surface-raised': 'oklch(0.13 0.04 260)',
        '--ink': 'oklch(0.97 0.008 260)',
        '--muted': 'oklch(0.62 0.04 260)',
        '--primary': 'oklch(0.62 0.22 250)',
        '--primary-hover': 'oklch(0.68 0.24 250)',
        '--accent': 'oklch(0.82 0.18 195)',
        '--border': 'oklch(0.22 0.05 260)',
        '--focus-ring': 'oklch(0.82 0.18 195)'
    }),
    fromPs('midnight', 'Midnight', 'Blue hour terminal', 'oklch(0.5 0.18 270)', 'dark', {
        '--bg': 'oklch(0.06 0.04 270)',
        '--surface': 'oklch(0.1 0.05 270)',
        '--surface-raised': 'oklch(0.14 0.055 270)',
        '--ink': 'oklch(0.95 0.01 270)',
        '--muted': 'oklch(0.58 0.04 270)',
        '--primary': 'oklch(0.5 0.18 270)',
        '--primary-hover': 'oklch(0.58 0.2 270)',
        '--accent': 'oklch(0.75 0.16 220)',
        '--border': 'oklch(0.18 0.05 270)',
        '--focus-ring': 'oklch(0.75 0.16 220)'
    }),
    fromPs('eclipse', 'Eclipse', 'Solar flare magenta', 'oklch(0.68 0.24 330)', 'dark', {
        '--bg': 'oklch(0.04 0.025 300)',
        '--surface': 'oklch(0.085 0.045 300)',
        '--surface-raised': 'oklch(0.12 0.055 300)',
        '--ink': 'oklch(0.96 0.015 300)',
        '--muted': 'oklch(0.6 0.05 300)',
        '--primary': 'oklch(0.68 0.24 330)',
        '--primary-hover': 'oklch(0.74 0.26 330)',
        '--accent': 'oklch(0.78 0.2 160)',
        '--border': 'oklch(0.2 0.06 300)',
        '--focus-ring': 'oklch(0.78 0.2 160)'
    }),
    fromPs('crimson', 'Crimson', 'Red alert grid', 'oklch(0.58 0.24 25)', 'dark', {
        '--bg': 'oklch(0.05 0.03 25)',
        '--surface': 'oklch(0.09 0.05 25)',
        '--surface-raised': 'oklch(0.13 0.06 25)',
        '--ink': 'oklch(0.95 0.02 25)',
        '--muted': 'oklch(0.6 0.05 25)',
        '--primary': 'oklch(0.58 0.24 25)',
        '--primary-hover': 'oklch(0.65 0.26 25)',
        '--accent': 'oklch(0.78 0.18 55)',
        '--border': 'oklch(0.2 0.06 25)',
        '--focus-ring': 'oklch(0.78 0.18 55)'
    }),
    fromPs('forest', 'Forest', 'Deep emerald ops', 'oklch(0.62 0.16 155)', 'dark', {
        '--bg': 'oklch(0.05 0.03 155)',
        '--surface': 'oklch(0.09 0.045 155)',
        '--surface-raised': 'oklch(0.13 0.05 155)',
        '--ink': 'oklch(0.95 0.015 155)',
        '--muted': 'oklch(0.58 0.04 155)',
        '--primary': 'oklch(0.62 0.16 155)',
        '--primary-hover': 'oklch(0.68 0.18 155)',
        '--accent': 'oklch(0.82 0.14 120)',
        '--border': 'oklch(0.18 0.05 155)',
        '--focus-ring': 'oklch(0.82 0.14 120)'
    }),
    fromPs('fusion', 'Fusion', 'Plasma reactor', 'oklch(0.7 0.28 305)', 'dark', {
        '--bg': 'oklch(0.05 0.04 305)',
        '--surface': 'oklch(0.1 0.07 305)',
        '--surface-raised': 'oklch(0.14 0.08 305)',
        '--ink': 'oklch(0.97 0.02 305)',
        '--muted': 'oklch(0.64 0.06 305)',
        '--primary': 'oklch(0.7 0.28 305)',
        '--primary-hover': 'oklch(0.76 0.3 305)',
        '--accent': 'oklch(0.82 0.22 55)',
        '--border': 'oklch(0.24 0.08 305)',
        '--focus-ring': 'oklch(0.82 0.22 55)'
    }),
    fromPs('ink', 'Ink', 'Charcoal minimal', 'oklch(0.45 0.02 260)', 'dark', {
        '--bg': 'oklch(0.08 0.01 260)',
        '--surface': 'oklch(0.12 0.015 260)',
        '--surface-raised': 'oklch(0.16 0.02 260)',
        '--ink': 'oklch(0.92 0.005 260)',
        '--muted': 'oklch(0.58 0.02 260)',
        '--primary': 'oklch(0.45 0.02 260)',
        '--primary-hover': 'oklch(0.52 0.03 260)',
        '--accent': 'oklch(0.72 0.1 195)',
        '--border': 'oklch(0.2 0.02 260)',
        '--focus-ring': 'oklch(0.72 0.1 195)'
    }),
    fromPs('dusk', 'Dusk', 'Twilight balance', 'oklch(0.55 0.14 280)', 'mid', {
        '--bg': 'oklch(0.14 0.03 280)',
        '--surface': 'oklch(0.18 0.035 280)',
        '--surface-raised': 'oklch(0.22 0.04 280)',
        '--ink': 'oklch(0.92 0.01 280)',
        '--muted': 'oklch(0.62 0.03 280)',
        '--primary': 'oklch(0.55 0.14 280)',
        '--primary-hover': 'oklch(0.62 0.16 280)',
        '--accent': 'oklch(0.75 0.14 200)',
        '--border': 'oklch(0.28 0.04 280)',
        '--focus-ring': 'oklch(0.75 0.14 200)'
    }),
    fromPs('graphite', 'Graphite', 'Industrial mid-tone', 'oklch(0.5 0.02 260)', 'mid', {
        '--bg': 'oklch(0.18 0.01 260)',
        '--surface': 'oklch(0.22 0.015 260)',
        '--surface-raised': 'oklch(0.26 0.02 260)',
        '--ink': 'oklch(0.9 0.005 260)',
        '--muted': 'oklch(0.62 0.02 260)',
        '--primary': 'oklch(0.5 0.02 260)',
        '--primary-hover': 'oklch(0.58 0.03 260)',
        '--accent': 'oklch(0.7 0.12 230)',
        '--border': 'oklch(0.32 0.02 260)',
        '--focus-ring': 'oklch(0.7 0.12 230)'
    }),
    fromPs('dawn', 'Dawn', 'Soft morning glow', 'oklch(0.62 0.18 250)', 'light', {
        '--bg': 'oklch(0.92 0.02 250)',
        '--surface': 'oklch(0.96 0.015 250)',
        '--surface-raised': 'oklch(0.99 0.01 250)',
        '--ink': 'oklch(0.18 0.03 250)',
        '--muted': 'oklch(0.48 0.04 250)',
        '--primary': 'oklch(0.62 0.18 250)',
        '--primary-hover': 'oklch(0.55 0.2 250)',
        '--accent': 'oklch(0.48 0.16 230)',
        '--border': 'oklch(0.82 0.03 250)',
        '--focus-ring': 'oklch(0.48 0.16 230)'
    }),
    fromPs('frost', 'Frost', 'Icy white blue', 'oklch(0.55 0.12 230)', 'light', {
        '--bg': 'oklch(0.95 0.015 230)',
        '--surface': 'oklch(0.98 0.01 230)',
        '--surface-raised': 'oklch(1 0.005 230)',
        '--ink': 'oklch(0.15 0.03 230)',
        '--muted': 'oklch(0.45 0.04 230)',
        '--primary': 'oklch(0.55 0.12 230)',
        '--primary-hover': 'oklch(0.48 0.14 230)',
        '--accent': 'oklch(0.42 0.14 210)',
        '--border': 'oklch(0.85 0.025 230)',
        '--focus-ring': 'oklch(0.42 0.14 210)'
    }),
    fromPs('paper', 'Paper', 'Clean editorial', 'oklch(0.35 0.02 260)', 'light', {
        '--bg': 'oklch(0.98 0.005 260)',
        '--surface': 'oklch(1 0 260)',
        '--surface-raised': 'oklch(0.99 0.003 260)',
        '--ink': 'oklch(0.12 0.02 260)',
        '--muted': 'oklch(0.42 0.02 260)',
        '--primary': 'oklch(0.35 0.02 260)',
        '--primary-hover': 'oklch(0.28 0.03 260)',
        '--accent': 'oklch(0.45 0.14 250)',
        '--border': 'oklch(0.88 0.01 260)',
        '--focus-ring': 'oklch(0.45 0.14 250)'
    }),
    fromPs('sand', 'Sand', 'Warm desert light', 'oklch(0.62 0.12 75)', 'light', {
        '--bg': 'oklch(0.94 0.03 75)',
        '--surface': 'oklch(0.97 0.025 75)',
        '--surface-raised': 'oklch(0.99 0.02 75)',
        '--ink': 'oklch(0.2 0.04 75)',
        '--muted': 'oklch(0.48 0.05 75)',
        '--primary': 'oklch(0.62 0.12 75)',
        '--primary-hover': 'oklch(0.55 0.14 75)',
        '--accent': 'oklch(0.48 0.14 45)',
        '--border': 'oklch(0.84 0.04 75)',
        '--focus-ring': 'oklch(0.48 0.14 45)'
    }),
    fromPs('sky', 'Sky', 'Open horizon', 'oklch(0.58 0.16 230)', 'light', {
        '--bg': 'oklch(0.93 0.025 230)',
        '--surface': 'oklch(0.97 0.02 230)',
        '--surface-raised': 'oklch(0.99 0.015 230)',
        '--ink': 'oklch(0.16 0.03 230)',
        '--muted': 'oklch(0.46 0.04 230)',
        '--primary': 'oklch(0.58 0.16 230)',
        '--primary-hover': 'oklch(0.5 0.18 230)',
        '--accent': 'oklch(0.45 0.18 250)',
        '--border': 'oklch(0.83 0.03 230)',
        '--focus-ring': 'oklch(0.45 0.18 250)'
    }),
    fromPs('mint', 'Mint', 'Fresh light terminal', 'oklch(0.58 0.14 165)', 'light', {
        '--bg': 'oklch(0.94 0.025 165)',
        '--surface': 'oklch(0.97 0.02 165)',
        '--surface-raised': 'oklch(0.99 0.015 165)',
        '--ink': 'oklch(0.16 0.04 165)',
        '--muted': 'oklch(0.46 0.05 165)',
        '--primary': 'oklch(0.58 0.14 165)',
        '--primary-hover': 'oklch(0.5 0.16 165)',
        '--accent': 'oklch(0.42 0.14 200)',
        '--border': 'oklch(0.84 0.035 165)',
        '--focus-ring': 'oklch(0.42 0.14 200)'
    }),
    fromPs('pearl', 'Pearl', 'Bright minimal luxe', 'oklch(0.65 0.1 330)', 'light', {
        '--bg': 'oklch(0.96 0.01 330)',
        '--surface': 'oklch(0.99 0.008 330)',
        '--surface-raised': 'oklch(1 0.005 330)',
        '--ink': 'oklch(0.14 0.03 330)',
        '--muted': 'oklch(0.44 0.04 330)',
        '--primary': 'oklch(0.65 0.1 330)',
        '--primary-hover': 'oklch(0.58 0.12 330)',
        '--accent': 'oklch(0.48 0.14 300)',
        '--border': 'oklch(0.86 0.02 330)',
        '--focus-ring': 'oklch(0.48 0.14 300)'
    })
];

export const defaultTheme: DesignTheme = 'sacred-covenant';

export const themeTiers: {tier: ThemeTier; label: string}[] = [
    {tier: 'bible', label: 'Bible'},
    {tier: 'dark', label: 'Deep dark'},
    {tier: 'mid', label: 'Balanced'},
    {tier: 'light', label: 'Light'}
];

const themeIds = new Set(themes.map(t => t.id));

export function getTheme(id: string | null | undefined): ThemeDefinition {
    const found = themes.find(t => t.id === id);
    return found ?? themes.find(t => t.id === defaultTheme)!;
}

export function isDesignTheme(id: string): id is DesignTheme {
    return themeIds.has(id as DesignTheme);
}

export function normalizeThemeId(id: string | null | undefined): DesignTheme {
    if (id && isDesignTheme(id)) return id;
    return defaultTheme;
}

export function applyThemeVars(root: HTMLElement, theme: ThemeDefinition): void {
    Object.entries(theme.vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
    root.dataset.theme = theme.id;
    root.style.colorScheme = theme.tier === 'light' || theme.tier === 'bible' ? 'light' : theme.tier === 'mid' ? 'light dark' : 'dark';
}
