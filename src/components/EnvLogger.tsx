'use client';

import { useEffect } from 'react';

/**
 * Component that logs environment variables on app startup
 * Only runs once on mount (client-side only)
 */
export default function EnvLogger() {
  useEffect(() => {
    // Only log in development or if explicitly enabled
    const shouldLog = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_LOG_ENV === 'true';

    if (!shouldLog) return;

    const envVars = {
      'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL || '❌ Not set',
      'NEXT_PUBLIC_IMAGES_BASE_URL': process.env.NEXT_PUBLIC_IMAGES_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '❌ Not set',
      'NEXT_PUBLIC_WS_URL': process.env.NEXT_PUBLIC_WS_URL || '❌ Not set (optional)',
      'NEXT_PUBLIC_STORAGE_URL': process.env.NEXT_PUBLIC_STORAGE_URL || '❌ Not set (optional)',
      'NODE_ENV': process.env.NODE_ENV || '❌ Not set',
    };

    // Log with nice formatting
    console.log('%c🚀 Environment Variables', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    Object.entries(envVars).forEach(([key, value]) => {
      const isSet = !value.toString().startsWith('❌');
      const color = isSet ? '#10b981' : '#ef4444';
      const icon = isSet ? '✅' : '❌';
      
      console.log(
        `%c${icon} %c${key.padEnd(30)} %c${value}`,
        'font-size: 14px;',
        `color: #374151; font-weight: 500; font-family: monospace;`,
        `color: ${color}; font-weight: 600; font-family: monospace;`
      );
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check for common issues
    const warnings: string[] = [];
    
    if (!process.env.NEXT_PUBLIC_API_URL) {
      warnings.push('⚠️ NEXT_PUBLIC_API_URL is not set - API calls will fail!');
    }
    
    if (process.env.NEXT_PUBLIC_API_URL?.includes('localhost') && process.env.NODE_ENV === 'production') {
      warnings.push('⚠️ Using localhost API URL in production - this will not work!');
    }

    if (warnings.length > 0) {
      console.warn('%c⚠️ Environment Warnings', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
      warnings.forEach(warning => {
        console.warn(`%c${warning}`, 'color: #f59e0b;');
      });
    }

    // Log source file info
    console.log('%c📝 Note: Variables are loaded from .env.local, .env.development, .env.production, or .env files', 
      'color: #6b7280; font-size: 11px; font-style: italic;');
  }, []); // Run only once on mount

  return null; // This component doesn't render anything
}
