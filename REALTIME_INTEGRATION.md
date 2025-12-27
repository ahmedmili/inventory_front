# 🔴 Intégration Temps Réel - Next.js Frontend

Documentation de l'intégration des fonctionnalités temps réel dans le frontend Next.js.

## ✅ Hooks Disponibles

### 1. `useStockAlerts()`
Écoute les alertes de stock (stock faible/épuisé).

**Utilisation :**
```typescript
import { useStockAlerts } from '@/hooks/useStockAlerts';

// Dans un composant
useStockAlerts();
```

**Événement :** `stock.alert`

**Où l'utiliser :** `AdminLayout` (déjà intégré)

---

### 2. `useProductsRealtime(onStockUpdated?)`
Écoute les mises à jour de stock en temps réel.

**Utilisation :**
```typescript
import { useProductsRealtime } from '@/hooks/useProductsRealtime';

// Dans ProductsPage
useProductsRealtime(() => {
  mutate(); // Rafraîchir la liste
});

// Dans ProductDetailPage
useProductsRealtime((payload) => {
  if (payload.productId === productId) {
    mutate(); // Rafraîchir seulement ce produit
  }
});
```

**Événement :** `stock.updated`

**Où l'utiliser :** 
- ✅ `ProductsPage` (intégré)
- ✅ `ProductDetailPage` (intégré)

---

### 3. `useReservationsRealtime(onCreated?, onUpdated?)`
Écoute les événements de réservations.

**Utilisation :**
```typescript
import { useReservationsRealtime } from '@/hooks/useReservationsRealtime';

useReservationsRealtime(
  () => {
    // Nouvelle réservation créée
    loadReservations();
  },
  () => {
    // Réservation mise à jour
    loadReservations();
  }
);
```

**Événements :** `reservation.created`, `reservation.updated`

**Où l'utiliser :** 
- ✅ `ReservationsPage` (intégré)

---

### 4. `useNotificationsRealtime(onNotificationCreated?)`
Écoute les nouvelles notifications.

**Utilisation :**
```typescript
import { useNotificationsRealtime } from '@/hooks/useNotificationsRealtime';

useNotificationsRealtime(() => {
  mutateNotifications();
  mutateCount();
});
```

**Événement :** `notification.created`

**Où l'utiliser :** 
- ✅ `Notifications` component (intégré)

---

## 📋 État d'Intégration

| Composant | Hook | État |
|-----------|------|------|
| `AdminLayout` | `useStockAlerts` | ✅ Intégré |
| `ProductsPage` | `useProductsRealtime` | ✅ Intégré |
| `ProductDetailPage` | `useProductsRealtime` | ✅ Intégré |
| `ReservationsPage` | `useReservationsRealtime` | ✅ Intégré |
| `Notifications` | `useNotificationsRealtime` | ✅ Intégré |

---

## 🎯 Événements Disponibles (Backend)

Tous ces événements sont émis par le backend :

1. ✅ `stock.alert` - Alerte stock faible/épuisé
2. ✅ `stock.updated` - Mise à jour de stock
3. ✅ `reservation.created` - Nouvelle réservation
4. ✅ `reservation.updated` - Réservation mise à jour
5. ✅ `notification.created` - Nouvelle notification
6. ⚠️ `presence.join` - Utilisateur connecté (non utilisé)
7. ⚠️ `presence.leave` - Utilisateur déconnecté (non utilisé)
8. ⚠️ `presence.update` - Mise à jour présence (non utilisé)
9. ⚠️ `typing.start` - Indicateur de frappe (non utilisé)
10. ⚠️ `typing.stop` - Fin de frappe (non utilisé)

---

## 🔧 Configuration

### Variables d'Environnement

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Connexion Automatique

La connexion WebSocket se fait automatiquement :
- Au chargement de l'application
- Si un token JWT est présent dans le localStorage
- Via le `RealtimeProvider` dans les Providers globaux

---

## 📝 Exemples d'Utilisation

### Exemple 1 : Rafraîchir une liste

```typescript
const { data, mutate } = useApi('/products');

useProductsRealtime(() => {
  mutate(); // Rafraîchir la liste
});
```

### Exemple 2 : Mise à jour conditionnelle

```typescript
useProductsRealtime((payload) => {
  // Rafraîchir seulement si c'est le produit actuel
  if (payload.productId === currentProductId) {
    mutate();
  }
});
```

### Exemple 3 : Callback personnalisé

```typescript
useReservationsRealtime(
  (payload) => {
    // Nouvelle réservation
    console.log('Nouvelle réservation:', payload);
    loadReservations();
    // Faire autre chose...
  },
  (payload) => {
    // Réservation mise à jour
    loadReservations();
  }
);
```

---

## 🐛 Dépannage

### La connexion ne se fait pas

1. Vérifier que `NEXT_PUBLIC_API_URL` est configuré
2. Vérifier qu'un token JWT est présent dans le localStorage
3. Vérifier les logs de la console pour les erreurs

### Les événements ne sont pas reçus

1. Vérifier que le backend émet bien les événements
2. Vérifier que le hook est bien appelé dans le composant
3. Vérifier la connexion WebSocket dans les DevTools (Network > WS)

### Performance

Les hooks utilisent `useEffect` avec des dépendances correctes pour éviter les re-renders inutiles.

---

## 🚀 Prochaines Étapes

### Améliorations Possibles

1. **Présence utilisateurs** - Afficher qui est en ligne
2. **Typing indicators** - Indicateurs de frappe dans les formulaires
3. **Optimistic updates** - Mettre à jour l'UI avant la confirmation serveur
4. **Cache intelligent** - Mettre à jour le cache SWR automatiquement

---

**Date de création :** $(date)
**Version :** 1.0.0

