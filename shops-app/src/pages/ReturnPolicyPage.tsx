"use client";

import React from 'react';

// Policy terms in one place so the page and any future checkout copy agree.
const RETURN_WINDOW_DAYS = 7;
const REFUND_DAYS = 7;
const SELLER_RESPONSE_HOURS = 48;
const SUPPORT_PHONE = '+254 720 073322';
const SUPPORT_WHATSAPP_URL = 'https://wa.me/254720073322';
const LAST_UPDATED = 'September 2026';

const link = 'text-primary dark:text-sky-400 font-semibold hover:underline';

const SECTIONS: { title: string; body: React.ReactNode }[] = [
    {
        title: '1. Who this policy applies to',
        body: (
            <>
                Suqafuran is a marketplace: items are sold by independent sellers and shops, not by Suqafuran
                itself. Every seller on Suqafuran must honour this Return Policy for items bought through the
                platform. The seller who sold you the item handles your return and refund. Suqafuran steps in if
                you and the seller can't agree (see section 7).
            </>
        ),
    },
    {
        title: `2. Return window: ${RETURN_WINDOW_DAYS} days`,
        body: (
            <>
                You can request a return within <strong>{RETURN_WINDOW_DAYS} days of receiving the item</strong>.
                Requests made after that are at the seller's discretion.
            </>
        ),
    },
    {
        title: '3. Items you can return',
        body: (
            <>
                You can return an item if:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>it is faulty, damaged, or doesn't work;</li>
                    <li>it is not as described in the listing (wrong item, size, colour, model, or condition);</li>
                    <li>part of the order is missing; or</li>
                    <li>
                        you changed your mind, provided the item is unused, in its original condition and packaging,
                        with any tags and accessories included.
                    </li>
                </ul>
                Please keep your order details or chat history with the seller as proof of purchase.
            </>
        ),
    },
    {
        title: '4. Items that cannot be returned',
        body: (
            <>
                Unless they arrive faulty, damaged, or not as described, the following can't be returned for a
                change of mind:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>perishable goods such as fresh food and groceries;</li>
                    <li>opened personal-care, beauty, and hygiene products, and underwear;</li>
                    <li>live animals and livestock;</li>
                    <li>items made or altered to order;</li>
                    <li>digital products, vouchers, and services that have already been provided.</li>
                </ul>
            </>
        ),
    },
    {
        title: '5. How to request a return',
        body: (
            <>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>
                        Open <a href="/messages" className={link}>Messages</a> and contact the seller within{' '}
                        {RETURN_WINDOW_DAYS} days of receiving the item. Say what's wrong and include photos if the
                        item is faulty or not as described.
                    </li>
                    <li>
                        The seller should reply within {SELLER_RESPONSE_HOURS} hours and agree how the item will be
                        returned (drop-off, pickup, or delivery).
                    </li>
                    <li>Return the item in the condition described in section 3.</li>
                </ol>
                If the seller doesn't reply within {SELLER_RESPONSE_HOURS} hours, contact Suqafuran support (section
                8) and we'll follow up.
            </>
        ),
    },
    {
        title: '6. Return delivery costs',
        body: (
            <>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <strong>Faulty, damaged, wrong, or not-as-described items:</strong> the seller pays for
                        return delivery.
                    </li>
                    <li>
                        <strong>Change of mind:</strong> you pay for return delivery.
                    </li>
                </ul>
            </>
        ),
    },
    {
        title: '7. Refunds',
        body: (
            <>
                Once the seller receives and checks the returned item, you'll be refunded{' '}
                <strong>within {REFUND_DAYS} days</strong>, using the{' '}
                <strong>same payment method you used</strong>: to the same M-Pesa number, or in cash if you paid
                in cash. For faulty or not-as-described
                items, the refund includes the original delivery fee. If a seller refuses a return this policy
                allows, or doesn't refund you in time, contact Suqafuran support. We will review the case, and
                sellers who don't honour this policy may have their listings removed or their account suspended.
            </>
        ),
    },
    {
        title: '8. Contact us',
        body: (
            <>
                For help with a return or refund, contact Suqafuran support by phone at{' '}
                <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className={link}>{SUPPORT_PHONE}</a>, on{' '}
                <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={link}>WhatsApp</a>,
                through the support chat on this website, or via the{' '}
                <a href="/help-center" className={link}>Help Center</a>.
            </>
        ),
    },
    {
        title: '9. Suqafuran promotion fees',
        body: (
            <>
                This policy covers items bought from sellers. Fees that sellers pay Suqafuran for promotions (such
                as featured listings or banners) are separate. If you were charged for a promotion that was never
                activated, contact support and we'll either activate it or refund you.
            </>
        ),
    },
];

export default function ReturnPolicyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-neutral-50">Return &amp; Refund Policy</h1>
                    <p className="mt-3 text-sm text-gray-500 dark:text-neutral-300">Last updated: {LAST_UPDATED}</p>
                    <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
                        Summary: you can return an item within <strong>{RETURN_WINDOW_DAYS} days</strong> of receiving it.
                        Refunds go back to your original payment method within <strong>{REFUND_DAYS} days</strong> of the
                        seller receiving the return. Return delivery is free when the item is faulty or not as described.
                    </p>
                </div>

                <div className="space-y-8">
                    {SECTIONS.map((section) => (
                        <div key={section.title}>
                            <h2 className="text-sm font-black text-gray-900 dark:text-neutral-50 mb-2">
                                {section.title}
                            </h2>
                            <div className="text-xs leading-relaxed text-gray-600 dark:text-neutral-300">
                                {section.body}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
