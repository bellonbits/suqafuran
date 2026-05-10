import React from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { FileText, ShieldCheck, UserCheck, AlertCircle, Scale, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TermsPage: React.FC = () => {
    const { t } = useTranslation();

    const SECTIONS = [
    {
        icon: UserCheck,
        title: t('terms.accountRegistration'),
        content: t('terms.accountRegistrationContent', { returnObjects: true }) as string[],
    },
    {
        icon: FileText,
        title: t('terms.listingRules'),
        content: t('terms.listingRulesContent', { returnObjects: true }) as string[],
    },
    {
        icon: AlertCircle,
        title: t('terms.buyerSeller'),
        content: t('terms.buyerSellerContent', { returnObjects: true }) as string[],
    },
    {
        icon: CreditCard,
        title: t('terms.fees'),
        content: t('terms.feesContent', { returnObjects: true }) as string[],
    },
    {
        icon: ShieldCheck,
        title: t('terms.intellectualProperty'),
        content: t('terms.intellectualPropertyContent', { returnObjects: true }) as string[],
    },
    {
        icon: Scale,
        title: t('terms.liability'),
        content: t('terms.liabilityContent', { returnObjects: true }) as string[],
    },
    ];

    return (
        <PublicLayout>
            {/* Hero */}
            <div className="bg-primary-500" style={{
                padding: '56px 24px 48px',
                textAlign: 'center',
            }}>
                <div className="bg-white/10" style={{
                    width: 64, height: 64, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <Scale size={32} color="white" />
                </div>
                <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0 }}>
                    {t('terms.title')}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 10, fontSize: 15, maxWidth: 540, margin: '10px auto 0' }}>
                    {t('terms.subtitle')}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 16 }}>
                    {t('terms.lastUpdated')}: {t('common.date', 'April 2026')}
                </p>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px 80px' }}>

                {/* Intro callout */}
                <div className="bg-primary-50 border-primary-200 text-primary-700" style={{
                    border: '1px solid',
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 36,
                    fontSize: 14,
                    lineHeight: 1.6,
                }}>
                    {t('terms.introText')}
                </div>

                {/* Sections */}
                {SECTIONS.map(({ icon: Icon, title, content }, i) => (
                    <div key={i} style={{ marginBottom: 36 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div className="bg-primary-50" style={{
                                width: 40, height: 40, borderRadius: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Icon size={18} className="text-primary-600" />
                            </div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                {title}
                            </h2>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {Array.isArray(content) ? content.map((item, j) => (
                                <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#374151', lineHeight: 1.65 }}>
                                    <span className="bg-primary-500" style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        flexShrink: 0, marginTop: 7,
                                    }} />
                                    {item}
                                </li>
                            )) : (
                                <li style={{ fontSize: 14, color: '#374151' }}>{content}</li>
                            )}
                        </ul>
                        {i < SECTIONS.length - 1 && (
                            <hr style={{ marginTop: 32, borderColor: '#f1f5f9', borderTopWidth: 1 }} />
                        )}
                    </div>
                ))}

                <div className="bg-gray-50 border-gray-200" style={{
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 28,
                    border: '1px solid',
                }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: 10 }}>
                        {t('terms.changesToTerms')}
                    </h2>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.65 }}>
                        {t('terms.changesDesc')}
                    </p>
                </div>

                {/* Contact */}
                <div className="bg-primary-500" style={{
                    borderRadius: 16,
                    padding: '28px 28px',
                    textAlign: 'center',
                    color: 'white',
                }}>
                    <FileText size={28} style={{ marginBottom: 12, opacity: 0.9 }} />
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>
                        {t('terms.questionsTitle')}
                    </h3>
                    <p style={{ fontSize: 14, opacity: 0.85, margin: '0 0 16px', lineHeight: 1.6 }}>
                        {t('terms.questionsDesc')}
                    </p>
                    <a
                        href="mailto:support@suqafuran.com"
                        className="text-primary-700 bg-white"
                        style={{
                            display: 'inline-block',
                            fontWeight: 700,
                            fontSize: 14,
                            padding: '10px 24px',
                            borderRadius: 999,
                            textDecoration: 'none',
                        }}
                    >
                        support@suqafuran.com
                    </a>
                </div>
            </div>
        </PublicLayout>
    );
};

export default TermsPage;
