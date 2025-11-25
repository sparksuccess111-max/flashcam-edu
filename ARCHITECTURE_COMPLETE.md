# FlashCamEdu - Documentation Technique Complète

## 1. STRUCTURE DE DOSSIERS

```
flashcamedu/
├── client/                          # Application frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Composants Shadcn/UI (44 fichiers)
│   │   │   ├── PackDialog.tsx       # Dialogue création/édition des packs
│   │   │   ├── FlashcardDialog.tsx  # Dialogue des flashcards
│   │   │   ├── FlashcardManager.tsx # Gestionnaire principal des flashcards
│   │   │   ├── BulkImportDialog.tsx # Import en masse des flashcards
│   │   │   └── Header.tsx           # En-tête de l'app
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Page de connexion
│   │   │   ├── Signup.tsx           # Page d'inscription
│   │   │   ├── Home.tsx             # Accueil (étudiants)
│   │   │   ├── TeacherDashboard.tsx # Tableau de bord des professeurs
│   │   │   ├── AdminDashboard.tsx   # Tableau de bord des admins
│   │   │   ├── AdminFlashcards.tsx  # Gestion des flashcards (admin)
│   │   │   ├── TeacherFlashcards.tsx# Gestion des flashcards (prof)
│   │   │   ├── PackView.tsx         # Vue détaillée d'un pack
│   │   │   ├── Messages.tsx         # Page de messagerie
│   │   │   └── not-found.tsx        # Page 404
│   │   ├── hooks/
│   │   │   ├── use-toast.ts         # Hook toast notifications
│   │   │   ├── use-mobile.tsx       # Hook détection mobile
│   │   │   └── useNavigationHistory.ts # Hook historique navigation
│   │   ├── lib/
│   │   │   ├── auth-context.tsx     # Context d'authentification
│   │   │   ├── notification-context.tsx # Context des notifications
│   │   │   ├── queryClient.ts       # Configuration TanStack Query
│   │   │   ├── websocket.tsx        # Client WebSocket
│   │   │   └── utils.ts             # Utilitaires
│   │   ├── App.tsx                  # Composant racine avec routing
│   │   ├── main.tsx                 # Point d'entrée React
│   │   └── index.css                # Styles globaux + CSS variables
│   ├── index.html                   # Template HTML
│   └── public/
│       └── favicon.png
│
├── server/                          # Application backend Express
│   ├── middleware/
│   │   └── auth.ts                  # Middleware JWT & autorisation
│   ├── utils/
│   │   └── normalize.ts             # Utilitaires de normalisation
│   ├── app.ts                       # Configuration Express (157 lignes)
│   ├── index-dev.ts                 # Point d'entrée dev (Vite HMR)
│   ├── index-prod.ts                # Point d'entrée production
│   ├── db.ts                        # Configuration Drizzle & PostrgreSQL
│   ├── routes.ts                    # Routes API complètes
│   ├── storage.ts                   # Interface stockage en mémoire
│   ├── logger.ts                    # Système de logging
│   └── seed.ts                      # Données de seed initiales
│
├── shared/                          # Code partagé frontend/backend
│   └── schema.ts                    # Schémas Drizzle + Zod (130 lignes)
│
├── migrations/                      # Migrations Drizzle (auto-générées)
│   └── *.sql
│
├── dist/                            # Build de production
│   ├── index.js                     # Serveur bundlé
│   └── public/                      # Assets frontend compilés
│
├── logs/
│   └── server.log                   # Logs du serveur
│
├── attached_assets/                 # Assets importés par l'utilisateur
│
├── CONFIGURATION FILES
├── package.json                     # Dépendances & scripts npm
├── tsconfig.json                    # Configuration TypeScript
├── vite.config.ts                   # Configuration Vite (Bundler)
├── tailwind.config.ts               # Configuration Tailwind CSS
├── postcss.config.js                # Configuration PostCSS
├── drizzle.config.ts                # Configuration Drizzle ORM
├── components.json                  # Config Shadcn
├── replit.md                        # Métadonnées du projet
└── ping.js                          # Script keep-alive auto-restart
```

---

## 2. FICHIERS OBLIGATOIRES

### 2.1 Configuration de Base
| Fichier | Rôle | Éditable ? |
|---------|------|-----------|
| `package.json` | Dépendances & scripts | ❌ Non |
| `tsconfig.json` | Configuration TypeScript | ✅ Oui (avancé) |
| `vite.config.ts` | Bundler frontend | ❌ Non (Replit) |
| `.env` ou `DATABASE_URL` | Chaîne connexion DB | ✅ Via secrets |

