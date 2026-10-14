import {create} from 'zustand';

export type Toast = {
    id: number;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
};

type UiState = {
    chromeHidden: boolean;
    reminderDue: boolean;
    toasts: Toast[];
    setChromeHidden: (hidden: boolean) => void;
    setReminderDue: (due: boolean) => void;
    showToast: (toast: Omit<Toast, 'id'>, durationMs?: number) => void;
    dismissToast: (id: number) => void;
};

let nextToastId = 1;

export const useUiStore = create<UiState>()(set => ({
    chromeHidden: false,
    reminderDue: false,
    toasts: [],
    setChromeHidden: chromeHidden => set(state => (state.chromeHidden === chromeHidden ? state : {chromeHidden})),
    setReminderDue: reminderDue => set({reminderDue}),
    showToast: (toast, durationMs = 2600) => {
        const id = nextToastId++;
        set(state => ({toasts: [...state.toasts.slice(-2), {...toast, id}]}));
        window.setTimeout(() => set(state => ({toasts: state.toasts.filter(item => item.id !== id)})), durationMs);
    },
    dismissToast: id => set(state => ({toasts: state.toasts.filter(item => item.id !== id)}))
}));

export const toast = (message: string, action?: {label: string; onAction: () => void}) =>
    useUiStore.getState().showToast(
        action ? {message, actionLabel: action.label, onAction: action.onAction} : {message},
        action ? 5000 : 2400
    );
