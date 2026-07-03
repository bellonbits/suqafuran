import RiderHeader from './RiderHeader';

export const metadata = {
    title: 'Rider - Suqafuran',
    description: 'Rider dashboard and delivery management',
};

export default function RiderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <RiderHeader />
            <main className="rider-main">
                {children}
            </main>
            <style jsx>{`
                .rider-main {
                    min-height: calc(100vh - 70px);
                    background: #f9fafb;
                }
            `}</style>
        </>
    );
}
