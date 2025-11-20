# Public Assets Directory

This directory contains static assets that are served directly by Next.js.

## Directory Structure

```
public/
├── logo/              # Application logos
│   ├── app_logo.svg
│   └── app_logo.jpeg
├── images/            # General images
└── README.md          # This file
```

## How to Use Assets

### Using Images in Components

#### Method 1: Using Next.js Image Component (Recommended)
```tsx
import Image from 'next/image';

// In your component
<Image
  src="/logo/app_logo.svg"
  alt="App Logo"
  width={64}
  height={64}
  priority // For above-the-fold images
/>
```

#### Method 2: Using Regular img Tag
```tsx
// In your component
<img src="/logo/app_logo.svg" alt="App Logo" className="w-16 h-16" />
```

#### Method 3: Using CSS Background
```tsx
// In your component
<div 
  className="w-16 h-16 bg-cover bg-center"
  style={{ backgroundImage: 'url(/logo/app_logo.svg)' }}
/>
```

## Important Notes

1. **Path Reference**: Files in the `public` folder are served from the root URL path `/`
   - `public/logo/app_logo.svg` → `/logo/app_logo.svg`
   - `public/images/photo.jpg` → `/images/photo.jpg`

2. **No Import Needed**: You don't need to import files from the `public` folder. Just reference them by their path starting with `/`

3. **File Organization**: 
   - Keep logos in `public/logo/`
   - Keep general images in `public/images/`
   - Keep fonts in `public/fonts/` (if needed)
   - Keep icons in `public/icons/` (if needed)

4. **Optimization**: Use Next.js `Image` component for automatic optimization, lazy loading, and responsive images.

## Example Usage

### Login Page Logo
```tsx
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div>
      <Image
        src="/logo/app_logo.svg"
        alt="Gestion de Stock Pro"
        width={64}
        height={64}
        priority
      />
    </div>
  );
}
```

### Sidebar Logo
```tsx
import Image from 'next/image';

export default function SidebarHeader() {
  return (
    <div>
      <Image
        src="/logo/app_logo.svg"
        alt="Logo"
        width={40}
        height={40}
      />
    </div>
  );
}
```

