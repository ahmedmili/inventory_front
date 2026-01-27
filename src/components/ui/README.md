# Composants UI Réutilisables

Ce dossier contient tous les composants UI réutilisables de l'application.

## 📦 Composants Disponibles

### StatisticsCard
Carte de statistiques avec schémas de couleurs prédéfinis.

```tsx
import { StatisticsCard } from '@/components/ui';
import { CalendarIcon } from '@/components/icons';

<StatisticsCard
  title="Total Réservations"
  value={totalReservations}
  icon={<CalendarIcon className="w-5 h-5" />}
  colorScheme="blue"
/>
```

**Props:**
- `title`: string - Titre de la carte
- `value`: string | number - Valeur à afficher
- `icon`: ReactNode - Icône à afficher
- `colorScheme`: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink'
- `className?`: string - Classes CSS supplémentaires

---

### StatusBadge
Badge de statut réutilisable avec styles prédéfinis.

```tsx
import { StatusBadge } from '@/components/ui';

<StatusBadge status="RESERVED" variant="default" size="md" />
```

**Props:**
- `status`: string - Statut à afficher (RESERVED, FULFILLED, ACTIVE, etc.)
- `variant?`: 'default' | 'rounded' | 'square' - Style du badge
- `size?`: 'sm' | 'md' | 'lg' - Taille du badge

**Statuts supportés:**
- Réservations: RESERVED, FULFILLED, RELEASED, CANCELLED
- Projets: ACTIVE, COMPLETED, ON_HOLD
- Autres: PENDING, CONFIRMED, EXPIRED

---

### ModernTable
Tableau moderne avec style gradient et lignes alternées.

```tsx
import { ModernTable } from '@/components/ui';

<ModernTable
  columns={columns}
  data={data}
  headerGradient="from-blue-600 via-blue-500 to-indigo-600"
  striped={true}
  hoverable={true}
  emptyMessage="Aucune donnée disponible"
  minWidth="600px"
/>
```

**Props:**
- `columns`: Column[] - Colonnes du tableau
- `data`: any[] - Données à afficher
- `headerGradient?`: string - Classes Tailwind pour le gradient du header
- `striped?`: boolean - Lignes alternées
- `hoverable?`: boolean - Effet hover sur les lignes
- `emptyMessage?`: string - Message quand aucune donnée
- `minWidth?`: string - Largeur minimale

---

### PageHeader
En-tête de page standardisé avec bouton retour et actions.

```tsx
import { PageHeader } from '@/components/ui';

<PageHeader
  title="Mes Réservations"
  description="Gérez vos réservations de produits"
  backUrl="/reservations"
  actions={<button>Action</button>}
  gradientFrom="from-blue-50"
  gradientTo="to-indigo-50"
/>
```

**Props:**
- `title`: string - Titre de la page
- `description?`: string - Description
- `backUrl?`: string - URL pour le bouton retour
- `actions?`: ReactNode - Actions à afficher à droite
- `gradientFrom?`: string - Classes Tailwind pour le gradient
- `gradientTo?`: string - Classes Tailwind pour le gradient

---

### SearchFilter
Filtre de recherche avec debounce intégré.

```tsx
import { SearchFilter } from '@/components/ui';

<SearchFilter
  value={search}
  onChange={setSearch}
  placeholder="Rechercher..."
  debounceMs={500}
  className="w-full"
/>
```

**Props:**
- `value`: string - Valeur actuelle
- `onChange`: (value: string) => void - Callback de changement
- `placeholder?`: string - Placeholder
- `debounceMs?`: number - Délai de debounce (défaut: 500ms)
- `className?`: string - Classes CSS supplémentaires

---

### SelectFilter
Filtre select réutilisable avec option de clear.

```tsx
import { SelectFilter } from '@/components/ui';

<SelectFilter
  label="Statut"
  value={statusFilter}
  onChange={setStatusFilter}
  options={[
    { value: 'RESERVED', label: 'Réservé' },
    { value: 'FULFILLED', label: 'Rempli' },
  ]}
  placeholder="Tous"
  showClear={statusFilter !== 'all'}
/>
```

**Props:**
- `value`: string - Valeur sélectionnée
- `onChange`: (value: string) => void - Callback de changement
- `options`: SelectOption[] - Options disponibles
- `placeholder?`: string - Placeholder
- `label?`: string - Label du champ
- `className?`: string - Classes CSS supplémentaires
- `showClear?`: boolean - Afficher le bouton clear

---

### CollapsibleSection
Section repliable avec header stylisé.

```tsx
import { CollapsibleSection } from '@/components/ui';

<CollapsibleSection
  title="Produits dans cette réservation"
  isExpanded={isExpanded}
  onToggle={() => setIsExpanded(!isExpanded)}
  count={items.length}
  headerGradient="from-blue-500 to-indigo-500"
  showDivider={true}
>
  {/* Contenu */}
</CollapsibleSection>
```

**Props:**
- `title`: string - Titre de la section
- `isExpanded`: boolean - État d'expansion
- `onToggle`: () => void - Callback de toggle
- `children`: ReactNode - Contenu à afficher
- `count?`: number - Nombre à afficher dans le badge
- `headerGradient?`: string - Classes Tailwind pour le gradient
- `showDivider?`: boolean - Afficher le séparateur

---

### Autocomplete
Champ de recherche avec suggestions automatiques.

```tsx
import { Autocomplete } from '@/components/ui';

<Autocomplete
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="Rechercher..."
  allowClear={true}
/>
```

---

### ExportDropdown
Menu déroulant pour les options d'export.

```tsx
import { ExportDropdown } from '@/components/ui';

<ExportDropdown
  trigger={<button>Exporter</button>}
  options={[
    {
      label: 'CSV',
      icon: <Icon />,
      onClick: handleExportCSV,
      description: 'Exporter en CSV'
    }
  ]}
/>
```

---

### StockActionsDropdown
Menu déroulant pour les actions sur le stock.

```tsx
import { StockActionsDropdown } from '@/components/ui';

<StockActionsDropdown
  trigger={<button>Actions</button>}
  actions={[
    {
      label: 'Ajustement',
      icon: <Icon />,
      onClick: handleAdjustment,
      color: 'blue',
      hoverColor: 'blue-700'
    }
  ]}
/>
```

---

## 🎨 Utilisation

Tous les composants peuvent être importés depuis l'index centralisé :

```tsx
import {
  StatisticsCard,
  StatusBadge,
  ModernTable,
  PageHeader,
  SearchFilter,
  SelectFilter,
  CollapsibleSection,
} from '@/components/ui';
```

Ou individuellement :

```tsx
import StatisticsCard from '@/components/ui/StatisticsCard';
```

---

## 🔧 Personnalisation

Tous les composants utilisent Tailwind CSS et peuvent être personnalisés via les props `className` ou les props spécifiques (comme `colorScheme` pour StatisticsCard).

---

## 📝 Notes

- Tous les composants sont responsive par défaut
- Les composants suivent le design system de l'application
- Les icônes doivent être importées depuis `@/components/icons`
