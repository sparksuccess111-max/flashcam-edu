# 🚀 FlashCamEdu - Firebase Quick Start

## Option 1: Garder PostgreSQL (Défaut actuel)
L'application fonctionne parfaitement avec PostgreSQL. Aucune action requise!

## Option 2: Migrer vers Firebase (Nouveau)

### Étape 1️⃣: Créer un projet Firebase

1. Allez à https://console.firebase.google.com/
2. Cliquez **"Créer un nouveau projet"** → nommez-le `flashcamedu`
3. Désactivez Google Analytics (optionnel)
4. ✅ Créer

### Étape 2️⃣: Activer les services Firebase

**Firestore Database:**
- Menu → **Firestore Database**
- Cliquez **"Créer une base de données"**
- Mode: **"Démarrer en mode test"** (développement)
- Région: **europe-west1** (ou plus proche)
- ✅ Créer

**Firebase Auth:**
- Menu → **Authentication**
- Cliquez **"Commencer"**
- Activez **Email/Mot de passe**
- ✅ Enregistrer

### Étape 3️⃣: Récupérer les clés

**Pour le Backend (Replit Secrets):**

1. Menu → **Paramètres du projet** (⚙️)
2. Onglet **"Comptes de service"**
3. Cliquez **"Générer une nouvelle clé privée"**
4. Un fichier JSON se télécharge

**Extrayez ces 3 valeurs du JSON et ajoutez-les dans Replit (clé 🔐 en haut à droite):**

```
FIREBASE_PROJECT_ID = projectId (du JSON)
FIREBASE_CLIENT_EMAIL = client_email (du JSON)
FIREBASE_PRIVATE_KEY = private_key (du JSON, gardez les \n comme-est)
```

**Pour le Frontend:**

1. Menu → **Paramètres du projet**
2. Cherchez **"Vos apps"** → cliquez l'app web
3. Copiez la config Firebase
4. Ajoutez ces variables dans Replit Secrets (préfixe `VITE_`):

```
VITE_FIREBASE_API_KEY = your_api_key
VITE_FIREBASE_AUTH_DOMAIN = your_auth_domain
VITE_FIREBASE_PROJECT_ID = your_project_id
VITE_FIREBASE_STORAGE_BUCKET = your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID = your_messaging_sender_id
VITE_FIREBASE_APP_ID = your_app_id
```

### Étape 4️⃣: Redémarrer l'application

```bash
npm run dev
```

✅ **Prêt!** L'app est connectée à Firebase et utilise Firestore au lieu de PostgreSQL.

---

## ⚡ Structure de données Firestore

```
firestore
├── users/
│   ├── {userId}
│   │   ├── id, firstName, lastName, password, role, subject
│
├── packs/
│   ├── {packId}
│   │   ├── id, title, description, subject, createdByUserId
│   │   ├── published, order, views, deletedAt
│
├── flashcards/
│   ├── {cardId}
│   │   ├── id, packId, question, answer, order
│
├── messages/
│   ├── {msgId}
│   │   ├── id, fromUserId, toUserId, content, read, createdAt
│
├── accountRequests/
│   └── {reqId}
│       ├── id, firstName, lastName, password, status
```

---

## 🔐 Règles Firestore (Copier-Coller)

Menu **Firestore Database** → **Règles** → Remplacez par:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null || request.path.parent.parent.id == 'accountRequests';
    }
  }
}
```

---

## 📊 Comparaison

| Aspect | PostgreSQL | Firebase |
|--------|-----------|----------|
| **Coût** | À payer (Supabase) | Gratuit (tier libre) |
| **Installation** | Connecter Supabase | Configurer secrets |
| **Scalabilité** | Moyenne | Haute |
| **Maintenance** | Plus | Moins |
| **Performance** | Excellente | Très bonne |

---

## ❓ FAQ

**Q: Je peux revenir à PostgreSQL?**  
A: Oui! Supprimez simplement les variables `FIREBASE_*` dans les Secrets. L'app revient automatiquement à PostgreSQL.

**Q: Firebase est vraiment gratuit?**  
A: Oui, pour petit trafic (<100k opérations/jour). Parfait pour le développement et petits projets.

**Q: Mes données actuelles (PostgreSQL) vont où?**  
A: Elles restent dans Supabase. Firebase créera une nouvelle base de données vierge. Vous pouvez migrer manuellement si besoin.

---

## 🎉 Vous êtes prêt!

Redémarrez l'app et connectez-vous. La migration Firebase est complète!

Support: Vérifiez les logs du serveur si vous avez des erreurs Firebase.
