# 🎵 Guide de Configuration - Worship Team Manager
## Système de Rôles et Permissions

---

## 📋 Table des Matières
1. [Aperçu du Système de Rôles](#aperçu)
2. [Installation et Configuration](#installation)
3. [Configuration du Premier Admin](#premier-admin)
4. [Gestion des Utilisateurs](#gestion-utilisateurs)
5. [Tests avec Postman/Insomnia](#tests-api)

---

## 🎯 Aperçu du Système de Rôles {#aperçu}

Le système comprend maintenant **3 rôles distincts** :

### 1. **Viewer** (Lecteur - Rôle par défaut)
- ✅ Peut se connecter et consulter toutes les données
- ✅ Peut voir les musiciens, événements, présences, cotisations
- ❌ **NE PEUT PAS** créer, modifier ou supprimer quoi que ce soit
- 🎯 **Rôle attribué automatiquement** lors de l'inscription

### 2. **Responsable**
- ✅ Toutes les permissions de "Viewer"
- ✅ **PEUT** créer, modifier et supprimer des données
- ✅ Gestion complète des musiciens, événements, présences, cotisations
- ❌ Ne peut pas gérer les autres utilisateurs
- 🎯 Doit être promu par un admin

### 3. **Admin** (Administrateur)
- ✅ Toutes les permissions de "Responsable"
- ✅ **PEUT** gérer tous les utilisateurs
- ✅ Peut promouvoir/rétrograder d'autres utilisateurs
- ✅ Peut supprimer des comptes utilisateurs
- 🎯 Le premier admin doit être configuré manuellement

---

## 🚀 Installation et Configuration {#installation}

### 1. Installation des dépendances

```bash
# Backend
cd worship-team-manager-main
npm install

# Frontend
cd ../worship-team-manager-frontend-main
npm install
```

### 2. Configuration du fichier .env (Backend)

Créez un fichier `.env` dans le dossier backend avec :

```env
# MongoDB
MONGO_URI=votre_uri_mongodb

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRE=30d

# Email (Brevo/SendInBlue)
BREVO_API_KEY=votre_cle_api_brevo
BREVO_SENDER_EMAIL=votre_email@domaine.com
BREVO_SENDER_NAME=Worship Team Manager

# Cloudinary (pour les photos)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# URL Frontend (pour les emails)
FRONTEND_URL=http://localhost:5173
```

### 3. Démarrage des serveurs

```bash
# Backend (depuis le dossier backend)
npm start

# Frontend (depuis le dossier frontend)
npm run dev
```

---

## 👑 Configuration du Premier Admin {#premier-admin}

### ⚠️ IMPORTANT : Configuration Initiale

Après avoir démarré l'application pour la première fois, vous devez **manuellement** créer le premier admin via MongoDB.

### Option 1 : Via MongoDB Compass (Interface Graphique)

1. Ouvrez **MongoDB Compass**
2. Connectez-vous à votre base de données
3. Allez dans la collection `users`
4. Créez un premier compte via l'interface web (inscription normale)
5. Trouvez ce compte dans la base de données
6. Modifiez le champ `role` de `"viewer"` à `"admin"`
7. Sauvegardez

### Option 2 : Via MongoDB Shell (Ligne de commande)

```bash
# Connectez-vous à votre base MongoDB
mongosh "votre_uri_mongodb"

# Utilisez votre base de données
use worship_team_manager

# Trouvez votre utilisateur par email
db.users.findOne({ email: "votre.email@exemple.com" })

# Mettez à jour le rôle en admin
db.users.updateOne(
  { email: "votre.email@exemple.com" },
  { $set: { role: "admin" } }
)

# Vérifiez que ça a fonctionné
db.users.findOne({ email: "votre.email@exemple.com" })
```

### Option 3 : Via Script Node.js

Créez un fichier `setup-admin.js` dans le dossier backend :

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const setupFirstAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // REMPLACEZ PAR VOTRE EMAIL
    const adminEmail = 'votre.email@exemple.com';

    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
      console.log('💡 Créez d\'abord un compte via l\'interface web');
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log('✅ Cet utilisateur est déjà admin');
      process.exit(0);
    }

    user.role = 'admin';
    await user.save();

    console.log('✅ Utilisateur promu en admin avec succès!');
    console.log(`👤 Nom: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Rôle: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

setupFirstAdmin();
```

Exécutez le script :

```bash
node setup-admin.js
```

---

## 👥 Gestion des Utilisateurs {#gestion-utilisateurs}

### Une fois connecté en tant qu'admin :

### 1. Voir tous les utilisateurs

**GET** `/api/users`

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
```

### 2. Promouvoir un utilisateur en admin (par email)

**POST** `/api/users/promote`

```bash
curl -X POST http://localhost:5000/api/users/promote \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "utilisateur@exemple.com"
  }'
```

### 3. Changer le rôle d'un utilisateur (par ID)

**PUT** `/api/users/:userId/role`

```bash
curl -X PUT http://localhost:5000/api/users/USER_ID/role \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "responsable"
  }'
```

Rôles disponibles : `"viewer"`, `"responsable"`, `"admin"`

### 4. Rétrograder un admin en responsable

**POST** `/api/users/demote`

```bash
curl -X POST http://localhost:5000/api/users/demote \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemple.com"
  }'
```

### 5. Supprimer un utilisateur

**DELETE** `/api/users/:userId`

```bash
curl -X DELETE http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
```

⚠️ **Note** : Un admin ne peut pas modifier ou supprimer son propre compte via ces routes.

---

## 🧪 Tests avec Postman/Insomnia {#tests-api}

### Configuration de base

1. Créez une nouvelle collection "Worship Team Manager"
2. Ajoutez une variable d'environnement `{{token}}` pour stocker le token JWT

### 1. Inscription d'un utilisateur (devient automatiquement "viewer")

**POST** `http://localhost:5000/api/auth/register`

```json
{
  "name": "Jean Dupont",
  "email": "jean@exemple.com",
  "password": "motdepasse123"
}
```

### 2. Connexion

**POST** `http://localhost:5000/api/auth/login`

```json
{
  "email": "jean@exemple.com",
  "password": "motdepasse123"
}
```

Copiez le `token` retourné et stockez-le dans `{{token}}`.

### 3. Tester les permissions "Viewer" (devrait échouer)

**POST** `http://localhost:5000/api/members`  
**Headers:** `Authorization: Bearer {{token}}`

```json
{
  "name": "Nouveau Musicien",
  "instrument": "Guitare"
}
```

**Résultat attendu :** ❌ Erreur 403 - "Accès refusé"

### 4. Tester la lecture (devrait fonctionner)

**GET** `http://localhost:5000/api/members`  
**Headers:** `Authorization: Bearer {{token}}`

**Résultat attendu :** ✅ Liste des musiciens

### 5. Promouvoir l'utilisateur en admin (via MongoDB)

Utilisez une des méthodes décrites plus haut pour changer le rôle en "admin".

### 6. Tester les permissions admin

**POST** `http://localhost:5000/api/users/promote`  
**Headers:** `Authorization: Bearer {{token}}`

```json
{
  "email": "autreuser@exemple.com"
}
```

**Résultat attendu :** ✅ Utilisateur promu avec succès

---

## 🔒 Résumé des Permissions

| Action | Viewer | Responsable | Admin |
|--------|--------|-------------|-------|
| Voir les données | ✅ | ✅ | ✅ |
| Créer/Modifier/Supprimer (musiciens, événements, etc.) | ❌ | ✅ | ✅ |
| Gérer les utilisateurs | ❌ | ❌ | ✅ |
| Promouvoir/Rétrograder | ❌ | ❌ | ✅ |

---

## 📝 Notes Importantes

1. **Données partagées** : Tous les utilisateurs voient les mêmes données (musiciens, événements, etc.). Il n'y a qu'une seule base de données partagée.

2. **Premier admin** : DOIT être configuré manuellement via MongoDB après la première inscription.

3. **Sécurité** : Les "viewers" peuvent voir toutes les données mais ne peuvent rien modifier. Cela garantit que seuls les admins et responsables peuvent gérer le contenu.

4. **Évolutivité** : Pour promouvoir d'autres admins après le premier, utilisez simplement l'API `/api/users/promote` avec votre compte admin.

---

## 🆘 Dépannage

### "Accès refusé" même en tant qu'admin
- Vérifiez que le rôle dans la base de données est bien `"admin"`
- Reconnectez-vous pour obtenir un nouveau token avec les bonnes permissions

### Les nouveaux utilisateurs peuvent modifier les données
- Vérifiez que le fichier `models/User.js` a bien `default: 'viewer'` dans le schéma
- Redémarrez le serveur backend

### Impossible de promouvoir un utilisateur
- Assurez-vous que VOUS êtes admin
- Vérifiez que l'email existe dans la base de données
- Vérifiez que l'utilisateur n'est pas déjà admin

---

✨ **Félicitations !** Votre système de gestion de worship team est maintenant sécurisé avec un système de rôles complet !
