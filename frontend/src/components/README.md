# Components Directory

This directory contains reusable UI components for the SIAC-IoT application.

## Structure

```
components/
├── cards/           # Card-related components
│   ├── StatCard.jsx        # Gradient stat cards with icons
│   ├── ContentCard.jsx     # Content cards with gradient headers
│   ├── ActivityItem.jsx    # Activity list item component
│   ├── ProgressBar.jsx     # Progress bar with gradient
│   └── index.js            # Card components exports
├── layout/          # Layout components
│   ├── PageHeader.jsx      # Page title and description
│   └── index.js            # Layout components exports
└── ui/              # Base UI components (from shadcn/ui)
    ├── badge.jsx
    ├── button.jsx
    ├── card.jsx
    └── input.jsx
```

## Card Components

### StatCard
Gradient stat card with icon and glassmorphism effect.

**Props:**
- `title` (string) - Card title
- `value` (string|number) - Main value to display
- `description` (string) - Description text below value
- `icon` (Component) - Lucide icon component
- `gradient` (string) - Tailwind gradient classes

**Example:**
```jsx
<StatCard
  title="Devices Actifs"
  value="24"
  description="+2 depuis hier"
  icon={Activity}
  gradient="from-violet-500 via-purple-600 to-indigo-700"
/>
```

### ContentCard
Content card with gradient header and icon.

**Props:**
- `title` (string) - Card title
- `description` (string) - Card description
- `icon` (Component) - Lucide icon component
- `iconColor` (string) - Icon color (e.g., "violet")
- `gradientFrom` (string) - Gradient start color
- `gradientTo` (string) - Gradient end color
- `children` (ReactNode) - Card content
- `headerActions` (ReactNode) - Optional header actions

**Example:**
```jsx
<ContentCard
  title="Activité Récente"
  description="Événements des dernières heures"
  icon={Activity}
  iconColor="violet"
  gradientFrom="violet-50"
  gradientTo="purple-50"
>
  <div>Your content here</div>
</ContentCard>
```

### ActivityItem
Activity list item with icon, badge, and timestamp.

**Props:**
- `text` (string) - Activity text
- `time` (string) - Time information
- `type` (string) - Activity type (success, danger, warning, info)
- `icon` (Component) - Lucide icon component
- `getActivityColor` (function) - Function to get color based on type
- `getBadgeVariant` (function) - Function to get badge variant

### ProgressBar
Progress bar with gradient fill.

**Props:**
- `label` (string) - Progress label
- `percentage` (number) - Progress percentage (0-100)
- `gradient` (string) - CSS gradient for the progress bar

**Example:**
```jsx
<ProgressBar 
  label="Santé des capteurs" 
  percentage={96} 
  gradient="linear-gradient(to right, #07005F, #5b21b6)" 
/>
```

## Layout Components

### PageHeader
Page title with optional icon and description.

**Props:**
- `title` (string) - Page title
- `description` (string) - Page description (optional)
- `icon` (Component) - Icon component (optional)

**Example:**
```jsx
<PageHeader 
  title="Tableau de bord" 
  description="Vue d'ensemble de votre infrastructure IoT"
  icon={Activity}
/>
```

## Usage

Import components from their respective index files:

```jsx
import { StatCard, ContentCard, ActivityItem, ProgressBar } from '@/components/cards'
import { PageHeader } from '@/components/layout'
```

## Benefits

- **Reusability**: Components can be used across multiple pages
- **Consistency**: Ensures uniform design across the application
- **Maintainability**: Changes to component design only need to be made once
- **Scalability**: Easy to add new components and extend existing ones
- **Type Safety**: Well-documented props for better developer experience
