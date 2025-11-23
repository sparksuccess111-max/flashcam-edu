# FlashLearn - Interactive Flashcard Application

## Overview

FlashLearn is a full-stack flashcard learning platform built with React, TypeScript, Express, and PostgreSQL. The application enables administrators to create and manage flashcard packs while allowing students to study through an interactive card-flipping interface. The system features role-based access control, real-time synchronization via WebSockets, and a clean, modern UI built with Shadcn UI and Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript for type-safe component development
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query (React Query)** for server state management and data fetching
- **Shadcn UI + Radix UI** for accessible, pre-styled component primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Vite** as the build tool and development server

**Design System:**
- Uses Shadcn UI's "new-york" style variant
- Custom Tailwind configuration with HSL-based color system for theme consistency
- Component aliases configured for clean imports (`@/components`, `@/lib`, etc.)
- Responsive design with mobile-first breakpoints

**State Management Strategy:**
- Server state managed via TanStack Query with aggressive caching
- Authentication state stored in React Context (`AuthProvider`) with localStorage persistence
- WebSocket updates trigger automatic query invalidation for real-time UI updates
- No complex global state management needed - relies on server as source of truth

**Key UI Patterns:**
- Role-based conditional rendering (admin vs student views)
- Dialog-based forms for CRUD operations on packs and flashcards
- Card-flip interaction pattern for studying flashcards
- Progress indicators for flashcard navigation
- Toast notifications for user feedback

### Backend Architecture

**Technology Stack:**
- **Node.js** with Express for the HTTP server
- **TypeScript** throughout for type safety
- **Drizzle ORM** for database interactions
- **Neon Serverless PostgreSQL** as the database provider
- **WebSocket (ws library)** for real-time bidirectional communication
- **JWT** for stateless authentication

**Authentication & Authorization:**
- JWT-based authentication with 7-day token expiration
- Bcrypt password hashing (10 salt rounds)
- Middleware-based authorization (`authenticate`, `requireAdmin`, `optionalAuth`)
- Role-based access control (admin/student roles stored in database)
- Token stored in localStorage on client, sent via Authorization header

**API Design:**
- RESTful endpoints following resource-based naming
- Centralized validation using Zod schemas (shared between client/server)
- Consistent error handling with appropriate HTTP status codes
- Support for both authenticated and public access patterns

**Real-time Synchronization:**
- WebSocket server runs on same port as HTTP server (path: `/ws`)
- Broadcasts update events when packs or flashcards are modified
- Event types: `pack-created`, `pack-updated`, `pack-deleted`, `flashcard-created`, `flashcard-updated`, `flashcard-deleted`
- Client automatically invalidates relevant queries on receiving updates
- Enables multi-admin collaboration without manual refreshes

**Data Layer:**
- Database schema defined in TypeScript using Drizzle ORM
- Three main tables: `users`, `packs`, `flashcards`
- Cascading deletes ensure referential integrity (deleting pack removes its flashcards)
- Order fields enable custom sorting of packs and flashcards
- Published flag controls visibility to non-admin users

### Database Schema

**Tables:**

1. **users**
   - `id` (UUID primary key, auto-generated)
   - `username` (unique, required)
   - `password` (hashed with bcrypt)
   - `role` (enum: "admin" or "student")

2. **packs**
   - `id` (UUID primary key, auto-generated)
   - `title` (required)
   - `description` (optional, defaults to empty string)
   - `order` (integer for custom sorting)
   - `published` (boolean, controls student visibility)

3. **flashcards**
   - `id` (UUID primary key, auto-generated)
   - `packId` (foreign key to packs, cascading delete)
   - `question` (required)
   - `answer` (required)
   - `order` (integer for custom sorting within pack)

**Relationships:**
- One-to-many: Pack → Flashcards
- Defined using Drizzle relations for type-safe queries

**Migration Strategy:**
- Schema defined in `shared/schema.ts`
- Drizzle Kit handles migration generation
- Database URL configured via environment variable
- Seeding script creates default admin and student accounts with sample data

### Routing & Navigation

**Client Routes:**
- `/login` - Authentication page (public)
- `/` - Home page showing published packs (public/authenticated)
- `/pack/:id` - Flashcard viewer for studying (public/authenticated)
- `/admin` - Admin dashboard (admin-only, protected route)

**API Endpoints:**
- `POST /api/login` - Authentication
- `GET /api/packs` - List packs (published only for non-admins)
- `POST /api/packs` - Create pack (admin-only)
- `PATCH /api/packs/:id` - Update pack (admin-only)
- `DELETE /api/packs/:id` - Delete pack (admin-only)
- `GET /api/packs/:id/flashcards` - List flashcards in pack
- `POST /api/packs/:id/flashcards` - Create flashcard (admin-only)
- `PATCH /api/packs/:packId/flashcards/:id` - Update flashcard (admin-only)
- `DELETE /api/packs/:packId/flashcards/:id` - Delete flashcard (admin-only)

**Deployment Strategy:**
- Development: Vite dev server proxies API requests to Express
- Production: Express serves static frontend files from `/dist/public`
- Single-port deployment simplifies hosting on platforms like Replit

## External Dependencies

### Third-Party Services

**Neon Serverless PostgreSQL:**
- Cloud-hosted PostgreSQL database
- Serverless architecture with automatic scaling
- Connection via WebSocket for edge compatibility
- Configured through `DATABASE_URL` environment variable

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required for database access)
- `JWT_SECRET` - Secret key for signing JWT tokens (required for security)
- `NODE_ENV` - Environment indicator (development/production)

### Key npm Packages

**Backend:**
- `@neondatabase/serverless` - Neon database client with WebSocket support
- `drizzle-orm` - TypeScript ORM for type-safe database queries
- `drizzle-kit` - CLI for migrations and schema management
- `express` - Web server framework
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT creation and verification
- `ws` - WebSocket server implementation
- `zod` - Runtime type validation

**Frontend:**
- `@tanstack/react-query` - Server state management
- `wouter` - Lightweight routing
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod integration for form validation
- All `@radix-ui/*` packages - Unstyled accessible UI primitives
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Type-safe variant management
- `lucide-react` - Icon library

**Development:**
- `vite` - Build tool and dev server
- `typescript` - Type checking
- `@vitejs/plugin-react` - React support for Vite
- Various Replit-specific Vite plugins for development experience

### Build & Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build frontend and backend for production
- `npm start` - Run production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push schema changes to database