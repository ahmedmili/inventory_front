# Exemples Avancés - Modals avec Images et HTML Dynamique

Ce document montre comment utiliser le système de modals avec des images et du contenu HTML dynamique.

## ✅ Support Actuel

Le système de modals supporte **déjà** :
- ✅ **ReactNode** pour le contenu (images, composants React, JSX)
- ✅ **ReactNode** pour le titre (images, composants React, JSX)
- ✅ **Icônes personnalisées** via la prop `icon`
- ✅ **Footer personnalisé** via la prop `footer`
- ✅ **Actions personnalisées** avec styles et états de chargement

## 📸 Exemple 1 : Modal avec Image de Produit

```tsx
import { useModal } from '@/contexts/ModalContext';
import Image from 'next/image';

function MyComponent() {
  const modal = useModal();

  const showProductModal = (product: { id: string; name: string; image: string; price: number }) => {
    modal.success({
      title: 'Produit ajouté',
      content: (
        <div className="flex items-start gap-4">
          <Image
            src={product.image}
            alt={product.name}
            width={80}
            height={80}
            className="rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <p className="font-semibold text-lg mb-1">{product.name}</p>
            <p className="text-gray-600">Prix: <span className="font-bold">{product.price}€</span></p>
            <p className="text-sm text-gray-500 mt-2">Produit ajouté avec succès au panier</p>
          </div>
        </div>
      ),
      actions: [
        {
          label: 'Voir le panier',
          onClick: () => {
            window.location.href = '/cart';
            modal.closeAllModals();
          },
          style: 'primary',
        },
        {
          label: 'Continuer',
          onClick: () => modal.closeAllModals(),
          style: 'secondary',
        },
      ],
    });
  };

  return (
    <button onClick={() => showProductModal({ 
      id: '1', 
      name: 'Produit Test', 
      image: '/images/product.jpg',
      price: 29.99
    })}>
      Afficher modal avec image
    </button>
  );
}
```

## 🎨 Exemple 2 : Modal avec Contenu HTML Personnalisé

```tsx
import { useModal } from '@/contexts/ModalContext';

function MyComponent() {
  const modal = useModal();

  const showRichModal = () => {
    modal.info({
      title: 'Détails du produit',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              En stock
            </span>
            <span className="text-sm text-gray-600">SKU: ABC-123</span>
          </div>
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700">
              Ce produit est de <strong>haute qualité</strong> et répond à tous vos besoins.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Caractéristique 1</li>
              <li>Caractéristique 2</li>
              <li>Caractéristique 3</li>
            </ul>
          </div>
        </div>
      ),
      size: 'lg',
    });
  };

  return <button onClick={showRichModal}>Modal avec contenu riche</button>;
}
```

## 🖼️ Exemple 3 : Modal avec Image et Actions

```tsx
import { useModal } from '@/contexts/ModalContext';
import Image from 'next/image';

function MyComponent() {
  const modal = useModal();

  const showProductAlert = (product: { 
    id: string; 
    name: string; 
    image: string; 
    stock: number;
    minStock: number;
  }) => {
    modal.warning({
      title: 'Alerte Stock',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Image
              src={product.image}
              alt={product.name}
              width={100}
              height={100}
              className="rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <p className="font-semibold text-lg mb-2">{product.name}</p>
              <div className="space-y-1">
                <p className="text-sm">
                  Stock actuel: <span className="font-bold text-red-600">{product.stock} unités</span>
                </p>
                <p className="text-sm">
                  Seuil minimum: <span className="font-semibold">{product.minStock} unités</span>
                </p>
                {product.stock <= 0 && (
                  <p className="text-sm text-red-600 font-semibold mt-2">
                    ⚠️ Stock épuisé !
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: 'Voir le produit',
          onClick: () => {
            window.location.href = `/products/${product.id}`;
            modal.closeAllModals();
          },
          style: 'primary',
        },
        {
          label: 'Réapprovisionner',
          onClick: async () => {
            // Logique de réapprovisionnement
            await restockProduct(product.id);
            modal.closeAllModals();
          },
          style: 'secondary',
        },
      ],
      size: 'lg',
    });
  };

  return <button onClick={() => showProductAlert({
    id: '1',
    name: 'Produit Test',
    image: '/images/product.jpg',
    stock: 5,
    minStock: 10
  })}>Alerte avec image</button>;
}
```

## 🎯 Exemple 4 : Modal avec HTML Dynamique (dangerouslySetInnerHTML)

Si vous avez besoin d'afficher du HTML brut (par exemple depuis une API), vous pouvez créer un composant wrapper :

