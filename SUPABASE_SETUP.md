# Configuration Supabase pour FlashCamEdu

## 📋 Guide complet pour migrer de Neon à Supabase

### **Étape 1 : Créer un compte Supabase**
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte gratuit
3. Créez une nouvelle organisation et projet

### **Étape 2 : Récupérer vos identifiants de connexion**
1. Dans le tableau de bord Supabase, allez à **Settings > Database**
2. Vous verrez :
   - **Host** (ex: `xyz.supabase.co`)
   - **Database name** (par défaut: `postgres`)
   - **User** (par défaut: `postgres`)
   - **Password** (votre mot de passe)
   - **Port** (5432)

### **Étape 3 : Construire votre DATABASE_URL**
Combinez vos identifiants dans ce format :
```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

**Exemple :**
```
postgresql://postgres:myPassword123@xyz.supabase.co:5432/postgres
```

### **Étape 4 : Configurer les variables d'environnement**

#### Sur Replit :
1. Allez à **Tools > Secrets** (onglet à gauche)
2. Cliquez sur **Create secret**
3. Ajoutez :
   - **Key**: `DATABASE_URL`
   - **Value**: Collez votre PostgreSQL connection string
4. Sauvegardez

#### En local (`.env.local`) :
```
DATABASE_URL=postgresql://postgres:myPassword@xyz.supabase.co:5432/postgres
```

### **Étape 5 : Initialiser la base de données**

Une fois l'app démarrée, exécutez :
```bash
npm run db:push
```

Cela créera automatiquement les tables :
- `users` (administrateurs et étudiants)
- `packs` (collections de cartes)
- `flashcards` (cartes individuelles)

### **Étape 6 : Ajouter des données initiales**

Les données de test (comptes admin) sont créées automatiquement au premier démarrage.

**Comptes par défaut :**
- **Admin 1**: Camille Cordier / `CaMa_39.cAmA`
- **Admin 2**: Stephen Dechelotte / `Stephen_histoire`

### **Étape 7 : Déployer l'app**

#### Option 1 : Sur Replit (recommandé)
1. Cliquez sur **Publish** en haut
2. L'app sera en ligne en quelques secondes

#### Option 2 : Sur Railway/Render
1. Connectez votre repo GitHub
2. Ajoutez `DATABASE_URL` dans les variables d'environnement
3. Déployez !

---

## 🔧 Modifications techniques effectuées

### Compatibilité Node.js + Supabase

**Driver PostgreSQL :**
- ✅ Ancien : `@neondatabase/serverless` (Neon)
- ✅ Nouveau : `postgres` (Drizzle compatible)

**Architecture :**
- ✅ `server/db.ts` adapté pour Supabase
- ✅ Toutes les routes conservent la même logique
- ✅ Authentification JWT inchangée
- ✅ WebSocket en temps réel conservé

**Sécurité :**
- ✅ Validations Zod côté serveur
- ✅ Bcrypt pour les mots de passe
- ✅ Variables d'environnement pour les secrets

---

## 🚀 Commandes principales

```bash
# Démarrer l'app en développement
npm run dev

# Construire pour production
npm run build

# Exécuter en production
npm start

# Synchroniser le schéma avec la base
npm run db:push

# Vérifier les types TypeScript
npm run check
```

---

## 📞 Dépannage

### ❌ "DATABASE_URL not found"
→ Vérifiez que vous avez défini `DATABASE_URL` dans **Tools > Secrets** sur Replit

### ❌ "Connection refused"
→ Vérifiez votre `DATABASE_URL` et que Supabase est accessible

### ❌ "Migration failed"
→ Exécutez : `npm run db:push --force`

### ❌ Comptes admin ne fonctionnent pas
→ Vérifiez que `npm run db:push` s'est exécuté correctement

---

## ✅ Validation

L'app est prête quand vous voyez :
- ✓ Page de connexion affichée
- ✓ Connexion avec les comptes admin réussit
- ✓ Packs visibles sur la page d'accueil
- ✓ Tableau de bord admin accessible
- ✓ Téléchargement PDF fonctionne

---

## 📚 Architecture finale

```
FlashCamEdu
├── Frontend (React + Vite)
│   ├── Authentification JWT
│   ├── WebSocket temps réel
│   └── Interface Shadcn UI
├── Backend (Express + Node.js)
│   ├── Routes API REST
│   ├── Validation Zod
│   └── WebSocket serveur
└── Database (PostgreSQL + Supabase)
    ├── Users
    ├── Packs
    └── Flashcards
```

---

**Besoin d'aide ?** Consultez la documentation :
- [Supabase docs](https://supabase.com/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [FlashCamEdu replit.md](./replit.md)
