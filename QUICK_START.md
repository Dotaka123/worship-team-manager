# 🚀 Guide de Démarrage Rapide - Worship Team Manager

## ⚡ Installation en 5 Minutes

### Étape 1 : Remplacer les Fichiers Backend

Copiez tous les fichiers fournis dans votre dossier `worship-team-manager-main` :

```bash
# Depuis le dossier où se trouvent les nouveaux fichiers
cp -r * /chemin/vers/worship-team-manager-main/
```

### Étape 2 : Configurer les Emails Administrateurs

**IMPORTANT** : Éditez le fichier `config/adminConfig.js` et ajoutez VOTRE email :

```javascript
export const ADMIN_EMAILS = [
  'votre.email@exemple.com',  // ⬅️ REMPLACEZ PAR VOTRE EMAIL
];
```

### Étape 3 : Installer et Démarrer

```bash
cd worship-team-manager-main
npm install
npm start
```

### Étape 4 : Créer Votre Compte Admin

1. Allez sur l'interface web (frontend)
2. **Inscrivez-vous** avec l'email que vous avez mis dans `adminConfig.js`
3. Vérifiez votre email
4. **Connectez-vous** - Vous êtes automatiquement admin ! 🎉

---

## 🎯 Fonctionnement du Système

### 📧 Emails Prédéfinis (RECOMMANDÉ)

**Avantage** : Configuration automatique

1. Ajoutez vos emails dans `config/adminConfig.js`
2. Lors de l'inscription, ces emails deviennent automatiquement **admin**
3. Pas besoin de script ni de MongoDB !

```javascript
// config/adminConfig.js
export const ADMIN_EMAILS = [
  'admin@worship.com',
  'responsable@eglise.com',
  'votre.email@gmail.com'
];
```

### 🔧 Méthode Manuelle (Alternative)

Si vous n'avez pas ajouté votre email dans `adminConfig.js` :

1. Créez un compte normalement (sera "viewer")
2. Exécutez : `npm run setup-admin`
3. Suivez les instructions pour vous promouvoir

---

## 👥 Gestion des Rôles

### Rôles Disponibles

| Rôle | Permissions | Attribution |
|------|-------------|-------------|
| **Viewer** | 👁️ Lecture seule | Automatique (défaut) |
| **Responsable** | 📝 Peut modifier | Promu par admin |
| **Admin** | 👑 Contrôle total | Email prédéfini OU promu |

### Promouvoir un Utilisateur

**Via API (Admin connecté)** :

```bash
POST http://localhost:5000/api/users/promote
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json

{
  "email": "utilisateur@exemple.com"
}
```

**Via l'interface** : À implémenter dans le frontend

---

## 🔒 Protection des Routes

