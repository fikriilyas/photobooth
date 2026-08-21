# Photo Booth Mandiri Wedding MVP

## Keputusan Teknis

- **Framework**: Next.js (App Router)
- **Database**: SQLite (via Prisma atau Drizzle)
- **Penyimpanan foto**: Filesystem lokal (`/uploads`)
- **Deployment**: Self-hosted (Node.js server)
- **Kapasitas Event**: Dihitung berdasarkan jumlah foto
- **Branding**: Tidak diperlukan pada MVP (gunakan default sederhana)
- **Layout slideshow**: Grid
- **Masa berlaku magic link**: 5 menit
- **Masa berlaku undangan admin**: 5 menit

## Tujuan
Menyediakan photo booth berbasis web untuk tamu pernikahan. Tamu memindai QR, mengambil foto dari kamera ponsel, lalu foto dapat dikelola pengantin dan ditampilkan secara publik jika tamu mengizinkan.

## Aktor
- Event Owner
- Event Admin
- Guest
- Slideshow Viewer

## Domain
- Event
- Event Owner
- Event Admin
- Guest Session
- Photo Session
- Photo
- Guest Consent
- Public Gallery
- Event Slideshow
- Audit Record

## Fitur Event
- Membuat Event dengan nama, pasangan, tanggal mulai/selesai, zona waktu, kuota, kapasitas (jumlah foto), dan retensi.
- Status: `Draft`, `Active`, `Archived`, `Expired`.
- Satu QR unik untuk setiap Event.
- Event Owner dapat mengundang/mencabut admin dan memindahkan kepemilikan.
- Admin dapat menutup pengambilan foto lebih awal.
- Event dapat diarsipkan dan diaktifkan kembali selama masa retensi.
- Satu pasangan dapat memiliki beberapa Event terpisah.

## Alur Tamu
- Tamu membuka Event melalui QR tanpa login.
- Sistem membuat Guest Session per perangkat dengan masa aktif 24 jam.
- Nama panggilan opsional.
- Tamu dapat membuat maksimal tiga Photo Session.
- Setiap sesi menghasilkan satu sampai empat foto secara default.
- Foto diambil melalui kamera browser, dapat dipratinjau, lalu dikirim.
- Kegagalan unggah tidak mengurangi kuota.
- Tautan privat diberikan setelah pengiriman untuk akses ulang dan unduhan.

## Persetujuan Dan Privasi
- Default publikasi: tidak diizinkan.
- Consent berlaku per Photo Session.
- Pilihan: tampilkan di galeri/slideshow atau simpan privat.
- Consent menyimpan waktu, versi teks, dan Guest Session.
- Tamu dapat mencabut consent atau meminta penghapusan sesi.
- Pencabutan langsung menyembunyikan foto dari galeri/slideshow.
- Tamu bertanggung jawab atas izin orang lain yang terlihat dalam foto.
- Data tamu dibatasi pada data minimum.

## Foto Dan Moderasi
- Status foto: `Pending`, `Approved`, `Hidden`, `Deleted`.
- Foto publik wajib memiliki consent aktif dan status `Approved`.
- Admin dapat melihat, menyetujui, menyembunyikan, menghapus, memulihkan, dan memproses foto secara kelompok.
- Foto asli disimpan untuk admin; versi teroptimasi digunakan untuk tampilan.
- Foto duplikat tetap disimpan pada MVP.
- Tidak ada moderasi konten otomatis.
- Foto `Deleted` dapat dipulihkan selama masa retensi; penghapusan permanen tidak dapat dipulihkan.

## Public Gallery
- Dapat diaktifkan secara independen dari slideshow.
- Hanya menampilkan foto berizin dan `Approved`.
- Tidak terindeks mesin pencari.
- Diakses melalui slug dan token acak.
- Tidak menampilkan nama panggilan secara default.
- Menampilkan keadaan kosong yang informatif.
- Diurutkan berdasarkan waktu persetujuan terbaru.

## Event Slideshow
- Dapat diaktifkan secara independen dari galeri.
- Hanya menampilkan foto berizin dan `Approved`.
- Layout: grid foto.
- Memperbarui foto otomatis.
- Kontrol slideshow membutuhkan login admin.
- Layar tampilan menggunakan token khusus read-only.

