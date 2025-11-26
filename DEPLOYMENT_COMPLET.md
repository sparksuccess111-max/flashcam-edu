# 🚀 Déployer FlashCamEdu GRATUITEMENT - Guide Complet

**Stack utilisé:**
- Frontend: **Vercel** (GRATUIT)
- Backend: **Render** (GRATUIT)
- Database + Auth: **Firebase** (GRATUIT - tier libre)
- **COÛT TOTAL: 0€/mois** ✅

---

## 📋 Table des matières
1. [Configuration Firebase](#firebase)
2. [Préparer le code](#préparer)
3. [Déployer Backend sur Render](#render)
4. [Déployer Frontend sur Vercel](#vercel)
5. [Vérifier tout fonctionne](#vérifier)

---

## 🔥 Étape 1: Configuration Firebase {#firebase}

### Créer un projet Firebase

1. Allez à https://console.firebase.google.com/
2. Cliquez **"Créer un nouveau projet"** 
3. Nommez-le `flashcamedu`
4. Désactivez Google Analytics
5. ✅ Créer

### Activer Firestore Database

1. Dans Firebase → **Firestore Database**
2. Cliquez **"Créer une base de données"**
3. Mode: **"Démarrer en mode test"** (développement)
4. Région: **europe-west1**
5. ✅ Créer

### Activer Firebase Auth

1. Firebase → **Authentication**
2. Cliquez **"Commencer"**
3. Activez **Email/Mot de passe**
4. ✅ Enregistrer

### Récupérer les clés Backend

1. Firebase → **Paramètres du projet** (⚙️)
2. Onglet **"Comptes de service"**
3. Cliquez **"Générer une nouvelle clé privée"**
4. Téléchargement du JSON

**Extrayez ces 3 valeurs du JSON:**
```
FIREBASE_PROJECT_ID = projectId
FIREBASE_CLIENT_EMAIL = client_email
FIREBASE_PRIVATE_KEY = private_key (gardez tel quel avec les \n)
```

### Récupérer les clés Frontend

1. Firebase → **Paramètres du projet**
2. Section **"Vos apps"** → cliquez l'app web
3. Copiez la config Firebase

Vous récupérez:
```
apiKey
authDomain
projectId
storageBucket
messagingSenderId
appId
```

---

## 🛠️ Étape 2: Préparer le code {#préparer}

### A. Ajouter les variables d'environnement dans Replit

**Dans Replit Secrets (🔐 en haut à droite), ajoutez:**

```
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_CLIENT_EMAIL=votre_client_email
FIREBASE_PRIVATE_KEY=votre_private_key
```

### B. Créer un fichier `.env.production` pour Vercel

Créez `client/.env.production`:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### C. Mettre à jour le backend pour utiliser Firebase

Modifiez `server/app.ts` pour charger Firestore si les clés existent:

```typescript
// À la place de: import { storage } from "./storage";

let storage;
if (process.env.FIREBASE_PROJECT_ID) {
  const { storage: firebaseStorage } = await import("./storage-firebase");
  storage = firebaseStorage;
} else {
  const { storage: pgStorage } = await import("./storage");
  storage = pgStorage;
}
```

---

## 📤 Étape 3: Déployer Backend sur Render {#render}

### 1. Créer un compte Render

1. Allez à https://render.com
2. Cliquez **"Sign up"** (créez un compte GitHub c'est plus facile)
3. ✅ Connectez votre GitHub

### 2. Créer un nouveau service

1. Dashboard Render → **"New"** → **"Web Service"**
2. Connectez votre repo GitHub `flashcamedu`
3. Configurez:
   - **Name**: `flashcamedu-backend`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build command**: `npm install && npm run build`
   - **Start command**: `npm run start`

### 3. Ajouter les variables d'environnement

Dans Render (avant de déployer):
- Cliquez **"Environment"**
- Ajoutez ces 3 variables:

```
FIREBASE_PROJECT_ID = votre_project_id
FIREBASE_CLIENT_EMAIL = votre_client_email
FIREBASE_PRIVATE_KEY = votre_private_key
```

### 4. Déployer

- Cliquez **"Create Web Service"**
- Attendre ~5 minutes
- Vous recevrez une URL: `https://flashcamedu-backend.onrender.com`

**Notez cette URL!** Vous en aurez besoin pour le frontend.

---

## 🎨 Étape 4: Déployer Frontend sur Vercel {#vercel}

### 1. Créer un compte Vercel

1. Allez à https://vercel.com
2. Cliquez **"Sign Up"** (GitHub c'est plus facile)
3. ✅ Connectez votre GitHub

### 2. Importer votre projet

1. Dashboard Vercel → **"Add New"** → **"Project"**
2. Sélectionnez votre repo `flashcamedu`
3. Framework: **Vite**
4. Root Directory: `./client`

### 3. Ajouter les variables d'environnement

Avant de déployer, dans Vercel:
- Allez à **"Settings"** → **"Environment Variables"**
- Ajoutez ces 6 variables:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Configurer l'API Backend

Créez un fichier `client/.env.production`:

```
VITE_API_URL=https://flashcamedu-backend.onrender.com
```

Puis dans `client/src/lib/queryClient.ts`, mettez à jour:

```typescript
const apiUrl = import.meta.env.VITE_API_URL || '';

async function handleRequest(
  method: string,
  url: string,
  data?: any
): Promise<any> {
  const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;
  // ... rest du code
}
```

### 5. Déployer

- Cliquez **"Deploy"**
- Attendre ~3 minutes
- Vercel vous donne une URL: `https://flashcamedu.vercel.app`

---

## ✅ Étape 5: Vérifier tout fonctionne {#vérifier}

### Test 1: Frontend est accessible
- Allez à `https://flashcamedu.vercel.app`
- Vous devez voir la page de login

### Test 2: Backend répond
```bash
curl https://flashcamedu-backend.onrender.com/api/health
# Réponse: {"status":"ok","timestamp":"..."}
```

### Test 3: Firebase Auth fonctionne
- Essayez de créer un compte
- Vérifiez dans Firebase Console → **Authentication**

### Test 4: Firestore fonctionne
- Créez un pack
- Allez dans Firebase Console → **Firestore Database**
- Vous devez voir une collection `packs` avec vos données

---

## 🎉 C'est prêt!

Votre application est en ligne **GRATUITEMENT**:
- ✅ Frontend sur Vercel
- ✅ Backend sur Render
- ✅ Database + Auth sur Firebase

**URL publique**: `https://flashcamedu.vercel.app` 🚀

---

## 🔧 Troubleshooting

### "Le backend met longtemps au démarrage"
- ✅ Normal sur Render gratuit (30-50s premier accès)
- C'est le "cold start". Attend après 15 min d'inactivité

### "Erreur Firebase invalid API key"
- ❌ Vérifiez que les variables `VITE_FIREBASE_*` sont correctes
- Les clés Frontend et Backend sont DIFFÉRENTES!

### "Backend ne se connecte pas à Firebase"
- ❌ Vérifiez les 3 variables Render:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

### "Erreur CORS"
- ✅ Ajouter dans `server/app.ts`:
```typescript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

---

## 📊 Résumé coûts

| Service | Coût | Notes |
|---------|------|-------|
| Vercel | 0€ | Gratuit pour petit trafic |
| Render | 0€ | 5$ crédits/mois, puis 1$/mois |
| Firebase | 0€ | Tier gratuit suffisant |
| **TOTAL** | **0€/mois** | ✅ Complètement gratuit |

---

## 🎯 Prochaines étapes

1. ✅ Configurez Firebase
2. ✅ Déployez le backend sur Render
3. ✅ Déployez le frontend sur Vercel
4. ✅ Testez tout fonctionne
5. ✅ Partagez votre URL publique! 🚀

**Besoin d'aide?** Relisez ce guide ou consultez la documentation des services.

Bonne chance! 🎉
