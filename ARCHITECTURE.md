# 📁 Architecture de FlashCamEdu

## Structure complète des fichiers et dossiers

```
FlashCamEdu/
│
├── 📄 Package & Configuration
│   ├── package.json                    # Dépendances Node.js et scripts
│   ├── package-lock.json               # Verrouillage des versions
│   ├── tsconfig.json                   # Configuration TypeScript
│   ├── vite.config.ts                  # Configuration Vite (build frontend)
│   ├── tailwind.config.ts              # Configuration Tailwind CSS
│   ├── drizzle.config.ts               # Configuration ORM Drizzle
│   └── components.json                 # Configuration Shadcn UI
│
├── 📚 Documentation
│   ├── replit.md                       # Vue d'ensemble du projet
│   ├── ARCHITECTURE.md                 # Ce fichier - structure des fichiers
│   ├── SUPABASE_SETUP.md               # Guide de configuration Supabase
│   ├── MIGRATION_SUMMARY.md            # Résumé migration Neon → Supabase
│   └── RUN.html                        # Guide d'exécution interactif
│
├── 🔐 Backend (Node.js + Express)
│   ├── server/
│   │   ├── index-dev.ts                # Point d'entrée développement
│   │   ├── index-prod.ts               # Point d'entrée production
│   │   ├── app.ts                      # Configuration Express
│   │   ├── db.ts                       # Connexion PostgreSQL/Supabase
│   │   ├── storage.ts                  # Interface de stockage données
│   │   ├── routes.ts                   # API REST + WebSocket
│   │   ├── seed.ts                     # Données initiales (admin)
│   │   └── middleware/
│   │       └── auth.ts                 # Authentification JWT
│   │
│   └── shared/
│       └── schema.ts                   # Schéma Drizzle + Zod (base de données)
│
├── 🎨 Frontend (React + TypeScript)
│   ├── client/
│   │   ├── index.html                  # HTML principal
│   │   ├── vite-env.d.ts               # Types Vite
│   │   │
│   │   └── src/
│   │       ├── main.tsx                # Point d'entrée React
│   │       ├── App.tsx                 # Routeur principal
│   │       ├── index.css               # Styles globaux + variables CSS
│   │       │
│   │       ├── 📄 Pages
│   │       │   ├── Login.tsx            # Page de connexion
│   │       │   ├── Home.tsx             # Accueil (packs published)
│   │       │   ├── AdminDashboard.tsx   # Tableau de bord admin
│   │       │   ├── PackView.tsx         # Visualisation pack + flashcards
│   │       │   └── not-found.tsx        # Page 404
│   │       │
│   │       ├── 🧩 Components (Shadcn UI)
│   │       │   ├── Header.tsx           # En-tête application
│   │       │   ├── ThemeToggle.tsx      # Sélecteur thème clair/sombre
│   │       │   ├── FlashcardDialog.tsx  # Dialog création/édition flashcard
│   │       │   ├── PackDialog.tsx       # Dialog création/édition pack
│   │       │   │
│   │       │   └── ui/
│   │       │       ├── button.tsx       # Bouton réutilisable
│   │       │       ├── card.tsx         # Carte réutilisable
│   │       │       ├── input.tsx        # Champ texte
│   │       │       ├── form.tsx         # Formulaire wrapper
│   │       │       ├── dialog.tsx       # Dialog/Modal
│   │       │       ├── select.tsx       # Sélecteur dropdown
│   │       │       ├── textarea.tsx     # Champ texte multi-ligne
│   │       │       ├── tooltip.tsx      # Info-bulle
│   │       │       ├── tabs.tsx         # Onglets
│   │       │       ├── badge.tsx        # Badge label
│   │       │       ├── progress.tsx     # Barre progression
│   │       │       ├── scroll-area.tsx  # Zone scrollable
│   │       │       ├── sidebar.tsx      # Navigation sidebar
│   │       │       ├── sheet.tsx        # Tiroir mobile
│   │       │       ├── dropdown-menu.tsx
│   │       │       ├── toast.tsx        # Notifications
│   │       │       ├── toaster.tsx      # Gestionnaire notifications
│   │       │       └── ... (autres composants Shadcn)
│   │       │
│   │       ├── 🪝 Hooks
│   │       │   ├── use-toast.ts         # Hook notifications
│   │       │   └── use-mobile.tsx       # Hook détection mobile
│   │       │
│   │       └── 📚 Libraries
│   │           ├── auth-context.tsx     # Context API authentification
│   │           ├── queryClient.ts       # Configuration TanStack Query
│   │           ├── websocket.tsx        # WebSocket client
│   │           └── utils.ts             # Fonctions utilitaires
│   │
│   └── design_guidelines.md            # Directives de design UI
│
├── 📦 Database
│   └── migrations/                     # Fichiers migrations Drizzle (généré)
│       ├── 0000_*.sql                  # Migration initiale
│       ├── 0001_*.sql                  # Migration suivante
│       └── meta/
│           └── _journal.json           # Journal migrations
│
└── 🔧 Root Files
    ├── .gitignore                      # Fichiers à ignorer Git
    ├── .replit                         # Configuration Replit
    ├── .env.example                    # Template variables environnement
    └── node_modules/                  # Dépendances (généré, non commité)
```

