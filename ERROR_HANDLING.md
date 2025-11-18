# Gestion d'Erreurs - Error Handling

## 📋 Vue d'ensemble

Le système de gestion d'erreurs est maintenant intégré globalement dans l'application pour capturer et gérer les erreurs de manière cohérente.

## 🛡️ Error Boundaries

### ErrorBoundary Component

Le composant `ErrorBoundary` capture les erreurs React et affiche une interface utilisateur de secours.

**Utilisation :**

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Fonctionnalités :**
- Capture les erreurs React dans les composants enfants
- Affiche une interface de secours avec options de récupération
- Log les erreurs pour le debugging
- Boutons pour recharger la page ou retourner au dashboard

### Intégration Globale

L'`ErrorBoundary` est déjà intégré dans `Providers.tsx`, donc toutes les pages sont protégées automatiquement.

## 🔧 Hook useErrorHandler

Hook personnalisé pour gérer les erreurs de manière cohérente.

**Utilisation :**

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { handleError, handleAsyncError } = useErrorHandler();

  const handleAction = async () => {
    try {
      await apiClient.post('/endpoint', data);
    } catch (error) {
      handleError(error, 'Failed to perform action');
    }
  };

  // Ou avec handleAsyncError
  const [result, error] = await handleAsyncError(
    () => apiClient.get('/data'),
    'Failed to load data'
  );
}
```

## 📡 Intercepteurs API

### Gestion des Codes HTTP

L'intercepteur API gère automatiquement :

- **401 Unauthorized** : Tente de rafraîchir le token, redirige vers login si échec
- **403 Forbidden** : Log l'erreur, laisse le composant gérer l'affichage
- **404 Not Found** : Log l'erreur avec message
- **500+ Server Error** : Log détaillé pour le debugging

### Exemple d'Utilisation

```tsx
// Les erreurs sont automatiquement gérées par l'intercepteur
try {
  const response = await apiClient.get('/products');
  // ...
} catch (error) {
  // L'erreur est déjà loggée et formatée
  // Utilisez useErrorHandler pour afficher un toast
  handleError(error, 'Failed to load products');
}
```

## 🎯 Bonnes Pratiques

### 1. Utiliser useErrorHandler dans les composants

```tsx
const { handleError } = useErrorHandler();

try {
  await apiClient.post('/endpoint', data);
  toast.success('Success!');
} catch (error) {
  handleError(error, 'Failed to save');
}
```

### 2. Gérer les erreurs de validation

```tsx
try {
  await apiClient.post('/endpoint', data);
} catch (error: any) {
  if (error.response?.status === 400) {
    // Erreur de validation
    const errors = error.response.data.errors;
    // Afficher les erreurs de validation
  } else {
    handleError(error);
  }
}
```

### 3. Gérer les erreurs réseau

```tsx
try {
  await apiClient.get('/data');
} catch (error: any) {
  if (!error.response) {
    // Erreur réseau (pas de connexion)
    toast.error('Network error. Please check your connection.');
  } else {
    handleError(error);
  }
}
```

## 🔍 Logging

### En Développement

Toutes les erreurs sont loggées dans la console avec :
- Message d'erreur
- Status HTTP (si applicable)
- URL de la requête
- Données de réponse (si applicable)

### En Production

Les erreurs critiques (500+) sont loggées pour le monitoring. Configurez un service de logging externe (Sentry, LogRocket, etc.) si nécessaire.

## 📝 Types d'Erreurs

### Erreurs React (Error Boundaries)
- Erreurs de rendu
- Erreurs dans les lifecycle methods
- Erreurs dans les constructeurs

### Erreurs API (Intercepteurs)
- Erreurs HTTP (400, 401, 403, 404, 500+)
- Erreurs réseau
- Erreurs de timeout

### Erreurs de Validation
- Erreurs de formulaire (Zod)
- Erreurs de validation backend

## 🚀 Améliorations Futures

- [ ] Intégration Sentry pour le monitoring
- [ ] Retry automatique pour les erreurs réseau
- [ ] Cache des erreurs pour éviter les spams
- [ ] Analytics des erreurs
- [ ] Notifications email pour les erreurs critiques

