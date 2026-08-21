'use client';

import { useState, useEffect } from 'react';

interface Props {
  eventId: string;
  qrUrl: string;
}

export function QRCodeDisplay({ eventId, qrUrl }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQR() {
      try {
        const res = await fetch(`/api/events/${eventId}/qr`);
        if (res.ok) {
          const data = await res.json();
          setQrCode(data.qrCode);
        }
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQR();
  }, [eventId]);

  function handleDownload() {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.download = `qr-event-${eventId}.png`;
    link.href = qrCode;
    link.click();
  }

  return (
    <div className="card p-6">
      <h2 className="section-title">QR Code</h2>
      <p className="mt-1 text-sm text-warm-500">
        Scan QR ini untuk membuka photo booth
      </p>
      
      <div className="mt-5 flex justify-center">
        {loading ? (
          <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-warm-50">
            <svg className="h-6 w-6 animate-spin text-warm-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : qrCode ? (
          <div className="rounded-xl border-2 border-warm-100 p-3 bg-white">
            <img src={qrCode} alt="QR Code" className="h-60 w-60" />
          </div>
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-warm-50">
            <p className="text-sm text-warm-400">Gagal memuat QR</p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <button
          onClick={handleDownload}
          disabled={!qrCode || loading}
          className="btn-primary w-full"
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download QR Code
        </button>
        <div className="rounded-lg bg-warm-50 p-3">
          <p className="text-xs text-warm-500 break-all font-mono">{qrUrl}</p>
        </div>
      </div>
    </div>
  );
}