## Akses Dan Unduhan
- Tamu dapat melihat dan mengunduh semua foto dari Guest Session.
- Admin dapat melihat dan mengunduh seluruh foto Event.
- Ekspor admin menyertakan metadata status publikasi dan consent.
- Penghapusan foto membatalkan semua tautan unduhan.
- Galeri publik dapat dibagikan oleh pemegang tautan.

## Admin Dan Keamanan
- Admin menggunakan magic link email (masa berlaku 5 menit).
- Undangan admin memiliki masa berlaku 5 menit.
- QR tamu tidak memberi akses dashboard.
- Tautan privat memakai token acak yang sulit ditebak.
- Event Owner dapat menghapus seluruh Event dengan konfirmasi eksplisit.

## Kapasitas Dan Retensi
- Dashboard menampilkan jumlah foto terpakai vs batas kapasitas.
- Saat kapasitas penuh (batas jumlah foto tercapai), unggahan baru dihentikan.
- Foto disimpan selama 90 hari setelah acara.
- Admin dapat memperpanjang retensi atau mengarsipkan Event.
- Audit disimpan selama akun dan Event masih ada tanpa salinan foto.

## Audit
Catat pelaku, tindakan, objek, dan waktu untuk:
- Moderasi foto
- Penghapusan/pemulihan foto
- Perubahan admin
- Perubahan kepemilikan
- Penghapusan Event
- Perubahan konfigurasi penting

## Kebutuhan Nonfungsional
- Web responsif/PWA ringan, tanpa aplikasi native.
- Mendukung browser modern Android dan iOS.
- Bahasa awal Bahasa Indonesia.
- Tampilan sederhana tanpa kustomisasi branding.
- Tidak mendukung mode offline pada MVP.
- Koneksi gagal harus menampilkan pesan yang jelas.

## Di Luar MVP
- Pembayaran dan langganan
- Aplikasi native
- Mode offline
- Integrasi printer
- Filter AR
- Moderasi otomatis
- Album grup lintas perangkat
- Login tamu
- Notifikasi per foto
- Integrasi media sosial
- Multi-bahasa
- Sengketa moderasi
- Pengumpulan nomor telepon tamu

## Urutan Implementasi
1. ✅ Struktur Event, akun admin, role, dan lifecycle.
2. ✅ QR Event dan Guest Session.
3. ✅ Kamera, Photo Session, unggah, kuota, dan tautan privat.
4. ✅ Consent, privasi, unduhan, dan penghapusan.
5. ✅ Dashboard admin dan moderasi.
6. ✅ Public Gallery.
7. ✅ Event Slideshow dan token layar.
8. ✅ Kapasitas, retensi, audit, dan ekspor.
9. ✅ Pengujian responsif, keamanan akses, privasi, dan alur gagal.

## Arsitektur Teknis

### Struktur Proyek
```
photo/
├── app/                    # Next.js App Router
│   ├── (guest)/           # Halaman tamu (tanpa auth)
│   │   ├── event/[eventId]/
│   │   └── session/[sessionToken]/
│   ├── (admin)/           # Dashboard admin (butuh auth)
│   │   ├── events/
│   │   └── event/[eventId]/
│   ├── (public)/          # Galeri dan slideshow publik
│   │   ├── gallery/[slug]/
│   │   └── slideshow/[token]/
│   └── api/               # API routes
├── lib/
│   ├── db/                # Database schema dan queries
│   ├── storage/           # File handling
│   ├── auth/              # Session dan token management
│   └── utils/
├── uploads/               # Direktori penyimpanan foto
│   ├── original/          # Foto asli untuk unduhan admin
│   └── optimized/         # Foto teroptimasi untuk tampilan
└── public/                # Static assets
```

### Database Schema (Prisma)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  role      Role     @default(OWNER)
  createdAt DateTime @default(now())
}

model Event {
  id              String      @id @default(cuid())
  name            String
  coupleName      String
  startDate       DateTime
  endDate         DateTime
  timezone        String
  status          EventStatus @default(DRAFT)
  qrToken         String      @unique
  maxSessions     Int         @default(3)
  maxPhotos       Int         @default(4)
  capacity        Int         @default(1000)
  retentionDays   Int         @default(90)
  galleryEnabled  Boolean     @default(false)
  slideshowEnabled Boolean    @default(false)
  gallerySlug     String?     @unique
  galleryToken    String?     @unique
  createdAt       DateTime    @default(now())
  owner           User        @relation(fields: [ownerId], references: [id])
  ownerId         String
  admins          EventAdmin[]
  guestSessions   GuestSession[]
  photos          Photo[]
  auditRecords    AuditRecord[]
}