---

## 📊 Architecture en couches

### **1. Frontend (Client)**
- **Technologie** : React 18 + TypeScript
- **Fichiers clés** : `client/src/App.tsx`, `client/src/pages/*.tsx`
- **Styling** : Tailwind CSS + Shadcn UI
- **État** : TanStack Query (server state) + React Context (auth)
- **Routing** : Wouter
- **Communication** : HTTP REST + WebSocket

### **2. Backend (Server)**
- **Technologie** : Node.js + Express
- **Fichiers clés** : `server/app.ts`, `server/routes.ts`
- **ORM** : Drizzle ORM
- **Auth** : JWT + Bcrypt
- **Real-time** : WebSocket (ws library)
- **Validation** : Zod schemas

### **3. Database**
- **Technologie** : PostgreSQL (Neon en dev, Supabase en prod)
- **Schéma** : `shared/schema.ts` (Drizzle)
- **Connexion** : `server/db.ts` (postgres driver)
- **Migrations** : Drizzle Kit (`npm run db:push`)

---

## 🗂️ Types de fichiers

### TypeScript/JavaScript
| Extension | Lieu | Usage |
|-----------|------|-------|
| `.ts` | `server/`, `shared/` | Code backend + schéma |
| `.tsx` | `client/src/` | Composants React |

### Configuration
| Fichier | Purpose |
|---------|---------|
| `tsconfig.json` | Config TypeScript |
| `vite.config.ts` | Config build frontend |
| `tailwind.config.ts` | Config Tailwind CSS |
| `drizzle.config.ts` | Config ORM Drizzle |
| `components.json` | Config Shadcn UI |
| `package.json` | Dépendances + scripts |

### Documentation
| Fichier | Contenu |
|---------|---------|
| `replit.md` | Vue d'ensemble projet |
| `ARCHITECTURE.md` | **Ce fichier** |
| `SUPABASE_SETUP.md` | Config Supabase gratuit |
| `MIGRATION_SUMMARY.md` | Changements Neon → Supabase |

### HTML & CSS
| Fichier | Purpose |
|---------|---------|
| `client/index.html` | HTML principal |
| `client/src/index.css` | Styles globaux |
| `RUN.html` | Guide d'exécution |

---

## 🚀 Flux d'une requête utilisateur

```
Utilisateur clique sur un pack
        ↓
Frontend (React) → GET /api/packs/:id
        ↓
Backend (Express) → authenticate middleware
        ↓
Routes handler → storage.getPackById()
        ↓
Storage → db.select() from Drizzle
        ↓
Database (PostgreSQL) retourne les données
        ↓
Backend envoie JSON au Frontend
        ↓
React Query cache + affiche les données
        ↓
WebSocket broadcast "pack-updated" à tous les clients
        ↓
Autres clients reçoivent la notification et rafraîchissent
```

---

## 📋 Fichiers essentiels à retenir

### 🎯 Si vous modifiez...

**Une API** → Modifiez `server/routes.ts`

**Un modèle de données** → Modifiez `shared/schema.ts`, puis `npm run db:push`

**L'authentification** → Modifiez `server/middleware/auth.ts`

**L'interface utilisateur** → Modifiez les fichiers dans `client/src/pages/` ou `client/src/components/`

**Les styles globaux** → Modifiez `client/src/index.css`

**Les variables d'environnement** → Modifiez `.env` ou Tools > Secrets (Replit)

---

## 🔐 Fichiers sensibles (à ne pas exposer)

- `.env.local` - Variables d'environnement locales
- `DATABASE_URL` - Chaîne de connexion base (jamais en public)
- `JWT_SECRET` - Clé secrète JWT (jamais en public)

---

## 📦 Scripts npm disponibles

```bash
npm run dev          # Démarrage développement (port 5000)
npm run build        # Build production
npm start            # Exécution production
npm run check        # Vérification TypeScript
npm run db:push      # Sync base de données
```

---

## ✅ Summary

| Dossier | Langage | Purpose |
|---------|---------|---------|
| `server/` | TypeScript | Logique backend |
| `client/src/` | React + TypeScript | Interface utilisateur |
| `shared/` | TypeScript | Schéma données partagé |
| `migrations/` | SQL | Historique base de données |

**Total des fichiers de code** : ~100+ fichiers  
**Principales dependencies** : 80+ packages npm  
**Architecture** : Full-stack monorepo (client + server dans 1 projet)

