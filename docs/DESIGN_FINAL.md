# 🎨 Design System - SIAC-IoT Platform

## Vue d'ensemble

Ce document décrit le système de design complet de la plateforme SIAC-IoT, incluant la palette de couleurs, la typographie, les composants et les animations.

---

## 🎨 Palette de couleurs

### Couleurs principales
```css
--primary: #110622           /* Violet foncé principal */
--primary-light: #1a0d30     /* Violet clair */
--primary-dark: #0a0311      /* Violet très foncé */
--accent: #667eea            /* Bleu-violet accent */
--accent-light: #764ba2      /* Violet accent */
```

### Couleurs système
```css
--success: #10b981           /* Vert succès */
--warning: #f59e0b           /* Orange avertissement */
--danger: #ef4444            /* Rouge erreur/danger */
```

### Nuances de gris
```css
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827
--white: #ffffff
```

### Gradients
```css
--gradient-primary: linear-gradient(135deg, #110622 0%, #1a0d30 50%, #2d1a4a 100%)
--gradient-accent: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%)
--gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)
--gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%)
```

---

## ✍️ Typographie

### Police de caractères
- **Famille principale** : `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'`
- **Famille monospace** : `'JetBrains Mono', 'Monaco', 'Courier New'`

### Hiérarchie des tailles
```css
body: 14px                /* Texte standard */
h1: 28px (mobile: 24px)   /* Titre principal */
h2: 22px (mobile: 20px)   /* Sous-titre */
h3: 18px (mobile: 16px)   /* Titre de section */

/* Composants spécifiques */
Stat values: 36px         /* Valeurs de statistiques */
Sidebar logo: 18px        /* Logo sidebar */
Navigation: 14px          /* Liens de navigation */
Labels: 12px              /* Étiquettes de formulaire */
Badges: 11px              /* Badges de statut */
Table headers: 11px       /* En-têtes de tableaux */
Code: 13px                /* Blocs de code */
Text muted: 13px          /* Texte secondaire */
```

### Poids de police
- **Normal** : 400
- **Medium** : 500
- **Semi-bold** : 600
- **Bold** : 700

---

## 📐 Espacements & Dimensions

### Radius (Border-radius)
```css
--radius-sm: 8px          /* Petit */
--radius: 12px            /* Moyen */
--radius-lg: 16px         /* Grand */
```

### Ombres (Shadows)
```css
--shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### Dimensions fixes
```css
--sidebar-width: 280px    /* Largeur sidebar desktop */
--header-height: 70px     /* Hauteur en-tête (si utilisé) */
```

---

## 🧩 Composants

### 1. Cards (Cartes)
```css
Background: var(--white)
Padding: 1.75rem
Border-radius: var(--radius-lg)
Shadow: 0 1px 3px rgba(0,0,0,0.05)
Border: 1px solid rgba(0,0,0,0.05)

Hover:
- transform: translateY(-4px)
- shadow: 0 12px 24px rgba(0,0,0,0.1)
- border-color: rgba(102, 126, 234, 0.2)
```

**Effet spécial** : Ligne animée en haut au survol (gradient accent)

### 2. Stat Cards (Cartes de statistiques)
```css
Background: var(--white)
Padding: 2rem
Border-radius: var(--radius)
Border-top: 4px avec gradient (au survol)

Variantes:
- .stat-card (défaut - accent)
- .stat-card.success (vert)
- .stat-card.warning (orange)
- .stat-card.danger (rouge)
```

**Effet spécial** :
- Barre colorée en haut qui se dévoile au survol
- Cercle décoratif en arrière-plan
- Animation d'entrée avec délais échelonnés

### 3. Sidebar
```css
Position: fixed left
Width: 280px
Background: gradient-primary
Shadow: 4px 0 24px rgba(0, 0, 0, 0.12)

Mobile (<768px):
- transform: translateX(-280px) par défaut
- Overlay avec backdrop-filter blur
- Hamburger menu button
```

**Effet glassmorphism** : Radial gradients subtils en superposition

#### Navigation Links
```css
Padding: 0.875rem 1.5rem
Border-radius: 10px
Gap: 0.875rem

