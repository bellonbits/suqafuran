import React from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { FileText, ShieldCheck, UserCheck, AlertCircle, Scale, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TermsPage: React.FC = () => {
    const { t } = useTranslation();

    const SECTIONS = [
    {
        icon: UserCheck,
        title: t('terms.accountRegistration', 'Account Registration'),
        content: [
            'You must be at least 18 years old to create an account and post advertisements on Suqafuran.',
            'You agree to provide accurate, current, and complete information during the registration process.',
            'You are responsible for safeguarding your password and for all activities that occur under your account.',
            'Suqafuran reserves the right to suspend or terminate accounts that provide false information or violate these terms.',
        ],
    },
    {
        icon: FileText,
        title: t('terms.listingRules', 'Listing Rules & Guidelines'),
        content: [
            'All listings must accurately describe the item or service being offered.',
            'Items listed must be legally available for sale in the jurisdiction they are posted.',
            'Prohibited items include illegal substances, weapons, counterfeit goods, and stolen property.',
            'Listings must not contain misleading information, spam, or abusive language.',
            'Suqafuran reserves the right to remove any listing that violates our community standards without prior notice.',
        ],
    },
    {
        icon: AlertCircle,
        title: t('terms.buyerSeller', 'Buyer & Seller Responsibilities'),
        content: [
            'Suqafuran acts as a venue to connect buyers and sellers and is not a party to the actual transaction.',
            'Buyers are responsible for inspecting items before making payments.',
            'Sellers are responsible for accurately representing the condition and legality of the items they sell.',
            'Users must exercise caution and use common sense when conducting business with unknown parties.',
            'We strongly recommend meeting in safe, public places for transactions.',
        ],
    },
    {
        icon: CreditCard,
        title: t('terms.fees', 'Fees & Paid Promotions'),
        content: [
            'Basic listings on Suqafuran are free of charge.',
            'We offer optional paid promotion services (Top, Premium, VIP) to increase the visibility of your listings.',
            'Fees for paid services are clearly stated at the time of purchase and are non-refundable except as required by law.',
            'Suqafuran reserves the right to change our fee structure at any time with prior notice to users.',
        ],
    },
    {
        icon: ShieldCheck,
        title: t('terms.intellectualProperty', 'Intellectual Property'),
        content: [
            'The Suqafuran platform, including its code, design, and original content, is protected by copyright and intellectual property laws.',
            'By posting content (images, text) to Suqafuran, you grant us a non-exclusive license to use, display, and reproduce that content in connection with our services.',
            'You must have the right to use and distribute any content or images you upload to your listings.',
        ],
    },
    {
        icon: Scale,
        title: t('terms.liability', 'Limitation of Liability'),
        content: [
            'Suqafuran is provided "as is" without any warranties, express or implied.',
            'We do not guarantee the quality, safety, or legality of items advertised, the truth or accuracy of listings, or the ability of sellers to sell and buyers to pay.',
            'Suqafuran shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform.',
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
                <div className="bg-white/10" style={{
                    width: 64, height: 64, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <Scale size={32} color="white" />
                </div>
                <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0 }}>
                    {t('terms.title', 'Terms & Conditions')}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 10, fontSize: 15, maxWidth: 540, margin: '10px auto 0' }}>
                    {t('terms.subtitle', 'Please read these terms carefully before using Suqafuran. By accessing or using our platform, you agree to be bound by these conditions.')}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 16 }}>
                    Last updated: April 2026
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
                    Welcome to Suqafuran. These Terms & Conditions govern your access to and use of the 
                    <strong> suqafuran.com</strong> website, mobile applications, and services.
                    If you do not agree to all the terms and conditions outlined below, you may not access or use the platform.
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

                <div className="bg-gray-50 border-gray-200" style={{
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 28,
                    border: '1px solid',
                }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: 10 }}>
                        {t('terms.changesToTerms', 'Changes to Terms')}
                    </h2>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.65 }}>
                        We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms & Conditions on this page. You are advised to review these terms periodically for any changes.
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
                        {t('terms.questionsTitle', 'Questions about our terms?')}
                    </h3>
                    <p style={{ fontSize: 14, opacity: 0.85, margin: '0 0 16px', lineHeight: 1.6 }}>
                        {t('terms.questionsDesc', 'If you have any questions or require clarification about these terms, please contact our support team.')}
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
