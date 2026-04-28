const GOOGLE_TRANSLATE_KEY = 'AIzaSyCgEFAnc3BNyIrzXYql7yzMf8ME7xT7PQ8';
const cache = new Map<string, string>();

export async function translateTexts(
    texts: string[],
    target: string,
    source = 'en'
): Promise<string[]> {
    const results: (string | null)[] = texts.map(() => null);
    const toFetch: string[] = [];
    const toFetchIdx: number[] = [];

    texts.forEach((text, i) => {
        const key = `${target}:${text}`;
        if (cache.has(key)) {
            results[i] = cache.get(key)!;
        } else {
            toFetch.push(text);
            toFetchIdx.push(i);
        }
    });

    if (toFetch.length > 0) {
        const res = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: toFetch, source, target, format: 'text' }),
            }
        );

        if (!res.ok) throw new Error(`Translate API error: ${res.status}`);

        const data = await res.json();
        const translations: { translatedText: string }[] = data?.data?.translations ?? [];

        translations.forEach((t, idx) => {
            const original = toFetch[idx];
            const translated = t.translatedText;
            cache.set(`${target}:${original}`, translated);
            results[toFetchIdx[idx]] = translated;
        });
    }

    return results.map((r, i) => r ?? texts[i]);
}

// ── Batched single-text translation ───────────────────────────────────────────
// All translateSingle calls within a 60ms window are grouped into one API call.
// This means 20 product cards mounting at the same time → 1 API request.

interface QueueItem {
    text: string;
    target: string;
    source: string;
    resolve: (s: string) => void;
    reject: (e: unknown) => void;
}

let queue: QueueItem[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushQueue() {
    if (!queue.length) return;
    const batch = [...queue];
    queue = [];
    flushTimer = null;

    const groups = new Map<string, QueueItem[]>();
    for (const item of batch) {
        const key = `${item.source}→${item.target}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
    }

    for (const items of groups.values()) {
        const { target, source } = items[0];
        try {
            const results = await translateTexts(items.map(i => i.text), target, source);
            items.forEach((item, idx) => item.resolve(results[idx]));
        } catch (e) {
            items.forEach(item => item.reject(e));
        }
    }
}

export function translateSingle(text: string, target: string, source = 'en'): Promise<string> {
    const key = `${target}:${text}`;
    if (cache.has(key)) return Promise.resolve(cache.get(key)!);

    return new Promise((resolve, reject) => {
        queue.push({ text, target, source, resolve, reject });
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(flushQueue, 60);
    });
}
