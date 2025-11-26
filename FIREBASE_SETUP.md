# 🔥 Configuration Firebase pour FlashCamEdu

## Étape 1: Créer un projet Firebase

1. Allez à [Firebase Console](https://console.firebase.google.com/)
2. Cliquez **"Créer un nouveau projet"**
3. Nommez-le `flashcamedu`
4. Désactivez Google Analytics (optionnel)
5. Cliquez **"Créer un projet"**

## Étape 2: Configuration Firestore

1. Dans Firebase Console, allez à **Firestore Database**
2. Cliquez **"Créer une base de données"**
3. Sélectionnez **"Démarrer en mode test"** (pour développement)
4. Choisissez région: `europe-west1` (ou proche de vous)
5. Cliquez **"Créer"**

## Étape 3: Configuration Firebase Auth

1. Allez à **Authentication** dans le menu Firebase
2. Cliquez **"Commencer"**
3. Activez **"Email/Mot de passe"**
4. Cliquez **"Enregistrer"**

## Étape 4: Récupérer les clés

### Backend (Node.js Admin SDK):

1. Allez à **Paramètres du projet** (icône engrenage)
2. Allez à l'onglet **"Comptes de service"**
3. Cliquez **"Générer une nouvelle clé privée"**
4. Un fichier JSON sera téléchargé
5. Extrayez ces valeurs et ajoutez-les comme variables d'environnement dans Replit:

```
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_CLIENT_EMAIL=votre_client_email
FIREBASE_PRIVATE_KEY=votre_private_key (remplacez \n par des vraies sauts de ligne)
```

### Frontend (Client SDK):

1. Allez à **Paramètres du projet**
2. Cliquez sur votre app web (ou créez-en une)
3. Copiez la config Firebase
4. Ajoutez ces variables d'environnement dans Replit:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Étape 5: Créer les règles Firestore

Allez à **Firestore Database** → **Règles**

Remplacez par:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /packs/{packId} {
      allow read: if resource.data.published == true || request.auth.uid == resource.data.createdByUserId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create, update, delete: if request.auth.uid == resource.data.createdByUserId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /flashcards/{fcId} {
      allow read, write: if request.auth != null;
    }
    match /messages/{msgId} {
      allow read, write: if request.auth.uid == resource.data.toUserId || request.auth.uid == resource.data.fromUserId;
    }
    match /accountRequests/{reqId} {
      allow write: if request.auth == null;
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Étape 6: Vérifier dans Replit

1. Allez aux **Secrets** dans Replit (clé en haut à droite)
2. Ajoutez toutes les variables d'environnement ci-dessus
3. Redémarrez le serveur: `npm run dev`

✅ C'est prêt! L'application est maintenant connectée à Firebase.
