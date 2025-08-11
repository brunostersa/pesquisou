import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS de forma inteligente, removendo duplicatas e conflitos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 