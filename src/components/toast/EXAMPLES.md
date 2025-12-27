# Exemples Avancés - Toast avec Images et HTML Dynamique

Ce document montre comment utiliser le système de toast avec des images et du contenu HTML dynamique.

## ✅ Support Actuel

Le système de toast supporte **déjà** :
- ✅ **ReactNode** pour le message (images, composants React, JSX)
- ✅ **Icônes personnalisées** via la prop `icon`
- ✅ **Contenu personnalisé** via la prop `message` (ReactNode)

## 📸 Exemple 1 : Toast avec Image

```tsx
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';

function MyComponent() {
  const toast = useToast();

  const showProductNotification = (product: { id: string; name: string; image: string }) => {
    toast.success({
      title: 'Nouveau produit ajouté',
      message: (
        <div className="flex items-center gap-3">
          <Image
            src={product.image}
            alt={product.name}
            width={48}
            height={48}
            className="rounded-lg object-cover"
          />
          <div>
            <p className="font-semibold">{product.name}</p>
            <p className="text-sm text-gray-600">Produit ajouté avec succès</p>
          </div>
        </div>
      ),
      duration: 5000,
    });
  };

  return (
    <button onClick={() => showProductNotification({ 
      id: '1', 
      name: 'Produit Test', 
      image: '/images/product.jpg' 
    })}>
      Afficher notification avec image
    </button>
  );
}
```

## 🎨 Exemple 2 : Toast avec Contenu HTML Personnalisé

```tsx
import { useToast } from '@/contexts/ToastContext';

function MyComponent() {
  const toast = useToast();

  const showRichNotification = () => {
    toast.info({
      title: 'Notification enrichie',
      message: (
        <div className="space-y-2">
          <p className="font-semibold">Stock faible détecté</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
              Urgent
            </span>
            <span>Produit: <strong>ABC-123</strong></span>
          </div>
          <div className="text-xs text-gray-600">
            Stock restant: <span className="font-bold">5 unités</span>
          </div>
        </div>
      ),
      duration: 6000,
    });
  };

  return <button onClick={showRichNotification}>Notification enrichie</button>;
}
```

## 🖼️ Exemple 3 : Toast avec Image et Actions

```tsx
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';

function MyComponent() {
  const toast = useToast();

  const showProductAlert = (product: { id: string; name: string; image: string; stock: number }) => {
    toast.warning({
      title: 'Alerte Stock',
      message: (
        <div className="flex items-start gap-3">
          <Image
            src={product.image}
            alt={product.name}
            width={60}
            height={60}
            className="rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <p className="font-semibold mb-1">{product.name}</p>
            <p className="text-sm text-gray-600">
              Stock restant: <span className="font-bold text-red-600">{product.stock} unités</span>
            </p>
          </div>
        </div>
      ),
      actions: [
        {
          label: 'Voir le produit',
          onClick: () => window.location.href = `/products/${product.id}`,
          style: 'primary',
        },
        {
          label: 'Ignorer',
          onClick: () => {},
          style: 'secondary',
        },
      ],
      duration: 8000,
    });
  };

  return <button onClick={() => showProductAlert({ 
    id: '1', 
    name: 'Produit Test', 
    image: '/images/product.jpg',
    stock: 5
  })}>Alerte avec image</button>;
}
```

## 🎯 Exemple 4 : Toast avec HTML Dynamique (dangerouslySetInnerHTML)

Si vous avez besoin d'afficher du HTML brut (par exemple depuis une API), vous pouvez créer un composant wrapper :

```tsx
import { useToast } from '@/contexts/ToastContext';
import { ReactNode } from 'react';

function MyComponent() {
  const toast = useToast();

  const showHTMLNotification = (htmlContent: string) => {
    toast.info({
      title: 'Notification HTML',
      message: (
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="prose prose-sm max-w-none"
        />
      ),
      duration: 5000,
    });
  };

  return (
    <button onClick={() => showHTMLNotification(
      '<p>Contenu <strong>HTML</strong> avec <em>formatage</em></p>'
    )}>
      Notification HTML
    </button>
  );
}
```

## 🎨 Exemple 5 : Toast avec Avatar Utilisateur

```tsx
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';

function MyComponent() {
  const toast = useToast();

  const showUserNotification = (user: { name: string; avatar: string; action: string }) => {
    toast.success({
      title: 'Action utilisateur',
      message: (
        <div className="flex items-center gap-3">
          <Image
            src={user.avatar}
            alt={user.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-gray-600">{user.action}</p>
          </div>
        </div>
      ),
      duration: 4000,
    });
  };

  return <button onClick={() => showUserNotification({
    name: 'John Doe',
    avatar: '/avatars/john.jpg',
    action: 'a créé une nouvelle commande'
  })}>Notification utilisateur</button>;
}
```

## 🔔 Exemple 6 : Toast pour Notifications Temps Réel avec Image

```tsx
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';

function useRealtimeNotifications() {
  const toast = useToast();

  useEffect(() => {
    // Exemple avec WebSocket ou EventSource
    const eventSource = new EventSource('/api/notifications/stream');
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      toast.warning({
        title: notification.title,
        message: (
          <div className="flex items-start gap-3">
            {notification.image && (
              <Image
                src={notification.image}
                alt={notification.productName}
                width={50}
                height={50}
                className="rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold">{notification.productName}</p>
              <p className="text-sm text-gray-600">{notification.message}</p>
              {notification.stock && (
                <p className="text-xs text-red-600 mt-1">
                  Stock: {notification.stock} unités
                </p>
              )}
            </div>
          </div>
        ),
        actions: notification.productId ? [
          {
            label: 'Voir',
            onClick: () => window.location.href = `/products/${notification.productId}`,
            style: 'primary',
          },
        ] : undefined,
        duration: 6000,
      });
    };

    return () => eventSource.close();
  }, [toast]);
}
```

## 📝 Notes Importantes

1. **Performance** : Les images dans les toasts peuvent impacter les performances si trop nombreuses. Utilisez `next/image` pour l'optimisation automatique.

2. **Sécurité** : Si vous utilisez `dangerouslySetInnerHTML`, assurez-vous de **sanitizer** le contenu HTML pour éviter les attaques XSS.

3. **Responsive** : Les toasts avec images peuvent être larges. Assurez-vous que le contenu s'adapte aux petits écrans.

4. **Accessibilité** : Ajoutez des `alt` text aux images pour l'accessibilité.

## 🚀 Améliorations Possibles

Si vous avez besoin de fonctionnalités supplémentaires, vous pouvez :

1. **Ajouter un prop `image` dédié** pour simplifier l'utilisation
2. **Créer des composants pré-configurés** pour les notifications de produits
3. **Ajouter un support natif pour `dangerouslySetInnerHTML`** avec sanitization automatique