### Routes Publiques
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/verify-email/:token` - Vérification email

### Routes Protégées (Tous les rôles)
- `GET /api/members` - Voir les musiciens
- `GET /api/events` - Voir les événements
- `GET /api/cotisations` - Voir les cotisations

### Routes Modification (Responsable + Admin)
- `POST /api/members` - Créer un musicien
- `PUT /api/members/:id` - Modifier un musicien
- `DELETE /api/members/:id` - Supprimer un musicien
- *(Même logique pour events, cotisations, etc.)*

### Routes Administration (Admin uniquement)
- `GET /api/users` - Lister tous les utilisateurs
- `POST /api/users/promote` - Promouvoir un utilisateur
- `PUT /api/users/:id/role` - Changer le rôle
- `DELETE /api/users/:id` - Supprimer un utilisateur

---

## 🎨 Mise à Jour du Frontend

### 1. Vérifier le Rôle dans le Context

```jsx
// Dans votre AuthContext
const user = {
  _id: '...',
  name: '...',
  email: '...',
  role: 'admin', // ⬅️ Nouveau champ !
  token: '...'
};
```

### 2. Afficher/Masquer selon le Rôle

```jsx
// Exemple de composant
const MusicianList = () => {
  const { user } = useAuth();
  const canModify = user.role === 'admin' || user.role === 'responsable';

  return (
    <div>
      {/* Tout le monde peut voir */}
      <MusicianTable />
      
      {/* Seulement les admins/responsables */}
      {canModify && (
        <button onClick={addMusician}>
          Ajouter un Musicien
        </button>
      )}
    </div>
  );
};
```

### 3. Désactiver les Boutons pour les Viewers

```jsx
{user.role === 'viewer' ? (
  <button disabled title="Vous devez être promu pour modifier">
    Modifier
  </button>
) : (
  <button onClick={handleEdit}>
    Modifier
  </button>
)}
```

---

## 🧪 Tester le Système

### Test 1 : Créer un Viewer

```bash
# 1. Inscrivez-vous avec un email NON présent dans adminConfig.js
# 2. Connectez-vous
# 3. Essayez de créer un musicien
# ✅ Résultat attendu : Erreur 403 - Accès refusé
```

### Test 2 : Créer un Admin Automatique

```bash
# 1. Ajoutez un email dans config/adminConfig.js
# 2. Inscrivez-vous avec cet email
# 3. Connectez-vous
# 4. Créez un musicien
# ✅ Résultat attendu : Succès !
```

### Test 3 : Promouvoir un Utilisateur

```bash
# En tant qu'admin :
POST /api/users/promote
{
  "email": "viewer@exemple.com"
}
# ✅ Résultat : Utilisateur promu en admin
```

---

## 📊 Base de Données Partagée

### ✅ Comment ça Marche

- **Tous les utilisateurs** accèdent à la **même base MongoDB**
- **Même collection** pour musiciens, événements, cotisations
- **Pas d'isolation** : tout le monde voit les mêmes données
- **Différence** : Seuls admins/responsables peuvent modifier

### 💾 Structure des Données

```
MongoDB Database: worship-team-manager
│
├── Collection: users
│   ├── user1 (viewer)
│   ├── user2 (responsable)
│   └── user3 (admin)
│
├── Collection: members (PARTAGÉE)
│   ├── musicien1
│   ├── musicien2
│   └── musicien3
│
└── Collection: events (PARTAGÉE)
    ├── event1
    └── event2
```

---

## ⚠️ Points Importants

### ✅ À Faire

1. **Configurez vos admins** dans `config/adminConfig.js` AVANT la première inscription
2. **Vérifiez les emails** dans la liste avant de vous inscrire
3. **Testez avec différents rôles** pour valider les permissions
4. **Mettez à jour le frontend** pour afficher/masquer les boutons

### ❌ À Éviter

1. Ne mettez PAS vos emails admins dans le code public (GitHub)
2. Ne partagez PAS vos tokens JWT
3. N'oubliez PAS de redémarrer le serveur après modification de `adminConfig.js`
4. Ne supprimez PAS le dernier admin (gardez-en toujours au moins un)

---

## 🆘 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| "Accès refusé" | Vérifiez votre rôle dans MongoDB ou reconnectez-vous |
| Nouveau compte pas admin | Vérifiez que l'email est dans `adminConfig.js` |
| Erreur "Token invalide" | Reconnectez-vous pour obtenir un nouveau token |
| Can't modify data | Normal si vous êtes "viewer" - contactez un admin |

---

## 📞 Commandes Utiles

```bash
# Démarrer le serveur
npm start

# Créer le premier admin (méthode manuelle)
npm run setup-admin

# Migrer les utilisateurs existants
npm run migrate-users

# Mode développement (auto-reload)
npm run dev
```

---

## ✅ Checklist de Déploiement

- [ ] Fichiers backend copiés
- [ ] `config/adminConfig.js` configuré avec vos emails
- [ ] `.env` créé et rempli
- [ ] Dépendances installées (`npm install`)
- [ ] Premier compte admin créé et testé
- [ ] Frontend mis à jour pour gérer les rôles
- [ ] Tests effectués avec viewer/responsable/admin
- [ ] Documentation lue et comprise

---

**🎉 Félicitations ! Votre système de gestion est maintenant sécurisé et fonctionnel !**

Pour plus de détails, consultez `GUIDE_INSTALLATION_ROLES.md`
