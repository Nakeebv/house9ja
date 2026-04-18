# RentNaija Backend API

NestJS-based REST API for RentNaija - P2P property rental platform for Nigeria.

## Features

- ✅ JWT Authentication
- ✅ Prisma ORM
- ✅ GraphQL Ready
- ✅ Swagger Documentation
- ✅ Modular Architecture
- ✅ Production-Ready

## Getting Started

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Setup database
npm run db:migrate
npm run db:seed

# Development server
npm run dev

# API docs
http://localhost:3001/api/docs

Modules
Auth - User registration, login, JWT
Users - User management
Properties - Property listings
Admin - Admin dashboard
Chat - Real-time messaging
Payments - Payment processing
API Endpoints
Auth
POST /auth/register
POST /auth/login
Users
GET /users
GET /users/:id
PUT /users/:id
Properties
GET /properties/search
POST /properties
GET /properties/:id
PUT /properties/:id
DELETE /properties/:id
Database
PostgreSQL with Prisma ORM

Deployment
Docker ready. See docker-compose.yml for local development.