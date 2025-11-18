# Toast Notifications - Guide d'utilisation

## 📋 Vue d'ensemble

Le système de toast notifications est maintenant intégré globalement dans l'application. Il permet d'afficher des notifications de succès, d'erreur, d'info ou d'avertissement.

## 🚀 Utilisation de base

### 1. Import du hook

```tsx
import { useToast } from '@/contexts/ToastContext';
```

### 2. Utilisation dans un composant

```tsx
export default function MyComponent() {
  const toast = useToast();
  
  const handleAction = async () => {
    try {
      await apiClient.post('/endpoint', data);
      toast.success('Opération réussie !');
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };
  
  return <button onClick={handleAction}>Action</button>;
}
```

## 📝 Méthodes disponibles

### `toast.success(message: string)`
Affiche une notification de succès (vert)

```tsx
toast.success('Produit créé avec succès !');
```

### `toast.error(message: string)`
Affiche une notification d'erreur (rouge, durée 5s)

```tsx
toast.error('Échec de la création');
```

### `toast.info(message: string)`
Affiche une notification d'information (bleu)

```tsx
toast.info('Chargement en cours...');
```

### `toast.warning(message: string)`
Affiche une notification d'avertissement (jaune)

```tsx
toast.warning('Stock faible détecté');
```

### `toast.showToast(message: string, type: ToastType, duration?: number)`
Méthode générique pour afficher un toast personnalisé

```tsx
toast.showToast('Message personnalisé', 'info', 5000);
```

## 🔧 Intégration dans les formulaires

### Pattern recommandé

```tsx
'use client';

import { useToast } from '@/contexts/ToastContext';
import { useForm } from 'react-hook-form';

export default function MyForm() {
  const toast = useToast();
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/endpoint', data);
      toast.success('Créé avec succès !');
      router.push('/list');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'En cours...' : 'Créer'}
      </button>
    </form>
  );
}
```

## 📋 Liste des formulaires à mettre à jour

Pour intégrer les toasts dans tous les formulaires, ajoutez :

1. **Import** : `import { useToast } from '@/contexts/ToastContext';`
2. **Hook** : `const toast = useToast();`
3. **Success** : `toast.success('Message de succès');` dans le `try`
4. **Error** : `toast.error(errorMessage);` dans le `catch`

### Formulaires déjà mis à jour ✅
- `/products/new` - Création produit
- `/products/[id]/edit` - Édition produit

### Formulaires à mettre à jour 📝
- `/suppliers/new` - Création fournisseur
- `/suppliers/[id]/edit` - Édition fournisseur
- `/customers/new` - Création client
- `/customers/[id]/edit` - Édition client
- `/warehouses/new` - Création entrepôt
- `/warehouses/[id]/edit` - Édition entrepôt
- `/categories/new` - Création catégorie
- `/categories/[id]/edit` - Édition catégorie
- `/purchases/new` - Création commande d'achat
- `/purchases/[id]/receive` - Réception commande
- `/sales/new` - Création commande de vente
- `/sales/[id]/deliver` - Livraison commande

## 🎨 Personnalisation

Les toasts sont automatiquement positionnés en haut à droite et disparaissent après 3 secondes (5 secondes pour les erreurs).

Les styles sont définis dans `frontend/src/components/Toast.tsx` et peuvent être personnalisés selon vos besoins.

## 🔍 Exemple complet

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api';
import { useForm } from 'react-hook-form';

export default function CreateItemPage() {
  const router = useRouter();
  const toast = useToast();
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await apiClient.post('/items', data);
      toast.success('Item créé avec succès !');
      router.push('/items');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer'}
      </button>
    </form>
  );
}
```

