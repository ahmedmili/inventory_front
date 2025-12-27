# Système de Modals Centralisé et Personnalisé

Un système de modals complet, dynamique et hautement personnalisable pour Next.js, similaire au système de toast.

## Fonctionnalités

✅ **Types de modals** : info, success, error, warning, confirm, custom  
✅ **Tailles multiples** : sm, md, lg, xl, full  
✅ **Animations fluides** : fade, slide, scale, slide-up, slide-down, zoom, none  
✅ **Contenu personnalisé** : Support pour ReactNode (HTML, composants, images, etc.)  
✅ **Actions personnalisées** : Boutons d'action avec styles (primary, secondary, danger)  
✅ **Icônes personnalisées** : Icônes par défaut ou personnalisées  
✅ **Images** : Support complet pour afficher des images dans les modals  
✅ **HTML dynamique** : Support pour contenu HTML personnalisé via ReactNode  
✅ **Confirmation asynchrone** : Méthode `confirm()` qui retourne une Promise  
✅ **Draggable** : Option pour rendre les modals déplaçables  
✅ **Mode sombre** : Support automatique du dark mode  
✅ **Accessible** : Compatible avec les lecteurs d'écran, gestion du focus, ESC pour fermer  

## Installation

Le système est déjà intégré dans le projet. `ModalProvider` est dans `Providers.tsx` :

```tsx
import { ModalProvider } from '@/contexts/ModalContext';
import ModalContainer from '@/components/modal/ModalContainer';

function App() {
  return (
    <ModalProvider>
      {/* Votre application */}
      <ModalContainer />
    </ModalProvider>
  );
}
```

## Utilisation de base

```tsx
import { useModal } from '@/contexts/ModalContext';

function MyComponent() {
  const modal = useModal();

  const handleClick = () => {
    modal.info({
      title: 'Information',
      content: 'Ceci est un message d\'information',
    });
  };

  return <button onClick={handleClick}>Afficher modal</button>;
}
```

## API complète

### Méthodes rapides

```tsx
modal.info(options);
modal.success(options);
modal.error(options);
modal.warning(options);
modal.showModal(options);
```

### Méthode de confirmation

```tsx
const confirmed = await modal.confirm({
  title: 'Confirmer',
  content: 'Êtes-vous sûr ?',
  onConfirm: async () => {
    // Action à exécuter
  },
});
```

### Options disponibles

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `id` | `string` | Auto | ID unique de la modal |
| `type` | `ModalType` | `'info'` | Type de modal |
| `title` | `string \| ReactNode` | - | Titre de la modal |
| `content` | `string \| ReactNode` | - | Contenu de la modal |
| `size` | `ModalSize` | `'md'` | Taille de la modal |
| `animation` | `ModalAnimation` | `'scale'` | Type d'animation |
| `showCloseButton` | `boolean` | `true` | Afficher le bouton de fermeture |
| `closeOnBackdrop` | `boolean` | `true` | Fermer au clic sur le backdrop |
| `closeOnEscape` | `boolean` | `true` | Fermer avec la touche ESC |
| `actions` | `ModalAction[]` | - | Boutons d'action personnalisés |
| `footer` | `ReactNode` | - | Footer personnalisé |
| `icon` | `ReactNode` | - | Icône personnalisée |
| `className` | `string` | - | Classes CSS personnalisées |
| `contentClassName` | `string` | - | Classes CSS pour le contenu |
| `onClose` | `() => void` | - | Callback à la fermeture |
| `onConfirm` | `() => void \| Promise<void>` | - | Callback de confirmation |
| `confirmText` | `string` | `'Confirmer'` | Texte du bouton de confirmation |
| `cancelText` | `string` | `'Annuler'` | Texte du bouton d'annulation |
| `loading` | `boolean` | `false` | État de chargement |

## Exemples d'utilisation

### Modal simple

```tsx
modal.info({
  title: 'Information',
  content: 'Ceci est un message d\'information',
});
```

### Modal avec confirmation

```tsx
const handleDelete = async () => {
  const confirmed = await modal.confirm({
    title: 'Supprimer',
    content: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
  });

  if (confirmed) {
    // Supprimer l'élément
    await deleteItem();
  }
};
```

### Modal avec actions personnalisées

```tsx
modal.showModal({
  title: 'Actions disponibles',
  content: 'Choisissez une action',
  actions: [
    {
      label: 'Annuler',
      onClick: () => console.log('Annulé'),
      style: 'secondary',
    },
    {
      label: 'Sauvegarder',
      onClick: async () => {
        await saveData();
        modal.closeModal(modalId);
      },
      style: 'primary',
    },
    {
      label: 'Supprimer',
      onClick: async () => {
        await deleteData();
        modal.closeModal(modalId);
      },
      style: 'danger',
    },
  ],
});
```

