/**
 * Unified Date & Time formatting utilities for mobile and web clients.
 *
 * All dates from the backend database are stored in UTC.
 * When parsing ISO timestamps that lack timezone designators (e.g. from naive DB columns),
 * this parser ensures they are treated as UTC so that `.toLocaleTimeString` and
 * `.toLocaleDateString` accurately reflect the user's mobile device local timezone (e.g. EAT in Kenya/East Africa).
 */

export function parseServerDate(dateInput: string | number | Date | null | undefined): Date {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'number') return new Date(dateInput);

    let str = String(dateInput).trim();
    if (!str) return new Date();

    // Timestamp as numeric string
    if (/^\d{10,}$/.test(str)) {
        return new Date(Number(str));
    }

    // If naive timestamp (missing Z or offset like +03:00 / -05:00 / +0300)
    if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str) && !/[+-]\d{4}$/.test(str)) {
        // Standardize SQL space separator to ISO 'T' and append 'Z' for UTC
        str = str.replace(' ', 'T') + 'Z';
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Format timestamp into local device time (e.g. "12:35 PM" in Kenya EAT).
 */
export function formatMessageTime(dateInput: string | number | Date | null | undefined): string {
    const d = parseServerDate(dateInput);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format conversation list preview timestamp:
 * - If today: "12:35 PM"
 * - If yesterday: "Yesterday"
 * - Same year: "Nov 12"
 * - Older year: "Nov 12, 2025"
 */
export function formatMessageDate(dateInput: string | number | Date | null | undefined): string {
    if (!dateInput) return '';
    const d = parseServerDate(dateInput);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format date divider header in message bubble streams (e.g. "Today", "Yesterday", "Monday, Oct 24")
 */
export function formatChatDateHeader(dateInput: string | number | Date | null | undefined): string {
    const d = parseServerDate(dateInput);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
