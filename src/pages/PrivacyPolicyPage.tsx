import React from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { Shield, Eye, Lock, Users, Trash2, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PrivacyPolicyPage: React.FC = () => {
    const { t } = useTranslation();

    const SECTIONS = [
    {
        icon: Eye,
        title: t('privacy.dataCollection'),
        content: t('privacy.dataCollectionContent', { returnObjects: true }) as string[],
    },
    {
        icon: Lock,
        title: t('privacy.howWeUse'),
        content: t('privacy.howWeUseContent', { returnObjects: true }) as string[],
    },
    {
        icon: Users,
        title: t('privacy.sharing'),
        content: t('privacy.sharingContent', { returnObjects: true }) as string[],
    },
    {
        icon: Shield,
        title: t('privacy.security'),
        content: t('privacy.securityContent', { returnObjects: true }) as string[],
    },
    {
        icon: Trash2,
        title: t('privacy.yourRights'),
        content: t('privacy.yourRightsContent', { returnObjects: true }) as string[],
    },
    {
        icon: Mail,
        title: t('privacy.cookies'),
        content: t('privacy.cookiesContent', { returnObjects: true }) as string[],
    },
    ];

    return (
        <PublicLayout>
            {/* Hero */}
            <div className="bg-primary-500" style={{
                padding: '56px 24px 48px',
                textAlign: 'center',
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <Shield size={32} color="white" />
                </div>
                <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0 }}>
                    {t('privacy.title')}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 10, fontSize: 15, maxWidth: 540, margin: '10px auto 0' }}>
                    {t('privacy.subtitle')}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 16 }}>
                    {t('terms.lastUpdated', 'Last updated')}: {t('common.date', 'March 2026')}
                </p>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px 80px' }}>

                {/* Intro callout */}
                <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 36,
                    fontSize: 14,
                    color: '#0369a1',
                    lineHeight: 1.6,
                }}>
                    {t('privacy.introText')}
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
                                    <div className="bg-primary-500" style={{
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

                {/* Children & Third parties */}
                <div style={{
                    background: '#fafafa',
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 28,
                    border: '1px solid #e2e8f0',
                }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: 10 }}>
                        {t('privacy.childrenPrivacy')}
                    </h2>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.65 }}>
                        {t('privacy.childrenDesc')}
                    </p>
                </div>

                <div style={{
                    background: '#fafafa',
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 28,
                    border: '1px solid #e2e8f0',
                }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: 10 }}>
                        {t('privacy.changesToPolicy')}
                    </h2>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.65 }}>
                        {t('privacy.changesDesc')}
                    </p>
                </div>

                {/* Contact */}
                <div className="bg-primary-500" style={{
                    borderRadius: 16,
                    padding: '28px 28px',
                    textAlign: 'center',
                    color: 'white',
                }}>
                    <Mail size={28} style={{ marginBottom: 12, opacity: 0.9 }} />
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>
                        {t('privacy.questionsTitle')}
                    </h3>
                    <p style={{ fontSize: 14, opacity: 0.85, margin: '0 0 16px', lineHeight: 1.6 }}>
                        {t('privacy.questionsDesc')}
                    </p>
                    <a
                        href="mailto:privacy@suqafuran.com"
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
                        privacy@suqafuran.com
                    </a>
                </div>
            </div>
        </PublicLayout>
    );
};

export default PrivacyPolicyPage;
