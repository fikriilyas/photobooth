'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const timezones = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
];

interface EventData {
  id: string;
  name: string;
  coupleName: string;
  startDate: string;
  endDate: string;
  timezone: string;
  maxSessions: number;
  maxPhotos: number;
  capacity: number;
  retentionDays: number;
  galleryEnabled: boolean;
  slideshowEnabled: boolean;
}

interface Props {
  event: EventData;
}

export function EditEventForm({ event }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState(event);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui event');
      }

      router.push(`/admin/event/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/admin/event/${event.id}`} className="back-link">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Detail Event
      </Link>
      <h1 className="page-title mt-3">Edit Event</h1>

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
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title">Tampilan Publik</h2>
          
          <div className="mt-5 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="galleryEnabled"
                checked={form.galleryEnabled}
                onChange={handleCheckboxChange}
                className="h-5 w-5 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-sm font-medium text-warm-700">Public Gallery</span>
                <p className="text-xs text-warm-400">Tampilkan galeri foto yang telah disetujui</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="slideshowEnabled"
                checked={form.slideshowEnabled}
                onChange={handleCheckboxChange}
                className="h-5 w-5 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-sm font-medium text-warm-700">Event Slideshow</span>
                <p className="text-xs text-warm-400">Aktifkan slideshow untuk layar acara</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/admin/event/${event.id}`}
            className="btn-secondary flex-1"
          >
            Batal
          </Link>
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
                Menyimpan...
              </span>
            ) : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