Hover:
- background: rgba(255,255,255,0.08)
- transform: translateX(4px)
- icône scale(1.2)

Active:
- background: rgba(255,255,255,0.12)
- Barre gauche colorée (gradient accent)
```

#### Logo
```css
Font-size: 18px
Font-weight: 700
Gradient text effect (white → #e0e7ff)

Image hover:
- transform: rotate(5deg) scale(1.05)
```

#### Logout Button
```css
Background: rgba(239, 68, 68, 0.12)
Color: #fca5a5
Border: 1.5px solid rgba(239, 68, 68, 0.3)
Border-radius: 10px

Hover:
- Effet ripple circulaire
- transform: translateY(-2px)
- shadow: 0 4px 12px rgba(239, 68, 68, 0.3)
```

### 4. Buttons
```css
Background: gradient-primary
Color: white
Padding: 0.75rem 1.5rem
Border-radius: var(--radius-sm)
Font-size: 14px
Font-weight: 600

Hover:
- Effet ripple blanc
- transform: translateY(-2px)
- shadow: 0 6px 16px rgba(17, 6, 34, 0.3)
```

### 5. Inputs
```css
Padding: 0.75rem 1rem
Border: 2px solid var(--gray-200)
Border-radius: var(--radius-sm)
Font-size: 14px

Focus:
- border-color: var(--accent)
- shadow: 0 0 0 4px rgba(102, 126, 234, 0.1)
- transform: translateY(-1px)
```

### 6. Tables
```css
Border-collapse: separate
Border-spacing: 0
Border-radius: var(--radius)
Overflow: hidden
Shadow: 0 1px 3px rgba(0,0,0,0.05)

Headers:
- background: var(--gray-50)
- padding: 1rem 1.25rem
- font-size: 11px
- letter-spacing: 1px
- border-bottom: 2px solid var(--gray-200)

Rows:
- padding: 1rem 1.25rem
- border-bottom: 1px solid var(--gray-100)

Row hover:
- background: linear-gradient(90deg, rgba(102, 126, 234, 0.03), rgba(102, 126, 234, 0.01))
- transform: scale(1.002)
```

### 7. Badges
```css
Display: inline-flex
Padding: 0.375rem 0.875rem
Border-radius: 16px
Font-size: 11px
Border: 1.5px solid

Variantes:
- .badge.online (vert avec point animé)
- .badge.warning (orange)
- .badge.offline (gris)

Effet spécial:
- Box-shadow colorée (0 0 0 3px)
- Point pulsant pour statut "online"
```

### 8. Alert Cards
```css
Background: white avec gradient subtle
Padding: 1.75rem
Border-left: 5px solid (couleur variante)
Border-radius: var(--radius)

Variantes:
- .alert-card.critical (rouge)
- .alert-card.medium (orange)
- .alert-card.low (bleu)

Hover:
- transform: translateX(6px)
- shadow colorée selon variante
```

---

## 🎬 Animations

### 1. Fade In Up (Cards, Container)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
Duration: 0.6s ease-out
```

### 2. Slide In (Stat Cards)
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
Duration: 0.5s ease-out
Delays échelonnés: 0.1s, 0.15s, 0.2s, 0.25s
```

### 3. Pulse (Badge online)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}
Duration: 2s ease-in-out infinite
```

### 4. Float (Background decoratif - Login)
```css
@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}
Duration: 8-10s ease-in-out infinite
```

### 5. Ripple Effect (Buttons)
```css
Effet de cercle blanc qui s'agrandit depuis le centre
Width/Height: 0 → 300px
Transition: 0.5s ease
Background: rgba(255, 255, 255, 0.25)
```

---

## 📱 Responsive Design

### Breakpoints
```css
Desktop: > 1024px
Tablet: 768px - 1024px
Mobile: < 768px
Small mobile: < 480px
```

### Adaptations mobiles

#### Sidebar
```css
< 768px:
- Position fixed avec overlay
- Transform: translateX(-280px) par défaut
- Hamburger menu (50px × 50px, top-left)
- Overlay: rgba(0, 0, 0, 0.6) + backdrop-filter blur
```

#### Grids
```css
Desktop: 4 colonnes (repeat(4, 1fr))
Tablet: 2 colonnes
Mobile: 1 colonne

Stats grid: repeat(auto-fit, minmax(250px, 1fr))
```

#### Typography (Mobile)
```css
h1: 28px → 24px
h2: 22px → 20px
h3: 18px → 16px
```

#### Tables
```css
.table-responsive:
- overflow-x: auto
- -webkit-overflow-scrolling: touch
- min-width: 600px (table elle-même)
```

---

## 🎯 Guidelines d'utilisation

### Hiérarchie visuelle
1. **Stat Cards** en haut pour KPIs
2. **Graphiques/Charts** au milieu
3. **Tables de données** en bas
4. **Info cards** en pied de page

### Spacing
- Margins entre sections : 1.5rem - 2rem
- Padding des cards : 1.75rem - 2rem
- Gap dans grids : 1.5rem

### Couleurs sémantiques
- **Success (vert)** : État OK, connexion établie, opération réussie
- **Warning (orange)** : Attention requise, seuil proche
- **Danger (rouge)** : Erreur critique, anomalie, déconnexion
- **Info (bleu/accent)** : Information neutre, nouveauté

### Feedback utilisateur
- **Hover** : Toujours un effet visuel (transform, shadow, color)
- **Active** : Réduction de l'effet hover
- **Focus** : Ring coloré (box-shadow 0 0 0 4px)
- **Disabled** : opacity 0.6 + cursor not-allowed

### Performance
- Utiliser `transform` et `opacity` pour animations (GPU accelerated)
- `transition` avec `cubic-bezier(0.4, 0, 0.2, 1)` pour fluidité
- Éviter `box-shadow` animé, préférer `transform`

---

## 🔍 Accessibilité (A11Y)

### Contraste
- Texte principal sur blanc : ratio > 7:1
- Texte secondaire (muted) : ratio > 4.5:1
- Badges et labels : vérifier contraste couleur/background

### Navigation clavier
- Focus visible sur tous les éléments interactifs
- Tab order logique
- Enter/Space pour activer boutons

### Scrollbar personnalisée
```css
::-webkit-scrollbar: 8px width/height
Track: var(--gray-100)
Thumb: var(--gray-400)
Hover: var(--gray-500)
Border-radius: 4px
```

---

## 📦 Fichiers du design system

```
frontend/src/
├── styles.css              # Styles globaux et composants
├── pages/
│   ├── Login.jsx          # Page de connexion (design premium)
│   ├── Dashboard.jsx      # Dashboard amélioré
│   ├── Devices.jsx        # Liste des devices
│   ├── Alerts.jsx         # Gestion des alertes
│   └── Admin.jsx          # Administration
└── components/
    └── Sidebar.jsx        # Composant sidebar (dans App.jsx)
```

---

## 🚀 Points forts du design

1. **Glassmorphism** : Effets de verre sur sidebar et login
2. **Gradients subtils** : Backgrounds et textes avec dégradés
3. **Micro-interactions** : Animations fluides sur hover/focus
4. **Depth (Profondeur)** : Utilisation intelligente des ombres
5. **Cohérence** : Variables CSS pour maintenance facile
6. **Performance** : Animations GPU accelerated
7. **Responsive** : Mobile-first avec breakpoints adaptés
8. **Accessibilité** : Contraste, focus, navigation clavier

---

## 📝 Notes de mise en œuvre

### Login Page
- Background animé avec cercles flottants
- Card glassmorphism avec blur
- Logo avec effet rotation au hover
- Titre avec gradient text
- Inputs avec focus ring accent

### Dashboard
- Header avec statut système (point vert pulsant)
- Stat cards avec barres colorées animées
- Activity feed avec icônes et couleurs contextuelles
- Info cards avec backgrounds gradients subtils

### Sidebar
- Logo avec gradient text effect
- Navigation avec barres latérales au hover/active
- Icônes qui s'agrandissent au hover
- Logout button avec ripple effect
- Footer discret

---

**Version** : 1.0 - Design Final  
**Date** : Novembre 2025  
**Auteur** : SIAC-IoT Team  
**Stack** : React 18 + CSS Variables + Modern Web Standards
