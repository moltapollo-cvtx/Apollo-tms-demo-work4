'use client';
import { useEffect } from 'react';

export function HydrationUnblock() {
  useEffect(() => {
    document.documentElement.classList.remove('fm-init');
  }, []);
  return null;
}