### 2.2 Structure Backend
| Fichier | Dépendant de | Description |
|---------|-------------|-------------|
| `server/app.ts` | Express, logger | Initialisation Express (middlewares globaux) |
| `server/db.ts` | `DATABASE_URL` | Client Drizzle + PostgreSQL |
| `server/routes.ts` | Tous les autres | **❌ FICHIER CRITIQUE** - Toutes les routes API |
| `server/storage.ts` | `schema.ts` | Interface CRUD en mémoire |
| `server/middleware/auth.ts` | jsonwebtoken, bcrypt | JWT + role-based access |
| `server/logger.ts` | - | Logging structuré |
| `shared/schema.ts` | drizzle-orm, zod | **❌ FICHIER CRITIQUE** - Modèle de données |

### 2.3 Structure Frontend
| Fichier | Rôle |
|---------|------|
| `client/src/App.tsx` | Routeur wouter principal |
| `client/src/main.tsx` | Point d'entrée React |
| `client/src/index.css` | Styles globaux + CSS variables |
| `client/src/lib/auth-context.tsx` | État utilisateur authentifié |
| `client/src/lib/queryClient.ts` | Configuration TanStack Query |

---

## 3. DÉPENDANCES CRITIQUES

### 3.1 Production Dependencies (82 packages)

#### Backend Core
- **express** (4.21.2) - Framework serveur
- **postgres** (3.4.7) - Client PostgreSQL
- **drizzle-orm** (0.39.1) - ORM TypeScript
- **jsonwebtoken** (9.0.2) - JWT authentication
- **bcrypt** (6.0.0) - Password hashing
- **zod** (3.24.2) - Validation schémas

#### Frontend Core
- **react** (18.3.1) - Framework UI
- **react-dom** (18.3.1) - Rendu DOM
- **wouter** (3.3.5) - Routeur léger
- **@tanstack/react-query** (5.60.5) - State management serveur

