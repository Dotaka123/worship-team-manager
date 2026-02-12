# 🎨 Guide d'Intégration Frontend - Système de Rôles

## 📋 Modifications Nécessaires dans le Frontend

---

## 1️⃣ Mise à Jour du AuthContext

### Fichier : `src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au chargement, vérifier le localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message);

    // ⬅️ IMPORTANT : Stocker le rôle
    const userData = {
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role, // ⬅️ Nouveau champ !
      token: data.token
    };

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    return userData;
  };

  const register = async (name, email, password) => {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // ⬅️ NOUVELLES FONCTIONS UTILITAIRES
  const canModify = () => {
    return user?.role === 'admin' || user?.role === 'responsable';
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isViewer = () => {
    return user?.role === 'viewer';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        loading,
        canModify,
        isAdmin,
        isViewer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 2️⃣ Composant de Badge de Rôle

### Fichier : `src/components/RoleBadge.jsx`

```jsx
const RoleBadge = ({ role }) => {
  const roleConfig = {
    admin: {
      label: 'Administrateur',
      color: 'bg-red-500',
      icon: '👑'
    },
    responsable: {
      label: 'Responsable',
      color: 'bg-blue-500',
      icon: '📝'
    },
    viewer: {
      label: 'Lecteur',
      color: 'bg-gray-500',
      icon: '👁️'
    }
  };

  const config = roleConfig[role] || roleConfig.viewer;

  return (
    <span className={`${config.color} text-white px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default RoleBadge;
```

---

## 3️⃣ Hook Personnalisé pour les Permissions

### Fichier : `src/hooks/usePermissions.js`

```jsx
import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user, canModify, isAdmin, isViewer } = useAuth();

  return {
    // Permissions de base
    canView: !!user,
    canModify: canModify(),
    canManageUsers: isAdmin(),
    isReadOnly: isViewer(),

    // Alias pratiques
    canCreate: canModify(),
    canEdit: canModify(),
    canDelete: canModify(),

    // Vérifications spécifiques
    canPromoteUsers: isAdmin(),
    canDeleteUsers: isAdmin(),

    // Informations utilisateur
    userRole: user?.role,
    userName: user?.name,
    userEmail: user?.email
  };
};
```

---

## 4️⃣ Exemple d'Utilisation - Liste de Musiciens

### Fichier : `src/pages/Musicians.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import RoleBadge from '../components/RoleBadge';

const Musicians = () => {
  const { user } = useAuth();
  const { canModify, isReadOnly } = usePermissions();
  const [musicians, setMusicians] = useState([]);

  useEffect(() => {
    fetchMusicians();
  }, []);

  const fetchMusicians = async () => {
    const response = await fetch('http://localhost:5000/api/members', {
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });
    const data = await response.json();
    setMusicians(data);
  };

  const handleDelete = async (id) => {
    if (!canModify) {
      alert('Vous n\'avez pas la permission de supprimer des musiciens');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        fetchMusicians();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Musiciens</h1>
        
        {/* Afficher le rôle de l'utilisateur */}
        <RoleBadge role={user.role} />
      </div>

      {/* Message pour les viewers */}
      {isReadOnly && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-medium">Mode Lecture Seule</p>
          <p className="text-sm">Vous pouvez consulter les données mais pas les modifier. Contactez un administrateur pour obtenir plus de permissions.</p>
        </div>
      )}

      {/* Bouton d'ajout - seulement pour admin/responsable */}
      {canModify && (
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4"
        >
          + Ajouter un Musicien
        </button>
      )}

      {/* Liste des musiciens */}
      <div className="grid gap-4">
        {musicians.map(musician => (
          <div key={musician._id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{musician.name}</h3>
              <p className="text-gray-600">{musician.instrument}</p>
            </div>

            <div className="flex gap-2">
              {/* Boutons - seulement pour admin/responsable */}
              {canModify ? (
                <>
                  <button 
                    onClick={() => handleEdit(musician._id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => handleDelete(musician._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Supprimer
                  </button>
                </>
              ) : (
                // Boutons désactivés pour les viewers
                <>
                  <button 
                    disabled
                    className="bg-gray-300 text-gray-500 px-3 py-1 rounded cursor-not-allowed"
                    title="Permission requise"
                  >
                    Modifier
                  </button>
                  <button 
                    disabled
                    className="bg-gray-300 text-gray-500 px-3 py-1 rounded cursor-not-allowed"
                    title="Permission requise"
                  >
                    Supprimer
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Musicians;
```

---

## 5️⃣ Page de Gestion des Utilisateurs (Admin uniquement)

### Fichier : `src/pages/UserManagement.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import RoleBadge from '../components/RoleBadge';

const UserManagement = () => {
  const { user } = useAuth();
  const { canManageUsers } = usePermissions();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rediriger si pas admin
    if (!canManageUsers) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [canManageUsers, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const promoteUser = async (email) => {
    if (!confirm(`Promouvoir ${email} en administrateur ?`)) return;

    try {
      const response = await fetch('http://localhost:5000/api/users/promote', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erreur lors de la promotion');
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erreur lors du changement de rôle');
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gestion des Utilisateurs</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u._id}>
                <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {u._id !== user._id && (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="responsable">Responsable</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {u._id === user._id && (
                    <span className="text-gray-500 text-sm">Vous</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
```

---

## 6️⃣ Composant de Route Protégée

### Fichier : `src/components/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
```

### Utilisation dans App.jsx

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Routes protégées normales */}
        <Route path="/musicians" element={
          <ProtectedRoute>
            <Musicians />
          </ProtectedRoute>
        } />

        {/* Routes admin uniquement */}
        <Route path="/users" element={
          <ProtectedRoute requireAdmin={true}>
            <UserManagement />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 7️⃣ Composant de Navigation avec Rôle

### Fichier : `src/components/Navbar.jsx`

```jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import RoleBadge from './RoleBadge';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { canManageUsers } = usePermissions();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Link to="/" className="font-bold text-xl">Worship Team</Link>
          <Link to="/musicians">Musiciens</Link>
          <Link to="/events">Événements</Link>
          
          {/* Lien admin seulement */}
          {canManageUsers && (
            <Link to="/users" className="flex items-center gap-1">
              👑 Utilisateurs
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <RoleBadge role={user.role} />
          <span>{user.name}</span>
          <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

---

## ✅ Checklist d'Intégration Frontend

- [ ] AuthContext mis à jour pour stocker le rôle
- [ ] Hook `usePermissions` créé
- [ ] Composant `RoleBadge` créé
- [ ] Routes protégées avec `ProtectedRoute`
- [ ] Boutons conditionnels selon les permissions
- [ ] Page de gestion des utilisateurs (admin)
- [ ] Navigation mise à jour avec accès admin
- [ ] Messages d'information pour les viewers
- [ ] Gestion des erreurs 403 (Accès refusé)

---

## 🎯 Bonnes Pratiques

1. **Toujours vérifier côté backend** - Le frontend peut être contourné
2. **Afficher des messages clairs** aux viewers
3. **Désactiver les boutons** plutôt que de les cacher
4. **Gérer les erreurs 403** avec des messages explicites
5. **Utiliser des hooks personnalisés** pour éviter la répétition

---

✨ **Votre frontend est maintenant prêt à gérer le système de rôles !**
