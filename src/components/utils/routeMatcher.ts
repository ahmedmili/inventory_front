import { NavigationItem } from '../navigationConfig';

export function isRouteActive(pathname: string, item: NavigationItem): boolean {
  if (!item.href) {
    return false;
  }

  if (item.exact) {
    return pathname === item.href;
  }

  if (pathname === item.href) {
    return true;
  }

  const hrefWithSlash = `${item.href}/`;
  return pathname.startsWith(hrefWithSlash);
}

export function isItemActive(pathname: string, item: NavigationItem): boolean {
  if (isRouteActive(pathname, item)) {
    return true;
  }

  if (item.children?.length) {
    return item.children.some((child) => isItemActive(pathname, child));
  }

  return false;
}

