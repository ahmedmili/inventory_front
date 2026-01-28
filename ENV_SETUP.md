# Configuration des Variables d'Environnement - Next.js

## 📋 Problème Identifié

Les variables d'environnement `NEXT_PUBLIC_*` ne sont pas chargées correctement car :

1. **Next.js charge les fichiers `.env` dans un ordre de priorité spécifique**
2. **La section `env` dans `next.config.js` est redondante** pour les variables `NEXT_PUBLIC_*`
3. **Il faut utiliser `.env.local` pour le développement local**

## 🔧 Solution

### Ordre de Priorité des Fichiers .env (Next.js)

Next.js charge les variables d'environnement dans cet ordre (du plus prioritaire au moins prioritaire) :

1. `.env.local` (toujours chargé, sauf en test)
2. `.env.development`, `.env.production`, `.env.test` (selon `NODE_ENV`)
3. `.env` (chargé dans tous les environnements)

**Important :** Si `.env.local` existe, il écrase les valeurs de `.env`

### Pourquoi la section `env` dans next.config.js n'est pas nécessaire ?

Les variables `NEXT_PUBLIC_*` sont **automatiquement exposées** par Next.js au client. La section `env` dans `next.config.js` est :
- **Redondante** pour les variables `NEXT_PUBLIC_*`
- **Utile uniquement** pour exposer des variables non-`NEXT_PUBLIC_` au client (rare)

### Comment Configurer

#### Option 1 : Utiliser `.env.local` (Recommandé pour développement local)

Créez un fichier `.env.local` dans `frontend/` :

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_IMAGES_BASE_URL=http://localhost:4000
```

**Avantages :**
- ✅ Priorité la plus élevée
- ✅ Ignoré par git (déjà dans .gitignore)
- ✅ Spécifique à votre environnement local

#### Option 2 : Utiliser `.env` (Pour valeurs par défaut partagées)

Le fichier `.env` peut contenir des valeurs par défaut, mais sera écrasé par `.env.local` si celui-ci existe.

#### Option 3 : Variables d'environnement système

Vous pouvez aussi définir les variables directement dans votre shell ou système :

```bash
# Windows PowerShell
$env:NEXT_PUBLIC_API_URL="http://localhost:4000"

# Linux/Mac
export NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## ⚠️ Points Importants

### 1. Redémarrer le Serveur

**IMPORTANT :** Après avoir modifié les variables d'environnement, vous **DEVEZ redémarrer** le serveur de développement :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
npm run dev
```

Les variables `NEXT_PUBLIC_*` sont **inlinées au moment du build**, donc les changements ne sont pas pris en compte sans redémarrage.

### 2. Build Time vs Runtime

- **Build Time :** Les variables `NEXT_PUBLIC_*` sont remplacées par leurs valeurs au moment du build
- **Runtime :** Les valeurs sont "hardcodées" dans le JavaScript bundle
- **Conséquence :** Après `npm run build`, changer les variables d'environnement ne changera pas les valeurs dans l'application

### 3. Fichiers Ignorés par Git

Les fichiers suivants sont dans `.gitignore` :
- `.env.local`
- `.env.development.local`
- `.env.production.local`
- `.env.test.local`
- `.env*.local`

**Le fichier `.env` n'est PAS ignoré** (il peut contenir des valeurs par défaut partagées).

## 📝 Exemple de Configuration

### Structure Recommandée

```
frontend/
├── .env                    # Valeurs par défaut (optionnel, peut être commité)
├── .env.local              # Configuration locale (NE PAS commit, dans .gitignore)
├── .env.example            # Template avec exemples (peut être commité)
└── next.config.js          # Configuration Next.js (sans section env pour NEXT_PUBLIC_*)
```

### Fichier `.env.local` (Créer ce fichier)

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Images Base URL (optionnel, utilise NEXT_PUBLIC_API_URL par défaut)
NEXT_PUBLIC_IMAGES_BASE_URL=http://localhost:4000

# WebSocket URL (optionnel)
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### Fichier `.env` (Valeurs par défaut partagées)

```env
# Valeurs par défaut pour l'équipe
# Ces valeurs seront écrasées par .env.local si celui-ci existe
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🔍 Vérification

Pour vérifier que les variables sont chargées :

1. **Dans le code :**
```typescript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

2. **Dans le navigateur (DevTools Console) :**
```javascript
// Les variables NEXT_PUBLIC_* sont accessibles côté client
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

3. **Vérifier le build :**
```bash
npm run build
# Les valeurs seront inlinées dans le bundle
```

## 🚀 Production

Pour la production, définissez les variables dans votre plateforme de déploiement :

- **Vercel :** Project Settings > Environment Variables
- **Netlify :** Site Settings > Environment Variables
- **Docker :** Utilisez `-e` flags ou fichier `.env`
- **Kubernetes :** Utilisez ConfigMaps ou Secrets

## 📚 Références

- [Next.js Environment Variables Documentation](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Next.js next.config.js env option](https://nextjs.org/docs/app/api-reference/next-config-js/env)

---

**Dernière mise à jour :** 28 Janvier 2025
