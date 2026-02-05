# AIKU - Productivity & Collaboration Platform

A full-stack productivity application with daily notes, reminders, calendar, friend system, and real-time chat.

## 🚀 Features

- **📝 Daily Notes** - Rich text editor with Tiptap, tags, and sharing
- **📅 Calendar** - Monthly view with colored events and sharing
- **⏰ Reminders** - Repeating reminders (daily/weekly/monthly/yearly)
- **👥 Friends** - Add friends, accept/reject requests, online status
- **💬 Real-time Chat** - Socket.IO powered instant messaging
- **🔐 Authentication** - JWT with refresh tokens
- **👤 Role-based Access** - Admin and User roles
- **📱 Responsive** - Mobile-friendly design

## 🛠️ Tech Stack

### Backend (Node.js)
- Express.js + Prisma ORM
- PostgreSQL database
- Socket.IO for real-time
- JWT authentication
- Cloudinary for uploads
- Helmet + CORS security

### Frontend (Next.js 14)
- TypeScript + App Router
- Tailwind CSS design system
- Zustand state management
- Tiptap rich text editor
- Framer Motion animations
- Socket.IO client

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
git clone <repository-url>
cd AIKU

# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 2. Configure Environment

### 3. Setup Database

```bash
cd backend
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Run Servers

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```


## 🎨 Design System

- **Primary**: Soft blue (#6366f1)
- **Secondary**: Gray (#64748b)  
- **Accent**: Cream (#fef3c7)
- **Shadows**: Subtle soft shadows
- **Corners**: Rounded (xl, 2xl)
- **Animations**: Smooth Framer Motion

## 🚀 Deployment

### Backend (Railway/VPS)
```bash
npx prisma migrate deploy
npm start
```

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy


```

### Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Database connection error | Pastikan PostgreSQL berjalan dan DATABASE_URL benar |
| CORS error | Pastikan FRONTEND_URL di backend .env sama dengan URL frontend |
| Prisma error | Jalankan `npx prisma generate` ulang |
| Port sudah dipakai | Ganti PORT di .env atau tutup aplikasi yang menggunakan port tersebut |

## 📄 License

MIT License - feel free to use for learning or production.

---

Built with ❤️ using Next.js, Node.js, and PostgreSQL
