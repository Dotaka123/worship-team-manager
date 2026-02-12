# 🎵 Worship Team Manager - Modifications Système de Rôles

## 🎯 Résumé des Modifications

Ce projet a été mis à jour avec un **système complet de gestion des rôles et permissions**.

### ✨ Nouvelles Fonctionnalités

#### 1. **Trois Rôles Distincts**
- 👁️ **Viewer** (par défaut) - Lecture seule
- 📝 **Responsable** - Peut modifier les données
- 👑 **Admin** - Contrôle total + gestion des utilisateurs

#### 2. **Base de Données Partagée**
- ✅ Tous les utilisateurs voient les **mêmes données**
- ✅ Plus de données isolées par utilisateur
- ✅ Une seule source de vérité pour tous

#### 3. **Gestion des Permissions**
- ✅ Les "viewers" peuvent uniquement consulter
- ✅ Seuls les admins/responsables peuvent créer/modifier/supprimer
- ✅ Seuls les admins peuvent gérer les utilisateurs

---

## 📁 Fichiers Modifiés/Créés

### Backend

#### Fichiers Modifiés
- `models/User.js` - Ajout du rôle "viewer" + méthodes de permissions
- `middleware/auth.js` - Ajout middlewares `canModify` et `adminOnly`
- `routes/*.js` - Séparation routes lecture/modification

#### Nouveaux Fichiers
- `controllers/userController.js` - Gestion des utilisateurs (admin)
- `routes/users.js` - Routes pour gérer les utilisateurs
- `server.js` - Mise à jour avec nouvelle route `/api/users`
- `setup-admin.js` - Script pour créer le premier admin
- `GUIDE_INSTALLATION_ROLES.md` - Guide complet

---

## 🚀 Installation Rapide

### 1. Remplacer les Fichiers

Copiez les fichiers modifiés dans votre projet :

```bash
# Backend
cp models/User.js worship-team-manager-main/models/
cp middleware/auth.js worship-team-manager-main/middleware/
cp routes/*.js worship-team-manager-main/routes/
cp controllers/userController.js worship-team-manager-main/controllers/
cp server.js worship-team-manager-main/
cp setup-admin.js worship-team-manager-main/
```

### 2. Installer les Dépendances

```bash
cd worship-team-manager-main
npm install
```

### 3. Configurer le Premier Admin

**Option 1 : Script automatique (RECOMMANDÉ)**
```bash
# 1. Créez d'abord un compte via l'interface web
# 2. Ensuite, exécutez:
node setup-admin.js
# 3. Suivez les instructions à l'écran
```

**Option 2 : MongoDB Compass**
1. Créez un compte via l'interface web
2. Ouvrez MongoDB Compass
3. Trouvez votre utilisateur dans la collection `users`
4. Changez le champ `role` de `"viewer"` à `"admin"`

**Option 3 : MongoDB Shell**
```bash
mongosh "votre_uri_mongodb"
use worship_team_manager
db.users.updateOne(
  { email: "votre.email@exemple.com" },
  { $set: { role: "admin" } }
)
```

### 4. Démarrer l'Application

```bash
# Backend
npm start

# Frontend (dans un autre terminal)
cd ../worship-team-manager-frontend-main
npm run dev
```

---

## 📚 Utilisation

### Pour les Développeurs (Vous)

1. **Créez votre compte** via l'interface web
2. **Promouvez-vous en admin** avec `node setup-admin.js`
3. **Gérez les utilisateurs** via l'API `/api/users`

### Pour les Utilisateurs

1. **Inscription normale** - Deviennent automatiquement "viewer"
2. **Consultation libre** - Peuvent voir toutes les données
3. **Pas de modification** - Doivent contacter un admin pour être promus

### Promouvoir un Utilisateur (Admin uniquement)

```bash
# Via API
POST /api/users/promote
{
  "email": "utilisateur@exemple.com"
}
```

Ou via l'interface frontend (à implémenter).

---

## 🔐 Sécurité

### Permissions par Rôle

| Action | Viewer | Responsable | Admin |
|--------|--------|-------------|-------|
| Voir musiciens/événements | ✅ | ✅ | ✅ |
| Créer/Modifier | ❌ | ✅ | ✅ |
| Supprimer | ❌ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ✅ |

### Routes Protégées

```javascript
// Lecture seule (tous les rôles)
GET /api/members
GET /api/events
GET /api/cotisations

// Modification (responsable + admin)
POST /api/members
PUT /api/members/:id
DELETE /api/members/:id

// Administration (admin uniquement)
GET /api/users
POST /api/users/promote
PUT /api/users/:id/role
```

---

## 🆘 Problèmes Courants

### "Accès refusé" après connexion
- Vérifiez votre rôle dans MongoDB
- Reconnectez-vous pour obtenir un nouveau token

### Les nouveaux utilisateurs peuvent modifier
- Vérifiez que `User.js` a bien `default: 'viewer'`
- Redémarrez le serveur

### Impossible de promouvoir un utilisateur
- Assurez-vous d'être admin
- Vérifiez que l'email existe

---

## 📞 Support

Pour toute question, consultez le guide complet :
👉 **GUIDE_INSTALLATION_ROLES.md**

---

## ✅ Checklist de Déploiement

- [ ] Fichiers backend remplacés
- [ ] Dépendances installées
- [ ] Premier admin configuré
- [ ] Tests effectués avec différents rôles
- [ ] Frontend mis à jour (si nécessaire)
- [ ] Documentation lue

---

**Développé avec ❤️ pour votre équipe de worship**
