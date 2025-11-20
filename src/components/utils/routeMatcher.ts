import { NavigationItem } from '../navigationConfig';

/**
 * Vérifie si une route est active en fonction du pathname actuel
 * @param pathname - Le pathname actuel
 * @param item - L'élément de navigation à vérifier
 * @returns true si la route est active, false sinon
 */
export function isRouteActive(pathname: string, item: NavigationItem): boolean {
  // Si exact est true, la route doit correspondre exactement
  if (item.exact) {
    return pathname === item.href;
  }

  // Correspondance exacte
  if (pathname === item.href) {
    return true;
  }

  // Pour les routes imbriquées, vérifie si le pathname commence par item.href suivi de /
  // Cela permet de matcher /products/123, /products/123/edit, /products/new, etc.
  // On utilise startsWith avec '/' pour éviter les faux positifs
  // Par exemple, /product ne matchera pas /products
  const hrefWithSlash = item.href + '/';
  if (pathname.startsWith(hrefWithSlash)) {
    return true;
  }

  return false;
}

