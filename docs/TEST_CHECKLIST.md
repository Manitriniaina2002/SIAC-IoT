# ✅ Checklist de Test - SIAC-IoT Responsive & Auth

## 🔐 Tests d'Authentification

### Test 1 : Redirection Login par défaut
- [ ] Ouvrir http://localhost:5173/
- [ ] **Attendu** : Redirection automatique vers `/login`
- [ ] **Vérification** : URL affiche `/login`, formulaire visible

### Test 2 : Login Success
- [ ] Sur la page login, entrer :
  - Email : `admin`
  - Password : `admin`
- [ ] Cliquer "Se connecter"
- [ ] **Attendu** : 
  - Toast "Connexion en cours..." puis "Connexion réussie!"
  - Redirection vers `/admin`
  - Sidebar visible avec bouton "Déconnexion"

### Test 3 : Login Validation
- [ ] Laisser les champs vides, cliquer "Se connecter"
- [ ] **Attendu** : Toast error "Veuillez remplir tous les champs"
- [ ] Entrer mauvais credentials (ex: test/test)
- [ ] **Attendu** : Toast error "Identifiants incorrects"

### Test 4 : Protection des Routes
- [ ] Déconnectez-vous (ou videz localStorage)
- [ ] Tentez d'accéder directement à `/dashboard`
- [ ] **Attendu** : Redirection immédiate vers `/login`
- [ ] Même test pour `/devices`, `/alerts`, `/admin`

### Test 5 : Déconnexion
- [ ] Connectez-vous (admin/admin)
- [ ] Dans la sidebar, vérifier que "Login" 🔐 est devenu "Déconnexion" 🚪
- [ ] Cliquer sur "Déconnexion"
- [ ] **Attendu** :
  - Toast "Déconnexion réussie"
  - Redirection vers `/login`
  - Impossible d'accéder aux pages sans nouvelle connexion

### Test 6 : Persistance Session
- [ ] Connectez-vous
- [ ] Rafraîchir la page (F5)
- [ ] **Attendu** : Reste connecté, pas de redirection login
- [ ] Fermer l'onglet, rouvrir
- [ ] **Attendu** : Toujours connecté (localStorage persiste)

---

## 📱 Tests Responsive - Mobile (< 768px)

### Test 7 : Menu Hamburger Visible
- [ ] Réduire fenêtre à < 768px (ou DevTools mobile)
- [ ] **Attendu** : 
  - Bouton hamburger (☰) visible en haut à gauche
  - Sidebar cachée (pas visible)
  - Main content prend toute la largeur

### Test 8 : Ouverture Menu Mobile
- [ ] Cliquer sur le bouton hamburger
- [ ] **Attendu** :
  - Sidebar slide depuis la gauche
  - Overlay semi-transparent apparaît
  - Logo "SIAC-IoT" et textes des liens visibles

### Test 9 : Fermeture Menu - Overlay
- [ ] Menu ouvert, cliquer sur l'overlay (zone grise)
- [ ] **Attendu** : Sidebar se ferme, overlay disparaît

### Test 10 : Fermeture Menu - Navigation
- [ ] Ouvrir menu, cliquer sur "Dashboard"
- [ ] **Attendu** :
  - Navigation vers Dashboard
  - Menu se ferme automatiquement
  - Overlay disparaît

### Test 11 : Stats Grid Mobile
- [ ] Sur Dashboard, vérifier les cartes stats
- [ ] **Attendu** : 
  - 1 colonne (cartes empilées verticalement)
  - Padding réduit mais lisible
  - Valeurs et labels bien alignés

### Test 12 : Tables Mobile
- [ ] Aller sur "Devices"
- [ ] **Attendu** :
  - Table avec scroll horizontal
  - Swipe gauche/droite pour voir colonnes cachées
  - Headers fixés en haut au scroll

### Test 13 : Formulaires Mobile (Admin)
- [ ] Aller sur "Admin"
- [ ] Tester le formulaire "Paramètres système"
- [ ] **Attendu** :
  - Inputs prennent 100% largeur
  - Boutons bien dimensionnés (faciles à toucher)
  - Pas de zoom automatique à la sélection d'input

### Test 14 : Alertes Mobile
- [ ] Aller sur "Alerts"
- [ ] **Attendu** :
  - Cartes d'alertes empilées
  - Score et bouton "Analyser" flex-wrap
  - Boutons tactiles (≥ 44px hauteur)

### Test 15 : Login Mobile
- [ ] Se déconnecter, afficher page login en mobile
- [ ] **Attendu** :
  - Logo réduit à 60px
  - Formulaire prend toute la largeur
  - Padding 1rem (pas trop serré)
  - H1 réduit mais lisible (1.5rem)

---

## 💻 Tests Responsive - Tablette (768px - 1024px)

### Test 16 : Sidebar Tablette
- [ ] Fenêtre entre 768px et 1024px
- [ ] **Attendu** :
  - Sidebar visible (280px)
  - Pas de bouton hamburger
  - Main content avec margin-left 280px

### Test 17 : Stats Grid Tablette
- [ ] Sur Dashboard
- [ ] **Attendu** : Grille 2 colonnes (2 cartes par ligne)

### Test 18 : Tables Tablette
- [ ] Vérifier tables sur Devices, Admin
- [ ] **Attendu** : Affichage normal, pas de scroll horizontal nécessaire

