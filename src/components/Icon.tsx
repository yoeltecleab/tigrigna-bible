import {
    BookOpen,
    Check,
    Palette,
    ChevronLeft,
    ChevronRight,
    Church,
    ChevronDown,
    ChevronUp,
    Heart,
    History,
    Lock,
    Medal,
    Bookmark,
    Menu,
    Search,
    Settings,
    Share2,
    Sparkles,
    Star,
    Sun,
    NotebookPen,
    X,
    type LucideIcon,
    type LucideProps
} from 'lucide-react';

const icons = {
    auto_stories: BookOpen,
    military_tech: Medal,
    favorite: Heart,
    search: Search,
    settings: Settings,
    menu_book: BookOpen,
    star: Star,
    expand_more: ChevronDown,
    expand_less: ChevronUp,
    chevron_left: ChevronLeft,
    chevron_right: ChevronRight,
    close: X,
    bookmark: Bookmark,
    share: Share2,
    history: History,
    sunny: Sun,
    edit_note: NotebookPen,
    church: Church,
    lock: Lock,
    menu: Menu,
    sparkles: Sparkles,
    palette: Palette,
    check: Check
} as const;

export type IconName = keyof typeof icons;

type Props = LucideProps & {
    name: IconName | string;
};

export default function Icon({name, size = 20, strokeWidth = 1.75, ...props}: Props) {
    const Cmp: LucideIcon = icons[name as IconName] ?? Search;
    return <Cmp aria-hidden="true" size={size} strokeWidth={strokeWidth} {...props} />;
}
