# 🍞 Toast Notifications - Guide d'Implémentation

## Vue d'ensemble

Le système de notifications toast a été intégré dans SIAC-IoT en utilisant **react-hot-toast** pour améliorer l'expérience utilisateur avec des retours visuels élégants et non-intrusifs.

## Installation

```bash
npm install react-hot-toast
```

✅ **Status**: Installé et configuré

## Configuration Globale

### Dans `App.jsx`

```javascript
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#110622',
            color: '#fff',
            fontWeight: '600',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}
      />
      {/* Reste de l'application */}
    </>
  )
}
```

**Paramètres**:
- **Position**: `top-right` - Notifications en haut à droite
- **Durée**: 4000ms (4 secondes)
- **Style**: Thème sombre (#110622) cohérent avec le design

## Implémentation par Page

### 1. Page Login (`Login.jsx`)

**Cas d'usage**: Validation et retour de connexion

```javascript
import toast from 'react-hot-toast'

// Validation des champs
if (!email || !password) {
  toast.error('Veuillez remplir tous les champs')
  return
}

// Connexion avec promise
toast.promise(
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'admin' && password === 'admin') {
        localStorage.setItem('user', JSON.stringify({ email, role: 'admin' }))
        resolve({ user: email })
      } else {
        reject(new Error('Identifiants incorrects'))
      }
    }, 1000)
  }),
  {
    loading: 'Connexion en cours...',
    success: 'Connexion réussie!',
    error: 'Identifiants incorrects',
  }
).then(() => navigate('/admin'))
```

**États gérés**:
- ⏳ Loading: "Connexion en cours..."
- ✅ Success: "Connexion réussie!" → Redirection vers `/admin`
- ❌ Error: "Identifiants incorrects"

### 2. Page Admin (`Admin.jsx`)

**Cas d'usage**: Gestion utilisateurs et paramètres système

#### Suppression d'utilisateur
```javascript
const handleDeleteUser = (userId) => {
  toast.promise(
    new Promise((resolve) => {
      setTimeout(() => {
        setUsers(users.filter(u => u.id !== userId))
        resolve()
      }, 800)
    }),
    {
      loading: 'Suppression en cours...',
      success: 'Utilisateur supprimé avec succès',
      error: 'Erreur lors de la suppression',
    }
  )
}
```

#### Toggle du statut
```javascript
const handleToggleStatus = (userId) => {
  toast.promise(
    new Promise((resolve) => {
      setTimeout(() => {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
        ))
        resolve()
      }, 500)
    }),
    {
      loading: 'Mise à jour...',
      success: 'Statut modifié',
      error: 'Erreur',
    }
  )
}
```

#### Sauvegarde des paramètres
```javascript
const handleSaveSettings = (e) => {
  e.preventDefault()
  toast.promise(
    new Promise((resolve) => {
      setTimeout(() => resolve(), 1200)
    }),
    {
      loading: 'Enregistrement des paramètres...',
      success: 'Paramètres enregistrés avec succès!',
      error: 'Erreur lors de l\'enregistrement',
    }
  )
}
```

**Fonctionnalités**:
- Suppression d'utilisateur
- Activation/désactivation de comptes
- Sauvegarde des configurations MQTT, InfluxDB, Email
- Backup système

### 3. Page Devices (`Devices.jsx`)

**Cas d'usage**: Actions sur les appareils IoT

```javascript
import toast from 'react-hot-toast'

const handleDeviceAction = (deviceId) => {
  toast.promise(
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: deviceId, details: 'Device actif, 25°C, 45% CPU' })
      }, 1000)
    }),
    {
      loading: 'Chargement des détails...',
      success: (data) => `Détails du device ${data.id}`,
      error: 'Impossible de charger les détails',
    }
  )
}

// Dans le JSX
<button onClick={() => handleDeviceAction(d.id)}>
  Détails
</button>
```

**Actions**:
- Affichage des détails d'appareil
- Chargement asynchrone des informations

### 4. Page Alerts (`Alerts.jsx`)

**Cas d'usage**: Analyse ML des alertes

```javascript
import toast from 'react-hot-toast'

const handleAnalyze = (alertId) => {
  toast.promise(
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          details: 'Analyse ML complétée', 
          recommendations: ['Vérifier la source', 'Bloquer IP suspecte'] 
        })
      }, 1500)
    }),
    {
      loading: 'Analyse en cours...',
      success: (data) => `Analyse terminée - ${data.recommendations.length} recommandations`,
      error: 'Échec de l\'analyse',
    }
  )
}

// Dans le JSX
<button onClick={() => handleAnalyze(alert.id)}>
  Analyser
</button>
```

**Analyse ML**:
- Détection d'anomalies
- Recommandations de sécurité
- Retour visuel du traitement

## Types de Notifications Utilisées

### 1. `toast.error(message)`
Usage: Erreurs de validation, échecs d'opération
```javascript
toast.error('Veuillez remplir tous les champs')
```

### 2. `toast.success(message)`
Usage: Confirmations rapides
```javascript
toast.success('Opération réussie!')
```

### 3. `toast.promise(promise, messages)`
Usage: Opérations asynchrones avec états multiples
```javascript
toast.promise(
  asyncOperation(),
  {
    loading: 'En cours...',
    success: 'Terminé!',
    error: 'Erreur!',
  }
)
```

## Design Pattern Recommandé

### Pattern Async avec Promise

```javascript
const handleAction = (params) => {
  toast.promise(
    // Votre opération asynchrone (API call, setTimeout pour mock)
    new Promise((resolve, reject) => {
      // Simuler appel API
      setTimeout(() => {
        const success = Math.random() > 0.2 // 80% succès
        if (success) {
          resolve({ data: 'résultat' })
        } else {
          reject(new Error('échec'))
        }
      }, 1000)
    }),
    {
      loading: 'Message de chargement...',
      success: (data) => `Succès: ${data.data}`, // Peut utiliser les données retournées
      error: (err) => `Erreur: ${err.message}`, // Peut utiliser l'erreur
    }
  )
}
```

## Personnalisation Avancée

### Toast personnalisé avec durée spécifique
```javascript
toast.success('Message important', {
  duration: 6000, // 6 secondes
  icon: '🎉',
})
```

### Toast avec action
```javascript
toast((t) => (
  <span>
    Voulez-vous continuer?
    <button onClick={() => {
      handleAction()
      toast.dismiss(t.id)
    }}>
      Oui
    </button>
  </span>
), { duration: Infinity })
```

## État d'Implémentation

| Page | Intégré | Fonctionnalités |
|------|---------|-----------------|
| Login | ✅ | Validation, connexion asynchrone |
| Admin | ✅ | CRUD utilisateurs, sauvegarde paramètres |
| Devices | ✅ | Détails d'appareil |
| Alerts | ✅ | Analyse ML |
| Dashboard | ⚪ | Pas d'actions interactives |

## Tests Fonctionnels

### Scénario de test complet

1. **Login**
   - Tester validation (champs vides) → Toast error
   - Tester mauvais credentials → Toast error
   - Tester login réussi → Toast success + redirection

2. **Admin**
   - Supprimer un utilisateur → Toast loading/success
   - Changer statut → Toast loading/success
   - Sauvegarder paramètres → Toast loading/success

3. **Devices**
   - Cliquer "Détails" → Toast loading/success avec info device

4. **Alerts**
   - Cliquer "Analyser" → Toast loading/success avec recommandations

## Prochaines Étapes

### Intégration Backend API

Quand les endpoints API seront prêts:

```javascript
// Exemple avec fetch
const handleRealLogin = (email, password) => {
  toast.promise(
    fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(res => {
      if (!res.ok) throw new Error('Login failed')
      return res.json()
    }),
    {
      loading: 'Connexion en cours...',
      success: (data) => `Bienvenue ${data.user.email}!`,
      error: (err) => `Erreur: ${err.message}`,
    }
  )
}
```

### Gestion d'erreurs réseau
```javascript
toast.promise(
  apiCall(),
  {
    loading: 'Envoi...',
    success: 'Succès!',
    error: (err) => {
      if (!navigator.onLine) return 'Pas de connexion internet'
      if (err.status === 401) return 'Session expirée'
      if (err.status === 500) return 'Erreur serveur'
      return 'Une erreur est survenue'
    },
  }
)
```

## Ressources

- Documentation officielle: https://react-hot-toast.com
- Repo GitHub: https://github.com/timolins/react-hot-toast
- Thème SIAC-IoT: #110622 (primary), #ffffff (text)

---

**Date de création**: 2025
**Version**: 1.0
**Maintenu par**: Équipe SIAC-IoT
