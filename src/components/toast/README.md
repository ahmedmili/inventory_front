# Système de Notifications Toast Personnalisé

Un système de notifications toast complet, dynamique et hautement personnalisable pour Next.js.

## Fonctionnalités

✅ **Types de notifications** : success, error, info, warning, loading  
✅ **Positions multiples** : 6 positions différentes (top/bottom × left/center/right)  
✅ **Animations fluides** : Entrée et sortie avec transitions  
✅ **Barre de progression** : Affichage visuel du temps restant  
✅ **Pause au survol** : La notification se met en pause quand la souris passe dessus  
✅ **Actions personnalisées** : Boutons d'action dans les notifications  
✅ **Contenu personnalisé** : Support pour ReactNode (HTML, composants, etc.)  
✅ **Icônes personnalisées** : Icônes par défaut ou personnalisées  
✅ **Durée configurable** : Durée personnalisée ou permanente (duration: 0)  
✅ **Mise à jour dynamique** : Possibilité de mettre à jour une notification existante  
✅ **Mode sombre** : Support automatique du dark mode  
✅ **Accessible** : Compatible avec les lecteurs d'écran  

## Installation

Le système est déjà intégré dans le projet. Assurez-vous que `ToastProvider` est dans votre arbre de composants :

```tsx
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/toast/ToastContainer';

function App() {
  return (
    <ToastProvider>
      {/* Votre application */}
      <ToastContainer />
    </ToastProvider>
  );
}
```

## Utilisation de base

```tsx
import { useToast } from '@/contexts/ToastContext';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Opération réussie !');
  };

  const handleError = () => {
    toast.error('Une erreur est survenue');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Succès</button>
      <button onClick={handleError}>Erreur</button>
    </div>
  );
}
```

## API complète

### Méthodes rapides

```tsx
toast.success(message, options?);
toast.error(message, options?);
toast.info(message, options?);
toast.warning(message, options?);
toast.loading(message, options?);
```

### Méthode principale

```tsx
const toastId = toast.showToast({
  type: 'success',
  title: 'Titre optionnel',
  message: 'Message de la notification',
  duration: 3000,
  position: 'top-right',
  showCloseButton: true,
  showProgressBar: true,
  pauseOnHover: true,
  actions: [...],
  icon: <CustomIcon />,
  className: 'custom-class',
  onClick: () => {},
  onClose: () => {},
});
```

### Options disponibles

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `id` | `string` | Auto | ID unique de la notification |
| `type` | `'success' \| 'error' \| 'info' \| 'warning' \| 'loading'` | `'info'` | Type de notification |
| `title` | `string` | - | Titre de la notification |
| `message` | `string \| ReactNode` | - | Message ou contenu personnalisé |
| `duration` | `number` | `3000` | Durée en ms (0 = permanent) |
| `position` | `ToastPosition` | `'top-right'` | Position de la notification |
| `showCloseButton` | `boolean` | `true` | Afficher le bouton de fermeture |
| `showProgressBar` | `boolean` | `true` | Afficher la barre de progression |
| `pauseOnHover` | `boolean` | `true` | Mettre en pause au survol |
| `actions` | `ToastAction[]` | - | Boutons d'action |
| `icon` | `ReactNode` | - | Icône personnalisée |
| `className` | `string` | - | Classes CSS personnalisées |
| `onClick` | `() => void` | - | Callback au clic sur la notification |
| `onClose` | `() => void` | - | Callback à la fermeture |

## Exemples d'utilisation

### Notification simple

```tsx
toast.success('Données sauvegardées avec succès');
```

### Avec titre

```tsx
toast.info('Nouvelle mise à jour disponible', {
  title: 'Mise à jour',
});
```

### Avec actions

```tsx
toast.warning('Voulez-vous continuer ?', {
  title: 'Confirmation',
  actions: [
    {
      label: 'Annuler',
      onClick: () => console.log('Annulé'),
      style: 'secondary',
    },
    {
      label: 'Continuer',
      onClick: () => console.log('Continué'),
      style: 'primary',
    },
  ],
});
```

### Contenu personnalisé

