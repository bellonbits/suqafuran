import React from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { Shield, Eye, Lock, Users, Trash2, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PrivacyPolicyPage: React.FC = () => {
    const { t } = useTranslation();

    const SECTIONS = [
    {
        icon: Eye,
        title: t('privacy.dataCollection', 'Information We Collect'),
        content: [
            'Account information: name, email address, phone number, and profile photo when you register.',
            'Listing data: titles, descriptions, prices, images, and location you provide when posting ads.',
            'Usage data: pages visited, search queries, clicks, and time spent on the platform.',
            'Device information: IP address, browser type, operating system, and device identifiers.',
            'Communications: messages exchanged between buyers and sellers through our platform.',
        ],
    },
    {
        icon: Lock,
        title: t('privacy.howWeUse', 'How We Use Your Information'),
        content: [
            'To create and manage your account, authenticate logins, and keep your account secure.',
            'To display your listings to potential buyers across Somalia and Africa.',
            'To send you important notifications about your ads, messages, and account activity.',
            'To improve our platform, fix bugs, and develop new features based on usage patterns.',
            'To detect and prevent fraud, spam, and misuse of the Suqafuran marketplace.',
            'To comply with applicable laws and regulations in Somalia and the jurisdictions we operate in.',
        ],
    },
    {
        icon: Users,
        title: t('privacy.sharing', 'Information We Share'),
        content: [
            'Your public listing details (title, price, location, images) are visible to all users.',
            'Your display name and general location are shown on your seller profile.',
            'We do not sell your personal data to third parties for marketing purposes.',
            'We may share data with trusted service providers (hosting, payments, analytics) under strict confidentiality agreements.',
            'We may disclose information when required by law, court order, or to protect the safety of our users.',
        ],
    },
    {
        icon: Shield,
        title: t('privacy.security', 'Data Security'),
        content: [
            'All data is transmitted over HTTPS with TLS encryption.',
            'Passwords are hashed using industry-standard algorithms and never stored in plain text.',
            'Access to production databases is restricted to authorised personnel only.',
            'We conduct regular security audits and vulnerability assessments.',
            'In the event of a data breach, we will notify affected users within 72 hours.',
        ],
    },
    {
        icon: Trash2,
        title: t('privacy.yourRights', 'Your Rights & Choices'),
        content: [
            'Access: You may request a copy of the personal data we hold about you at any time.',
            'Correction: You can update your profile information directly from your account settings.',
            'Deletion: You may request deletion of your account and associated data by contacting us.',
            'Opt-out: You can unsubscribe from marketing emails using the link in any email we send.',
            'Data portability: You may request your data in a machine-readable format.',
        ],
    },
    {
        icon: Mail,
        title: t('privacy.cookies', 'Cookies & Tracking'),
        content: [
            'We use cookies — small text files stored on your device — to make Suqafuran work and improve your experience.',
            'Essential cookies: required for login sessions, security tokens, and core platform functionality. These cannot be turned off.',
            'Preference cookies: remember your language choice (English or Somali) and display settings.',
            'Analytics cookies: help us understand how users navigate the platform using aggregated, anonymised data. No personally identifiable information is shared with analytics providers.',
            'When you first visit Suqafuran, a cookie notice will appear. Clicking "Accept" records your consent in your browser. You can clear this at any time by clearing your browser storage.',
            'You can disable non-essential cookies in your browser or device settings at any time, though some features may not work as expected.',
        ],
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
                    {t('privacy.title', 'Privacy Policy')}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 10, fontSize: 15, maxWidth: 540, margin: '10px auto 0' }}>
                    {t('privacy.subtitle', 'We respect your privacy and are committed to protecting your personal data. This policy explains how Suqafuran collects, uses, and safeguards your information.')}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 16 }}>
                    Last updated: March 2026
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
                    By using Suqafuran — including our website at <strong>suqafuran.com</strong> and our mobile apps —
                    you agree to the collection and use of information described in this policy.
                    If you do not agree, please do not use our services.
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
                            {content.map((item, j) => (
                                <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#374151', lineHeight: 1.65 }}>
                                    <span className="bg-primary-500" style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        flexShrink: 0, marginTop: 7,
                                    }} />
                                    {item}
                                </li>
                            ))}
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
                        {t('privacy.childrenPrivacy', "Children's Privacy")}
                    </h2>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.65 }}>
                        Suqafuran is not intended for children under the age of 13. We do not knowingly collect
                        personal data from children. If you believe a child has provided us with personal information,
                        please contact us and we will promptly delete it.
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
                        {t('privacy.changesToPolicy', 'Changes to This Policy')}
                    </h2>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.65 }}>
                        We may update this Privacy Policy from time to time. We will notify you of significant changes
                        by posting a notice on our platform or sending you an email. Continued use of Suqafuran after
                        changes are posted constitutes your acceptance of the revised policy.
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
                        {t('privacy.questionsTitle', 'Questions about your data?')}
                    </h3>
                    <p style={{ fontSize: 14, opacity: 0.85, margin: '0 0 16px', lineHeight: 1.6 }}>
                        {t('privacy.questionsDesc', 'If you have any questions, requests, or concerns about this Privacy Policy or how we handle your personal data, please reach out to us.')}
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
