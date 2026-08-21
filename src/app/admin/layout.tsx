'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const isEventsPage = pathname === '/admin/events';

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/admin/events" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-warm-900">Photo Booth</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin/events"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                isEventsPage
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-warm-600 hover:bg-warm-50 hover:text-warm-900'
              }`}
            >
              Events
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-warm-500 transition-colors duration-200 hover:bg-warm-50 hover:text-warm-700"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
