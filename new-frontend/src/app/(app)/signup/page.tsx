"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '../../../store/useAuthModal';

/** /signup is kept as a route for any bookmarked/shared links, but auth now lives in the global modal. */
export default function SignupPage() {
    const router = useRouter();
    const open = useAuthModal((s) => s.open);

    useEffect(() => {
        open('signup');
        router.replace('/');
    }, [open, router]);

    return null;
}
