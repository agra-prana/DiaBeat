<div align="center">

# DiaBeat
### Platform Kesehatan & Pencegahan Diabetes Cerdas Berbasis AI

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-Ready-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

<p align="center">
  <b>DiaBeat</b> adalah aplikasi pemantauan kesehatan harian modern yang mengintegrasikan kecerdasan buatan (Gemini 2.5 Flash), kalkulasi biometrik presisi (BMR, TDEE, Net Calories, Harris-Benedict), analisis risiko diabetes, serta pencatatan aktivitas berbasis Natural Language Processing (NLP).
</p>

Developed with passion by **Agra Prana**.

</div>

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur Direktori](#-struktur-direktori)
- [Memulai (Getting Started)](#-memulai-getting-started)
  - [Prasyarat](#prasyarat)
  - [Instalasi](#instalasi)
  - [Konfigurasi Environment](#konfigurasi-environment)
  - [Menjalankan Server Dev](#menjalankan-server-dev)
  - [Build Produksi](#build-produksi)
- [Kalkulasi Biometrik & Logika Kesehatan](#-kalkulasi-biometrik--logika-kesehatan)
- [Kesiapan Database Relasional](#-kesiapan-database-relasional)
- [API Endpoints](#-api-endpoints)
- [Lisensi](#-lisensi)

---

## 🚀 Fitur Utama

- **✨ Smart Quick Add (NLP AI Extractor)**:
  Catat makanan, olahraga, durasi tidur, atau screen time hanya dengan mengetik kalimat bebas (contoh: *"Makan soto ayam 400 kalori"*, *"Lari pagi 5km 300 kkal"*). Dilengkapi **Offline Heuristic Parser** sebagai fallback instan jika tanpa koneksi internet.
- **⚡ Kalkulasi Kalori Bersih (Net Calories)**:
  Perhitungan real-time kalori masuk vs kalori terbakar dengan integrasi BMR (Basal Metabolic Rate) dan TDEE (Total Daily Energy Expenditure).
- **🩺 Analisis Risiko Diabetes & Laporan Kesehatan AI**:
  Evaluasi komprehensif gaya hidup harian menggunakan model risiko metabolisme berbasis IMT/BMI, defisit kalori, kualitas tidur, dan langkah aktif.
- **📅 Kalender Riwayat Berbasis Tanggal Nyata (`YYYY-MM-DD`)**:
  Menyimpan dan mengagregasi data historis secara akurat per tanggal kalender dengan fungsionalitas CRUD lengkap.
- **🎨 Desain Clean Dark Mode (Zero-Neon)**:
  Tampilan modern, elegan, responsif mobile-first, bebas dari efek pendaran neon blur yang melelahkan mata.
- **🛡️ Database-Ready Architecture**:
  Pola *Repository Service Layer* yang saat ini persisten di LocalStorage dan siap dihubungkan langsung ke PostgreSQL / Prisma / Supabase tanpa merombak UI.

---

## 🏗️ Arsitektur Sistem

```mermaid
graph TD
    Client[Next.js 16 App Router UI] --> AppContext[Global State & Auth Provider]
    AppContext --> StorageService[Storage & Repository Layer]
    
    StorageService --> LocalStorage[(Browser LocalStorage Cache)]
    StorageService -.-> FutureDB[(PostgreSQL / Supabase / Prisma DB)]
    
    Client --> HealthEngine[Biometric Calculation Engine]
    HealthEngine --> BMR[Harris-Benedict BMR & TDEE]
    HealthEngine --> DiabetesRisk[Diabetes Metabolic Risk Model]
    
    Client --> GeminiService[Gemini AI / Server API]
    GeminiService --> ServerRoute[/api/ai Route]
    GeminiService --> OfflineParser[Heuristic NLP Fallback Parser]
```

---

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi / Library | Keterangan |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | SSR, CSR, API Routes, Turbopack |
| **Core UI** | React 19 | State, Hooks, Context API |
| **Styling** | Tailwind CSS 3.4 & PostCSS | Clean modern dark-theme |
| **Icons** | Lucide React | Modern SVG icons |
| **AI Integration** | Google Gemini 2.5 Flash | Structured JSON prompt extraction |
| **ORM Schema** | Prisma | Schema definitions for PostgreSQL/Supabase |

---

## 📂 Struktur Direktori

```text
FIT+/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/ai/route.js     # Server-side Gemini AI proxy route
│   │   ├── globals.css         # Tailwind & custom keyframe styling
│   │   ├── layout.jsx          # Root application layout
│   │   └── page.jsx            # Main page & view orchestrator
│   ├── components/
│   │   ├── auth/               # IntroScreen & AuthScreen
│   │   ├── calendar/           # CalendarScreen (Date history & stats)
│   │   ├── dashboard/          # HomeScreen (Metrics, Hero Net Calories)
│   │   ├── layout/             # BottomNavigation
│   │   ├── logs/               # Activity, Diet, Sleep, ScreenTime Screens
│   │   └── modals/             # QuickAddModal, HealthReportModal, ProfileModal
│   ├── context/
│   │   └── AppContext.jsx      # Global React Context & Data Hydration
│   ├── db/
│   │   └── schema.prisma       # Database relational schema ready for SQL
│   └── services/
│       ├── gemini.js           # AI extraction & offline heuristic parser
│       ├── healthEngine.js     # Biometric calculations (BMR, TDEE, Risk)
│       └── storage.js          # Repository service layer
├── .env.example                # Environment variables template
├── jsconfig.json               # Path alias mapping (@/*)
├── next.config.mjs             # Next.js configuration
├── package.json                # Project dependencies & scripts
├── tailwind.config.js          # Tailwind CSS configuration
└── README.md                   # Project documentation
```

---

## 🏁 Memulai (Getting Started)

### Prasyarat
- **Node.js**: `v18.18.0` atau versi lebih tinggi
- **npm** atau **pnpm** / **yarn**

### Instalasi
1. Clone repositori ke komputer Anda:
   ```bash
   git clone https://github.com/your-username/diabeat.git
   cd diabeat
   ```
2. Pasang semua dependensi:
   ```bash
   npm install
   ```

### Konfigurasi Environment
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka file `.env` dan isi kunci API Google Gemini Anda:
```env
# Gemini API Key untuk Next.js
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
GEMINI_API_KEY=AIzaSy...
```

> 💡 *Dapatkan kunci API gratis di [Google AI Studio](https://aistudio.google.com/).*

### Menjalankan Server Dev
Jalankan server lokal:
```bash
npm run dev
```
Buka browser dan navigasikan ke [http://localhost:3000](http://localhost:3000).

### Build Produksi
Untuk memvalidasi dan mem-build bundle produksi:
```bash
npm run build
npm run start
```

---

## 🧮 Kalkulasi Biometrik & Logika Kesehatan

1. **BMR (Basal Metabolic Rate)**:
   Menggunakan formula Harris-Benedict yang disempurnakan oleh Roza & Shizgal:
   $$\text{BMR}_{\text{Pria}} = 88.362 + (13.397 \times W) + (4.799 \times H) - (5.677 \times A)$$
   $$\text{BMR}_{\text{Wanita}} = 447.593 + (9.247 \times W) + (3.098 \times H) - (4.330 \times A)$$
2. **Net Calories**:
   $$\text{Net Calories} = \sum \text{Kalori Makanan (Diet)} - \sum \text{Kalori Terbakar (Aktivitas)}$$
3. **Kebutuhan Air Harian**:
   $$\text{Target Air (L)} = (\text{Berat (kg)} \times 0.035) + \left(\frac{\text{Kalori Terbakar}}{500} \times 0.35\right)$$

---

## 🗄️ Kesiapan Database Relasional

Skema Prisma telah disediakan di [`src/db/schema.prisma`](file:///Users/abibhaskara/Downloads/FIT+/src/db/schema.prisma) untuk mendukung relasi tabel:
- `User` 1-ke-1 dengan `Profile`
- `User` 1-ke-Banyak dengan `ActivityLog`, `DietLog`, `SleepLog`, `ScreenTimeLog`, dan `DailyInsight`.

Untuk menyambungkan database PostgreSQL / Supabase di masa mendatang:
```bash
npx prisma generate
npx prisma db push
```

---

## 🌐 API Endpoints

### `POST /api/ai`
Proxy server-side untuk memproses prompt Gemini AI secara aman tanpa mengekspos API key di client.

**Request Body:**
```json
{
  "prompt": "Analisis data makanan...",
  "userContext": "Nama: Agra Prana, Usia: 24, Berat: 70kg"
}
```

**Response:**
```json
{
  "result": "{ \"score\": 88, \"risk\": \"Rendah\", \"analysis\": \"...\" }"
}
```

---

## 👨‍💻 Pengembang

Aplikasi ini dirancang dan dikembangkan secara independen oleh:
- **Agra Prana** — *Lead Developer & Creator of DiaBeat*

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi **MIT**. Silakan gunakan dan kembangkan untuk tujuan edukasi dan kesehatan masyarakat.
