import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';


/* ── Brand icons (no lucide equivalents / replaced for brand accuracy) ── */
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38a3.7 3.7 0 0 1-1.38.9c-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 0 0-2.13 1.38A5.86 5.86 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.86 5.86 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.13-1.38 5.86 5.86 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.13A5.86 5.86 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/>
    </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.2 8.2 0 0 0 4.78 1.52V7.01a4.85 4.85 0 0 1-1.01-.32z" fill="currentColor"/>
    </svg>
);

const SOCIALS = [
    {
        name: 'Instagram',
        handle: '@suqafuran',
        url: 'https://www.instagram.com/suqafuran/',
        icon: InstagramIcon,
        color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
        textColor: 'text-white',
    },
    {
        name: 'X (Twitter)',
        handle: '@suqafuran',
        url: 'https://x.com/suqafuran',
        icon: XIcon,
        color: 'bg-black',
        textColor: 'text-white',
    },
    {
        name: 'TikTok',
        handle: '@suqafuran_',
        url: 'https://www.tiktok.com/@suqafuran_',
        icon: TikTokIcon,
        color: 'bg-black',
        textColor: 'text-white',
    },
];

const ContactPage: React.FC = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');
        // Open default mail client as fallback — real form submission can be wired to backend later
        const mailto = `mailto:support@suqafuran.com?subject=${encodeURIComponent(form.subject || 'Contact from website')}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
        window.location.href = mailto;
        setTimeout(() => setStatus('sent'), 800);
    };

    return (
        <PublicLayout>
            {/* ── Hero ── */}
            <div
                className="relative overflow-hidden py-20 text-white"
                style={{ background: 'linear-gradient(135deg, var(--color-primary-600, #1b5e20) 0%, var(--color-primary-500, #2e7d32) 60%, var(--color-primary-400, #43a047) 100%)' }}
            >
                <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                        <MessageSquare className="w-4 h-4" />
                        {t('contact.heroBadge')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">{t('contact.heroTitle')}</h1>
                    <p className="text-lg text-white/80 max-w-xl mx-auto">
                        {t('contact.heroSubtitle')}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <div className="grid lg:grid-cols-5 gap-12">

                    {/* ── Left: Contact info ── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Direct contacts */}
                        <div>
                            <h2 className="text-xl font-black text-gray-900 mb-5">{t('contact.directContact')}</h2>
                            <div className="space-y-4">
                                <a
                                    href="mailto:support@suqafuran.com"
                                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--color-primary-500, #2e7d32), var(--color-primary-400, #43a047))' }}
                                    >
                                        <Mail className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('contact.emailSupport')}</p>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">support@suqafuran.com</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{t('contact.repliesWithin')}</p>
                                    </div>
                                </a>

                                <a
                                    href="tel:+254700000000"
                                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--color-primary-500, #2e7d32), var(--color-primary-400, #43a047))' }}
                                    >
                                        <Phone className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('contact.phoneWhatsapp')}</p>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">+254 700 000 000</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{t('contact.officeHoursTime', 'Mon – Fri, 8am – 6pm EAT')}</p>
                                    </div>
                                </a>

                                {/* Address */}
                                <a
                                    href="https://maps.google.com/?q=Krishna+Pointe,+Riverside+Lane,+Westlands,+Nairobi"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--color-primary-500, #2e7d32), var(--color-primary-400, #43a047))' }}
                                    >
                                        <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('contact.ourOffice')}</p>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug">
                                            Flat 13, Krishna Pointe<br />
                                            Riverside Lane, Westlands<br />
                                            Nairobi, Kenya
                                        </p>
                                        <p className="text-[11px] text-primary-600 font-semibold mt-0.5">Open in Maps →</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Social media */}
                        <div>
                            <h2 className="text-xl font-black text-gray-900 mb-5">{t('contact.followUs')}</h2>
                            <div className="space-y-3">
                                {SOCIALS.map(({ name, handle, url, icon: Icon, color, textColor }) => (
                                    <a
                                        key={name}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                            <Icon className={`w-5 h-5 ${textColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{name}</p>
                                            <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{handle}</p>
                                        </div>
                                        <span className="text-xs font-bold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">Follow →</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div
                            className="rounded-2xl p-5 text-white relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary-600, #1b5e20), var(--color-primary-500, #2e7d32))' }}
                        >
                            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                            <h3 className="font-black text-base mb-3 relative z-10">{t('contact.officeHours')}</h3>
                            <div className="space-y-2 text-sm relative z-10">
                                <div className="flex justify-between">
                                    <span className="text-white/70">{t('common.days.monFri', 'Monday – Friday')}</span>
                                    <span className="font-bold">8:00 – 18:00 EAT</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/70">{t('common.days.sat', 'Saturday')}</span>
                                    <span className="font-bold">9:00 – 14:00 EAT</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/70">{t('common.days.sun', 'Sunday')}</span>
                                    <span className="font-bold text-white/50">{t('common.closed', 'Closed')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Contact form ── */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">{t('contact.sendMessage')}</h2>
                            <p className="text-gray-500 text-sm mb-8">{t('contact.formSubtitle')}</p>

                            {status === 'sent' ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                                    <div
                                        className="w-20 h-20 rounded-full flex items-center justify-center"
                                        style={{ background: 'var(--color-primary-50, #f1f8e9)' }}
                                    >
                                        <CheckCircle className="w-10 h-10" style={{ color: 'var(--color-primary-500, #2e7d32)' }} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">{t('contact.successTitle')}</h3>
                                    <p className="text-gray-500 max-w-xs">{t('contact.successDesc')}</p>
                                    <button
                                        onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }); }}
                                        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        {t('contact.sendAnother')}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">{t('contact.yourName')} *</label>
                                            <input
                                                name="name"
                                                required
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="John Kamau"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">{t('contact.emailAddress')} *</label>
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                value={form.email}
                                                onChange={handleChange}
                                                placeholder="john@example.com"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">{t('contact.subject')} *</label>
                                        <select
                                            name="subject"
                                            required
                                            value={form.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all bg-white"
                                        >
                                            <option value="">{t('common.select')}</option>
                                            <option value="General Inquiry">{t('contact.subjectGeneral')}</option>
                                            <option value="Account Help">{t('contact.subjectAccount')}</option>
                                            <option value="Listing / Ad Support">{t('contact.subjectAd')}</option>
                                            <option value="Payment Issue">{t('contact.subjectPayment')}</option>
                                            <option value="Report a Problem">{t('contact.subjectReport')}</option>
                                            <option value="Business / Partnership">{t('contact.subjectBusiness')}</option>
                                            <option value="Other">{t('contact.subjectOther')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">{t('contact.message')} *</label>
                                        <textarea
                                            name="message"
                                            required
                                            rows={6}
                                            value={form.message}
                                            onChange={handleChange}
                                            placeholder={t('contact.messagePlaceholder', 'Tell us how we can help you…')}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'sending'}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-black text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
                                        style={{ background: 'linear-gradient(135deg, var(--color-primary-600, #1b5e20), var(--color-primary-500, #2e7d32))' }}
                                    >
                                        {status === 'sending' ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> {t('common.sending', 'Sending…')}</>
                                        ) : (
                                            <><Send className="w-4 h-4" /> {t('contact.sendButton')}</>
                                        )}
                                    </button>

                                    <p className="text-[11px] text-gray-400 text-center">
                                        Or email us directly at{' '}
                                        <a href="mailto:support@suqafuran.com" className="font-bold hover:underline" style={{ color: 'var(--color-primary-600, #1b5e20)' }}>
                                            support@suqafuran.com
                                        </a>
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { ContactPage };
