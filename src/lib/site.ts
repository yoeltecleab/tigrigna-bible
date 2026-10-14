const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');

export const SITE_URL = configured || (typeof window !== 'undefined' ? window.location.origin : 'https://tigrigna-bible.vercel.app');

export const SITE_NAME = 'Tigrigna Bible';

export const readerShareUrl = (bookId: string, chapter: number, verse?: number) => {
    const url = new URL(`/reader/${bookId}/${chapter}`, SITE_URL);
    if (verse != null && Number.isFinite(verse)) {
        url.searchParams.set('verse', String(verse));
    }
    return url.toString();
};

/** Citation text without the link; share targets get the URL separately so it is never duplicated. */
export const formatCitation = (reference: string, body: string) => `${body}\n\n— ${reference}`;

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export const copyText = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Fall through to the legacy path (e.g. iOS without user-gesture clipboard access).
    }
    try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        return ok;
    } catch {
        return false;
    }
};

export const sharePassage = async (reference: string, body: string, url: string): Promise<ShareOutcome> => {
    const text = formatCitation(reference, body);
    if (navigator.share) {
        try {
            await navigator.share({title: reference, text, url});
            return 'shared';
        } catch (error) {
            if ((error as DOMException)?.name === 'AbortError') {
                return 'cancelled';
            }
        }
    }
    return (await copyText(`${text}\n${url}`)) ? 'copied' : 'failed';
};
