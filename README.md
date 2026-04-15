# 📦 Material Request System — United Transworld

![REACT](https://img.shields.io/badge/⚛%20REACT-18.x-61DAFB?style=flat-square&labelColor=20232A)
![TYPESCRIPT](https://img.shields.io/badge/TS%20TYPESCRIPT-5.x-3178C6?style=flat-square&labelColor=1a1a2e)
![VITE](https://img.shields.io/badge/⚡%20VITE-6.x-646CFF?style=flat-square&labelColor=1a1a2e)
![FIREBASE](https://img.shields.io/badge/🔥%20FIREBASE-AUTH%20%2B%20FIRESTORE-FFCA28?style=flat-square&labelColor=1a1a2e)
![RADIX UI](https://img.shields.io/badge/%20RADIX%20UI-READY-8B5CF6?style=flat-square&labelColor=1a1a2e)
![RECHARTS](https://img.shields.io/badge/📊%20RECHARTS-2.x-22D3EE?style=flat-square&labelColor=1a1a2e)

**Material Request System** adalah platform web full-stack untuk manajemen pengajuan material dan peralatan secara digital, dibangun untuk **PT United Transworld Technologies** (UTT). Sistem ini mendigitalisasi seluruh alur pengajuan — mulai dari **Project Manager** yang membuat request, melalui rantai approval multi-level oleh **PMO**, **Sales/Pre-Sales**, **Purchasing**, hingga **BOD** — secara real-time dengan antarmuka dark-mode premium dan keamanan berbasis **Firebase Authentication** serta **Role-Based Access Control (RBAC)**.

> ⚠️ **Repository ini bersifat private.** Seluruh credentials, API keys, dan konfigurasi sensitif dikecualikan dari version control melalui `.gitignore` dan dikelola via environment variables.

---

## 🏗️ Tech Stack

| Layer                  | Technology                | Keterangan                                    |
| ---------------------- | ------------------------- | --------------------------------------------- |
| **Frontend Framework** | React 18 + TypeScript     | UI berbasis komponen dengan type safety penuh  |
| **Build Tool**         | Vite 6                    | Fast HMR, optimized production build           |
| **Styling**            | TailwindCSS + Radix UI    | Utility-first CSS + accessible primitives      |
| **Component System**   | shadcn/ui (Radix-based)   | Design system konsisten dengan CVA             |
| **Backend & Auth**     | Firebase Auth + Firestore | Real-time database + authentication            |
| **Hosting**            | Firebase Hosting + Vercel | Dual deployment support                        |
| **Charts**             | Recharts 2.x              | Finance dashboard visualisasi data             |
| **Forms**              | React Hook Form 7         | Form management performa tinggi                |
| **API Layer**          | Hono                      | Lightweight server framework                   |
| **Date Picker**        | React Day Picker           | Kalender interaktif                           |
| **Notifications**      | Sonner                    | Toast notification system                      |

---

## 🚀 Fitur Utama

### 📋 Alur Pengajuan Material (Multi-Stage Workflow)

Sistem mengimplementasikan alur approval hierarkis yang terstruktur:

```text
Project Manager → PMO Review → Sales Verification → Purchasing Pricing → BOD Final Approval → Purchasing Processing → Delivery → PM Confirmation
```

- **Procurement**: Alur penuh termasuk pricing dan BOD approval
- **Borrowing**: Alur dipersingkat (skip pricing, langsung ke BOD)
- Setiap tahap mendukung **remark/catatan** dari approver
- Rejection dapat dilakukan di setiap stage dengan mandatory reason

### 📦 BOQ Management (Bill of Quantities)

- Sales/Pre-Sales dapat mendaftarkan item BOQ per proyek
- Project Manager dapat membuat request langsung dari item BOQ yang tersedia
- Sistem otomatis tracking `totalQuantity`, `usedQuantity`, dan `remainingQuantity`
- Deduction quantity dilakukan saat request disetujui; rollback otomatis jika ditolak

### 💰 Purchasing Recommendations

- Purchasing dapat menambahkan **multiple rekomendasi vendor** per request
- Setiap rekomendasi mencantumkan: jenis barang, estimasi tiba, harga satuan/total, dan payment terms
- BOD memilih rekomendasi terbaik saat melakukan final approval

### 📊 Finance Dashboard

- Visualisasi total spending, rekapitulasi request, dan tren bulanan via Recharts
- Filter berdasarkan status, proyek, dan rentang waktu

### 📁 File Attachments

- Project Manager dapat melampirkan dokumen pendukung (PDF, DOCX, XLSX) saat membuat request
- Purchasing dapat mengupload **bukti pembelian** (foto/image) setelah transaksi

### 📦 Delivery & Return Management

- Purchasing mencatat delivery proof beserta foto pengiriman
- PM melakukan konfirmasi penerimaan barang secara digital
- Sistem **Return to Central**: PM dapat mengajukan pengembalian item dengan foto kondisi barang
- Purchasing dapat accept/reject return dengan catatan dan foto

### 🔔 Real-time Notifications

- In-app toast notifications untuk setiap perubahan status request
- Notifikasi disesuaikan per role (hanya notifikasi yang relevan ditampilkan)
- Online/offline detection dengan informasi koneksi

---

## 👥 Role & Akses

| Role                  | Deskripsi Akses                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **Project Manager**   | Membuat request (manual / dari BOQ), tracking status request sendiri, konfirmasi delivery, request return |
| **PMO**               | Review & approve/reject request pertama, manage user approval, lihat semua request                       |
| **Sales / Pre-Sales** | Verifikasi request, manage proyek & BOQ, update availability material                                    |
| **Purchasing**        | Input pricing, buat rekomendasi vendor, proses delivery, upload bukti pembelian, handle returns           |
| **BOD Finance**       | Final approval dengan pemilihan rekomendasi Purchasing                                                   |
| **BOD Procurement**   | Final approval dengan pemilihan rekomendasi Purchasing                                                   |
| **BOD Director**      | Final approval dengan pemilihan rekomendasi Purchasing                                                   |
| **Admin**             | Full access via Firebase Console (approval akun, manage data)                                            |

---

## 🔐 Keamanan & Autentikasi

- **Firebase Authentication** — email/password-based login
- **Firestore Security Rules** — akses data dikontrol ketat di server-side berdasarkan role dan approval status
- **Approval System** — akun baru harus disetujui Admin/PMO sebelum bisa login
- **RBAC** — setiap operasi CRUD divalidasi berdasarkan role aktif user
- **Environment Variables** — semua credentials disimpan di `.env` (tidak di-commit ke repository)

---

## 🗂️ Struktur Proyek

```text
utt-request/
├── src/
│   ├── components/
│   │   ├── pages/          # Halaman per role & fitur
│   │   │   ├── PMDashboard.tsx
│   │   │   ├── ApprovalsPage.tsx
│   │   │   ├── BOQManagement.tsx
│   │   │   ├── FinanceDashboard.tsx
│   │   │   ├── HandleReturnsPage.tsx
│   │   │   └── ...
│   │   └── ui/             # Reusable UI primitives
│   ├── lib/
│   │   ├── firebaseAuth.ts      # Auth logic
│   │   ├── firebaseRequests.ts  # Request CRUD & real-time
│   │   ├── firebaseProjects.ts  # Project management
│   │   └── firebaseBOQ.ts       # BOQ management
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces & types
│   ├── App.tsx             # Root component & routing logic
│   └── main.tsx
├── .env.example            # Template environment variables
├── firebase.json           # Firebase hosting config
├── vercel.json             # Vercel deployment config
└── vite.config.ts
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x
- Firebase project (Auth + Firestore diaktifkan)

### 1. Clone & Install

```bash
git clone <repository-url>
cd utt-request
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
```

Isi `.env` dengan kredensial Firebase project Anda:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan tersedia di `http://localhost:3000`

### 4. Build Production

```bash
npm run build
```

---

## 🚢 Deployment

### Firebase Hosting

```bash
firebase deploy --only hosting
```

### Vercel

Connect repository ke Vercel, set environment variables melalui dashboard Vercel, kemudian deploy otomatis via push ke `main`.

---

## 📄 Lisensi

Proyek ini dikembangkan secara internal untuk **PT United Transworld Technologies**. Seluruh hak cipta dilindungi. Tidak untuk didistribusikan secara publik tanpa izin tertulis dari pemilik proyek.

---

Built with ❤️ for PT United Transworld Technologies • Internal Use Only