model EventAdmin {
  id        String   @id @default(cuid())
  userId    String
  event     Event    @relation(fields: [eventId], references: [id])
  eventId   String
  invitedAt DateTime @default(now())
  joinedAt  DateTime?
  inviteToken String? @unique
  inviteExpiry DateTime?
  @@unique([userId, eventId])
}

model GuestSession {
  id            String   @id @default(cuid())
  event         Event    @relation(fields: [eventId], references: [id])
  eventId       String
  nickname      String?
  sessionToken  String   @unique
  createdAt     DateTime @default(now())
  expiresAt     DateTime
  photoSessions PhotoSession[]
}

model PhotoSession {
  id              String   @id @default(cuid())
  guestSession    GuestSession @relation(fields: [guestSessionId], references: [id])
  guestSessionId  String
  consentGiven    Boolean  @default(false)
  consentVersion  String?
  consentedAt     DateTime?
  createdAt       DateTime @default(now())
  photos          Photo[]
}

model Photo {
  id              String      @id @default(cuid())
  photoSession    PhotoSession @relation(fields: [photoSessionId], references: [id])
  photoSessionId  String
  event           Event       @relation(fields: [eventId], references: [id])
  eventId         String
  filename        String
  originalPath    String
  optimizedPath   String
  status          PhotoStatus @default(PENDING)
  approvedAt      DateTime?
  hiddenAt        DateTime?
  deletedAt       DateTime?
  createdAt       DateTime    @default(now())
}

model AuditRecord {
  id        String   @id @default(cuid())
  event     Event    @relation(fields: [eventId], references: [id])
  eventId   String
  actorId   String?
  action    String
  objectType String
  objectId  String
  metadata  String?  // JSON
  createdAt DateTime @default(now())
}

enum Role {
  OWNER
  ADMIN
}

enum EventStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  EXPIRED
}

enum PhotoStatus {
  PENDING
  APPROVED
  HIDDEN
  DELETED
}
```

### API Routes Utama
```
POST   /api/auth/magic-link          # Request magic link
POST   /api/auth/verify              # Verify magic link token
POST   /api/events                   # Create event
GET    /api/events/[id]              # Get event details
PATCH  /api/events/[id]              # Update event
DELETE /api/events/[id]              # Delete event
POST   /api/events/[id]/admins       # Invite admin
DELETE /api/events/[id]/admins/[uid] # Remove admin
POST   /api/events/[id]/guest-session # Create guest session
POST   /api/events/[id]/photos       # Upload photo
GET    /api/events/[id]/photos       # List photos (admin)
PATCH  /api/events/[id]/photos/[pid] # Update photo status
DELETE /api/events/[id]/photos/[pid] # Delete photo
GET    /api/session/[token]          # Get guest session
DELETE /api/session/[token]          # Delete guest session
PATCH  /api/session/[token]/consent  # Update consent
```

### Alur Autentikasi
1. Admin request magic link via email
2. Sistem generate token acak, simpan dengan expiry 5 menit
3. Admin klik link, token diverifikasi
4. Session cookie dibuat (HTTP-only, secure)
5. Session valid selama 7 hari

### Alur Tamu
1. Tamu scan QR → `/event/[eventId]`
2. Sistem buat GuestSession dengan token acak
3. Token disimpan di localStorage untuk akses ulang
4. Tamu ambil foto → upload ke `/api/events/[id]/photos`
5. Setelah upload, tampilkan tautan privat `/session/[token]`
6. Tamu pilih consent sebelum submit

### Alur Moderasi
1. Admin login → dashboard
2. Lihat daftar foto dengan status PENDING
3. Admin klik Approve/Hide/Delete
4. Foto APPROVED + consent aktif → tampil di galeri/slideshow
5. Perubahan real-time via polling atau WebSocket

### Penyimpanan File
```javascript
// Struktur folder
uploads/
├── original/
│   └── [eventId]/
│       └── [photoId].jpg
└── optimized/
    └── [eventId]/
        └── [photoId].webp

// Optimasi: resize max 1920px, compress untuk web
```
