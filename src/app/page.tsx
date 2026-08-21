import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 shadow-soft">
          <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <h1 className="font-display text-4xl font-semibold tracking-tight text-warm-900 sm:text-5xl">
          Photo Booth Wedding
        </h1>
        <p className="mt-4 text-lg text-warm-600">
          Abadikan momen spesial pernikahan Anda bersama para tamu
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/login"
            className="btn-primary w-full py-3.5"
          >
            Login Admin
          </Link>
        </div>

        <p className="mt-8 text-sm text-warm-400">
          Scan QR code di venue untuk mulai mengambil foto
        </p>
      </div>
    </main>
  );
}
