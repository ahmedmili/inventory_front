import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface MediaQueryResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  breakpoint: Breakpoint;
  width: number;
  height: number;
  matches: (query: string) => boolean;
}

// Tailwind CSS breakpoints (default)
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Device type thresholds
const DEVICE_THRESHOLDS = {
  mobile: BREAKPOINTS.md, // < 768px
  tablet: BREAKPOINTS.lg, // 768px - 1023px
  desktop: BREAKPOINTS.lg, // >= 1024px
} as const;

/**
 * Custom hook to detect screen size and device type
 * 
 * @param customBreakpoints - Optional custom breakpoints object
 * @returns MediaQueryResult with device info and helper methods
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, deviceType, width } = useMedia();
 * 
 * if (isMobile) {
 *   // Mobile-specific logic
 * }
 * ```
 */
export function useMedia(customBreakpoints?: Partial<typeof BREAKPOINTS>): MediaQueryResult {
  const breakpoints = { ...BREAKPOINTS, ...customBreakpoints };

  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine current breakpoint
  const getBreakpoint = (): Breakpoint => {
    const { width } = dimensions;
    
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  };

  // Determine device type
  const getDeviceType = (): DeviceType => {
    const { width } = dimensions;
    
    if (width < DEVICE_THRESHOLDS.mobile) {
      return 'mobile';
    } else if (width < DEVICE_THRESHOLDS.desktop) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  };

  const breakpoint = getBreakpoint();
  const deviceType = getDeviceType();

  // Helper to check if a media query matches
  const matches = (query: string): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType,
    breakpoint,
    width: dimensions.width,
    height: dimensions.height,
    matches,
  };
}

/**
 * Hook to check if a specific breakpoint is active
 * 
 * @param breakpoint - The breakpoint to check ('sm', 'md', 'lg', etc.)
 * @param direction - 'up' (>=) or 'down' (<)
 * @returns boolean indicating if the breakpoint matches
 * 
 * @example
 * ```tsx
 * const isLargeScreen = useBreakpoint('lg', 'up');
 * const isSmallScreen = useBreakpoint('md', 'down');
 * ```
 */
export function useBreakpoint(
  breakpoint: Breakpoint,
  direction: 'up' | 'down' = 'up'
): boolean {
  const { width } = useMedia();
  const breakpointValue = BREAKPOINTS[breakpoint];

  if (direction === 'up') {
    return width >= breakpointValue;
  } else {
    return width < breakpointValue;
  }
}

/**
 * Hook to check if a custom media query matches
 * 
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * ```tsx
 * const isLandscape = useMediaQuery('(orientation: landscape)');
 * const isPrint = useMediaQuery('print');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const { matches } = useMedia();
  return matches(query);
}

