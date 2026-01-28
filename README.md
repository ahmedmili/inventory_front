# Frontend – Gestion de Stock Pro (Next.js)

Interface utilisateur moderne et réactive pour la gestion de stock, construite avec **Next.js 14** (App Router), **React**, **TypeScript**, et **Tailwind CSS**. Fournit des tableaux de bord, des workflows CRUD complets, la numérisation de codes-barres, et l'upload de fichiers.

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Développement](#-développement)
- [Déploiement](#-déploiement)
- [Structure du Projet](#-structure-du-projet)
- [Gestion d'État](#-gestion-détat)
- [Authentification](#-authentification)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Fonctionnalités

### 🎨 Interface Utilisateur
- **Design moderne** avec Tailwind CSS
- **Responsive** : Mobile, tablette, desktop
- **Composants réutilisables** : Tables, formulaires, modals, toasts
- **Chargement optimisé** : Skeleton loaders, lazy loading
- **Gestion d'images** : Upload multiple, preview, lazy loading

### 📊 Tableaux de Bord
- Vue d'ensemble avec statistiques en temps réel
- Graphiques et visualisations (Recharts)
- Alertes de stock faible
- Notifications en temps réel

### 📦 Gestion des Produits
- Liste paginée avec recherche et filtres
- Création/édition avec formulaire validé
- Upload d'images multiples
- Affichage des niveaux de stock par entrepôt
- Génération automatique de codes-barres

### 🏢 Entrepôts
- Gestion multi-entrepôts
- Vue du stock par entrepôt
- Transferts entre entrepôts
- Historique des mouvements

### 🛒 Achats & Ventes
- Création de commandes d'achat/vente
- Workflow complet (brouillon → validé → reçu/livré)
- Réception partielle des commandes
- Génération et téléchargement de PDF

### 👥 Fournisseurs & Clients
- Gestion complète des contacts
- Historique des transactions
- Informations détaillées
- Modal pour gestion des fournisseurs (accessible depuis la navigation)

### 🔔 Notifications
- Badge de notifications non lues
- Liste des notifications
- Marquage comme lu
- Notifications en temps réel

### 📈 Rapports
- Valeur de l'inventaire
- Produits en rupture
- Meilleurs vendeurs
- Analytics avec graphiques

### 👤 Gestion des Utilisateurs
- Page administrateurs avec pagination et recherche
- Page employés avec pagination et recherche
- Modal d'ajout d'administrateurs
- Gestion des rôles et permissions
- Activation/désactivation de comptes

### 📦 Importations
- Gestion des importations de produits
- Association avec fournisseurs
- Suivi des réceptions

---

## 🛠 Technologies

| Composant | Technologie |
|-----------|-------------|
| **Framework** | Next.js 14 (App Router) |
| **Langage** | TypeScript |
| **UI** | React 18 |
| **Styling** | Tailwind CSS |
| **Formulaires** | react-hook-form + Zod |
| **Data Fetching** | SWR (React Hooks) |
| **HTTP Client** | Axios |
| **Graphiques** | Recharts (lazy loaded) |
| **Icons** | Heroicons |
| **Date** | date-fns |
| **Tests** | Jest + React Testing Library |

---

## 📦 Prérequis

- **Node.js** 18+ et npm
- **Backend API** en cours d'exécution (voir [backend/README.md](../backend/README.md))
- **Docker** & Docker Compose (optionnel, pour déploiement)

---

## 🚀 Installation

### 1. Cloner et Installer

```bash
cd frontend
npm install
```

### 2. Configuration de l'Environnement

Créez un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_IMAGES_BASE_URL=http://localhost:4000
```

**Important** : Les variables commençant par `NEXT_PUBLIC_` sont exposées au client.

### 3. Démarrer le Serveur de Développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

---

## ⚙️ Configuration

### Variables d'Environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | URL de l'API backend | `http://localhost:4000` |
| `NEXT_PUBLIC_IMAGES_BASE_URL` | URL de base pour les images uploadées | `NEXT_PUBLIC_API_URL` ou `http://localhost:4000` |
| `NEXT_PUBLIC_WS_URL` | URL WebSocket (optionnel) | - |
| `NEXT_PUBLIC_STORAGE_URL` | URL de stockage média | - |

### Configuration Next.js

Le fichier `next.config.js` inclut :
- **SWC minification** activée
- **Compression Gzip** activée
- **Standalone output** pour Docker
- **Optimisation d'images** (AVIF, WebP)
- **Remote patterns** pour S3

---

## 💻 Développement

### Structure du Projet

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── layout.tsx         # Layout racine
│   │   ├── page.tsx           # Page d'accueil
│   │   ├── login/             # Page de connexion
│   │   ├── dashboard/         # Tableau de bord
│   │   ├── products/          # Gestion produits
│   │   │   ├── page.tsx      # Liste produits
│   │   │   ├── [id]/         # Détails produit
│   │   │   ├── new/          # Créer produit
│   │   │   └── [id]/edit/    # Éditer produit
│   │   ├── warehouses/        # Gestion entrepôts
│   │   ├── purchases/         # Commandes d'achat
│   │   ├── sales/             # Commandes de vente
│   │   ├── suppliers/         # Fournisseurs
│   │   ├── customers/         # Clients
│   │   ├── categories/        # Catégories
│   │   ├── movements/         # Mouvements de stock
│   │   └── reports/           # Rapports
│   ├── components/            # Composants réutilisables
│   │   ├── Layout.tsx         # Layout avec navigation
│   │   ├── Pagination.tsx    # Pagination
│   │   ├── ImageUpload.tsx    # Upload d'images
│   │   ├── LazyImage.tsx      # Image lazy loading
│   │   ├── SkeletonLoader.tsx # Skeleton loaders
│   │   ├── Toast.tsx          # Notifications toast
│   │   ├── Notifications.tsx  # Notifications utilisateur
│   │   ├── ErrorBoundary.tsx  # Gestion d'erreurs
│   │   └── Providers.tsx      # Providers (SWR, Auth, Toast)
│   ├── contexts/              # Contextes React
│   │   ├── AuthContext.tsx    # État authentification
│   │   └── ToastContext.tsx   # Gestion toasts
│   ├── hooks/                 # Hooks personnalisés
│   │   ├── useApi.ts          # Hook SWR pour API
│   │   ├── useToastForm.ts    # Hook pour formulaires
│   │   └── useErrorHandler.ts # Gestion d'erreurs
│   ├── lib/                   # Utilitaires
│   │   ├── api.ts             # Client Axios configuré
│   │   ├── auth.ts            # Service authentification
│   │   ├── utils.ts           # Utilitaires (cn, etc.)
│   │   └── pdf.ts             # Helpers PDF
│   └── types/                 # Types TypeScript
├── public/                     # Assets statiques
├── Dockerfile                  # Image Docker
├── docker-compose.yml         # Orchestration
└── package.json
```

### Scripts NPM

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production (après build) |
| `npm run lint` | Linter ESLint |
| `npm run test` | Tests unitaires (Jest) |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Tests avec couverture |

### Workflow de Développement

1. **Démarrer le backend** (voir [backend/README.md](../backend/README.md))
2. **Démarrer le frontend** : `npm run dev`
3. **Accéder à l'application** : `http://localhost:3000`
4. **Se connecter** avec les identifiants du backend

---

## 🐳 Déploiement

### Docker Compose

Le projet inclut un `docker-compose.yml` pour déployer le frontend :

```bash
# Démarrer le service
docker-compose up -d

# Voir les logs
docker-compose logs -f frontend

# Arrêter le service
docker-compose down

# Rebuild et redémarrer
docker-compose up -d --build
```

### Docker Seul

```bash
# Build l'image
docker build -t gestion-stock-frontend .

# Run le container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-backend-url.com \
  gestion-stock-frontend
```

### Production

1. **Variables d'environnement** : Configurez `NEXT_PUBLIC_API_URL` pour pointer vers votre backend
2. **Build** : `npm run build`
3. **Start** : `npm run start` ou utilisez Docker
4. **HTTPS** : Utilisez un reverse proxy (Nginx, Traefik) pour HTTPS

---

## 🔄 Gestion d'État

### SWR pour Data Fetching

Le projet utilise **SWR** pour la récupération et la mise en cache des données :

```typescript
import { useApi } from '@/hooks/useApi';

// Fetch data
const { data, loading, error } = useApi<Product[]>('/products');

// Mutations
const { mutate } = useApiMutation();
await mutate('/products', 'POST', newProduct);
```

### Contextes React

- **AuthContext** : État d'authentification global
- **ToastContext** : Notifications toast globales

### Exemple d'Utilisation

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

function MyComponent() {
  const { user, logout } = useAuth();
  const toast = useToast();
  
  const handleAction = async () => {
    try {
      // ... action
      toast.success('Action réussie !');
    } catch (error) {
      toast.error('Erreur lors de l\'action');
    }
  };
}
```

---

## 🔐 Authentification

### Flow d'Authentification

1. **Login** : L'utilisateur se connecte via `/login`
2. **Tokens** : Le backend retourne un access token et un refresh token (cookie HTTP-only)
3. **Storage** : L'access token est stocké en mémoire (pas dans localStorage)
4. **Refresh** : Le refresh token est automatiquement utilisé pour renouveler l'access token
5. **Logout** : Nettoyage des tokens et redirection

### Protection des Routes

Les routes protégées vérifient l'authentification côté client et serveur.

### Exemple

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  if (loading) return <div>Chargement...</div>;
  if (!user) {
    router.push('/login');
    return null;
  }
  
  return <div>Contenu protégé</div>;
}
```

---

## 🎨 Composants Principaux

### Layout

Le composant `Layout` fournit :
- Navigation principale
- Informations utilisateur
- Notifications
- Logout

### Pagination

Composant réutilisable pour la pagination :

```typescript
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  hasNext={hasNext}
  hasPrev={hasPrev}
/>
```

### ImageUpload

Upload d'images multiples avec preview :

```typescript
<ImageUpload
  value={images}
  onChange={setImages}
  maxFiles={5}
/>
```

### SkeletonLoader

Skeleton loaders pour améliorer l'UX pendant le chargement :

```typescript
<TableSkeleton rows={5} cols={4} />
<CardSkeleton count={3} />
```

---

## 🧪 Tests

### Tests Unitaires

```bash
npm run test
```

Les tests utilisent Jest et React Testing Library.

### Exemple de Test

```typescript
import { render, screen } from '@testing-library/react';
import Pagination from '@/components/Pagination';

test('renders pagination correctly', () => {
  render(
    <Pagination
      currentPage={1}
      totalPages={5}
      onPageChange={jest.fn()}
      hasNext={true}
      hasPrev={false}
    />
  );
  
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

---

## 🛠 Troubleshooting

### Problèmes CORS

Vérifiez que `NEXT_PUBLIC_API_URL` correspond à l'URL du backend et que le backend autorise cette origine dans `FRONTEND_URL`.

### Erreurs d'Authentification

- Vérifiez que le backend est démarré
- Vérifiez que les cookies sont activés dans le navigateur
- Vérifiez les tokens dans les DevTools (Network tab)

### Problèmes de Build

```bash
# Nettoyer et rebuilder
rm -rf .next node_modules
npm install
npm run build
```

### Images Non Chargées

- Vérifiez que `next.config.js` inclut les domaines d'images
- Vérifiez les permissions des fichiers uploadés
- Vérifiez que `NEXT_PUBLIC_API_URL` est correct

---

## 📖 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation React](https://react.dev/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation SWR](https://swr.vercel.app/)
- [Documentation React Hook Form](https://react-hook-form.com/)

---

## 📝 License

Ce projet fait partie de **Gestion de Stock Pro**.

---

---

## ✨ Améliorations Récentes (Janvier 2025)

- ✅ Pagination et synchronisation URL pour pages admins et employees
- ✅ Modal SuppliersModal pour gestion des fournisseurs
- ✅ NavigationModalContext pour gestion des modals depuis la navigation
- ✅ Amélioration de la gestion d'URL avec useUrlSync sur toutes les pages principales
- ✅ Correction des erreurs TypeScript et amélioration du build

---

**Développé avec ❤️ en utilisant Next.js et React**
