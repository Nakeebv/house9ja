# RentNaija — Nigerian Rental Marketplace

A full-stack rental platform built for Nigeria. Tenants browse verified listings, chat directly with landlords, book viewings, and sign digital agreements. Landlords manage their portfolio, track leads, and negotiate with tenants in real time.

---

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend  | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Auth     | JWT (access tokens) |
| Realtime | Socket.io WebSockets |
| Images   | Cloudinary |
| Maps     | Google Maps JavaScript API |

---

## Project Structure

```
rentnaija/
├── rentnaija-frontend/   # Next.js app
│   └── src/
│       ├── app/          # Pages (Next.js App Router)
│       │   ├── (auth)/   # login, register
│       │   ├── (tenant)/ # search, property detail, dashboard, chat
│       │   ├── landlord/ # dashboard, properties, chat, leads
│       │   └── admin/    # full admin panel
│       ├── components/   # Shared UI components
│       └── lib/          # API client, services, socket, auth context
│
└── rentnaija-backend/    # NestJS API
    ├── prisma/           # Schema + migrations
    └── src/
        ├── modules/
        │   ├── auth/         # JWT auth
        │   ├── users/        # User profiles
        │   ├── properties/   # Property CRUD + search
        │   ├── chat/         # Messaging + Socket.io gateway
        │   ├── bookings/     # Viewing requests
        │   ├── favorites/    # Saved properties
        │   ├── notifications/
        │   └── admin/        # Admin controls
        └── prisma/           # Prisma service
```

---

## Quick Start

### 1. Clone and install

```bash
# Install backend dependencies
cd rentnaija-backend
npm install

# Install frontend dependencies
cd ../rentnaija-frontend
npm install
```

### 2. Set up environment variables

```bash
# Backend
cp rentnaija-backend/.env.example rentnaija-backend/.env
# → Fill in DATABASE_URL, JWT_SECRET, CLOUDINARY_* values

# Frontend
cp rentnaija-frontend/.env.example rentnaija-frontend/.env.local
# → Fill in NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_MAPS_KEY
```

### 3. Set up the database

```bash
cd rentnaija-backend
npx prisma migrate dev --name init
# Optional: seed sample data
npx ts-node prisma/seed.ts
```

### 4. Run both servers

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd rentnaija-backend
npm run start:dev

# Terminal 2 — Frontend (http://localhost:3000)
cd rentnaija-frontend
npm run dev
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Auth
```
POST /api/auth/register     → { email, phone, password, firstName, lastName, role }
POST /api/auth/login        → { email, password }
GET  /api/auth/me           → returns current user (JWT required)
```

### Properties
```
GET    /api/properties              → search with ?query=&location=&type=&minPrice=&maxPrice=&bedrooms=
GET    /api/properties/:id          → single property + landlord info
GET    /api/properties/landlord/me  → landlord's own listings (JWT)
POST   /api/properties              → create listing (JWT, landlord/agent)
PATCH  /api/properties/:id          → update (JWT, owner only)
DELETE /api/properties/:id          → soft delete (JWT, owner only)
```

### Chat
```
POST /api/chats                         → create/get conversation { propertyId, landlordId }
GET  /api/chats                         → all conversations for current user
GET  /api/chats/:id/messages            → messages (paginated)
POST /api/chats/:id/messages            → send message { content }
GET  /api/chats/unread                  → unread count

WebSocket: ws://localhost:3001/chat
  emit: join_chat(chatId)
  emit: send_message({ chatId, content })
  emit: typing(chatId)
  on:   new_message → { message object }
  on:   user_typing → { userId }
```

### Bookings
```
POST   /api/bookings                → { propertyId, date, time }
GET    /api/bookings/tenant/me      → tenant's bookings
GET    /api/bookings/landlord/me    → landlord's bookings
PATCH  /api/bookings/:id/status     → { status: APPROVED|REJECTED|RESCHEDULED }
```

### Favorites
```
POST /api/favorites/:propertyId      → toggle save/unsave
GET  /api/favorites/me               → all saved properties
GET  /api/favorites/:propertyId/check → { saved: boolean }
```

### Notifications
```
GET   /api/notifications/me          → all notifications
PATCH /api/notifications/:id/read    → mark one read
PATCH /api/notifications/mark-all-read
```

### Admin (role: ADMIN only)
```
GET    /api/admin/overview
GET    /api/admin/users?role=TENANT|LANDLORD|AGENT
PATCH  /api/admin/users/:id/suspend
GET    /api/admin/properties
PATCH  /api/admin/properties/:id/approve
PATCH  /api/admin/properties/:id/reject
GET    /api/admin/verifications
PATCH  /api/admin/verifications/:id/status  → { status: APPROVED|REJECTED }
GET    /api/admin/reports
```

---

## Required Third-Party Services

| Service | Purpose | Where to get |
|---------|---------|--------------|
| PostgreSQL | Database | [Supabase](https://supabase.com) (free) or [Railway](https://railway.app) |
| Cloudinary | Image uploads | [cloudinary.com](https://cloudinary.com) (free tier) |
| Google Maps | Property map + geocoding | [Google Cloud Console](https://console.cloud.google.com) |

---

## Deployment

### Docker (recommended)

```bash
# Build and run both services
docker-compose up --build
```

### Manual

Backend: `npm run build && npm start`  
Frontend: `npm run build && npm start`

---

## User Roles

| Role | Access |
|------|--------|
| TENANT | Browse properties, save favorites, book viewings, chat with landlords |
| LANDLORD | List properties, manage leads, chat with tenants, view bookings |
| AGENT | Same as landlord |
| ADMIN | Full platform control — users, properties, verifications, disputes |