```tsx
toast.success(
  <div>
    <p className="font-semibold">Commande créée</p>
    <p className="text-sm opacity-80">Référence: CMD-12345</p>
  </div>,
  {
    title: 'Nouvelle commande',
  }
);
```

### Notification permanente

```tsx
toast.loading('Traitement en cours...', {
  duration: 0, // Ne se ferme pas automatiquement
});
```

### Mise à jour dynamique

```tsx
const id = toast.loading('Chargement...', {
  duration: 0,
});

// Plus tard...
toast.updateToast(id, {
  type: 'success',
  message: 'Chargement terminé !',
  duration: 3000,
});
```

### Différentes positions

```tsx
toast.info('En haut à gauche', { position: 'top-left' });
toast.info('En haut au centre', { position: 'top-center' });
toast.info('En haut à droite', { position: 'top-right' });
toast.info('En bas à gauche', { position: 'bottom-left' });
toast.info('En bas au centre', { position: 'bottom-center' });
toast.info('En bas à droite', { position: 'bottom-right' });
```

### Notification cliquable

```tsx
toast.info('Cliquez pour voir les détails', {
  onClick: () => {
    // Naviguer vers une page ou ouvrir un modal
    router.push('/details');
  },
});
```

### Icône personnalisée

```tsx
toast.success('Félicitations !', {
  icon: <span className="text-2xl">🎉</span>,
});
```

### Style personnalisé

```tsx
toast.info('Notification stylisée', {
  className: 'border-2 border-purple-500 shadow-xl',
});
```

## Gestion des notifications

### Supprimer une notification

```tsx
const id = toast.success('Notification');
// Plus tard...
toast.removeToast(id);
```

### Supprimer toutes les notifications

```tsx
toast.removeAllToasts();
```

## Types d'actions

Les actions peuvent avoir trois styles :

- `'primary'` : Bouton principal (bleu)
- `'secondary'` : Bouton secondaire (gris)
- `'danger'` : Bouton de danger (rouge)

```tsx
actions: [
  {
    label: 'Action principale',
    onClick: () => {},
    style: 'primary',
  },
  {
    label: 'Action secondaire',
    onClick: () => {},
    style: 'secondary',
  },
  {
    label: 'Supprimer',
    onClick: () => {},
    style: 'danger',
  },
]
```

## Personnalisation

### Couleurs par type

Les couleurs sont définies dans `ToastItem.tsx` et peuvent être personnalisées :

```tsx
const colors = {
  success: { bg: 'bg-green-50', border: 'border-green-200', ... },
  error: { bg: 'bg-red-50', border: 'border-red-200', ... },
  // ...
};
```

### Positions disponibles

- `'top-left'`
- `'top-center'`
- `'top-right'`
- `'bottom-left'`
- `'bottom-center'`
- `'bottom-right'`

## Bonnes pratiques

1. **Utilisez des messages clairs et concis**
2. **Choisissez le bon type** : success pour les succès, error pour les erreurs, etc.
3. **Ajoutez des actions** pour les notifications importantes nécessitant une action
4. **Utilisez des durées appropriées** : plus longues pour les messages importants
5. **Groupez les notifications** : utilisez différentes positions pour éviter le chevauchement
6. **Mettez à jour les toasts de chargement** : transformez-les en success/error à la fin

## Exemple complet

```tsx
import { useToast } from '@/contexts/ToastContext';

function ProductForm() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null);

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    // Afficher un toast de chargement
    const id = toast.loading('Enregistrement en cours...', {
      duration: 0,
    });
    setLoadingToastId(id);

    try {
      await saveProduct(data);
      
      // Mettre à jour le toast en succès
      toast.updateToast(id, {
        type: 'success',
        message: 'Produit enregistré avec succès !',
        duration: 3000,
      });
    } catch (error) {
      // Mettre à jour le toast en erreur
      toast.updateToast(id, {
        type: 'error',
        message: 'Erreur lors de l\'enregistrement',
        duration: 5000,
        actions: [
          {
            label: 'Réessayer',
            onClick: () => handleSubmit(data),
            style: 'primary',
          },
        ],
      });
    } finally {
      setIsLoading(false);
      setLoadingToastId(null);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

