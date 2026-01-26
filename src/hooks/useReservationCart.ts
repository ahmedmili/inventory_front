'use client';

import { useState, useEffect } from 'react';

interface CartItem {
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  availableStock: number;
}

const STORAGE_KEY = 'reservation_cart';

export function useReservationCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to load cart from localStorage', e);
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (cart.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [cart]);

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    cart,
    setCart,
    clearCart,
    cartCount: cart.length,
  };
}

