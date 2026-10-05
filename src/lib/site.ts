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

export const buildSharePayload = (reference: string, text: string, url: string) => {
    const body = `${text}\n\n${reference}\n${url}`;
    return {
        title: reference,
        text: body,
        url
    };
};
