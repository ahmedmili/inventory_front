# Modal Template System

Un système de modales dynamique et réutilisable avec plusieurs variantes de design.

## Utilisation de base

```tsx
import Modal from '@/components/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Titre de la modale"
  variant="default" // Variant de design
>
  {/* Contenu de la modale */}
</Modal>
```

## Variants disponibles

### `default`
Design par défaut avec gradient bleu/indigo.

```tsx
<Modal variant="default" title="Modale par défaut">
  Contenu
</Modal>
```

### `form`
Design optimisé pour les formulaires avec fond bleu clair.

```tsx
<Modal variant="form" title="Créer un utilisateur">
  <form>...</form>
</Modal>
```

### `info`
Design pour les messages informatifs (bleu clair).

```tsx
<Modal variant="info" title="Information">
  Message informatif
</Modal>
```

### `success`
Design pour les messages de succès (vert).

```tsx
<Modal variant="success" title="Succès">
  Opération réussie !
</Modal>
```

### `error`
Design pour les messages d'erreur (rouge).

```tsx
<Modal variant="error" title="Erreur">
  Une erreur s'est produite
</Modal>
```

### `warning`
Design pour les avertissements (jaune/orange).

```tsx
<Modal variant="warning" title="Attention">
  Attention requise
</Modal>
```

### `confirm`
Design pour les confirmations (orange/rouge).

```tsx
<Modal variant="confirm" title="Confirmer">
  Êtes-vous sûr ?
</Modal>
```

### `custom`
Design personnalisable (gris).

```tsx
<Modal variant="custom" title="Personnalisé">
  Contenu personnalisé
</Modal>
```

## Props disponibles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `isOpen` | `boolean` | - | État d'ouverture de la modale |
| `onClose` | `() => void` | - | Fonction appelée à la fermeture |
| `title` | `string` | - | Titre de la modale |
| `children` | `ReactNode` | - | Contenu de la modale |
| `variant` | `ModalVariant` | `'default'` | Variant de design |
| `size` | `ModalSize` | `'lg'` | Taille : `'sm'`, `'md'`, `'lg'`, `'xl'`, `'full'` |
| `animation` | `AnimationType` | `'scale'` | Type d'animation |
| `showCloseButton` | `boolean` | `true` | Afficher le bouton de fermeture |
| `icon` | `ReactNode` | - | Icône personnalisée (remplace l'icône par défaut) |
| `headerClassName` | `string` | `''` | Classes CSS supplémentaires pour le header |
| `contentClassName` | `string` | `''` | Classes CSS supplémentaires pour le contenu |
| `className` | `string` | `''` | Classes CSS supplémentaires pour le conteneur |
| `closeOnBackdrop` | `boolean` | `true` | Fermer au clic sur le backdrop |

## Exemples avancés

### Modale avec icône personnalisée

```tsx
<Modal
  variant="form"
  title="Ajouter un produit"
  icon={
    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-blue-100">
      <ProductIcon className="w-5 h-5 text-white" />
    </div>
  }
>
  {/* Contenu */}
</Modal>
```

### Modale avec classes personnalisées

```tsx
<Modal
  variant="success"
  title="Succès"
  headerClassName="bg-green-100"
  contentClassName="p-8"
>
  Opération réussie !
</Modal>
```

### Modale pleine largeur

```tsx
<Modal
  variant="default"
  title="Liste complète"
  size="full"
>
  {/* Contenu large */}
</Modal>
```

### Modale sans fermeture au clic backdrop

```tsx
<Modal
  variant="confirm"
  title="Confirmer"
  closeOnBackdrop={false}
>
  Cette modale ne se ferme pas au clic sur le backdrop
</Modal>
```

## Types d'animations

- `'fade'` : Fondu
- `'slide'` : Glissement latéral
- `'scale'` : Zoom (par défaut)
- `'slide-up'` : Glissement vers le haut
- `'slide-down'` : Glissement vers le bas
- `'zoom'` : Zoom simple
- `'none'` : Aucune animation

## Tailles disponibles

- `'sm'` : Petite (max-w-md)
- `'md'` : Moyenne (max-w-lg)
- `'lg'` : Grande (max-w-2xl) - par défaut
- `'xl'` : Très grande (max-w-4xl)
- `'full'` : Pleine largeur (max-w-full)

## Architecture

Le système est composé de deux composants principaux :

1. **`Modal.tsx`** : Composant principal qui gère les animations et l'état
2. **`ModalTemplate.tsx`** : Template réutilisable avec les variants de design

Tous les variants partagent la même structure de base mais avec des couleurs et styles différents selon le type de modale.