### Modal avec image

```tsx
import Image from 'next/image';

modal.success({
  title: 'Produit ajouté',
  content: (
    <div className="flex items-center gap-3">
      <Image
        src="/product.jpg"
        alt="Product"
        width={48}
        height={48}
        className="rounded-lg"
      />
      <div>
        <p className="font-semibold">Produit ABC</p>
        <p className="text-sm text-gray-600">Ajouté avec succès</p>
      </div>
    </div>
  ),
});
```

### Modal avec contenu HTML

```tsx
modal.info({
  title: 'Contenu HTML',
  content: (
    <div dangerouslySetInnerHTML={{ __html: '<p>Contenu <strong>HTML</strong> personnalisé</p>' }} />
  ),
});
```

### Modal avec taille personnalisée

```tsx
modal.showModal({
  title: 'Modal large',
  content: 'Contenu de la modal',
  size: 'xl',
  animation: 'slide-up',
});
```

### Modal de chargement

```tsx
const modalId = modal.info({
  title: 'Traitement en cours',
  content: 'Veuillez patienter...',
  showCloseButton: false,
  closeOnBackdrop: false,
  closeOnEscape: false,
});

// Plus tard...
modal.closeModal(modalId);
```

## Types de modals

### Info
```tsx
modal.info({
  title: 'Information',
  content: 'Message informatif',
});
```

### Success
```tsx
modal.success({
  title: 'Succès',
  content: 'Opération réussie !',
});
```

### Error
```tsx
modal.error({
  title: 'Erreur',
  content: 'Une erreur est survenue',
});
```

### Warning
```tsx
modal.warning({
  title: 'Attention',
  content: 'Attention requise',
});
```

### Confirm
```tsx
const confirmed = await modal.confirm({
  title: 'Confirmer',
  content: 'Êtes-vous sûr ?',
  onConfirm: async () => {
    // Action
  },
});
```

### Custom
```tsx
modal.showModal({
  type: 'custom',
  title: 'Modal personnalisée',
  content: <CustomComponent />,
  footer: <CustomFooter />,
});
```

## Tailles disponibles

- `'sm'` : Petite modal (max-w-md)
- `'md'` : Modal moyenne (max-w-lg) - **Défaut**
- `'lg'` : Grande modal (max-w-2xl)
- `'xl'` : Très grande modal (max-w-4xl)
- `'full'` : Modal pleine largeur (max-w-full)

## Animations disponibles

- `'fade'` : Fondu
- `'slide'` : Glissement latéral
- `'scale'` : Zoom - **Défaut**
- `'slide-up'` : Glissement vers le haut
- `'slide-down'` : Glissement vers le bas
- `'zoom'` : Zoom
- `'none'` : Aucune animation

## Gestion des modals

### Fermer une modal

```tsx
const modalId = modal.info({ content: 'Message' });
// Plus tard...
modal.closeModal(modalId);
```

### Fermer toutes les modals

```tsx
modal.closeAllModals();
```

## Bonnes pratiques

1. **Utilisez `confirm()` pour les confirmations** : Retourne une Promise<bool>
2. **Fermez les modals après les actions** : Appelez `closeModal()` après les actions asynchrones
3. **Utilisez des tailles appropriées** : `sm` pour les confirmations, `lg`/`xl` pour les formulaires
4. **Gérez les états de chargement** : Utilisez `loading` pour les actions asynchrones
5. **Personnalisez les actions** : Utilisez `actions` pour des boutons personnalisés
6. **Support du dark mode** : Les modals supportent automatiquement le dark mode

## Exemple complet

```tsx
import { useModal } from '@/contexts/ModalContext';
import { useState } from 'react';

function ProductForm() {
  const modal = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    const confirmed = await modal.confirm({
      title: 'Confirmer la création',
      content: 'Voulez-vous créer ce produit ?',
    });

    if (!confirmed) {
      setIsSubmitting(false);
      return;
    }

    try {
      await createProduct(data);
      
      modal.success({
        title: 'Succès',
        content: 'Produit créé avec succès !',
      });
    } catch (error) {
      modal.error({
        title: 'Erreur',
        content: 'Erreur lors de la création du produit',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Documentation

- [Types](../types/modal.types.ts) - Types TypeScript
- [Context](../contexts/ModalContext.tsx) - Contexte et Provider
- [ModalItem](./ModalItem.tsx) - Composant de modal individuel
- [ModalContainer](./ModalContainer.tsx) - Conteneur des modals