#### UI Components (Radix UI + Shadcn)
- **44 packages @radix-ui/** - Primitives accessibles
- **tailwindcss** (3.4.17) - Framework CSS utilitaire
- **lucide-react** (0.453.0) - Icônes SVG
- **react-icons** (5.4.0) - Logos (SI)
- **framer-motion** (11.13.1) - Animations

#### Forms & Validation
- **react-hook-form** (7.55.0) - Gestion formulaires
- **@hookform/resolvers** (3.10.0) - Intégration Zod
- **drizzle-zod** (0.7.0) - Schémas Zod depuis Drizzle

#### Data Export
- **jspdf** (3.0.4) - Export PDF
- **recharts** (2.15.2) - Graphiques

#### Utilities
- **date-fns** (3.6.0) - Manipulation dates
- **clsx** (2.1.1) - Classnames conditionnel
- **tailwind-merge** (2.6.0) - Fusion Tailwind classes
- **ws** (8.18.3) - WebSocket

### 3.2 Dev Dependencies (15 packages)

#### Tooling
- **tsx** (4.20.5) - Exécution TypeScript
- **vite** (5.4.20) - Bundler production
- **esbuild** (0.25.0) - Minification JS
- **typescript** (5.6.3) - Compilateur TS

#### Dev Plugins
- **@replit/vite-plugin-cartographer** - Replit dev tools
- **@replit/vite-plugin-dev-banner** - Replit dev banner
- **@replit/vite-plugin-runtime-error-modal** - Replit error display

#### Styling & CSS
- **tailwindcss** (dev, 3.4.17)
- **@tailwindcss/vite** (4.1.3) - Plugin Vite
- **@tailwindcss/typography** - Plugin typographie
- **autoprefixer** (10.4.20) - Préfixes CSS
- **postcss** (8.4.47) - Processeur CSS

#### Types
- **@types/node** (20.16.11)
- **@types/express** (4.17.21)
- **@types/react** (18.3.11)
- **@types/ws** (8.18.1)
- Et 5 autres...

#### Drizzle
- **drizzle-kit** (0.31.4) - CLI migrations

### 3.3 Package Management
- **npm** ✅ (par défaut Replit)
- **yarn** ou **bun** ❌ (non utilisé)

---

## 4. SCRIPTS DE LANCEMENT

### 4.1 Scripts disponibles

```json
{
  "dev": "NODE_ENV=development tsx server/index-dev.ts",
  "build": "vite build && esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js",
  "start": "NODE_ENV=production node dist/index.js",
  "check": "tsc",
  "db:push": "drizzle-kit push"
}
```

### 4.2 Processus de Démarrage

#### **Développement** (`npm run dev`)
1. `tsx` charge `server/index-dev.ts`
2. `index-dev.ts` appelle `runApp(setupVite)`
3. `setupVite()` initialise Vite en mode middleware
   - Chaud rechargement (HMR) activé
   - Template `client/index.html` rechargé à chaque changement
4. `runApp()` dans `app.ts`:
   - Lance `registerRoutes()` → Serveur HTTP créé
   - Écoute sur `0.0.0.0:5000`
   - Lance `ping.js` en processus enfant auto-restart
5. Application accessible à `http://localhost:5000`

#### **Production** (`npm run build && npm run start`)
1. `npm run build`:
   - Vite compile `client/src/**` → `dist/public/`
   - esbuild bundle `server/index-prod.ts` → `dist/index.js`
2. `npm run start`:
   - `NODE_ENV=production node dist/index.js`
   - Pas de Vite, assets statiques servis depuis `dist/public/`

### 4.3 Port & Binding
- **Port**: `process.env.PORT` ou défaut `5000`
- **Host**: `0.0.0.0` (écoute toutes interfaces)
- **Seul port non-firewallé**: 5000

---

## 5. CONFIGURATION DU SERVEUR

### 5.1 Express Middleware Stack (app.ts)

```
1. express.json({ verify: rawBody capture })
   ↓
2. express.urlencoded({ extended: false })
   ↓
3. Logging middleware (durée + statut)
   ↓
4. registerRoutes() - Routes API
   ↓
5. Vite middleware (dev) ou Static files (prod)
   ↓
6. Error handler middleware (500 errors)
```

### 5.2 Routes API (routes.ts)

#### Authentification
- `POST /api/login` - Connexion (JWT généré)
- `POST /api/signup` - Inscription (demande de compte)
- `GET /api/me` - Utilisateur actuel
- `POST /api/logout` - Déconnexion

#### Gestion des Utilisateurs (Admin)
- `GET /api/admin/users` - Liste tous les utilisateurs
- `PATCH /api/admin/users/:userId` - Modifier utilisateur
- `POST /api/admin/approve/:requestId` - Approuver inscription
- `DELETE /api/admin/users/:userId` - Supprimer utilisateur

#### Packs de Flashcards
- `GET /api/packs` - Liste packs (filtrés par rôle)
- `GET /api/packs/:id` - Détails d'un pack
- `POST /api/packs` - Créer pack (prof/admin uniquement)
- `PATCH /api/packs/:id` - Modifier pack
- `DELETE /api/packs/:id` - Supprimer pack
- `PATCH /api/packs/:id` (publish toggle) - Publier/brouillon
- `GET /api/packs/:id/export` - Export TXT flashcards

#### Flashcards
- `GET /api/packs/:id/flashcards` - Lister flashcards d'un pack
- `POST /api/packs/:id/flashcards` - Créer flashcard
- `PATCH /api/packs/:id/flashcards/:cardId` - Modifier flashcard
- `DELETE /api/packs/:id/flashcards/:cardId` - Supprimer flashcard
- `PATCH /api/packs/:id/flashcards/:cardId/reorder` - Réordonner

#### Messagerie
- `GET /api/messages` - Messages reçus
- `POST /api/messages` - Envoyer message
- `PATCH /api/messages/:id/read` - Marquer comme lu
- `GET /api/users/online` - Utilisateurs en ligne (WebSocket)

### 5.3 Middleware d'Authentification (middleware/auth.ts)

```typescript
// JWT Signature
- generateToken(user) → Crée JWT avec userId, role, subject

// Validation Routes
- authenticate → Vérifie JWT présent (401 si absent)
- requireAdmin → authenticate + vérifie role==="admin"
- requireTeacherOrAdmin → authenticate + role in ["admin", "teacher"]
- optionalAuth → Peut avoir JWT ou non
```

### 5.4 WebSocket (routes.ts)
- `ws://` endpoint pour messagerie temps-réel
- Broadcast de mises à jour: créations/modifications packs
- Events: `pack-created`, `message-received`

---

## 6. VARIABLES D'ENVIRONNEMENT

### 6.1 Variables CRITIQUES

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `DATABASE_URL` | string | Connection PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | enum | Mode exécution | `development` \| `production` |
| `PORT` | number | Port d'écoute | `5000` (défaut) |

### 6.2 Env Frontend (Vite)

Préfixe: `VITE_` (pour accès via `import.meta.env`)

```javascript
// Accessible côté client
import.meta.env.VITE_API_URL  // http://localhost:5000
import.meta.env.VITE_MODE     // dev ou prod
```

### 6.3 Secrets (Non-variables d'env)

| Secret | Usage | Source |
|--------|-------|--------|
| JWT_SECRET | Signature des tokens | ❌ Non utilisé - secret implicite |
| Aucun autre | - | - |

**Note**: Le code utilise `jsonwebtoken.sign()` sans secret explicite = risque de sécurité en prod ⚠️

### 6.4 Configuration via .env.local (Replit)

Replit injecte automatiquement:
- `DATABASE_URL` (Neon PostgreSQL)
- `PORT` (5000)
- `NODE_ENV` (défini par script)

---

## 7. GESTION DE LA BASE DE DONNÉES

### 7.1 Schéma Drizzle (shared/schema.ts)

#### Tables

**users** (7 colonnes)
```typescript
id: varchar → UUID (gen_random_uuid())
firstName: text UNIQUE → Normalisation du nom
lastName: text
password: text → Hashé bcrypt (10 rounds)
role: enum ['admin', 'teacher', 'student']
subject: enum 8 matières (nullable)
```

**accountRequests** (5 colonnes)
```typescript
id: varchar → UUID
firstName, lastName, password
requestedRole: enum
status: enum ['pending', 'approved', 'rejected']
```

**packs** (6 colonnes)
```typescript
id: varchar → UUID
title, description: text
order: integer
published: boolean
subject: enum 8 matières (NOT NULL)
createdByUserId: varchar → FK users.id (ON DELETE SET NULL)
```

**flashcards** (4 colonnes)
```typescript
id: varchar → UUID
packId: varchar → FK packs.id (ON DELETE CASCADE)
question, answer: text
order: integer
```

**messages** (5 colonnes)
```typescript
id: varchar → UUID
fromUserId: varchar → FK users.id (CASCADE)
toUserId: varchar → FK users.id (CASCADE)
content: text
createdAt: text (default now())
read: boolean
```

**messageReads** (3 colonnes)
```typescript
id: varchar → UUID
messageId: varchar → FK
userId: varchar → FK
readAt: text (default now())
```

### 7.2 Relations & Cascades

```
users (1) ─── (N) packs
users (1) ─── (N) messages (fromUserId)
users (1) ─── (N) messages (toUserId)

packs (1) ─── (N) flashcards (CASCADE DELETE)

messages (1) ─── (N) messageReads (CASCADE DELETE)
users (1) ─── (N) messageReads (CASCADE DELETE)
```

### 7.3 Initialisation & Migrations

#### Configuration (drizzle.config.ts)
```typescript
{
  out: "./migrations",          // Dossier migrations générées
  schema: "./shared/schema.ts", // Source du schéma
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
}
```

#### Commandes
```bash
# Pousser migrations en dev
npm run db:push

# Générer migration (inspect les changements)
npx drizzle-kit generate

# Forcer la synchronisation (détruit/recrée si nécessaire)
npm run db:push --force
```

#### Seed Données (server/seed.ts)
- Admin par défaut: "Camille Cordier" / "CaMa_39.cAmA"
- Rôles: admin, teacher, student
- Matières: 8 options disponibles

### 7.4 Stockage en Mémoire (server/storage.ts)

**IMPORTANT**: L'application utilise une interface de **stockage en mémoire** (`MemStorage`) pour le développement
- Données **perdues au redémarrage**
- À remplacer par vraie DB pour production
- Implémente: `getAllUsers()`, `createPack()`, `getFlashcards()`, etc.

---

## 8. FLUX DE DONNÉES

### 8.1 Authentification

```
Frontend (Login.tsx)
  ↓ [POST /api/login]
Backend (routes.ts)
  ├─ Valider credentials (Zod)
  ├─ Trouver utilisateur (normalizeName)
  ├─ Comparer password (bcrypt.compare)
  ├─ Générer JWT (jsonwebtoken.sign)
  ↓ [JWT token]
Frontend (Auth Context)
  ├─ localStorage.setItem("token", jwt)
  ├─ setState({ user, isAuthenticated })
  ├─ Redirect à dashboard (selon rôle)
```

### 8.2 Fetch de Données

```
Frontend (useQuery)
  ↓ [GET /api/packs]
Backend
  ├─ Vérifie JWT (middleware authenticate)
  ├─ Récupère rôle utilisateur
  ├─ Filtre packs:
  │  ├─ Admin: tous
  │  ├─ Teacher: ses packs dans sa matière
  │  ├─ Student: seulement publiés
  ↓ [JSON]
Frontend
  ├─ TanStack Query cache
  ├─ Render composants
```

### 8.3 Mutations (POST/PATCH/DELETE)

```
Frontend (Form)
  ↓ handleSubmit
Frontend (Mutation)
  ├─ apiRequest("POST", url, data)
  ├─ Ajoute header Authorization: Bearer {jwt}
  ↓ [POST /api/packs]
Backend
  ├─ Middleware auth
  ├─ Valide body (Zod schema)
  ├─ Stockage opération
  ├─ WebSocket broadcast (pack-created)
  ↓ [201 + JSON]
Frontend
  ├─ Toast succès
  ├─ Invalide queryKey cache
  ├─ useQuery re-fetch automatique
  ├─ UI mise à jour
```

---

## 9. POINTS DE SÉCURITÉ CLÉS

### 9.1 Authentification
- ✅ Passwords hashés bcrypt (10 rounds)
- ✅ JWT tokens stockés localStorage
- ✅ CORS Headers implicite
- ❌ Pas de refresh token (expiration infinie)
- ❌ JWT_SECRET non défini (utilise défaut jsonwebtoken)

### 9.2 Autorisation
- ✅ Middleware role-based (`requireAdmin`, `requireTeacher`)
- ✅ Vérification subject pour professors
- ✅ Requêtes non-authentifiées autorisées (optionalAuth)
- ✅ Cascading deletes configurés

### 9.3 Validation
- ✅ Zod schemas sur tous endpoints
- ✅ Type-safe avec TypeScript strict
- ✅ Pas d'injections SQL (Drizzle ORM)

---

## 10. INTEGRATION & DÉPLOIEMENT

### 10.1 Technologies Utilisées

| Couche | Tech | Version |
|--------|------|---------|
| **Runtime** | Node.js | 20+ |
| **Frontend** | React | 18.3.1 |
| **Backend** | Express | 4.21.2 |
| **Database** | PostgreSQL | 14+ |
| **ORM** | Drizzle | 0.39.1 |
| **Bundler** | Vite | 5.4.20 |
| **Styling** | Tailwind | 3.4.17 |
| **Forms** | React Hook Form + Zod | 7.55 + 3.24 |
| **Router** | Wouter | 3.3.5 |
| **State** | TanStack Query | 5.60.5 |
| **WebSocket** | WS | 8.18.3 |

### 10.2 Build Process

```
npm run build
├─ vite build (React → dist/public/)
└─ esbuild (Server → dist/index.js)
    ↓
npm run start (Production)
└─ node dist/index.js
   ├─ Express avec routes
   ├─ Assets statiques depuis dist/public/
   └─ Écoute sur 0.0.0.0:5000
```

### 10.3 Fichiers Nécessaires en Production

```
dist/
├── index.js              ✅ Serveur bundlé
└── public/
    ├── index.html        ✅ Template
    ├── assets/           ✅ CSS/JS compilés
    └── favicon.png       ✅

package.json             ✅
package-lock.json        ✅
```

---

## 11. DÉPANNAGE

### Erreur: "DATABASE_URL must be set"
- **Cause**: Pas de variable d'environnement `DATABASE_URL`
- **Solution**: Créer une base PostgreSQL, ajouter sa URL à `.env`

### Erreur: "Cannot find module"
- **Cause**: Dépendance non installée
- **Solution**: `npm install`

### Erreur: "Port already in use"
- **Cause**: Autre processus utilise port 5000
- **Solution**: `lsof -i :5000` puis `kill -9 <PID>`

### Erreur: "JWT malformed"
- **Cause**: Token corrompu ou expiré
- **Solution**: Reconnecter (login)

---

## 12. CHECKLIST DE PRODUCTION

- [ ] DATABASE_URL configurée (PostgreSQL valide)
- [ ] NODE_ENV=production
- [ ] npm run build réussi (pas d'erreurs TS)
- [ ] npm run start démarre sans erreurs
- [ ] API endpoints répondent (curl /api/me)
- [ ] Logs serveur monitorés (server.log)
- [ ] HTTPS activé (si déploiement public)
- [ ] Backups DB configurés
- [ ] JWT_SECRET défini (optionnel mais recommandé)
- [ ] CORS whitelist configuré (si APIs externes)