```tsx
import { useModal } from '@/contexts/ModalContext';
import { ReactNode } from 'react';

function MyComponent() {
  const modal = useModal();

  const showHTMLModal = (htmlContent: string) => {
    modal.info({
      title: 'Contenu HTML',
      content: (
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="prose prose-sm max-w-none"
        />
      ),
      size: 'lg',
    });
  };

  return (
    <button onClick={() => showHTMLModal(
      '<h2>Titre HTML</h2><p>Contenu avec <strong>formatage</strong> et <em>styles</em></p><ul><li>Item 1</li><li>Item 2</li></ul>'
    )}>
      Modal HTML
    </button>
  );
}
```

## 🎨 Exemple 5 : Modal avec Avatar Utilisateur

```tsx
import { useModal } from '@/contexts/ModalContext';
import Image from 'next/image';

function MyComponent() {
  const modal = useModal();

  const showUserModal = (user: { name: string; avatar: string; role: string; email: string }) => {
    modal.info({
      title: (
        <div className="flex items-center gap-3">
          <Image
            src={user.avatar}
            alt={user.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <span>{user.name}</span>
        </div>
      ),
      content: (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Rôle</p>
            <p className="font-semibold">{user.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold">{user.email}</p>
          </div>
        </div>
      ),
      actions: [
        {
          label: 'Envoyer un message',
          onClick: () => {
            // Ouvrir chat
            modal.closeAllModals();
          },
          style: 'primary',
        },
      ],
    });
  };

  return <button onClick={() => showUserModal({
    name: 'John Doe',
    avatar: '/avatars/john.jpg',
    role: 'Administrateur',
    email: 'john@example.com'
  })}>Modal utilisateur</button>;
}
```

## 🔔 Exemple 6 : Modal pour Notifications Temps Réel avec Image

```tsx
import { useModal } from '@/contexts/ModalContext';
import Image from 'next/image';
import { useEffect } from 'react';

function useRealtimeModals() {
  const modal = useModal();

  useEffect(() => {
    // Exemple avec WebSocket ou EventSource
    const eventSource = new EventSource('/api/notifications/stream');
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      modal.warning({
        title: notification.title,
        content: (
          <div className="flex items-start gap-4">
            {notification.image && (
              <Image
                src={notification.image}
                alt={notification.productName}
                width={80}
                height={80}
                className="rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg mb-2">{notification.productName}</p>
              <p className="text-gray-700 mb-2">{notification.message}</p>
              {notification.stock !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-semibold">
                    Stock: {notification.stock} unités
                  </span>
                </div>
              )}
            </div>
          </div>
        ),
        actions: notification.productId ? [
          {
            label: 'Voir le produit',
            onClick: () => {
              window.location.href = `/products/${notification.productId}`;
              modal.closeAllModals();
            },
            style: 'primary',
          },
        ] : undefined,
        size: 'lg',
      });
    };

    return () => eventSource.close();
  }, [modal]);
}
```

## 📝 Exemple 7 : Modal de Formulaire avec Image Upload

```tsx
import { useModal } from '@/contexts/ModalContext';
import Image from 'next/image';
import { useState } from 'react';

function MyComponent() {
  const modal = useModal();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const showImageUploadModal = () => {
    modal.showModal({
      title: 'Télécharger une image',
      content: (
        <div className="space-y-4">
          {uploadedImage && (
            <div className="flex justify-center">
              <Image
                src={uploadedImage}
                alt="Uploaded"
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setUploadedImage(url);
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      ),
      actions: [
        {
          label: 'Annuler',
          onClick: () => {
            setUploadedImage(null);
            modal.closeAllModals();
          },
          style: 'secondary',
        },
        {
          label: 'Télécharger',
          onClick: async () => {
            if (uploadedImage) {
              // Logique de téléchargement
              await uploadImage(uploadedImage);
              modal.closeAllModals();
            }
          },
          style: 'primary',
        },
      ],
      size: 'md',
    });
  };

  return <button onClick={showImageUploadModal}>Télécharger image</button>;
}
```

## 📝 Notes Importantes

1. **Performance** : Les images dans les modals peuvent impacter les performances si trop nombreuses. Utilisez `next/image` pour l'optimisation automatique.

2. **Sécurité** : Si vous utilisez `dangerouslySetInnerHTML`, assurez-vous de **sanitizer** le contenu HTML pour éviter les attaques XSS.

3. **Responsive** : Les modals avec images peuvent être larges. Assurez-vous que le contenu s'adapte aux petits écrans (les modals sont déjà responsive).

4. **Accessibilité** : Ajoutez des `alt` text aux images pour l'accessibilité.

5. **Dark Mode** : Les modals supportent automatiquement le dark mode.

## 🚀 Améliorations Possibles

Si vous avez besoin de fonctionnalités supplémentaires, vous pouvez :

1. **Ajouter un prop `image` dédié** pour simplifier l'utilisation
2. **Créer des composants pré-configurés** pour les modals de produits
3. **Ajouter un support natif pour `dangerouslySetInnerHTML`** avec sanitization automatique
4. **Ajouter un système de templates** pour les modals récurrents