---

## 🖥️ Tests Responsive - Desktop (> 1024px)

### Test 19 : Layout Desktop
- [ ] Fenêtre > 1024px
- [ ] **Attendu** :
  - Sidebar 280px fixe à gauche
  - Pas de bouton hamburger
  - Stats grid 4 colonnes (ou auto-fit)
  - Tables complètes sans scroll

### Test 20 : Animations Desktop
- [ ] Hover sur liens sidebar
- [ ] **Attendu** : 
  - Transform translateX(4px)
  - Barre latérale blanche apparaît
  - Background rgba change
- [ ] Hover boutons
- [ ] **Attendu** : Transform translateY(-3px), shadow augmentée

---

## 🎯 Tests Fonctionnels avec Toast

### Test 21 : Toast Devices
- [ ] Sur "Devices", cliquer "Détails" sur un device
- [ ] **Attendu** :
  - Toast "Chargement des détails..."
  - Puis "Détails du device [ID]"
  - Fermeture auto après 4s

### Test 22 : Toast Alerts
- [ ] Sur "Alerts", cliquer "Analyser"
- [ ] **Attendu** :
  - Toast "Analyse en cours..."
  - Puis "Analyse terminée - 2 recommandations"
  - Fermeture auto après 4s

### Test 23 : Toast Admin - Delete User
- [ ] Sur "Admin", cliquer "🗑️ Supprimer" sur un user
- [ ] **Attendu** :
  - Toast "Suppression en cours..."
  - Puis "Utilisateur supprimé avec succès"
  - User retiré de la table

### Test 24 : Toast Admin - Toggle Status
- [ ] Cliquer bouton toggle status d'un user
- [ ] **Attendu** :
  - Toast "Mise à jour..."
  - Puis "Statut modifié"
  - Badge change (active ↔ inactive)

### Test 25 : Toast Admin - Save Settings
- [ ] Modifier un champ (ex: MQTT Broker), cliquer "Sauvegarder"
- [ ] **Attendu** :
  - Toast "Enregistrement des paramètres..."
  - Puis "Paramètres enregistrés avec succès!"

---

## 🔍 Tests de Performance Mobile

### Test 26 : Smooth Scrolling
- [ ] Sur mobile, scroller une page longue (Dashboard, Alerts)
- [ ] **Attendu** : Scroll fluide à 60fps, pas de lag

### Test 27 : Touch Interactions
- [ ] Tester tous les boutons avec doigt (sur appareil réel si possible)
- [ ] **Attendu** : Réponse immédiate, pas de double-tap nécessaire

### Test 28 : Sidebar Transition
- [ ] Ouvrir/fermer menu plusieurs fois rapidement
- [ ] **Attendu** : Animation 0.3s smooth, pas de glitch

---

## 🌐 Tests Cross-Browser

### Test 29 : Chrome/Edge
- [ ] Tester toutes les fonctionnalités sur Chrome/Edge
- [ ] **Attendu** : Tout fonctionne

### Test 30 : Firefox
- [ ] Répéter tests sur Firefox
- [ ] **Attendu** : Compatibilité complète

### Test 31 : Safari (si disponible)
- [ ] Tester sur Safari/iOS
- [ ] **Attendu** : 
  - Backdrop-filter fonctionne
  - Inputs ne zooment pas (font-size ≥ 16px)
  - Smooth scroll sur iOS

---

## 🐛 Tests de Régression

### Test 32 : Toasts Styling
- [ ] Vérifier tous les toasts (login, devices, alerts, admin)
- [ ] **Attendu** :
  - Background #110622
  - Texte blanc
  - Position top-right
  - Border-radius 12px
  - Icons colorés (success vert, error rouge)

### Test 33 : Logo Display
- [ ] Vérifier logo sur login
- [ ] Vérifier logo dans sidebar (desktop + mobile ouvert)
- [ ] **Attendu** : Logo SIAC-IoT visible, filtre invert sur sidebar

### Test 34 : Theme Consistency
- [ ] Parcourir toutes les pages
- [ ] **Attendu** : Couleur primaire #110622 cohérente partout

---

## 📊 Résultats Attendus

| Test | Desktop | Tablette | Mobile | Status |
|------|---------|----------|--------|--------|
| Auth | ✅ | ✅ | ✅ | |
| Navigation | ✅ | ✅ | ✅ | |
| Responsive Layout | ✅ | ✅ | ✅ | |
| Toasts | ✅ | ✅ | ✅ | |
| Forms | ✅ | ✅ | ✅ | |
| Tables | ✅ | ✅ | ✅ | |
| Animations | ✅ | ✅ | ✅ | |

---

## 🚀 Commandes de Test

### Lancer l'app
```bash
cd frontend
npm run dev
```

### DevTools Mobile
1. F12 pour ouvrir DevTools
2. Ctrl+Shift+M pour toggle device toolbar
3. Sélectionner iPhone 12 Pro ou custom 375px

### Test sur appareil réel
```bash
# Trouver votre IP (affichée par Vite)
# Exemple: http://192.168.1.100:5173

# Sur mobile, ouvrir navigateur et accéder à cette URL
```

---

**Date** : 11 Novembre 2025  
**Testeur** : ________________  
**Environnement** : ________________  
**Résultat global** : ☐ PASS ☐ FAIL

**Notes** :
_________________________________________
_________________________________________
_________________________________________
