'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const timezones = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    coupleName: '',
    startDate: '',
    endDate: '',
    timezone: 'Asia/Jakarta',
    maxSessions: 3,
    maxPhotos: 4,
    capacity: 1000,
    retentionDays: 90,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat event');
      }

      router.push(`/admin/event/${data.event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/events" className="back-link">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Events
      </Link>
      <h1 className="page-title mt-3">Buat Event Baru</h1>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="card p-6">
          <h2 className="section-title">Informasi Event</h2>
          
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-warm-700">
                Nama Event
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Contoh: Pernikahan Budi & Ani"
                className="input-field mt-1.5"
              />
            </div>

            <div>
              <label htmlFor="coupleName" className="block text-sm font-medium text-warm-700">
                Nama Pasangan
              </label>
              <input
                id="coupleName"
                name="coupleName"
                type="text"
                required
                value={form.coupleName}
                onChange={handleChange}
                placeholder="Contoh: Budi & Ani"
                className="input-field mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-warm-700">
                  Tanggal Mulai
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  required
                  value={form.startDate}
                  onChange={handleChange}
                  className="input-field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-warm-700">
                  Tanggal Selesai
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  required
                  value={form.endDate}
                  onChange={handleChange}
                  className="input-field mt-1.5"
                />
              </div>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-warm-700">
                Zona Waktu
              </label>
              <select
                id="timezone"
                name="timezone"
                required
                value={form.timezone}
                onChange={handleChange}
                className="input-field mt-1.5"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title">Pengaturan Kuota</h2>
          
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxSessions" className="block text-sm font-medium text-warm-700">
                  Maksimal Sesi per Tamu
                </label>
                <input
                  id="maxSessions"
                  name="maxSessions"
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={form.maxSessions}
                  onChange={handleChange}
                  className="input-field mt-1.5"
                />
                <p className="mt-1 text-xs text-warm-400">Default: 3</p>
              </div>

              <div>
                <label htmlFor="maxPhotos" className="block text-sm font-medium text-warm-700">
                  Maksimal Foto per Sesi
                </label>
                <input
                  id="maxPhotos"
                  name="maxPhotos"
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={form.maxPhotos}
                  onChange={handleChange}
                  className="input-field mt-1.5"
                />
                <p className="mt-1 text-xs text-warm-400">Default: 4</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-warm-700">
                  Kapasitas (Jumlah Foto)
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  required
                  value={form.capacity}
                  onChange={handleChange}
                  className="input-field mt-1.5"
                />
                <p className="mt-1 text-xs text-warm-400">Default: 1000</p>
              </div>

              <div>
                <label htmlFor="retentionDays" className="block text-sm font-medium text-warm-700">
                  Masa Retensi (Hari)
                </label>
                <input
                  id="retentionDays"
                  name="retentionDays"
                  type="number"
                  min="1"
                  required
                  value={form.retentionDays}
                  onChange={handleChange}
                  className="input-field mt-1.5"
                />
                <p className="mt-1 text-xs text-warm-400">Default: 90</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Membuat...
              </span>
            ) : 'Buat Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
