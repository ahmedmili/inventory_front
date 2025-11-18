# Gestion d'État - State Management

## 📋 Vue d'ensemble

Ce projet utilise **SWR + React Context** au lieu de Redux pour la gestion d'état. Cette approche est plus légère, moderne et mieux adaptée à Next.js.

## 🎯 Pourquoi pas Redux ?

- **Redux est overkill** pour ce projet
- Plus de code boilerplate nécessaire
- SWR + Context est suffisant et plus simple
- Meilleure intégration avec Next.js

## 🏗️ Architecture

### 1. **AuthContext** (`src/contexts/AuthContext.tsx`)
- Gère l'état global de l'utilisateur authentifié
- Fournit `user`, `loading`, `refreshUser()`, `logout()`
- Évite les appels API multiples pour récupérer l'utilisateur

### 2. **SWR Hooks** (`src/hooks/useApi.ts`)
- `useApi<T>(url)` : Hook pour les requêtes GET avec cache automatique
- `useApiMutation()` : Hook pour POST/PUT/DELETE
- Cache automatique, revalidation en arrière-plan, retry intelligent

### 3. **Providers** (`src/components/Providers.tsx`)
- Enveloppe l'application avec `SWRConfig` et `AuthProvider`
- Configuré dans `app/layout.tsx`

## 📝 Utilisation

### Récupérer l'utilisateur authentifié

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, logout } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Hello {user.firstName}</div>;
}
```

### Faire une requête GET avec cache

```tsx
import { useApi } from '@/hooks/useApi';

function ProductsPage() {
  const { data: products, loading, error, mutate } = useApi<Product[]>('/products');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {products?.map(product => <div key={product.id}>{product.name}</div>)}
      <button onClick={() => mutate()}>Refresh</button>
    </div>
  );
}
```

### Faire une mutation (POST/PUT/DELETE)

```tsx
import { useApiMutation } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';

function CreateProductPage() {
  const router = useRouter();
  const { mutate, loading, error } = useApiMutation();
  
  const handleSubmit = async (data: ProductFormData) => {
    try {
      await mutate('/products', 'POST', data);
      router.push('/products');
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## ✅ Avantages

1. **Cache automatique** : Les données sont mises en cache et réutilisées
2. **Revalidation** : Mise à jour automatique en arrière-plan
3. **Moins de code** : Pas besoin de actions/reducers/selectors
4. **Type-safe** : Support TypeScript complet
5. **Optimiste** : Support pour les mises à jour optimistes
6. **Retry intelligent** : Retry automatique sur erreurs réseau

## 🔄 Migration depuis useState/useEffect

**Avant** (avec useState/useEffect) :
```tsx
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  apiClient.get('/products').then(res => {
    setProducts(res.data);
    setLoading(false);
  });
}, []);
```

**Après** (avec SWR) :
```tsx
const { data: products, loading } = useApi<Product[]>('/products');
```

## 🚀 Prochaines étapes

Pour migrer les autres pages :
1. Remplacer `useState` + `useEffect` par `useApi`
2. Utiliser `useAuth()` au lieu de `authService.getCurrentUser()`
3. Utiliser `useApiMutation()` pour les formulaires

