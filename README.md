# LEENA CEYLON — Pure Ceylon Tea

> **Main Tagline:** PURE CEYLON TEA  
> **Secondary Tagline:** THE TASTE OF CEYLON  
> **Official WhatsApp Hotline:** `+94 71 777 4717` (`071 777 4717`)  
> **Official Corporate Bank:** Commercial Bank of Ceylon PLC — Acc No: `1000 2489 7120`

A modern, mobile-first Sri Lankan tea brand showcase platform featuring **Direct WhatsApp Ordering**, **Ceylon Tea Heritage & Regional Showcase**, and a **Secure Admin Management Portal**.

---

## 🍃 Key Features

### 1. Direct WhatsApp Ordering & Inquiries
- **Single-Click Ordering**: Customers select their preferred pack size (50g, 100g, 200g, 250g, 500g, 1kg) and quantity, and click **"ORDER VIA WHATSAPP"** to launch WhatsApp Web or the WhatsApp mobile app with a pre-compiled message.
- **Direct Bank Transfer Integration**: Customers can choose **"ORDER WITH BANK TRANSFER & SEND SLIP"** to immediately open WhatsApp with the LEENA CEYLON Commercial Bank corporate account details and attach their payment slip.
- **One-Click Account Number Copy**: Convenient copy button for quick paste into Sri Lankan mobile banking apps (Commercial Bank Q+, Flash, BOC, Sampath Vishwa, etc.).

### 2. Premium Sri Lankan Brand Identity & Experience
- **Official Brand Logo**: Uses the official uploaded LEENA CEYLON logo strictly as provided without monograms, redesigns, or lions.
- **Deep Tea Color Palette**: Deep Tea Green (`#143424`), Leaf Green (`#2D6A4F`), Ceylon Warm Gold (`#C5A059`), Soft Tea Cream (`#FBFBF9`), and Dark Charcoal (`#1F2421`).
- **7 Ceylon Tea Growing Regions**: Deep educational guide to Nuwara Eliya, Dimbula, Uva, Kandy, Ruhuna, Uda Pussellawa, and Sabaragamuwa.
- **Tasting & Brewing Guides**: Step-by-step water temperature, steeping time, and leaf measurement instructions for each tea grade (BOPF, BOP, FBOP, OP).

### 3. Secure Admin Dashboard (`/admin`)
- **Dashboard Overview**: 9 metric cards, sales summaries, and stock alerts.
- **Product Management**: Searchable catalog with live inline price and stock editor, variant weights, grades, and images.
- **Category Management**: Tea Powder, Ceylon Black Tea, Premium Tin Collection, Flavored Ceylon Tea, Spices.
- **Media Library**: Upload and manage brand photography and packaging images.
- **Site Settings**: Dynamically update WhatsApp number, hotlines, bank account details, and SEO metadata without touching code.
- **Security Audit Logs**: Immutable activity logging of all administrative actions.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Client Components)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite (seamlessly switchable to PostgreSQL)
- **Security**: Jose (JWT), Bcryptjs (salted password hashing), HTTP-only cookies
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/leena-ceylon.git
cd leena-ceylon
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file (or copy `.env.example`):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="leena-ceylon-super-secure-jwt-secret-key-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER="071 777 4717"
```

### 3. Initialize & Seed Database
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Admin Credentials

- **Admin Login URL**: `http://localhost:3000/admin/login`
- **Email**: `admin@leenaceylon.com`
- **Password**: `LeenaCeylon@2026!`
- **Role**: `SUPER_ADMIN`

---

## 📦 Build for Production

```bash
npm run build
npm start
```

---

## 📄 License
© 2026 LEENA CEYLON (PVT) LTD. All rights reserved.
